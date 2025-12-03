// API 调用封装
// Vercel 部署：直接调用外部 API，不需要后端代理
const API_BASE_URL = '';  // 空字符串表示直接调用 Gemini API

// 超时配置（毫秒）
const TIMEOUTS = {
  OPTIMIZE_PROMPT: 100000,  // 100秒 - AI优化提示词（单次请求）
  GENERATE_IMAGE: 200000    // 200秒 - 图片生成（单次请求）
};

export interface OptimizePromptRequest {
  prompt: string;
  baseUrl: string;
  apiKey: string;
}

export interface GenerateImageRequest {
  baseUrl: string;
  apiKey: string;
  modelType: string;  // 模型类型：'nano' 或 'pro'
  prompt: string;
  config: {
    imageConfig: {
      aspectRatio: string;
      imageSize?: string;
    };
  };
  referenceImages?: Array<{
    mimeType: string;
    data: string;
  }>;
}

// 带超时和重试的 fetch 封装
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number, maxRetries: number = 3): Promise<Response> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      // 如果是 429（限流），则重试
      if (response.status === 429 && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000; // 指数退避：1s, 2s, 4s
        console.warn(`[API] 收到 429 限流，${waitTime}ms 后重试 (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      
      if (error.name === 'AbortError') {
        throw new Error(`请求超时（超过${timeout / 1000}秒）`);
      }
      
      // 网络错误则重试
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        console.warn(`[API] 请求失败，${waitTime}ms 后重试 (${attempt}/${maxRetries}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }
  
  throw lastError || new Error('请求失败');
}

// 模型配置（与后端保持一致）
const MODELS = {
  IMAGE_GENERATION: {
    'nano': 'gemini-2.5-flash-image',
    'pro': 'gemini-3-pro-image-preview'
  },
  TEXT_OPTIMIZATION: 'gemini-3-pro-preview'
};

export const api = {
  // AI 优化提示词
  async optimizePrompt(request: OptimizePromptRequest): Promise<string> {
    const optimizeModel = MODELS.TEXT_OPTIMIZATION;
    
    const response = await fetchWithTimeout(
      `${request.baseUrl}/v1beta/models/${optimizeModel}:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': request.apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `你是AI绘画提示词优化专家。将用户输入优化成一个详细的英文绘画提示词。

规则：
1. 只返回一个优化方案，不要多个选项
2. 保留核心主题，添加艺术风格、光影、构图细节
3. 使用专业术语（如：cinematic lighting, high detail, 4K等）
4. 直接输出优化后的提示词，不要标题、编号、解释
5. 控制在150词以内`
            }]
          },
          contents: [{
            parts: [{ text: request.prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,  // 增加到 1000
            thinkingConfig: {
              thinkingLevel: "low"  // 降低思考力度，减少 thoughts token 消耗
            }
          }
        })
      },
      TIMEOUTS.OPTIMIZE_PROMPT
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '优化失败');
    }

    const data = await response.json();
    
    // 详细的错误诊断
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini 返回空 candidates:', JSON.stringify(data, null, 2));
      throw new Error('received empty response from Gemini: no meaningful content in candidates');
    }
    
    const candidate = data.candidates[0];
    
    // 检查 finishReason
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('Gemini 达到 MAX_TOKENS 限制，尝试增加 maxOutputTokens');
    }
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('Gemini 返回空 content:', JSON.stringify(data, null, 2));
      
      // 如果是 MAX_TOKENS 导致的空响应，给出更友好的提示
      if (candidate.finishReason === 'MAX_TOKENS') {
        throw new Error('AI 优化超出长度限制，请尝试更短的提示词');
      }
      
      throw new Error('received empty response from Gemini: no meaningful content in candidates');
    }
    
    const optimizedText = candidate.content.parts[0]?.text;
    
    if (!optimizedText) {
      console.error('Gemini 返回空 text:', JSON.stringify(data, null, 2));
      
      if (candidate.finishReason === 'MAX_TOKENS') {
        throw new Error('AI 优化超出长度限制，请尝试更短的提示词');
      }
      
      throw new Error('received empty response from Gemini: no meaningful content in candidates');
    }

    return optimizedText.trim();
  },

  // 生成图片
  async generateImage(request: GenerateImageRequest): Promise<string> {
    const model = MODELS.IMAGE_GENERATION[request.modelType];
    if (!model) {
      throw new Error('无效的模型类型');
    }

    // 构建请求内容
    const parts: any[] = [];
    
    // 添加参考图片（如果有）
    if (request.referenceImages && request.referenceImages.length > 0) {
      request.referenceImages.forEach(img => {
        parts.push({
          inline_data: {
            mime_type: img.mimeType,
            data: img.data
          }
        });
      });
    }

    // 添加提示词
    parts.push({ text: `请帮我画图：${request.prompt}` });

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: request.config.imageConfig
      }
    };

    const response = await fetchWithTimeout(
      `${request.baseUrl}/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': request.apiKey
        },
        body: JSON.stringify(requestBody)
      },
      TIMEOUTS.GENERATE_IMAGE
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '生成失败');
    }

    const data = await response.json();
    
    // 解析响应（与后端逻辑一致）
    let imageUrl: string | null = null;
    let textContent = '';

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // 方式1: base64 数据
          if (part.inlineData?.data || part.inline_data?.data) {
            const base64Data = part.inlineData?.data || part.inline_data?.data;
            imageUrl = `data:image/png;base64,${base64Data}`;
            break;
          }
          
          // 方式2: markdown 格式的图片链接
          if (part.text) {
            textContent += part.text;
            const markdownMatch = part.text.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
            if (markdownMatch && markdownMatch[1]) {
              imageUrl = markdownMatch[1];
              break;
            }
            
            // 方式3: 纯 URL
            const urlMatch = part.text.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp|gif))/i);
            if (urlMatch && urlMatch[1]) {
              imageUrl = urlMatch[1];
              break;
            }
          }
        }
      }
    }

    if (!imageUrl) {
      throw new Error(textContent ? `Gemini未返回图片：${textContent}` : 'Gemini未返回图片');
    }

    return imageUrl;
  }
};

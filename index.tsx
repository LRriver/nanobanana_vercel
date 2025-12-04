import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Settings2, Image as ImageIcon, Type, Sparkles, Video, 
  Sun, Moon, Loader2, Play, Download, Wand2, CircleUser,
  Bot, Coins, Monitor, X, Check, AlertCircle, Plus, ImagePlus,
  Globe, Key, ExternalLink, Maximize2, Trash2, Edit, CheckSquare, Square,
  FileText, RefreshCw, Info, Film
} from 'lucide-react';
import { api } from './services/api';

// --- Type Declarations ---
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

// --- Constants ---

const MODELS = [
  { 
    id: 'nano',  // 模型类型，后端会映射到 gemini-2.5-flash-image
    name: 'Nano Banana', 
    description: '快速，高效，标准画质',
    cost: '低成本',
    features: ['fast', 'standard_res'],
    maxImages: 4,
    supportsQuality: false
  },
  { 
    id: 'pro',  // 模型类型，后端会映射到 gemini-3-pro-image-preview
    name: 'Nano Banana Pro', 
    description: '高清，细腻，支持4K',
    cost: '需付费Key',
    features: ['hd', 'high_res'],
    maxImages: 8,
    supportsQuality: true
  },
];

const ASPECT_RATIOS = [
  { label: '1:1 (朋友圈)', value: '1:1' },
  { label: '2:3 (照片)', value: '2:3' },
  { label: '3:2 (摄影)', value: '3:2' },
  { label: '3:4 (小红书)', value: '3:4' },
  { label: '4:3 (早期电视)', value: '4:3' },
  { label: '4:5 (详情页)', value: '4:5' },
  { label: '5:4 (装饰画)', value: '5:4' },
  { label: '9:16 (短视频)', value: '9:16' },
  { label: '16:9 (电脑壁纸)', value: '16:9' },
  { label: '21:9 (宽屏电影)', value: '21:9' },
];

const RESOLUTIONS = [
  { label: '标清 (1K)', value: '1K' },
  { label: '高清 (2K)', value: '2K' },
  { label: '超清 (4K)', value: '4K' },
];

// --- Types ---
type ImageOperationState = 'idle' | 'generating' | 'completed' | 'failed';

interface AppConfig {
  baseUrl: string;
  apiKey: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  modelName: string;
  duration: string;
  modelId: string;
}

interface ReferenceImage {
  id: string;
  data: string;
  mimeType: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

// --- Main Component ---

const App = () => {
  // --- UI State ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'text-to-image' | 'image-to-image'>('text-to-image');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Mobile Tab State
  const [activeMobileTab, setActiveMobileTab] = useState<'create' | 'gallery'>('create');
  
  // --- Configuration State ---
  const [config, setConfig] = useState<AppConfig>({
    baseUrl: 'https://www.vivaapi.cn',
    apiKey: ''
  });
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);

  // --- Generation Config ---
  const [prompt, setPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imageSize, setImageSize] = useState('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generationCount, setGenerationCount] = useState(1);
  const [activeBatchCount, setActiveBatchCount] = useState(0);

  // --- Logic State ---
  const [operationState, setOperationState] = useState<ImageOperationState>('idle');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // --- Box Selection State ---
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Load config from local storage
    const savedConfig = localStorage.getItem('viva_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        setTempConfig(parsed);
      } catch (e) {
        console.error("Failed to load config", e);
      }
    }
  }, []);



  // Enforce Reference Image Limits when model changes
  useEffect(() => {
    const currentModel = MODELS.find(m => m.id === selectedModel);
    if (currentModel && referenceImages.length > currentModel.maxImages) {
       setReferenceImages(prev => prev.slice(0, currentModel.maxImages));
       setError(`已根据当前模型限制，自动保留前 ${currentModel.maxImages} 张参考图`);
    }
  }, [selectedModel]);

  // Handle Box Selection Logic
  useEffect(() => {
    if (isSelecting) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        setSelectionCurrent({ x: e.clientX, y: e.clientY });
        
        // Calculate intersection in real-time
        const startX = Math.min(selectionStart.x, e.clientX);
        const startY = Math.min(selectionStart.y, e.clientY);
        const endX = Math.max(selectionStart.x, e.clientX);
        const endY = Math.max(selectionStart.y, e.clientY);

        const newSelection = new Set<string>();
        const cards = document.querySelectorAll('[data-image-id]');
        
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            // Check for intersection
            const isIntersecting = 
                rect.left < endX &&
                rect.right > startX &&
                rect.top < endY &&
                rect.bottom > startY;
            
            if (isIntersecting) {
                const id = card.getAttribute('data-image-id');
                if (id) newSelection.add(id);
            }
        });
        
        // If holding shift/ctrl is not supported for now, just replace selection
        setSelectedImageIds(newSelection);
      };

      const handleGlobalMouseUp = () => {
        setIsSelecting(false);
      };

      // Add listeners to window to catch moves outside container
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isSelecting, selectionStart]);



  const saveConfig = () => {
    setConfig(tempConfig);
    localStorage.setItem('viva_config', JSON.stringify(tempConfig));
    setIsSettingsOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentModel = MODELS.find(m => m.id === selectedModel);
    const max = currentModel?.maxImages || 4;
    const remaining = max - referenceImages.length;

    if (remaining <= 0) {
        setError(`当前模型 (${currentModel?.name}) 最多支持上传 ${max} 张参考图`);
        // Reset input
        e.target.value = '';
        return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);
    
    const promises = filesToProcess.map(file => new Promise<ReferenceImage | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const matches = result.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          resolve({
             id: crypto.randomUUID(),
             mimeType: matches[1],
             data: matches[2]
          });
        } else {
          resolve(null);
        }
      };
      reader.readAsDataURL(file as Blob);
    }));

    Promise.all(promises).then(results => {
       const newImages = results.filter((img): img is ReferenceImage => img !== null);
       setReferenceImages(prev => [...prev, ...newImages]);
       setActiveTab('image-to-image');
       setError(null);
    });
    
    e.target.value = '';
  };

  const removeReferenceImage = (id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  };

  const handleEditImage = (imageUrl: string) => {
    const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      const newImage = { 
        id: crypto.randomUUID(),
        mimeType: matches[1], 
        data: matches[2] 
      };
      
      const currentModel = MODELS.find(m => m.id === selectedModel);
      const max = currentModel?.maxImages || 4;

      setReferenceImages(prev => {
         if (prev.length >= max) {
            // Replace the last one or alert? Let's alert but still trying to switch context best effort
            setError(`参考图已满 (${max}张)，请先删除一些图片`);
            return prev;
         }
         return [...prev, newImage];
      });
      setActiveTab('image-to-image');
    }
  };

  const handleDeleteImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const deleteSelectedImages = () => {
    setGeneratedImages(prev => prev.filter(img => !selectedImageIds.has(img.id)));
    setSelectedImageIds(new Set());
  };

  const optimizePrompt = async () => {
     if (!prompt) return;
     
     if (!config.apiKey || !config.baseUrl) {
       setError('请先配置 API 地址和密钥');
       return;
     }

     try {
       setIsOptimizing(true);
       setError(null);
       const optimized = await api.optimizePrompt({
         prompt,
         baseUrl: config.baseUrl,
         apiKey: config.apiKey
       });
       setPrompt(optimized);
     } catch (err: any) {
       setError(`优化失败：${err.message}`);
     } finally {
       setIsOptimizing(false);
     }
  };

  // Helper to execute generation logic separated from UI event
  const executeGeneration = async (promptText: string, modelId: string, countOverride?: number) => {
    if (!promptText) {
      setError("请输入提示词");
      return;
    }
    
    if (!config.apiKey || !config.baseUrl) {
      alert("请先设置API令牌");
      setIsSettingsOpen(true);
      return;
    }

    setOperationState('generating');
    setError(null);
    setSelectedImageIds(new Set());
    
    const count = countOverride ?? generationCount;
    setActiveBatchCount(count);

    const startTime = Date.now();

    try {
      const imageConfig: any = {
        aspectRatio: aspectRatio,
      };

      const currentModel = MODELS.find(m => m.id === modelId);
      if (currentModel?.supportsQuality) {
        imageConfig.imageSize = imageSize;
      }

      // 准备参考图片（如果有）
      const refImages = (activeTab === 'image-to-image' && referenceImages.length > 0) 
        ? referenceImages.map(img => ({ mimeType: img.mimeType, data: img.data }))
        : undefined;

      const generateOne = async () => {
        return await api.generateImage({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          modelType: modelId,  // 传递模型类型而不是模型 ID
          prompt: promptText,
          config: { imageConfig },
          referenceImages: refImages
        });
      };

      const promises = Array.from({ length: count }).map(() => generateOne());
      const results = await Promise.allSettled(promises);
      
      const successes: GeneratedImage[] = [];
      let firstError: string | null = null;
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2) + 's';
      const modelName = MODELS.find(m => m.id === modelId)?.name || modelId;

      results.forEach(res => {
        if (res.status === 'fulfilled') {
          successes.push({
            id: crypto.randomUUID(),
            url: res.value,
            prompt: promptText,
            modelId: modelId,
            modelName: modelName,
            duration: duration
          });
        } else {
          console.error("Generation failed:", res.reason);
          if (!firstError) firstError = res.reason.message || "生成失败";
        }
      });

      if (successes.length > 0) {
        setGeneratedImages(prev => [...successes, ...prev]);
        setOperationState('completed');
        if (successes.length < count) {
          setError(`成功生成 ${successes.length} 张，失败 ${count - successes.length} 张`);
        }
        // Switch to gallery view on mobile after creation
        if (window.innerWidth < 768) {
          setActiveMobileTab('gallery');
        }
      } else {
        throw new Error(firstError || "所有图片生成失败，请检查设置或API Key");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "生成失败");
      setOperationState('failed');
    } finally {
      setOperationState('idle');
    }
  };

  const handleGenerate = async () => {
    await executeGeneration(prompt, selectedModel);
  };

  const handleRegenerate = (img: GeneratedImage) => {
    // Update Prompt UI
    setPrompt(img.prompt);
    // Update Model UI
    setSelectedModel(img.modelId);
    // Trigger generation with image's prompt
    executeGeneration(img.prompt, img.modelId, 1);
  };

  const getCurrentModelMaxImages = () => {
      const m = MODELS.find(m => m.id === selectedModel);
      return m?.maxImages || 4;
  };

  // Handler for drag selection start
  const handleContainerMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button') || 
          (e.target as HTMLElement).closest('a') || 
          (e.target as HTMLElement).closest('input') ||
          (e.target as HTMLElement).closest('[data-image-card="true"]')) { 
          return;
      }

      setIsSelecting(true);
      setSelectionStart({ x: e.clientX, y: e.clientY });
      setSelectionCurrent({ x: e.clientX, y: e.clientY });
      setSelectedImageIds(new Set());
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans selection:bg-brand-500/30 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* --- Sidebar (Create Panel) --- */}
      <div className={`
        w-full md:w-[420px] lg:w-[480px] 
        flex-shrink-0 border-r backdrop-blur flex-col transition-colors duration-300
        ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}
        ${activeMobileTab === 'create' ? 'flex h-full' : 'hidden md:flex h-full'}
      `}>
        
        {/* Header */}
        <div className={`p-3 md:p-6 border-b flex justify-between items-start transition-colors duration-300 flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
                <Bot className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className={`font-bold text-base md:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>ViVa AI 图像创作</span>
            </div>
            <span className="text-[10px] md:text-xs text-brand-500 font-medium tracking-wide ml-8 md:ml-10 hidden sm:inline">用AI创造无限可能</span>
          </div>
          <div className="flex gap-1 md:gap-2">
            <a 
              href="https://ai.feishu.cn/wiki/Xy1Zwf23YifxDHkXQ9xcTfQCn6g?from=from_copylink" 
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 md:p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
              title="帮助文档"
            >
              <FileText className="w-4 h-4 md:w-5 md:h-5" />
            </a>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 md:p-2 rounded-lg transition-colors hidden sm:flex ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
              title={isDarkMode ? "切换亮色模式" : "切换暗色模式"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <button 
              onClick={() => {
                setTempConfig(config);
                setIsSettingsOpen(true);
              }}
              className={`p-1.5 md:p-2 rounded-lg transition-all duration-1000 ease-in-out animate-pulse ${
                isDarkMode 
                  ? 'text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20' 
                  : 'text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200'
              }`}
              title="系统设置"
            >
              <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 flex flex-col px-4 pt-4 md:px-6 md:pt-6 overflow-y-auto custom-scrollbar pb-32 md:pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h1 className={`text-lg md:text-2xl font-bold flex items-center gap-1.5 md:gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <Sparkles className="text-brand-500 w-5 h-5 md:w-6 md:h-6" />
                创建图像
            </h1>
            <div className="flex gap-1.5 md:gap-2">
                <a 
                    href="https://v.vivaapi.cn" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-brand-500/10 ${
                        isDarkMode 
                        ? 'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 hover:text-brand-300 border border-brand-500/20' 
                        : 'bg-brand-50 text-brand-600 hover:bg-brand-100 hover:text-brand-700 border border-brand-200'
                    }`}
                    title="创建视频"
                >
                    <Video className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>创建视频</span>
                </a>
                <a 
                    href="https://m.vivaapi.cn" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-brand-500/10 ${
                        isDarkMode 
                        ? 'bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 hover:text-brand-300 border border-brand-500/20' 
                        : 'bg-brand-50 text-brand-600 hover:bg-brand-100 hover:text-brand-700 border border-brand-200'
                    }`}
                    title="分镜大师"
                >
                    <Film className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>分镜大师</span>
                </a>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex p-1.5 rounded-2xl mb-6 border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-200/50 border-slate-200'}`}>
            <button 
              onClick={() => setActiveTab('text-to-image')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 scale-[1.02] ${
                activeTab === 'text-to-image'
                ? `bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md shadow-brand-500/10 ring-1 ${isDarkMode ? 'ring-slate-700' : 'ring-slate-200'}`
                : `text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50`
              }`}
            >
              <Type className="w-4 h-4 text-brand-500" /> 文生图
            </button>
            <button 
              onClick={() => setActiveTab('image-to-image')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                activeTab === 'image-to-image'
                ? `bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md shadow-brand-500/10 ring-1 ${isDarkMode ? 'ring-slate-700' : 'ring-slate-200'}`
                : `text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50`
              }`}
            >
              <ImageIcon className="w-4 h-4" /> 图生图
            </button>
          </div>

          <div className="space-y-4 md:space-y-8">
            
            {/* Model Selection */}
            <div className="space-y-2 md:space-y-3">
              <label className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>模型选择</label>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedModel === model.id
                          ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                          : `${isDarkMode ? 'border-slate-700 bg-slate-800 hover:border-slate-600' : 'border-slate-200 bg-white hover:border-slate-400'}`
                      }`}
                    >
                      <div className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{model.name}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{model.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prompt & Inputs */}
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-3">
                  <label className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>提示词</label>
                  <div className="relative group cursor-help">
                     <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-brand-400 hover:border-brand-500/50' : 'bg-white border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200'}`}>
                        <Coins className="w-3.5 h-3.5"/>
                        <span>价格</span>
                     </div>
                     <div className="absolute bottom-full left-0 mb-3 w-72 p-0 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 border border-slate-700 overflow-hidden transform origin-bottom-left scale-95 group-hover:scale-100">
                        <div className="px-4 py-3 bg-slate-800/50 border-b border-white/5 flex items-center gap-2">
                            <Coins className="w-4 h-4 text-brand-400"/> 
                            <span className="font-bold text-slate-200">价格说明（实际参考文档）</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-[1fr,auto] gap-x-4 gap-y-3 items-center text-slate-300">
                                <span className="opacity-80">Banana</span> 
                                <span className="font-mono text-brand-400 font-bold text-right">0.06-0.1元/张</span>
                                
                                <span className="opacity-80">Banana Pro</span> 
                                <span className="font-mono text-brand-400 font-bold text-right">0.22-0.66元/张</span>
                                
                                <span className="opacity-80">AI优化</span> 
                                <span className="font-mono text-brand-400 font-bold text-right">约0.006元/次</span>
                            </div>
                        </div>
                     </div>
                  </div>
                </div>
                
                <button 
                  onClick={optimizePrompt}
                  disabled={!prompt || isOptimizing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    isDarkMode 
                        ? 'bg-slate-800 text-brand-400 hover:bg-brand-500 hover:text-white border border-slate-700 hover:border-brand-500' 
                        : 'bg-white text-brand-600 hover:bg-brand-600 hover:text-white border border-slate-200 hover:border-brand-600'
                  }`}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> 优化中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" /> AI优化
                    </>
                  )}
                </button>
              </div>

              {/* Image Input */}
              {activeTab === 'image-to-image' && (
                 <div className="space-y-2">
                     <div className="grid grid-cols-3 gap-2">
                         {referenceImages.map(img => (
                            <div 
                                key={img.id} 
                                className="relative group aspect-square rounded-lg overflow-hidden border border-slate-500/30 cursor-pointer"
                                onDoubleClick={() => removeReferenceImage(img.id)}
                            >
                                <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" />
                                <div 
                                    onClick={() => removeReferenceImage(img.id)}
                                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full cursor-pointer hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-3 h-3" />
                                </div>
                            </div>
                         ))}
                         {referenceImages.length < getCurrentModelMaxImages() && (
                            <label className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-900/50 hover:border-brand-500/50 hover:bg-slate-800' : 'border-slate-300 bg-slate-50 hover:border-brand-500/50 hover:bg-slate-100'}`}>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" multiple />
                                <Plus className={`w-6 h-6 mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                                <span className="text-[10px] text-slate-500">添加图片</span>
                            </label>
                         )}
                     </div>
                     <p className="text-xs text-slate-500 text-right">
                        {referenceImages.length} / {getCurrentModelMaxImages()} 张 (双击图片删除)
                     </p>
                 </div>
              )}

              <div className="relative">
                <textarea 
                  placeholder={activeTab === 'image-to-image' ? "描述如何修改这些图片..." : "描述您想要的画面内容，例如：一只赛博朋克风格的猫，霓虹灯背景..."}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className={`w-full border rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none h-24 md:h-32 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
                ></textarea>
              </div>
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Aspect Ratio */}
              <div className="space-y-2 col-span-1">
                <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>比例</label>
                <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className={`w-full text-sm rounded-lg p-2.5 border focus:outline-none focus:border-brand-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'}`}
                    >
                    {ASPECT_RATIOS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
              </div>

              {/* Resolution (Only for Pro) */}
              {MODELS.find(m => m.id === selectedModel)?.supportsQuality && (
                <div className="space-y-2 col-span-1">
                   <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>分辨率</label>
                   <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className={`w-full text-sm rounded-lg p-2.5 border focus:outline-none focus:border-brand-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'}`}
                   >
                      {RESOLUTIONS.map(res => (
                          <option key={res.value} value={res.value}>{res.label}</option>
                      ))}
                   </select>
                </div>
              )}
            </div>

            {/* Generation Count */}
            <div className="space-y-2">
                 <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>生成数量 (1-10)</label>
                 <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={generationCount}
                      onChange={(e) => setGenerationCount(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-brand-500"
                    />
                    <div className={`w-12 text-center py-1.5 rounded-md text-sm font-bold border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                      {generationCount}
                    </div>
                 </div>
              </div>

            {/* Submit Button */}
            <button 
              onClick={handleGenerate}
              disabled={operationState === 'generating'}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 hover:from-brand-500 hover:to-brand-300 text-white font-bold py-3 md:py-4 rounded-lg md:rounded-xl transition-all shadow-lg shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {operationState === 'generating' ? (
                   <>
                     <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                     生成中...
                   </>
                ) : (
                   <>
                     <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                     立即生成
                   </>
                )}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                 <span>{error}</span>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- Right Content Area (Gallery Panel) --- */}
      <div className={`
        flex-1 flex-col relative overflow-hidden
        ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}
        ${activeMobileTab === 'gallery' ? 'flex h-full' : 'hidden md:flex h-full'}
      `}>
         {/* Background Pattern */}
         <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ 
              backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")',
              backgroundSize: 'cover'
            }} 
         />

         {/* Header Bar */}
         <div className={`h-12 md:h-16 border-b flex-shrink-0 flex items-center px-3 md:px-6 justify-between transition-colors duration-300 z-10 ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}`}>
            <div className={`text-xs md:text-sm flex items-center gap-2 md:gap-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{generatedImages.length > 0 ? `共 ${generatedImages.length} 张` : '仅供娱乐'}</span>
                {selectedImageIds.size > 0 && (
                  <button 
                    onClick={deleteSelectedImages}
                    className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs bg-red-500/10 text-red-500 px-2 md:px-3 py-1 rounded-full hover:bg-red-500/20 transition-colors font-medium border border-red-500/20"
                  >
                    <Trash2 className="w-3 md:w-3.5 h-3 md:h-3.5" />
                    <span className="hidden sm:inline">删除</span> ({selectedImageIds.size})
                  </button>
                )}
            </div>
            {!config.apiKey ? (
              <div className="flex-shrink-0 text-[10px] md:text-xs text-amber-500 bg-amber-500/10 px-2 md:px-3 py-1 rounded-full flex items-center gap-2 border border-amber-500/20">
                 <span className="hidden sm:inline">未配置 API 令牌</span>
                 <span className="sm:hidden">未配置Token</span>
                 <button onClick={() => setIsSettingsOpen(true)} className="underline hover:text-amber-600 font-bold">去配置</button>
              </div>
            ) : (
              <div className="flex-shrink-0 text-[10px] md:text-xs text-green-500 bg-green-500/10 px-2 md:px-3 py-1 rounded-full flex items-center gap-1 md:gap-2 border border-green-500/20">
                 <Check className="w-3 h-3" />
                 <span className="hidden sm:inline">Ready</span>
              </div>
            )}
         </div>

         {/* Main Viewing Area */}
         {generatedImages.length > 0 ? (
            <div 
                className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pt-0 pb-32 md:pb-6 relative z-0 ${isSelecting ? 'select-none cursor-crosshair' : ''}`}
                onMouseDown={handleContainerMouseDown}
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                
                {/* Grid - Responsive grid columns */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 w-full justify-start items-start content-start">
                    
                    {/* Inline Loading Card */}
                    {operationState === 'generating' && (
                        <div className={`flex flex-col rounded-xl overflow-hidden shadow-xl border-2 border-dashed animate-pulse aspect-square justify-center items-center ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                正在生成 {activeBatchCount} 张...
                            </span>
                        </div>
                    )}

                    {generatedImages.map((img) => (
                        <div 
                            key={img.id} 
                            data-image-id={img.id}
                            data-image-card="true"
                            className={`flex flex-col rounded-lg md:rounded-xl overflow-hidden shadow-lg md:shadow-xl transition-all hover:shadow-brand-500/10 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'} ${selectedImageIds.has(img.id) ? 'ring-2 ring-brand-500' : ''}`}
                        >
                            {/* Image Container */}
                            <div 
                                className="relative group aspect-square bg-black/50 overflow-hidden cursor-pointer"
                                onClick={() => setPreviewImage(img.url)}
                            >
                                <img 
                                    src={img.url} 
                                    alt="Generated content"
                                    className="w-full h-full object-contain"
                                />
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <a 
                                    href={img.url} 
                                    download={`viva-image-${img.id}.png`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-brand-500 hover:border-brand-500 text-white rounded-full transition-all transform hover:scale-110 shadow-lg"
                                    title="下载"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                    <button 
                                    className="p-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-brand-500 hover:border-brand-500 text-white rounded-full transition-all transform hover:scale-110 shadow-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage(img.url);
                                    }}
                                    title="放大查看"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {/* Top Right: Delete */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                                    title="删除"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Top Left: Select Indicator */}
                                <div className="absolute top-2 left-2 pointer-events-none">
                                    {selectedImageIds.has(img.id) && (
                                        <CheckSquare className="w-5 h-5 text-brand-500 bg-white rounded-sm fill-white" />
                                    )}
                                </div>
                            </div>

                            {/* Metadata Bar */}
                            <div className={`px-2 md:px-3 py-1.5 md:py-2 flex justify-between text-[9px] md:text-[10px] ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                                <span className="text-green-500 truncate max-w-[50%]">{img.modelName}</span>
                                <span className="text-green-500">{img.duration}</span>
                            </div>

                            {/* Actions Bar */}
                            <div className={`p-1.5 md:p-2 grid grid-cols-2 gap-1.5 md:gap-2 border-t ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                                <button 
                                    onClick={() => handleRegenerate(img)}
                                    className={`flex items-center justify-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-1.5 rounded-md md:rounded-lg transition-colors ${
                                        isDarkMode 
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' 
                                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span className="hidden sm:inline">重新生成</span>
                                    <span className="sm:hidden">重生</span>
                                </button>
                                <button 
                                    onClick={() => handleEditImage(img.url)}
                                    className={`flex items-center justify-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-1.5 rounded-md md:rounded-lg transition-colors ${
                                        isDarkMode 
                                        ? 'bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white border border-slate-700' 
                                        : 'bg-white hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200'
                                    }`}
                                >
                                    <Edit className="w-3 h-3" />
                                    <span className="hidden sm:inline">编辑图片</span>
                                    <span className="sm:hidden">编辑</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-0">
                {operationState === 'generating' ? (
                <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-brand-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-brand-500 animate-pulse" />
                        </div>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>正在绘制您的创意...</h3>
                    <p className="text-slate-500 max-w-md">正在生成 {activeBatchCount} 张图片，请稍候。</p>
                </div>
                ) : (
                <div className={`flex flex-col items-center justify-center opacity-50 select-none ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <ImageIcon className="w-10 h-10 opacity-50 ml-1" />
                    </div>
                    <h3 className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>暂无作品</h3>
                    <p className="max-w-xs text-sm">请在{typeof window !== 'undefined' && window.innerWidth < 768 ? '创建图像' : '左侧'}面板配置参数并创建您的第一张图片。</p>
                </div>
                )}
            </div>
         )}

      </div>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 backdrop-blur-lg border-t z-50 flex items-center justify-around pb-safe ${isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <button 
          onClick={() => setActiveMobileTab('create')}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
             activeMobileTab === 'create' ? 'text-brand-500' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <Sparkles className={`w-6 h-6 ${activeMobileTab === 'create' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-medium">创建图像</span>
        </button>
        <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
        <button 
          onClick={() => setActiveMobileTab('gallery')}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
             activeMobileTab === 'gallery' ? 'text-brand-500' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <ImageIcon className={`w-6 h-6 ${activeMobileTab === 'gallery' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-medium">作品库</span>
          {generatedImages.length > 0 && (
            <span className="absolute top-2 right-8 px-1.5 py-0.5 bg-brand-500 text-white text-[9px] rounded-full font-bold min-w-[18px] text-center">
              {generatedImages.length}
            </span>
          )}
        </button>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
           <div className={`w-full max-w-[450px] p-6 rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-[#151b2e] border-slate-700' : 'bg-white border-slate-200'} transform transition-all scale-100`}>
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                   <Settings2 className="w-5 h-5 text-brand-500" />
                   <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>系统设置</h2>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-5 mb-8">
                 <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>API 地址 (Base URL)</label>
                    <div className="relative group">
                       <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                       <input 
                         type="text" 
                         value={tempConfig.baseUrl}
                         onChange={(e) => setTempConfig({...tempConfig, baseUrl: e.target.value})}
                         placeholder="https://www.vivaapi.cn"
                         className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                            isDarkMode 
                            ? 'bg-[#1e2538] border-slate-700 text-white focus:border-brand-500 focus:bg-[#1e2538]' 
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-brand-500 focus:bg-white'
                         }`}
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>API 令牌 (Key)</label>
                    <div className="relative group">
                       <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                       <input 
                         type="password" 
                         value={tempConfig.apiKey}
                         onChange={(e) => setTempConfig({...tempConfig, apiKey: e.target.value})}
                         placeholder="sk-..."
                         className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                            isDarkMode 
                            ? 'bg-[#1e2538] border-slate-700 text-white focus:border-brand-500 focus:bg-[#1e2538]' 
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-brand-500 focus:bg-white'
                         }`}
                       />
                    </div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                        <a 
                            href="https://www.vivaapi.cn" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-brand-500 text-xs font-bold hover:underline flex items-center gap-1 flex-shrink-0"
                        >
                            点击获取API令牌 <ExternalLink className="w-3 h-3"/>
                        </a>
                        <span className="text-xs text-amber-500 font-medium">
                            请创建分组为“限时特价→优质Gemini”的API令牌
                        </span>
                    </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <button 
                onClick={saveConfig}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-500/20"
              >
                 保存配置
              </button>
           </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setPreviewImage(null)}
        >
            <div className="absolute top-4 right-4 z-10">
                <button 
                    onClick={() => setPreviewImage(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            <img 
                src={previewImage} 
                className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                alt="Full preview"
            />
        </div>
      )}

      {/* Selection Box Overlay */}
      {isSelecting && (
        <div
          className="fixed border bg-brand-500/20 border-brand-500 z-[60] pointer-events-none"
          style={{
            left: Math.min(selectionStart.x, selectionCurrent.x),
            top: Math.min(selectionStart.y, selectionCurrent.y),
            width: Math.abs(selectionCurrent.x - selectionStart.x),
            height: Math.abs(selectionCurrent.y - selectionStart.y)
          }}
        />
      )}

    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
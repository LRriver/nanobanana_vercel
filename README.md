# Nano Banana - Vercel 部署版

基于 Gemini API 的 AI 图像生成应用，专为 Vercel 部署优化。

## 特点

✅ **纯前端架构** - 无需后端服务器  
✅ **直接调用 API** - 前端直接调用 Gemini API  
✅ **一键部署** - 推送到 GitHub 即可部署到 Vercel  
✅ **全球 CDN** - Vercel 全球加速  
✅ **免费 HTTPS** - 自动配置 SSL 证书  

## 模型配置

### 生图模型
- **Nano Banana** → `gemini-2.5-flash-image` - 快速，标准画质
- **Nano Banana Pro** → `gemini-3-pro-image-preview` - 高清，支持 1K/2K/4K

### AI 优化模型
- **AI 优化** → `gemini-3-pro-preview` - 智能优化提示词

## 快速部署到 Vercel

### 1. 上传到 GitHub

```bash
cd nanobanana_vercel
git init
git add .
git commit -m "Deploy to Vercel"
git branch -M main
git remote add origin https://github.com/你的用户名/nanobanana_vercel.git
git push -u origin main
```

### 2. 连接 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 选择你的 `nanobanana` 仓库
5. Vercel 会自动检测配置（已有 `vercel.json`）
6. 点击 "Deploy"
7. 等待 2-3 分钟
8. 完成！🎉

### 3. 访问你的应用

部署完成后，Vercel 会给你一个 URL，类似：
```
https://nanobanana-xxx.vercel.app
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 本地测试 Vercel 环境

```bash
# 安装 Vercel CLI
npm install -g vercel

# 本地运行（模拟 Vercel 环境）
vercel dev
```

## 配置和使用

1. 访问应用
2. 点击右上角"系统设置"
3. 填入 API 地址和密钥：
   - API 地址：`https://generativelanguage.googleapis.com`
   - API 密钥：你的 Gemini API Key
4. 开始创作

## 技术栈

- **前端**：React + TypeScript + Vite + Tailwind CSS
- **部署**：Vercel
- **API**：直接调用 Gemini API（无后端代理）

## 注意事项

⚠️ **CORS 问题**
- 前端直接调用 Gemini API 可能遇到 CORS 问题
- 建议使用支持 CORS 的 API 代理服务
- 或者使用 `https://www.vivaapi.cn` 等代理服务

⚠️ **API Key 安全**
- API Key 保存在浏览器 localStorage
- 不会上传到服务器
- 建议使用限额较小的测试 Key

## 项目结构

```
nanobanana_vercel/
├── index.html          # 入口 HTML
├── index.tsx           # 主应用组件
├── services/
│   └── api.ts          # API 调用服务
├── package.json        # 依赖配置
├── vite.config.ts      # Vite 配置
├── vercel.json         # Vercel 配置
└── README.md
```

## 更新部署

只需推送代码到 GitHub：

```bash
git add .
git commit -m "Update features"
git push
```

Vercel 会自动重新部署！

## 与 nanobanana 的区别

| 特性 | nanobanana | nanobanana_vercel |
|------|-----------|-------------------|
| 架构 | 前端 + 后端 | 纯前端 |
| 部署 | 需要两个服务 | 一键部署 |
| API 调用 | 通过后端代理 | 直接调用 |
| 适用场景 | 本地开发 | 生产部署 |
| CORS | 无问题 | 可能需要代理 |

## 故障排查

### CORS 错误
使用支持 CORS 的 API 代理服务，如 `https://www.vivaapi.cn`

### 构建失败
检查 `package.json` 是否有 `build` 脚本

### API 调用失败
检查 API 地址和密钥是否正确配置

## 更多帮助

- [Vercel 文档](https://vercel.com/docs)
- [Gemini API 文档](https://ai.google.dev/docs)

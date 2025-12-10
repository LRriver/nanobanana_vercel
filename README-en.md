# Nano Banana - Vercel Deployment

English | [简体中文](./README.md)

AI Image Generation App based on Gemini API, optimized for Vercel deployment.

## Features

✅ **Pure Frontend Architecture** - No backend server required  
✅ **Direct API Calls** - Frontend directly calls Gemini API  
✅ **One-Click Deploy** - Push to GitHub and deploy to Vercel  
✅ **Global CDN** - Vercel global acceleration  
✅ **Free HTTPS** - Automatic SSL certificate configuration  
✅ **Mobile Optimized** - Perfect support for phones and tablets  

## Model Configuration

### Image Generation Models
- **Nano Banana** → `gemini-2.5-flash-image` - Fast, standard quality
- **Nano Banana Pro** → `gemini-3-pro-image-preview` - HD, supports 1K/2K/4K

### AI Optimization Model
- **AI Optimization** → `gemini-3-pro-preview` - Smart prompt optimization

## Quick Deploy to Vercel

### Method 1: Fork This Repository (Recommended for Users)

1. Visit this project's GitHub repository
2. Click the "Fork" button in the upper right corner to copy the project to your account
3. Jump to the [Connect Vercel](#connect-vercel-both-methods) step below

### Method 2: From Scratch (For Developers)

If you're developing locally or have modified the code, upload to GitHub:

```bash
cd nanobanana_vercel
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/nanobanana_vercel.git
git push -u origin main
```

### Connect Vercel (Both Methods)

1. Visit https://vercel.com
2. Login with your GitHub account
3. Click "Add New Project" or "Import Project"
4. Select your forked or uploaded repository
5. Vercel will automatically detect the configuration (has `vercel.json`)
6. Click "Deploy"
7. Wait 2-3 minutes for deployment to complete
8. Done! 🎉

### Access Your App

After deployment, Vercel will give you a URL like:
```
https://nanobanana-xxx.vercel.app
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
```

## Test Vercel Environment Locally

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally (simulate Vercel environment)
vercel dev
```

## Configuration and Usage

1. Visit the app
2. Click "System Settings" in the upper right corner
3. Fill in API address and key:
   - API Address: `https://www.vivaapi.cn` (Recommended proxy service to avoid CORS issues)
   - API Key: Get from [ViVa API](https://www.vivaapi.cn), select "Limited Time Offer → Premium Gemini" group
4. Start creating

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Deployment**: Vercel
- **API**: Direct Gemini API calls (no backend proxy)

## Notes

⚠️ **CORS Issues**
- Direct Gemini API calls from frontend may encounter CORS issues
- Recommend using CORS-enabled API proxy services
- Or use `https://www.vivaapi.cn` proxy service

⚠️ **API Key Security**
- API Key is saved in browser localStorage
- Not uploaded to server
- Recommend using test keys with lower quotas

## Project Structure

```
nanobanana_vercel/
├── index.html          # Entry HTML
├── index.tsx           # Main app component
├── services/
│   └── api.ts          # API service
├── package.json        # Dependencies
├── vite.config.ts      # Vite config
├── vercel.json         # Vercel config
└── README.md
```

## Update Deployment

Just push code to GitHub:

```bash
git add .
git commit -m "Update features"
git push
```

Vercel will automatically redeploy!

## Differences from nanobanana

| Feature | nanobanana | nanobanana_vercel |
|---------|-----------|-------------------|
| Architecture | Frontend + Backend | Pure Frontend |
| Deployment | Two services needed | One-click deploy |
| API Calls | Through backend proxy | Direct calls |
| Use Case | Local development | Production deployment |
| CORS | No issues | May need proxy |

## Troubleshooting

### CORS Errors
Use CORS-enabled API proxy service like `https://www.vivaapi.cn`

### Build Failures
Check if `package.json` has `build` script

### API Call Failures
Check if API address and key are correctly configured

## Mobile Optimization

This app is fully optimized for mobile with a completely different interaction approach from PC:

### PC (Desktop Browser)
- ✅ **Left-Right Layout** - Creation panel on left, image gallery on right
- ✅ **Simultaneous View** - Both areas visible at once, no overlap
- ✅ **Independent Scrolling** - Each area scrolls independently

### Mobile (Phone/Tablet)
- ✅ **Bottom Navigation** - Switch between "Create Image" and "Gallery" via bottom tabs
- ✅ **Full Screen** - Each view occupies entire screen, no extra whitespace
- ✅ **Smart Switching** - Auto-jump to gallery after image generation
- ✅ **Touch Optimized** - Smooth touch scrolling experience
- ✅ **Compact UI** - Optimized spacing and fonts for small screens

### Mobile Usage

1. **Create Image**: Tap "Create Image" tab at bottom, configure and generate
2. **View Works**: Auto-jump to "Gallery" after generation, or manually switch tabs
3. **Manage Works**: Download, delete, regenerate or edit images in gallery
4. **Scroll Browse**: Each panel scrolls independently, bottom nav stays fixed

### Technical Details

- Mobile uses `pb-32` (128px) bottom padding for 64px bottom nav with buffer
- Desktop uses `pb-6` (24px) normal padding
- Uses `-webkit-overflow-scrolling: touch` for iOS scroll optimization
- Bottom nav uses `fixed` positioning, always visible
- API config status responds in real-time: shows "Configure" when not set, "Ready" when configured

### Latest Optimizations (v1.1)

- ✅ Fixed mobile scrolling content being blocked by bottom nav
- ✅ Optimized API config status display logic based on actual configuration
- ✅ Improved header bar responsive layout to prevent text overflow
- ✅ Unified mobile and desktop padding settings

## More Help

- [Vercel Docs](https://vercel.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)

## 特点

✅ **纯前端架构** - 无需后端服务器  
✅ **直接调用 API** - 前端直接调用 Gemini API  
✅ **一键部署** - 推送到 GitHub 即可部署到 Vercel  
✅ **全球 CDN** - Vercel 全球加速  
✅ **免费 HTTPS** - 自动配置 SSL 证书  
✅ **移动端适配** - 完美支持手机和平板设备  

## 模型配置

### 生图模型
- **Nano Banana** → `gemini-2.5-flash-image` - 快速，标准画质
- **Nano Banana Pro** → `gemini-3-pro-image-preview` - 高清，支持 1K/2K/4K

### AI 优化模型
- **AI 优化** → `gemini-3-pro-preview` - 智能优化提示词

## 快速部署到 Vercel

### 方式一：Fork 本仓库（推荐给普通用户）

1. 访问本项目的 GitHub 仓库
2. 点击右上角的 "Fork" 按钮，将项目复制到你的账号下
3. 跳转到下面的 [连接 Vercel](#连接-vercel两种方式都适用) 步骤

### 方式二：从零开始（适合开发者）

如果你是从本地开发或修改了代码，需要上传到 GitHub：

```bash
cd nanobanana_vercel
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/nanobanana_vercel.git
git push -u origin main
```

### 连接 Vercel（两种方式都适用）

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New Project" 或 "Import Project"
4. 选择你 Fork 或上传的仓库
5. Vercel 会自动检测配置（已有 `vercel.json`）
6. 点击 "Deploy"
7. 等待 2-3 分钟部署完成
8. 完成！🎉

### 访问你的应用

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
   - API 地址：你的 API平台的url，如果是官方的api，那就填写: https://generativelanguage.googleapis.com
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

## 移动端优化

本应用已针对移动端进行全面优化，采用与 PC 端完全不同的交互方式：

### PC 端（桌面浏览器）
- ✅ **左右分栏布局** - 左侧创建面板，右侧图片展示区
- ✅ **同时可见** - 两个区域同时显示，互不遮挡
- ✅ **独立滚动** - 各自区域独立滚动

### 移动端（手机/平板）
- ✅ **底部导航栏** - 通过底部标签切换"创建图像"和"作品库"
- ✅ **全屏显示** - 每个视图占据整个屏幕，无多余空白
- ✅ **智能切换** - 生成图片后自动跳转到作品库查看
- ✅ **触摸优化** - 流畅的触摸滚动体验
- ✅ **紧凑界面** - 针对小屏幕优化的间距和字体

### 移动端使用方式

1. **创建图像**：点击底部"创建图像"标签，配置参数并生成
2. **查看作品**：生成完成后自动跳转到"作品库"，或手动点击底部标签切换
3. **作品管理**：在作品库中可以下载、删除、重新生成或编辑图片
4. **滚动浏览**：每个面板都可以独立上下滚动，底部导航栏固定不动

### 技术细节

- 移动端使用 `pb-24`（96px）底部padding，为64px高的底部导航栏预留足够空间
- 桌面端使用 `pb-6`（24px）正常padding
- 使用 `-webkit-overflow-scrolling: touch` 优化iOS滚动体验
- 底部导航栏使用 `fixed` 定位，始终可见
- API配置状态实时响应：未配置时显示"去配置"按钮，配置后显示"Ready"状态

### 最新优化（v1.1）

- ✅ 修复移动端滚动时内容被底部导航栏遮挡的问题
- ✅ 优化API配置状态显示逻辑，根据实际配置动态显示
- ✅ 改进header bar的响应式布局，防止文字溢出
- ✅ 统一移动端和桌面端的padding设置

## 更多帮助

- [Vercel 文档](https://vercel.com/docs)
- [Gemini API 文档](https://ai.google.dev/docs)

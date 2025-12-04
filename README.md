# Nano Banana - Vercel 部署版

基于 Gemini API 的 AI 图像生成应用，专为 Vercel 部署优化。

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

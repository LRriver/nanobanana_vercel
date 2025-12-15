# 故障排查指南 / Troubleshooting Guide

## 文件监控数量超出限制 / File Watch Limit Exceeded

### 问题描述 / Problem
运行 `npm run dev` 时出现错误：
```
Error: ENOSPC: System limit for number of file watchers reached
```

### 解决方案 / Solutions

#### 方法一：增加系统文件监控限制（推荐）/ Method 1: Increase System Limit (Recommended)

**Linux 系统：**

1. 临时增加限制（重启后失效）：
```bash
sudo sysctl fs.inotify.max_user_watches=524288
```

2. 永久增加限制：
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

3. 验证设置：
```bash
cat /proc/sys/fs/inotify/max_user_watches
```

**macOS 系统：**

macOS 通常不会遇到这个问题，如果遇到，可以尝试：
```bash
brew install watchman
```

**Windows 系统：**

Windows 通常不会遇到这个问题。

#### 方法二：清理 node_modules / Method 2: Clean node_modules

有时候 node_modules 文件过多会导致问题：

```bash
# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 方法三：使用 Docker / Method 3: Use Docker

如果你在 Docker 容器中运行，可以在启动容器时增加限制：

```bash
docker run --sysctl fs.inotify.max_user_watches=524288 ...
```

### 已配置的优化 / Configured Optimizations

项目的 `vite.config.ts` 已经配置了忽略 node_modules 和 dist 目录：

```typescript
server: {
  watch: {
    ignored: ['**/node_modules/**', '**/dist/**']
  }
}
```

这应该能减少文件监控的数量。

## 其他常见问题 / Other Common Issues

### 端口被占用 / Port Already in Use

如果 3000 端口被占用：

```bash
# 查找占用端口的进程
lsof -i :3000

# 或者使用其他端口
npm run dev -- --port 3001
```

### 构建失败 / Build Failures

```bash
# 清理缓存
rm -rf node_modules/.vite

# 重新构建
npm run build
```

### API 调用失败 / API Call Failures

1. 检查 API 地址和密钥是否正确配置
2. 检查网络连接
3. 查看浏览器控制台的错误信息
4. 尝试使用代理服务（如 https://www.vivaapi.cn）

## 需要更多帮助？ / Need More Help?

- 查看 [Vite 文档](https://vitejs.dev/guide/troubleshooting.html)
- 查看 [React 文档](https://react.dev/)
- 提交 Issue 到项目仓库

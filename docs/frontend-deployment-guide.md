# FixRate Lending 前端部署指南

本文档详细介绍了如何部署 FixRate Lending 项目的前端应用。

## 目录

1. [环境准备](#环境准备)
2. [获取代码](#获取代码)
3. [本地开发环境配置](#本地开发环境配置)
4. [生产环境部署](#生产环境部署)
   - [GitHub Pages 部署](#github-pages-部署)
   - [传统服务器部署](#传统服务器部署)
   - [Docker 部署](#docker-部署)
5. [环境变量配置](#环境变量配置)
6. [常见问题与解决方案](#常见问题与解决方案)

## 环境准备

在开始部署前，请确保您的系统满足以下要求：

- Node.js (推荐 v16.x 或更高版本)
- npm (v8.x 或更高版本) 或 yarn (v1.22.x 或更高版本)
- Git

您可以使用以下命令检查您的环境：

```bash
node -v
npm -v
git --version
```

## 获取代码

1. 克隆项目仓库：

```bash
git clone https://github.com/govm-net/fixrate-lending.git
cd fixrate-lending
```

2. 切换到前端目录：

```bash
cd frontend
```

## 本地开发环境配置

1. 安装依赖：

```bash
npm install
# 或者使用 yarn
yarn install
```

2. 启动开发服务器：

```bash
npm start
# 或者使用 yarn
yarn start
```

应用将在 http://localhost:3000 启动，并支持热重载。

## 生产环境部署

### GitHub Pages 部署

项目已配置为可以直接部署到 GitHub Pages。

1. 确保 `package.json` 中的 `homepage` 字段设置正确：

```json
"homepage": "https://govm-net.github.io/fixrate-lending"
```

2. 安装 `gh-pages` 包（如果尚未安装）：

```bash
npm install --save-dev gh-pages
# 或者使用 yarn
yarn add --dev gh-pages
```

3. 在 `package.json` 中添加部署脚本（如果尚未添加）：

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

4. 执行部署命令：

```bash
npm run deploy
# 或者使用 yarn
yarn deploy
```

5. 部署完成后，访问 https://govm-net.github.io/fixrate-lending 查看您的应用。

### 传统服务器部署

1. 构建生产版本：

```bash
npm run build
# 或者使用 yarn
yarn build
```

2. 将 `build` 目录中的文件上传到您的 Web 服务器。

3. 配置服务器：

   - 对于 Apache，确保 `.htaccess` 文件正确配置以支持 SPA 路由。
   - 对于 Nginx，添加以下配置：

   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     root /path/to/build;
     index index.html;
     
     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```

### Docker 部署

1. 在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. 创建 `nginx.conf` 文件：

```
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html =404;
  }
}
```

3. 构建 Docker 镜像：

```bash
docker build -t fixrate-lending-frontend .
```

4. 运行 Docker 容器：

```bash
docker run -p 80:80 fixrate-lending-frontend
```

## 环境变量配置

前端应用可能需要一些环境变量来连接到区块链网络或后端服务。在 React 应用中，环境变量需要以 `REACT_APP_` 开头。

1. 在项目根目录创建 `.env.production` 文件：

```
REACT_APP_API_URL=https://api.example.com
REACT_APP_CONTRACT_ADDRESS=0x1234567890abcdef
REACT_APP_CHAIN_ID=1
```

2. 在代码中使用环境变量：

```javascript
const apiUrl = process.env.REACT_APP_API_URL;
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
```

## 常见问题与解决方案

### 路由问题

如果部署后发现刷新页面出现 404 错误，这通常是因为服务器没有正确配置来处理单页应用的路由。确保您的服务器配置了正确的重定向规则。

### CORS 问题

如果前端应用需要与 API 交互，可能会遇到 CORS 问题。确保您的 API 服务器配置了正确的 CORS 头。

### 合约连接问题

如果应用无法连接到智能合约，请检查：

1. 合约地址是否正确
2. 网络 ID 是否正确
3. 用户钱包是否连接到正确的网络

### 性能优化

如果应用加载速度慢，考虑以下优化：

1. 使用代码分割（Code Splitting）
2. 优化图片和资源
3. 使用 CDN 分发静态资源
4. 启用 GZIP 压缩

---

如有任何部署问题，请提交 issue 到 [GitHub 仓库](https://github.com/govm-net/fixrate-lending/issues)。 
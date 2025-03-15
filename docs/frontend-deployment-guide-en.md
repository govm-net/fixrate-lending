# FixRate Lending Frontend Deployment Guide

This document provides detailed instructions on how to deploy the frontend application of the FixRate Lending project.

## Table of Contents

1. [Environment Preparation](#environment-preparation)
2. [Getting the Code](#getting-the-code)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
   - [GitHub Pages Deployment](#github-pages-deployment)
   - [Traditional Server Deployment](#traditional-server-deployment)
   - [Docker Deployment](#docker-deployment)
5. [Environment Variables Configuration](#environment-variables-configuration)
6. [Common Issues and Solutions](#common-issues-and-solutions)

## Environment Preparation

Before starting the deployment, ensure your system meets the following requirements:

- Node.js (recommended v16.x or higher)
- npm (v8.x or higher) or yarn (v1.22.x or higher)
- Git

You can check your environment with the following commands:

```bash
node -v
npm -v
git --version
```

## Getting the Code

1. Clone the repository:

```bash
git clone https://github.com/govm-net/fixrate-lending.git
cd fixrate-lending
```

2. Navigate to the frontend directory:

```bash
cd frontend
```

## Local Development Setup

1. Install dependencies:

```bash
npm install
# or using yarn
yarn install
```

2. Start the development server:

```bash
npm start
# or using yarn
yarn start
```

The application will start at http://localhost:3000 with hot-reload support.

## Production Deployment

### GitHub Pages Deployment

The project is configured for direct deployment to GitHub Pages.

1. Ensure the `homepage` field in `package.json` is set correctly:

```json
"homepage": "https://govm-net.github.io/fixrate-lending"
```

2. Install the `gh-pages` package (if not already installed):

```bash
npm install --save-dev gh-pages
# or using yarn
yarn add --dev gh-pages
```

3. Add deployment scripts to `package.json` (if not already added):

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

4. Run the deployment command:

```bash
npm run deploy
# or using yarn
yarn deploy
```

5. After deployment, visit https://govm-net.github.io/fixrate-lending to view your application.

### Traditional Server Deployment

1. Build the production version:

```bash
npm run build
# or using yarn
yarn build
```

2. Upload the files from the `build` directory to your web server.

3. Configure your server:

   - For Apache, ensure the `.htaccess` file is correctly configured to support SPA routing.
   - For Nginx, add the following configuration:

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

### Docker Deployment

1. Create a `Dockerfile` in the project root directory:

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

2. Create an `nginx.conf` file:

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

3. Build the Docker image:

```bash
docker build -t fixrate-lending-frontend .
```

4. Run the Docker container:

```bash
docker run -p 80:80 fixrate-lending-frontend
```

## Environment Variables Configuration

The frontend application may require environment variables to connect to blockchain networks or backend services. In React applications, environment variables must start with `REACT_APP_`.

1. Create a `.env.production` file in the project root directory:

```
REACT_APP_API_URL=https://api.example.com
REACT_APP_CONTRACT_ADDRESS=0x1234567890abcdef
REACT_APP_CHAIN_ID=1
```

2. Use environment variables in your code:

```javascript
const apiUrl = process.env.REACT_APP_API_URL;
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
```

## Common Issues and Solutions

### Routing Issues

If you encounter 404 errors when refreshing pages after deployment, it's usually because the server isn't correctly configured to handle single-page application routing. Ensure your server has the correct redirect rules.

### CORS Issues

If your frontend application needs to interact with an API, you may encounter CORS issues. Ensure your API server is configured with the correct CORS headers.

### Contract Connection Issues

If the application cannot connect to smart contracts, check:

1. If the contract address is correct
2. If the network ID is correct
3. If the user's wallet is connected to the correct network

### Performance Optimization

If the application loads slowly, consider the following optimizations:

1. Use code splitting
2. Optimize images and resources
3. Use a CDN to distribute static resources
4. Enable GZIP compression

---

If you encounter any deployment issues, please submit an issue to the [GitHub repository](https://github.com/govm-net/fixrate-lending/issues). 
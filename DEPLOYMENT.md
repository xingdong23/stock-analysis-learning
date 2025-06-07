# 股票分析学习网站 - 云端部署文档

## 项目概述

这是一个基于 React + TypeScript + Vite 构建的股票技术分析学习平台，提供技术指标学习、图表演示和实战案例等功能。

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 5
- **样式框架**: Tailwind CSS
- **动画库**: Framer Motion
- **图表库**: ECharts
- **图标库**: Lucide React
- **路由**: React Router DOM

## 部署方案选择

### 1. Vercel 部署（推荐）

**优势**: 
- 免费额度充足
- 自动CI/CD
- 全球CDN加速
- 零配置部署

#### 部署步骤：

1. **准备代码仓库**
   ```bash
   # 确保代码已推送到 GitHub
   git add .
   git commit -m "准备部署"
   git push origin main
   ```

2. **Vercel 部署**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "New Project"
   - 选择你的仓库
   - 配置项目设置：
     - Framework Preset: `Vite`
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - 点击 "Deploy"

3. **环境变量配置**（如需要）
   ```
   NODE_ENV=production
   ```

### 2. Netlify 部署

**优势**: 
- 简单易用
- 免费SSL证书
- 表单处理功能
- 分支预览

#### 部署步骤：

1. **构建配置**
   创建 `netlify.toml` 文件：
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **部署方式**
   - **方式一**: 拖拽部署
     ```bash
     npm run build
     # 将 dist 文件夹拖拽到 Netlify
     ```
   
   - **方式二**: Git 集成
     - 访问 [netlify.com](https://netlify.com)
     - 连接 GitHub 仓库
     - 自动部署

### 3. GitHub Pages 部署

#### 部署步骤：

1. **安装 gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **修改 package.json**
   ```json
   {
     "homepage": "https://yourusername.github.io/stock-analysis-learning",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **修改 vite.config.ts**
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/stock-analysis-learning/'
   })
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

### 4. 阿里云/腾讯云服务器部署

#### 服务器要求：
- 操作系统: Ubuntu 20.04+ / CentOS 7+
- 内存: 1GB+
- 存储: 10GB+
- 带宽: 1Mbps+

#### 部署步骤：

1. **服务器环境准备**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 安装 Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 安装 Nginx
   sudo apt install nginx -y
   
   # 安装 PM2
   sudo npm install -g pm2
   ```

2. **代码部署**
   ```bash
   # 克隆代码
   git clone https://github.com/yourusername/stock-analysis-learning.git
   cd stock-analysis-learning
   
   # 安装依赖
   npm install
   
   # 构建项目
   npm run build
   ```

3. **Nginx 配置**
   创建 `/etc/nginx/sites-available/stock-analysis` 文件：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/stock-analysis-learning/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

4. **启用站点**
   ```bash
   sudo ln -s /etc/nginx/sites-available/stock-analysis /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 域名配置

### 1. 购买域名
推荐平台：
- 阿里云万网
- 腾讯云
- GoDaddy
- Namecheap

### 2. DNS 配置
```
类型    名称    值
A       @       服务器IP地址
CNAME   www     @
```

### 3. SSL 证书配置

#### 使用 Let's Encrypt（免费）
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 性能优化

### 1. 构建优化
在 `vite.config.ts` 中添加：
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          charts: ['echarts', 'echarts-for-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

### 2. 图片优化
- 使用 WebP 格式
- 压缩图片大小
- 使用 CDN 加速

### 3. 缓存策略
```nginx
# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML 文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## 监控和维护

### 1. 错误监控
推荐使用：
- Sentry（错误追踪）
- Google Analytics（访问统计）
- Hotjar（用户行为分析）

### 2. 性能监控
- Lighthouse（性能评分）
- PageSpeed Insights（页面速度）
- GTmetrix（综合性能）

### 3. 备份策略
```bash
# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backup/stock-analysis-$DATE.tar.gz /path/to/stock-analysis-learning
find /backup -name "stock-analysis-*.tar.gz" -mtime +7 -delete
```

## 常见问题解决

### 1. 路由 404 问题
确保服务器配置了 SPA 路由重定向：
```nginx
try_files $uri $uri/ /index.html;
```

### 2. 构建内存不足
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### 3. 字体加载问题
在 `index.html` 中添加字体预加载：
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

## 部署检查清单

- [ ] 代码已推送到仓库
- [ ] 构建命令正常执行
- [ ] 环境变量已配置
- [ ] 域名已解析
- [ ] SSL 证书已配置
- [ ] 路由重定向已设置
- [ ] 性能优化已完成
- [ ] 监控工具已接入
- [ ] 备份策略已制定

## 联系支持

如果在部署过程中遇到问题，可以：
1. 查看项目 Issues
2. 联系开发团队
3. 参考官方文档

---

**祝你部署顺利！** 🚀

# 股票分析学习网站 - 最终部署指南

## 项目信息
- **项目名称**: 股票分析学习平台
- **GitHub仓库**: https://github.com/xingdong23/stock-analysis-learning.git
- **技术栈**: React + TypeScript + Vite + Tailwind CSS
- **服务器**: CentOS 7 (101.42.14.209)
- **用户**: root
- **密码**: czbcxy25809*

## 一键部署脚本

### 自动部署脚本 (推荐)
```bash
#!/bin/bash
# 文件名: deploy-final.sh

SERVER_HOST="101.42.14.209"
SERVER_USER="root"
SERVER_PASSWORD="czbcxy25809*"
SERVER_PATH="/var/www/stock-analysis"

# 1. 本地构建
echo "🔨 本地构建项目..."
npm run build

# 2. 打包文件
echo "📦 打包构建文件..."
tar -czf dist.tar.gz dist/

# 3. 上传到服务器
echo "⬆️ 上传文件到服务器..."
sshpass -p "$SERVER_PASSWORD" scp dist.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# 4. 服务器部署
echo "🚀 服务器部署..."
sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
    # 创建目录
    mkdir -p $SERVER_PATH
    cd $SERVER_PATH
    
    # 解压文件
    tar -xzf /tmp/dist.tar.gz
    
    # 设置权限
    chown -R nginx:nginx $SERVER_PATH
    chmod -R 755 $SERVER_PATH
    
    # 重载 Nginx
    systemctl reload nginx
    
    # 清理临时文件
    rm -f /tmp/dist.tar.gz
    
    echo '✅ 部署完成!'
"

# 5. 清理本地文件
rm -f dist.tar.gz

echo "🎉 部署成功! 访问: http://$SERVER_HOST"
```

## 首次服务器环境配置

### 服务器初始化脚本
```bash
#!/bin/bash
# 文件名: server-init.sh
# 只需要在首次部署时运行一次

SERVER_HOST="101.42.14.209"
SERVER_USER="root"
SERVER_PASSWORD="czbcxy25809*"

sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
    # 更新系统
    yum update -y
    
    # 安装软件
    yum install -y epel-release curl wget git nginx
    yum install -y nodejs npm
    
    # 配置防火墙
    systemctl start firewalld
    systemctl enable firewalld
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --reload
    
    # 禁用冲突的配置
    mv /etc/nginx/conf.d/shuzhongren.com.conf /etc/nginx/conf.d/shuzhongren.com.conf.disabled 2>/dev/null || true
    mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
    
    # 创建 Nginx 配置
    cat > /etc/nginx/conf.d/stock-analysis.conf << 'EOF'
server {
    listen 80;
    server_name 101.42.14.209;
    root /var/www/stock-analysis/dist;
    index index.html;

    access_log /var/log/nginx/stock-analysis.access.log;
    error_log /var/log/nginx/stock-analysis.error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
        access_log off;
    }

    add_header X-Frame-Options \"DENY\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;

    error_page 404 /index.html;
}
EOF
    
    # 启动服务
    nginx -t
    systemctl start nginx
    systemctl enable nginx
    
    echo '✅ 服务器初始化完成!'
"
```

## 日常更新方法

### 快速更新脚本
```bash
#!/bin/bash
# 文件名: update.sh

echo "🔄 开始更新网站..."

# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm ci

# 3. 构建项目
npm run build

# 4. 部署到服务器
tar -czf dist.tar.gz dist/
sshpass -p "czbcxy25809*" scp dist.tar.gz root@101.42.14.209:/tmp/
sshpass -p "czbcxy25809*" ssh root@101.42.14.209 "
    cd /var/www/stock-analysis
    tar -xzf /tmp/dist.tar.gz
    chown -R nginx:nginx /var/www/stock-analysis
    systemctl reload nginx
    rm -f /tmp/dist.tar.gz
"

# 5. 清理
rm -f dist.tar.gz

echo "✅ 更新完成! 访问: http://101.42.14.209"
```

## 使用方法

### 首次部署
```bash
# 1. 克隆项目
git clone https://github.com/xingdong23/stock-analysis-learning.git
cd stock-analysis-learning

# 2. 安装依赖
npm install

# 3. 安装 sshpass (如果没有)
# macOS: brew install hudochenkov/sshpass/sshpass
# Ubuntu: sudo apt-get install sshpass
# CentOS: sudo yum install sshpass

# 4. 初始化服务器 (只需运行一次)
chmod +x server-init.sh
./server-init.sh

# 5. 部署项目
chmod +x deploy-final.sh
./deploy-final.sh
```

### 日常更新
```bash
# 进入项目目录
cd stock-analysis-learning

# 运行更新脚本
chmod +x update.sh
./update.sh
```

### 手动更新 (备用方法)
```bash
# 1. 本地构建
npm run build

# 2. 上传并部署
tar -czf dist.tar.gz dist/
sshpass -p "czbcxy25809*" scp dist.tar.gz root@101.42.14.209:/tmp/
sshpass -p "czbcxy25809*" ssh root@101.42.14.209 "
    cd /var/www/stock-analysis && 
    tar -xzf /tmp/dist.tar.gz && 
    chown -R nginx:nginx /var/www/stock-analysis && 
    systemctl reload nginx
"
rm -f dist.tar.gz
```

## 故障排除

### 常见问题
1. **网站无法访问**: 检查 Nginx 状态 `systemctl status nginx`
2. **端口被占用**: 重启 Nginx `systemctl restart nginx`
3. **权限问题**: 设置正确权限 `chown -R nginx:nginx /var/www/stock-analysis`

### 检查命令
```bash
# 检查网站状态
curl -I http://101.42.14.209

# 检查 Nginx 配置
sshpass -p "czbcxy25809*" ssh root@101.42.14.209 "nginx -t"

# 查看 Nginx 日志
sshpass -p "czbcxy25809*" ssh root@101.42.14.209 "tail -f /var/log/nginx/stock-analysis.error.log"
```

## 重要提醒

1. **首次部署**: 先运行 `server-init.sh`，再运行 `deploy-final.sh`
2. **日常更新**: 只需运行 `update.sh`
3. **安全建议**: 生产环境建议配置 SSH 密钥认证
4. **备份**: 定期备份网站文件和数据库

---

**网站地址**: http://101.42.14.209  
**部署完成后即可访问股票分析学习平台** 🚀

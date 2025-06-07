# 手动部署步骤

由于自动脚本需要 SSH 密钥配置，我们先进行手动部署。

## 第一步：连接服务器

```bash
ssh root@101.42.14.209
# 输入密码：czbcxy25809*
```

## 第二步：在服务器上执行以下命令

### 1. 更新系统并安装软件
```bash
# 更新系统
yum update -y

# 安装 EPEL 仓库
yum install -y epel-release

# 安装基础软件
yum install -y curl wget git nginx

# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node --version
npm --version
nginx -v
```

### 2. 配置防火墙
```bash
# 启动防火墙
systemctl start firewalld
systemctl enable firewalld

# 开放端口
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# 查看开放的端口
firewall-cmd --list-ports
```

### 3. 克隆项目
```bash
# 创建目录
mkdir -p /var/www
cd /var/www

# 克隆项目
git clone https://github.com/xingdong23/stock-analysis-learning.git stock-analysis
cd stock-analysis

# 查看项目
ls -la
git log --oneline -3
```

### 4. 安装依赖并构建
```bash
# 安装依赖
npm ci

# 构建项目
npm run build

# 检查构建结果
ls -la dist/
```

### 5. 配置 Nginx
```bash
# 备份默认配置
mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

# 创建项目配置
cat > /etc/nginx/conf.d/stock-analysis.conf << 'EOF'
server {
    listen 80;
    server_name 101.42.14.209;
    root /var/www/stock-analysis/dist;
    index index.html;

    # 访问日志
    access_log /var/log/nginx/stock-analysis.access.log;
    error_log /var/log/nginx/stock-analysis.error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 安全头部
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 错误页面
    error_page 404 /index.html;
}
EOF

# 测试配置
nginx -t

# 设置文件权限
chown -R nginx:nginx /var/www/stock-analysis
chmod -R 755 /var/www/stock-analysis

# 启动 Nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

### 6. 创建更新脚本
```bash
cat > /var/www/stock-analysis/update.sh << 'EOF'
#!/bin/bash
echo "开始更新: $(date)"
cd /var/www/stock-analysis
git fetch origin
git reset --hard origin/main
git clean -fd
echo "当前版本: $(git rev-parse --short HEAD)"
npm ci
npm run build
systemctl reload nginx
echo "更新完成: $(date)"
EOF

chmod +x /var/www/stock-analysis/update.sh
```

### 7. 测试部署
```bash
# 检查服务状态
systemctl status nginx

# 检查端口
netstat -tlnp | grep :80

# 本地测试
curl -I http://localhost

# 查看日志
tail -5 /var/log/nginx/stock-analysis.access.log
```

## 第三步：在本地测试

退出服务器连接，在本地执行：

```bash
# 测试网站访问
curl -I http://101.42.14.209

# 运行完整测试
./scripts/test-deployment.sh
```

## 完成！

如果一切正常，你应该能够访问：**http://101.42.14.209**

## 后续更新

每次更新代码后，在服务器上运行：
```bash
/var/www/stock-analysis/update.sh
```

或者从本地运行：
```bash
ssh root@101.42.14.209 "/var/www/stock-analysis/update.sh"
```

# CentOS 云主机部署指南

## 服务器信息
- **IP地址**: 101.42.14.209
- **操作系统**: CentOS
- **用户名**: root
- **GitHub仓库**: https://github.com/xingdong23/stock-analysis-learning.git

## 快速部署

### 一键自动部署（推荐）
```bash
# 本地执行
./scripts/deploy-to-server.sh
```

### 手动部署步骤

#### 1. 连接服务器
```bash
ssh root@101.42.14.209
```

#### 2. 系统环境准备
```bash
# 更新系统
yum update -y

# 安装 EPEL 仓库（扩展软件包）
yum install -y epel-release

# 安装基础软件
yum install -y curl wget git vim

# 安装 Nginx
yum install -y nginx

# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node --version
npm --version
nginx -v
```

#### 3. 配置防火墙
```bash
# 启动防火墙服务
systemctl start firewalld
systemctl enable firewalld

# 开放必要端口
firewall-cmd --permanent --add-port=22/tcp   # SSH
firewall-cmd --permanent --add-port=80/tcp   # HTTP
firewall-cmd --permanent --add-port=443/tcp  # HTTPS

# 重载防火墙配置
firewall-cmd --reload

# 查看开放的端口
firewall-cmd --list-ports
```

#### 4. 克隆项目
```bash
# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆项目
git clone https://github.com/xingdong23/stock-analysis-learning.git stock-analysis
cd stock-analysis

# 查看项目信息
ls -la
git log --oneline -5
```

#### 5. 安装依赖并构建
```bash
# 安装项目依赖
npm ci

# 构建项目
npm run build

# 验证构建结果
ls -la dist/
```

#### 6. 配置 Nginx
```bash
# 备份默认配置
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

# 创建项目配置文件
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

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# 测试配置
nginx -t

# 设置文件权限
chown -R nginx:nginx /var/www/stock-analysis
chmod -R 755 /var/www/stock-analysis

# 启动并启用 Nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

#### 7. 创建更新脚本
```bash
# 创建自动更新脚本
cat > /var/www/stock-analysis/update.sh << 'EOF'
#!/bin/bash

echo "开始更新网站: $(date)"

# 进入项目目录
cd /var/www/stock-analysis

# 拉取最新代码
git fetch origin
git reset --hard origin/main
git clean -fd

echo "当前版本: $(git rev-parse --short HEAD)"
echo "最新提交: $(git log -1 --pretty=format:'%h - %s (%an, %ar)')"

# 安装依赖
npm ci

# 构建项目
npm run build

# 重载 Nginx
systemctl reload nginx

echo "更新完成: $(date)"
EOF

# 设置执行权限
chmod +x /var/www/stock-analysis/update.sh
```

## 验证部署

### 检查服务状态
```bash
# 检查 Nginx 状态
systemctl status nginx

# 检查端口监听
netstat -tlnp | grep :80

# 检查防火墙状态
firewall-cmd --list-all
```

### 测试网站访问
```bash
# 本地测试
curl -I http://localhost
curl -I http://101.42.14.209

# 检查关键页面
curl -s http://localhost/ | grep -i "股票分析"
```

## 日常维护

### 更新网站
```bash
# 方法1：使用更新脚本
/var/www/stock-analysis/update.sh

# 方法2：手动更新
cd /var/www/stock-analysis
git pull origin main
npm ci
npm run build
systemctl reload nginx
```

### 查看日志
```bash
# Nginx 访问日志
tail -f /var/log/nginx/stock-analysis.access.log

# Nginx 错误日志
tail -f /var/log/nginx/stock-analysis.error.log

# 系统日志
journalctl -u nginx -f
```

### 备份数据
```bash
# 创建备份脚本
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# 备份网站文件
tar -czf $BACKUP_DIR/stock-analysis-$DATE.tar.gz /var/www/stock-analysis

# 备份 Nginx 配置
tar -czf $BACKUP_DIR/nginx-config-$DATE.tar.gz /etc/nginx

# 清理7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
EOF

chmod +x /root/backup.sh

# 设置定时备份（每天凌晨2点）
echo "0 2 * * * /root/backup.sh" | crontab -
```

## 故障排除

### Nginx 无法启动
```bash
# 检查配置语法
nginx -t

# 查看错误日志
journalctl -u nginx --no-pager

# 检查端口占用
netstat -tlnp | grep :80
```

### 网站无法访问
```bash
# 检查防火墙
firewall-cmd --list-all

# 检查 SELinux（如果启用）
getenforce
setsebool -P httpd_can_network_connect 1

# 重启服务
systemctl restart nginx
```

### 构建失败
```bash
# 检查 Node.js 版本
node --version

# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

## 性能优化

### 启用 HTTP/2
```bash
# 安装 SSL 证书后，在 Nginx 配置中添加
# listen 443 ssl http2;
```

### 配置日志轮转
```bash
# 创建日志轮转配置
cat > /etc/logrotate.d/stock-analysis << 'EOF'
/var/log/nginx/stock-analysis.*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        systemctl reload nginx
    endscript
}
EOF
```

## 安全加固

### 更改 SSH 端口
```bash
# 编辑 SSH 配置
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
systemctl restart sshd

# 更新防火墙
firewall-cmd --permanent --remove-port=22/tcp
firewall-cmd --permanent --add-port=2222/tcp
firewall-cmd --reload
```

### 禁用不必要的服务
```bash
# 查看运行的服务
systemctl list-units --type=service --state=running

# 禁用不需要的服务（根据实际情况）
systemctl disable postfix
systemctl stop postfix
```

---

**部署完成！访问 http://101.42.14.209 查看网站** 🚀

如有问题，请检查防火墙、SELinux 和 Nginx 配置。

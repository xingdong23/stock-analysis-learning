# 云主机部署指南

## 服务器信息
- **服务器地址**: 101.42.14.209
- **用户名**: root
- **操作系统**: CentOS
- **GitHub仓库**: https://github.com/xingdong23/stock-analysis-learning.git

## 部署步骤

### 1. 连接服务器
```bash
ssh root@101.42.14.209
```

### 2. 服务器环境准备

#### 更新系统
```bash
# CentOS 7/8
yum update -y

# 或者 CentOS 8+ (使用 dnf)
dnf update -y
```

#### 安装必要软件
```bash
# CentOS - 先安装 EPEL 仓库
yum install -y epel-release

# 安装基础软件
yum install -y curl wget git nginx

# 安装最新版本的 Node.js (CentOS)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node --version
npm --version
```

#### 安装 PM2 (进程管理器)
```bash
npm install -g pm2
```

### 3. 配置防火墙
```bash
# CentOS 使用 firewalld
systemctl start firewalld
systemctl enable firewalld

# 开放必要端口
firewall-cmd --permanent --add-port=22/tcp    # SSH
firewall-cmd --permanent --add-port=80/tcp    # HTTP
firewall-cmd --permanent --add-port=443/tcp   # HTTPS

# 重载配置
firewall-cmd --reload

# 查看开放的端口
firewall-cmd --list-ports
```

### 4. 创建项目目录
```bash
mkdir -p /var/www/stock-analysis
cd /var/www/stock-analysis
```

### 5. 克隆项目代码
```bash
# 从 GitHub 克隆项目
git clone git@github.com:xingdong23/stock-analysis-learning.git .

# 如果使用 HTTPS（推荐）
git clone https://github.com/xingdong23/stock-analysis-learning.git .
```

### 6. 安装项目依赖并构建
```bash
cd /var/www/stock-analysis
npm install
npm run build
```

### 7. 配置 Nginx

#### 创建 Nginx 配置文件
```bash
nano /etc/nginx/sites-available/stock-analysis
```

#### 配置内容
```nginx
server {
    listen 80;
    server_name 101.42.14.209;  # 可以替换为你的域名
    root /var/www/stock-analysis/dist;
    index index.html;

    # 启用 Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/atom+xml image/svg+xml;

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
```

#### 启用站点
```bash
# 创建软链接
ln -s /etc/nginx/sites-available/stock-analysis /etc/nginx/sites-enabled/

# 删除默认站点（可选）
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx
```

### 8. 配置 SSL 证书（可选但推荐）

#### 安装 Certbot
```bash
# Ubuntu
apt install certbot python3-certbot-nginx

# CentOS
yum install certbot python3-certbot-nginx
```

#### 获取 SSL 证书
```bash
# 如果有域名
certbot --nginx -d yourdomain.com

# 如果只用 IP，可以跳过此步骤
```

### 9. 设置自动部署脚本

#### 创建部署脚本
```bash
nano /var/www/stock-analysis/deploy.sh
```

#### 脚本内容
```bash
#!/bin/bash
cd /var/www/stock-analysis
echo "开始部署: $(date)"

# 拉取最新代码
git fetch origin
git reset --hard origin/main
git clean -fd

echo "当前版本: $(git rev-parse --short HEAD)"

# 安装依赖
npm ci --production=false

# 构建项目
npm run build

# 重启 Nginx
systemctl reload nginx

echo "部署完成: $(date)"
```

#### 设置执行权限
```bash
chmod +x /var/www/stock-analysis/deploy.sh
```

### 10. 设置定时任务（可选）
```bash
crontab -e

# 添加以下行，每天凌晨2点自动更新
0 2 * * * /var/www/stock-analysis/deploy.sh >> /var/log/deploy.log 2>&1
```

## 访问网站

部署完成后，可以通过以下地址访问：
- HTTP: http://101.42.14.209
- HTTPS: https://101.42.14.209 (如果配置了SSL)

## 监控和维护

### 查看 Nginx 状态
```bash
systemctl status nginx
```

### 查看 Nginx 日志
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 重启服务
```bash
systemctl restart nginx
```

### 更新网站
```bash
cd /var/www/stock-analysis
./deploy.sh
```

## 故障排除

### 1. 网站无法访问
- 检查防火墙设置
- 检查 Nginx 状态
- 检查端口是否开放

### 2. 404 错误
- 检查文件路径是否正确
- 确认 dist 目录存在且有内容

### 3. 路由不工作
- 确认 Nginx 配置中有 `try_files` 指令

### 4. 静态资源加载失败
- 检查文件权限
- 确认路径配置正确

## 安全建议

1. **更改默认 SSH 端口**
2. **禁用 root 密码登录，使用密钥认证**
3. **定期更新系统和软件**
4. **配置防火墙规则**
5. **启用 fail2ban 防止暴力破解**

## 性能优化

1. **启用 Nginx 缓存**
2. **配置 CDN**
3. **优化图片资源**
4. **启用 HTTP/2**

---

**部署完成后记得测试所有功能是否正常！** 🚀

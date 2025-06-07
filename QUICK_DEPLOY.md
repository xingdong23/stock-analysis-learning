# 快速部署指南 🚀

## 服务器信息
- **IP地址**: 101.42.14.209
- **用户名**: root
- **GitHub仓库**: git@github.com:xingdong23/stock-analysis-learning.git

## 一键部署

### 方法一：使用自动化脚本（推荐）

```bash
# 1. 确保本地代码已提交并推送
git add .
git commit -m "准备部署"
git push origin main

# 2. 运行自动部署脚本
./scripts/deploy-to-server.sh
```

### 方法二：手动部署

#### 1. 连接服务器
```bash
ssh root@101.42.14.209
```

#### 2. 首次部署 (CentOS)
```bash
# 更新系统
yum update -y

# 安装 EPEL 仓库
yum install -y epel-release

# 安装必要软件
yum install -y curl wget git nginx

# 安装最新 Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 克隆项目
cd /var/www
rm -rf stock-analysis
git clone https://github.com/xingdong23/stock-analysis-learning.git stock-analysis
cd stock-analysis

# 安装依赖并构建
npm ci
npm run build

# 配置 Nginx (CentOS 使用 conf.d 目录)
cat > /etc/nginx/conf.d/stock-analysis.conf << 'EOF'
server {
    listen 80;
    server_name 101.42.14.209;
    root /var/www/stock-analysis/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# 备份默认配置并测试
mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
nginx -t
systemctl restart nginx
systemctl enable nginx

# 配置防火墙 (CentOS 使用 firewalld)
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

#### 3. 后续更新
```bash
cd /var/www/stock-analysis
git pull origin main
npm ci
npm run build
systemctl reload nginx
```

## 快速命令

### 连接服务器
```bash
ssh root@101.42.14.209
```

### 更新网站
```bash
ssh root@101.42.14.209 "cd /var/www/stock-analysis && git pull && npm ci && npm run build && systemctl reload nginx"
```

### 查看网站状态
```bash
ssh root@101.42.14.209 "systemctl status nginx && curl -I http://localhost"
```

### 查看日志
```bash
ssh root@101.42.14.209 "tail -f /var/log/nginx/access.log"
```

## 访问网站

部署完成后访问：**http://101.42.14.209**

## 故障排除

### 网站无法访问
```bash
# 检查 Nginx 状态
systemctl status nginx

# 检查端口
netstat -tlnp | grep :80

# 重启 Nginx
systemctl restart nginx
```

### 构建失败
```bash
# 检查 Node.js 版本
node --version
npm --version

# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Git 问题
```bash
# 强制更新代码
git fetch origin
git reset --hard origin/main
git clean -fd
```

## 安全提醒

1. **更改 SSH 端口**（可选）
2. **配置 SSH 密钥认证**
3. **启用防火墙**
4. **定期更新系统**

## 性能优化

1. **配置 SSL 证书**
2. **启用 HTTP/2**
3. **配置 CDN**
4. **优化图片资源**

---

**部署愉快！** 🎉

如有问题，请检查：
- 服务器网络连接
- 防火墙设置
- Nginx 配置
- 文件权限

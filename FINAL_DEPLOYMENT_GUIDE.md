# 股票分析学习网站 - 完整云端部署指南

## 项目信息
- **项目名称**: 股票分析学习平台
- **GitHub仓库**: https://github.com/xingdong23/stock-analysis-learning.git
- **技术栈**:
  - 前端: React + TypeScript + Vite + Tailwind CSS
  - 后端1: FastAPI (主API服务)
  - 后端2: Flask (股票监控服务)
  - 数据库: MySQL
- **服务器**: CentOS 7 (101.42.14.209)
- **用户**: root
- **密码**: czbcxy25809*

## 🚀 完整部署方案

### 方案一：一键部署（推荐）

```bash
# 完整自动化部署，包含服务器配置和应用部署
chmod +x deploy-one-click.sh
./deploy-one-click.sh
```

### 方案二：分步部署

```bash
# 1. 服务器环境配置
chmod +x server-setup-complete.sh
./server-setup-complete.sh

# 2. 完整应用部署
chmod +x deploy-complete.sh
./deploy-complete.sh
```

### 方案三：仅前端部署（原有方案）

```bash
# 仅部署前端应用
chmod +x deploy-final.sh
./deploy-final.sh
```

## 📋 部署内容

### 完整部署包含：
- ✅ **前端应用**: React + TypeScript + Vite
- ✅ **FastAPI后端**: 主API服务 (端口8000)
- ✅ **Flask监控**: 股票监控服务 (端口5000)
- ✅ **MySQL数据库**: 数据持久化存储
- ✅ **Nginx代理**: 反向代理和静态文件服务
- ✅ **系统服务**: systemd服务管理
- ✅ **防火墙配置**: 安全端口开放
- ✅ **监控工具**: 系统状态监控

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

## 📖 使用方法

### 首次完整部署

```bash
# 1. 克隆项目
git clone https://github.com/xingdong23/stock-analysis-learning.git
cd stock-analysis-learning

# 2. 安装本地依赖
npm install

# 3. 安装sshpass（如果没有）
# macOS: brew install hudochenkov/sshpass/sshpass
# Ubuntu: sudo apt install sshpass
# CentOS: sudo yum install sshpass

# 4. 一键部署（推荐）
chmod +x deploy-one-click.sh
./deploy-one-click.sh
```

### 分步部署（高级用户）

```bash
# 1. 配置服务器环境
chmod +x server-setup-complete.sh
./server-setup-complete.sh

# 2. 部署完整应用
chmod +x deploy-complete.sh
./deploy-complete.sh
```

### 日常更新

```bash
# 快速更新所有服务
chmod +x update.sh
./update.sh

# 或仅更新前端
chmod +x deploy-final.sh
./deploy-final.sh
```

### 部署状态检查

```bash
# 检查所有服务状态
chmod +x check-deployment.sh
./check-deployment.sh
```

## 🌐 访问地址

部署完成后可通过以下地址访问：

- **前端应用**: http://101.42.14.209
- **后端API**: http://101.42.14.209:8000
- **API文档**: http://101.42.14.209:8000/docs
- **监控服务**: http://101.42.14.209:5000

## 🔧 管理命令

```bash
# 查看系统状态
ssh root@101.42.14.209 'stock-status.sh'

# 重启所有服务
ssh root@101.42.14.209 'systemctl restart nginx stock-backend stock-monitor'

# 查看服务日志
ssh root@101.42.14.209 'journalctl -u stock-backend -f'
ssh root@101.42.14.209 'journalctl -u stock-monitor -f'

# 检查部署状态
./check-deployment.sh
```

## 🛠 故障排除

### 常见问题

1. **前端无法访问**
   ```bash
   ssh root@101.42.14.209 'systemctl status nginx'
   ssh root@101.42.14.209 'nginx -t'
   ```

2. **后端API异常**
   ```bash
   ssh root@101.42.14.209 'systemctl status stock-backend'
   ssh root@101.42.14.209 'journalctl -u stock-backend -n 50'
   ```

3. **监控服务异常**
   ```bash
   ssh root@101.42.14.209 'systemctl status stock-monitor'
   ssh root@101.42.14.209 'journalctl -u stock-monitor -n 50'
   ```

4. **数据库连接问题**
   ```bash
   ssh root@101.42.14.209 'systemctl status mysqld'
   ssh root@101.42.14.209 'mysql -u stock_user -p stock_analysis'
   ```

### 快速诊断

```bash
# 运行完整状态检查
./check-deployment.sh

# 检查端口监听
ssh root@101.42.14.209 'netstat -tlnp | grep -E ":(80|8000|5000|3306)"'

# 检查防火墙
ssh root@101.42.14.209 'firewall-cmd --list-ports'
```

## 📋 重要提醒

1. **首次部署**: 推荐使用 `deploy-one-click.sh` 一键部署
2. **日常更新**: 使用 `update.sh` 快速更新
3. **状态监控**: 定期运行 `check-deployment.sh` 检查状态
4. **安全建议**: 生产环境建议配置SSH密钥认证和SSL证书
5. **数据备份**: 定期备份MySQL数据库和应用文件

---

## 🎉 部署完成

**恭喜！您的股票分析学习平台已成功部署到云端** 🚀

立即访问: **http://101.42.14.209**

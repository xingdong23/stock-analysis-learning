#!/bin/bash

# 股票监控系统Python后端部署脚本

echo "🐍 部署Python后端到服务器..."

# 服务器配置
SERVER_HOST="101.42.14.209"
SERVER_USER="root"
BACKEND_DIR="/opt/stock-monitor-backend"
LOCAL_BACKEND_DIR="backend"

# 检查本地后端目录
if [ ! -d "$LOCAL_BACKEND_DIR" ]; then
    echo "❌ 本地后端目录不存在: $LOCAL_BACKEND_DIR"
    exit 1
fi

echo "📦 准备部署文件..."

# 创建临时部署目录
TEMP_DIR=$(mktemp -d)
cp -r $LOCAL_BACKEND_DIR/* $TEMP_DIR/

# 创建环境配置文件
cat > $TEMP_DIR/.env << EOF
# 生产环境配置
APP_NAME=股票监控系统
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false

# 服务器配置
HOST=0.0.0.0
PORT=8000
RELOAD=false

# 数据库配置 (SQLite for now)
DATABASE_TYPE=sqlite
SQLITE_PATH=data/stock_monitor.db

# CORS配置
CORS_ORIGINS=["http://101.42.14.209","http://localhost:3000"]

# 安全配置
SECRET_KEY=stock-monitor-production-secret-key-$(date +%s)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API配置
API_V1_PREFIX=/api/v1

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# 监控配置
MONITOR_CHECK_INTERVAL=60
MAX_ALERTS_PER_USER=100
MAX_TRIGGERS_HISTORY=1000

# 性能配置
WORKER_PROCESSES=2
EOF

echo "🚀 上传文件到服务器..."

# 创建服务器目录
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $BACKEND_DIR"

# 上传文件
rsync -avz --delete $TEMP_DIR/ $SERVER_USER@$SERVER_HOST:$BACKEND_DIR/

# 清理临时目录
rm -rf $TEMP_DIR

echo "🔧 在服务器上安装和配置..."

ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd /opt/stock-monitor-backend

# 检查Python版本
echo "📦 检查Python环境..."
python3 --version

# 安装Python虚拟环境工具（如果没有）
if ! command -v python3-venv &> /dev/null; then
    echo "安装Python虚拟环境工具..."
    yum install -y python3-venv python3-pip
fi

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
echo "安装Python依赖..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 创建必要目录
mkdir -p data logs temp

# 设置权限
chown -R root:root /opt/stock-monitor-backend
chmod +x start.sh

echo "✅ Python后端安装完成"
ENDSSH

echo "🔧 配置系统服务..."

# 创建systemd服务文件
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cat > /etc/systemd/system/stock-monitor-backend.service << 'EOF'
[Unit]
Description=Stock Monitor Backend API
After=network.target

[Service]
Type=exec
User=root
Group=root
WorkingDirectory=/opt/stock-monitor-backend
Environment=PATH=/opt/stock-monitor-backend/venv/bin
ExecStart=/opt/stock-monitor-backend/venv/bin/python main.py
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd并启动服务
systemctl daemon-reload
systemctl enable stock-monitor-backend
systemctl restart stock-monitor-backend

echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
systemctl status stock-monitor-backend --no-pager
ENDSSH

echo "🌐 配置Nginx反向代理..."

ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
# 创建Nginx配置
cat > /etc/nginx/conf.d/stock-monitor-backend.conf << 'EOF'
server {
    listen 8000;
    server_name 101.42.14.209;

    # API路由
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-User-Id";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-User-Id";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # 健康检查和文档
    location ~ ^/(health|docs|redoc)$ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 测试Nginx配置
nginx -t

# 重新加载Nginx
systemctl reload nginx

echo "✅ Nginx配置完成"
ENDSSH

echo "🧪 测试后端服务..."

# 等待服务完全启动
sleep 10

# 测试健康检查
echo "测试健康检查..."
curl -s http://101.42.14.209:8000/health | python3 -m json.tool

echo ""
echo "测试API根路径..."
curl -s http://101.42.14.209:8000/ | python3 -m json.tool

echo ""
echo "🎉 Python后端部署完成！"
echo ""
echo "📊 服务信息:"
echo "- 后端API: http://101.42.14.209:8000"
echo "- 健康检查: http://101.42.14.209:8000/health"
echo "- API文档: http://101.42.14.209:8000/docs"
echo "- 前端网站: http://101.42.14.209"
echo ""
echo "🔧 管理命令:"
echo "- 查看服务状态: systemctl status stock-monitor-backend"
echo "- 查看日志: journalctl -u stock-monitor-backend -f"
echo "- 重启服务: systemctl restart stock-monitor-backend"
echo ""
echo "✅ 部署完成！现在你的股票预警数据将永久保存在数据库中！"

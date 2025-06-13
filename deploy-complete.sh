#!/bin/bash
# 股票分析学习网站 - 完整云端部署脚本
# 包含前端、后端API服务、股票监控服务和数据库配置

SERVER_HOST="101.42.14.209"
SERVER_USER="root"
SERVER_PASSWORD="czbcxy25809*"
FRONTEND_PATH="/var/www/stock-analysis"
BACKEND_PATH="/opt/stock-analysis-backend"
MONITOR_PATH="/opt/stock-monitor"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查本地依赖..."
    
    if ! command -v sshpass &> /dev/null; then
        log_error "sshpass 未安装"
        log_info "安装方法:"
        log_info "  macOS: brew install hudochenkov/sshpass/sshpass"
        log_info "  Ubuntu: sudo apt-get install sshpass"
        log_info "  CentOS: sudo yum install sshpass"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "本地依赖检查完成"
}

# 构建前端
build_frontend() {
    log_info "🔨 构建前端项目..."
    
    # 安装依赖
    npm ci
    
    # 构建项目
    npm run build
    
    if [[ ! -d "dist" ]]; then
        log_error "前端构建失败，dist 目录不存在"
        exit 1
    fi
    
    # 打包前端文件
    tar -czf frontend.tar.gz dist/
    log_success "前端构建完成"
}

# 打包后端文件
package_backend() {
    log_info "📦 打包后端文件..."
    
    # 打包FastAPI后端
    tar -czf backend.tar.gz backend/
    
    # 打包股票监控服务
    tar -czf stock-monitor.tar.gz stock-monitor/
    
    log_success "后端文件打包完成"
}

# 上传文件到服务器
upload_files() {
    log_info "⬆️ 上传文件到服务器..."
    
    # 上传前端文件
    if ! sshpass -p "$SERVER_PASSWORD" scp frontend.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/; then
        log_error "前端文件上传失败"
        exit 1
    fi
    
    # 上传后端文件
    if ! sshpass -p "$SERVER_PASSWORD" scp backend.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/; then
        log_error "后端文件上传失败"
        exit 1
    fi
    
    # 上传股票监控文件
    if ! sshpass -p "$SERVER_PASSWORD" scp stock-monitor.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/; then
        log_error "股票监控文件上传失败"
        exit 1
    fi
    
    log_success "文件上传完成"
}

# 服务器环境初始化
init_server_environment() {
    log_info "🔧 初始化服务器环境..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 更新系统
        yum update -y
        
        # 安装基础软件
        yum install -y epel-release curl wget git nginx
        yum install -y python3 python3-pip mysql-server
        
        # 启动MySQL
        systemctl start mysqld
        systemctl enable mysqld
        
        # 配置防火墙
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-port=22/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=8000/tcp
        firewall-cmd --permanent --add-port=5000/tcp
        firewall-cmd --reload
        
        echo '✅ 服务器环境初始化完成'
    "
    
    log_success "服务器环境初始化完成"
}

# 部署前端
deploy_frontend() {
    log_info "🌐 部署前端应用..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 创建前端目录
        mkdir -p $FRONTEND_PATH
        cd $FRONTEND_PATH
        
        # 解压前端文件
        tar -xzf /tmp/frontend.tar.gz
        
        # 设置权限
        chown -R nginx:nginx $FRONTEND_PATH
        chmod -R 755 $FRONTEND_PATH
        
        echo '✅ 前端部署完成'
    "
    
    log_success "前端部署完成"
}

# 部署FastAPI后端
deploy_backend() {
    log_info "🐍 部署FastAPI后端服务..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 创建后端目录
        mkdir -p $BACKEND_PATH
        cd $BACKEND_PATH
        
        # 解压后端文件
        tar -xzf /tmp/backend.tar.gz --strip-components=1
        
        # 安装Python依赖
        pip3 install --upgrade pip
        pip3 install -r requirements.txt
        
        # 使用生产环境配置文件
        cp .env.production .env
        
        # 设置权限
        chmod +x start.sh
        
        echo '✅ FastAPI后端部署完成'
    "
    
    log_success "FastAPI后端部署完成"
}

# 部署股票监控服务
deploy_stock_monitor() {
    log_info "📈 部署股票监控服务..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 创建监控服务目录
        mkdir -p $MONITOR_PATH
        cd $MONITOR_PATH
        
        # 解压监控服务文件
        tar -xzf /tmp/stock-monitor.tar.gz --strip-components=1
        
        # 安装Python依赖
        pip3 install -r requirements.txt
        
        # 设置权限
        chmod +x deploy.sh
        
        echo '✅ 股票监控服务部署完成'
    "
    
    log_success "股票监控服务部署完成"
}

# 配置数据库
setup_database() {
    log_info "🗄️ 配置MySQL数据库..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 获取MySQL临时密码
        TEMP_PASSWORD=\$(grep 'temporary password' /var/log/mysqld.log | awk '{print \$NF}' | tail -1)
        
        # 设置MySQL root密码
        mysql -u root -p\"\$TEMP_PASSWORD\" --connect-expired-password << 'EOF'
ALTER USER 'root'@'localhost' IDENTIFIED BY 'StockAnalysis2024!';
FLUSH PRIVILEGES;
EOF
        
        # 创建数据库和用户
        mysql -u root -p'StockAnalysis2024!' << 'EOF'
CREATE DATABASE IF NOT EXISTS stock_analysis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'stock_user'@'localhost' IDENTIFIED BY 'stock_password';
GRANT ALL PRIVILEGES ON stock_analysis.* TO 'stock_user'@'localhost';
FLUSH PRIVILEGES;
EOF
        
        echo '✅ 数据库配置完成'
    "
    
    log_success "数据库配置完成"
}

# 清理临时文件
cleanup() {
    log_info "🧹 清理临时文件..."
    
    # 清理本地文件
    rm -f frontend.tar.gz backend.tar.gz stock-monitor.tar.gz
    
    # 清理服务器临时文件
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        rm -f /tmp/frontend.tar.gz /tmp/backend.tar.gz /tmp/stock-monitor.tar.gz
    "
    
    log_success "清理完成"
}

# 主函数
main() {
    log_info "========================================="
    log_info "股票分析学习网站 - 完整云端部署"
    log_info "目标服务器: $SERVER_HOST"
    log_info "开始时间: $(date)"
    log_info "========================================="
    
    check_dependencies
    build_frontend
    package_backend
    upload_files
    init_server_environment
    setup_database
    deploy_frontend
    deploy_backend
    deploy_stock_monitor
    cleanup
    
    log_success "========================================="
    log_success "🎉 完整部署成功!"
    log_success "前端地址: http://$SERVER_HOST"
    log_success "后端API: http://$SERVER_HOST:8000"
    log_success "监控服务: http://$SERVER_HOST:5000"
    log_success "完成时间: $(date)"
    log_success "========================================="
}

# 错误处理
trap 'log_error "部署过程中发生错误"; cleanup; exit 1' ERR

# 执行主函数
main "$@"

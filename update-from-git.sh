#!/bin/bash
# 从Git拉取最新代码并重新部署

SERVER_HOST="101.42.14.209"
SERVER_USER="root"
SERVER_PASSWORD="czbcxy25809*"

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

# 推送本地代码到远程仓库
push_to_remote() {
    log_info "📤 推送本地代码到远程仓库..."
    
    # 添加所有修改的文件
    git add .
    
    # 提交更改
    git commit -m "部署配置更新: 修复后端服务配置和Nginx代理" || log_warning "没有新的更改需要提交"
    
    # 推送到远程仓库
    git push origin main
    
    log_success "代码推送完成"
}

# 在服务器上拉取最新代码
pull_on_server() {
    log_info "📥 在服务器上拉取最新代码..."
    
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
        # 进入项目目录
        cd /root/stock-analysis-learning || {
            echo '项目目录不存在，克隆仓库...'
            git clone https://github.com/xingdong23/stock-analysis-learning.git
            cd stock-analysis-learning
        }
        
        # 拉取最新代码
        git pull origin main
        
        echo '✅ 代码拉取完成'
    "
    
    log_success "服务器代码更新完成"
}

# 更新后端服务
update_backend() {
    log_info "🐍 更新FastAPI后端服务..."
    
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
        cd /root/stock-analysis-learning
        
        # 复制后端文件到部署目录
        cp -r backend/* /opt/stock-analysis-backend/
        
        # 设置生产环境配置
        cd /opt/stock-analysis-backend
        cp .env.production .env
        
        # 重启服务
        systemctl restart stock-backend
        
        echo '✅ 后端服务更新完成'
    "
    
    log_success "FastAPI后端更新完成"
}

# 更新股票监控服务
update_monitor() {
    log_info "📈 更新股票监控服务..."
    
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
        cd /root/stock-analysis-learning
        
        # 复制监控服务文件到部署目录
        cp -r stock-monitor/* /opt/stock-monitor/
        
        # 重启服务
        systemctl restart stock-monitor
        
        echo '✅ 监控服务更新完成'
    "
    
    log_success "股票监控服务更新完成"
}

# 更新前端
update_frontend() {
    log_info "🌐 更新前端应用..."
    
    # 本地构建前端
    npm ci
    npm run build
    
    # 打包并上传
    tar -czf frontend.tar.gz dist/
    sshpass -p "$SERVER_PASSWORD" scp frontend.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/
    
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
        cd /var/www/stock-analysis
        tar -xzf /tmp/frontend.tar.gz
        chown -R nginx:nginx /var/www/stock-analysis
        rm -f /tmp/frontend.tar.gz
        
        echo '✅ 前端更新完成'
    "
    
    # 清理本地文件
    rm -f frontend.tar.gz
    
    log_success "前端应用更新完成"
}

# 更新Nginx配置
update_nginx() {
    log_info "🌐 更新Nginx配置..."
    
    # 上传新的Nginx配置
    sshpass -p "$SERVER_PASSWORD" scp nginx-complete.conf $SERVER_USER@$SERVER_HOST:/tmp/
    
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
        # 备份当前配置
        cp /etc/nginx/conf.d/stock-analysis.conf /etc/nginx/conf.d/stock-analysis.conf.backup
        
        # 安装新配置
        cp /tmp/nginx-complete.conf /etc/nginx/conf.d/stock-analysis.conf
        
        # 测试配置
        nginx -t && systemctl reload nginx
        
        echo '✅ Nginx配置更新完成'
    "
    
    log_success "Nginx配置更新完成"
}

# 检查服务状态
check_services() {
    log_info "🔍 检查服务状态..."
    
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
        echo '=== 服务状态检查 ==='
        echo 'Nginx状态:'
        systemctl is-active nginx
        
        echo 'FastAPI后端状态:'
        systemctl is-active stock-backend
        
        echo '股票监控服务状态:'
        systemctl is-active stock-monitor
        
        echo '=== 端口监听检查 ==='
        netstat -tlnp | grep -E ':(80|8001|5000)'
        
        echo '=== 健康检查 ==='
        curl -s http://localhost:8001/health | head -100
        echo
        curl -s http://localhost:5000/api/health | head -100
        echo
    "
    
    log_success "服务状态检查完成"
}

# 主函数
main() {
    log_info "========================================="
    log_info "股票分析学习网站 - Git更新部署"
    log_info "开始时间: $(date)"
    log_info "========================================="
    
    push_to_remote
    pull_on_server
    update_backend
    update_monitor
    update_frontend
    update_nginx
    check_services
    
    log_success "========================================="
    log_success "🎉 更新部署完成!"
    log_success "前端地址: http://$SERVER_HOST"
    log_success "后端API: http://$SERVER_HOST:8001"
    log_success "监控服务: http://$SERVER_HOST:5000"
    log_success "完成时间: $(date)"
    log_success "========================================="
}

# 错误处理
trap 'log_error "更新过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"

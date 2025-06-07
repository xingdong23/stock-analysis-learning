#!/bin/bash
# 股票分析学习网站 - 最终部署脚本

SERVER_HOST="101.42.14.209"
SERVER_USER="root"
SERVER_PASSWORD="czbcxy25809*"
SERVER_PATH="/var/www/stock-analysis"

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
}

# 本地构建
build_project() {
    log_info "🔨 本地构建项目..."
    
    # 安装依赖
    npm ci
    
    # 构建项目
    npm run build
    
    if [[ ! -d "dist" ]]; then
        log_error "构建失败，dist 目录不存在"
        exit 1
    fi
    
    log_success "项目构建完成"
}

# 打包文件
package_files() {
    log_info "📦 打包构建文件..."
    tar -czf dist.tar.gz dist/
    log_success "文件打包完成"
}

# 上传到服务器
upload_files() {
    log_info "⬆️ 上传文件到服务器..."
    
    if ! sshpass -p "$SERVER_PASSWORD" scp dist.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/; then
        log_error "文件上传失败"
        exit 1
    fi
    
    log_success "文件上传完成"
}

# 服务器部署
deploy_to_server() {
    log_info "🚀 服务器部署..."
    
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
        
        echo '✅ 服务器部署完成!'
    "
    
    log_success "服务器部署完成"
}

# 清理本地文件
cleanup() {
    log_info "🧹 清理临时文件..."
    rm -f dist.tar.gz
    log_success "清理完成"
}

# 测试部署
test_deployment() {
    log_info "🧪 测试部署结果..."
    
    sleep 3
    
    if curl -f -s -o /dev/null "http://$SERVER_HOST"; then
        log_success "✅ 网站可正常访问: http://$SERVER_HOST"
    else
        log_error "❌ 网站无法访问"
        return 1
    fi
}

# 主函数
main() {
    log_info "========================================="
    log_info "股票分析学习网站 - 自动部署"
    log_info "目标服务器: $SERVER_HOST"
    log_info "开始时间: $(date)"
    log_info "========================================="
    
    check_dependencies
    build_project
    package_files
    upload_files
    deploy_to_server
    cleanup
    test_deployment
    
    log_success "========================================="
    log_success "🎉 部署成功!"
    log_success "网站地址: http://$SERVER_HOST"
    log_success "完成时间: $(date)"
    log_success "========================================="
}

# 错误处理
trap 'log_error "部署过程中发生错误"; cleanup; exit 1' ERR

# 执行主函数
main "$@"

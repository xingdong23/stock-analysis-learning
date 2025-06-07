#!/bin/bash
# 股票分析学习网站 - 快速更新脚本

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

# 检查依赖
check_dependencies() {
    if ! command -v sshpass &> /dev/null; then
        log_error "sshpass 未安装"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "git 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
}

# 更新代码
update_code() {
    log_info "📥 拉取最新代码..."
    
    # 检查是否有未提交的更改
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "存在未提交的更改"
        read -p "是否继续更新? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "更新已取消"
            exit 0
        fi
    fi
    
    git pull origin main
    log_success "代码更新完成"
}

# 构建项目
build_project() {
    log_info "🔨 构建项目..."
    
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

# 部署到服务器
deploy_to_server() {
    log_info "🚀 部署到服务器..."
    
    # 打包文件
    tar -czf dist.tar.gz dist/
    
    # 上传文件
    sshpass -p "$SERVER_PASSWORD" scp dist.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/
    
    # 服务器部署
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        cd /var/www/stock-analysis
        tar -xzf /tmp/dist.tar.gz
        chown -R nginx:nginx /var/www/stock-analysis
        systemctl reload nginx
        rm -f /tmp/dist.tar.gz
        echo '服务器部署完成'
    "
    
    # 清理本地文件
    rm -f dist.tar.gz
    
    log_success "部署完成"
}

# 测试更新
test_update() {
    log_info "🧪 测试更新结果..."
    
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
    log_info "股票分析学习网站 - 快速更新"
    log_info "目标服务器: $SERVER_HOST"
    log_info "开始时间: $(date)"
    log_info "========================================="
    
    check_dependencies
    update_code
    build_project
    deploy_to_server
    test_update
    
    log_success "========================================="
    log_success "🎉 更新成功!"
    log_success "网站地址: http://$SERVER_HOST"
    log_success "完成时间: $(date)"
    log_success "========================================="
}

# 错误处理
trap 'log_error "更新过程中发生错误"; rm -f dist.tar.gz; exit 1' ERR

# 执行主函数
main "$@"

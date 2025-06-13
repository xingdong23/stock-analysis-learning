#!/bin/bash
# 股票分析学习网站 - 一键部署脚本
# 自动完成服务器配置和应用部署

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

# 显示欢迎信息
show_welcome() {
    clear
    echo -e "${GREEN}"
    echo "========================================="
    echo "   股票分析学习网站 - 一键部署工具"
    echo "========================================="
    echo -e "${NC}"
    echo "🎯 目标服务器: $SERVER_HOST"
    echo "📦 部署内容:"
    echo "   ✓ React前端应用"
    echo "   ✓ FastAPI后端服务"
    echo "   ✓ Flask股票监控服务"
    echo "   ✓ MySQL数据库"
    echo "   ✓ Nginx反向代理"
    echo ""
    echo -e "${YELLOW}注意: 此脚本将完全配置服务器环境${NC}"
    echo ""
    read -p "是否继续部署? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 0
    fi
}

# 检查本地环境
check_local_environment() {
    log_info "🔍 检查本地环境..."
    
    # 检查必要工具
    local missing_tools=()
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if ! command -v sshpass &> /dev/null; then
        missing_tools+=("sshpass")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少必要工具: ${missing_tools[*]}"
        log_info "安装方法:"
        log_info "  macOS: brew install node hudochenkov/sshpass/sshpass"
        log_info "  Ubuntu: sudo apt install nodejs npm sshpass"
        log_info "  CentOS: sudo yum install nodejs npm sshpass"
        exit 1
    fi
    
    # 检查项目文件
    if [[ ! -f "package.json" ]]; then
        log_error "未找到 package.json，请在项目根目录运行此脚本"
        exit 1
    fi
    
    log_success "本地环境检查通过"
}

# 测试服务器连接
test_server_connection() {
    log_info "🔗 测试服务器连接..."
    
    if ! sshpass -p "$SERVER_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "echo '连接成功'" &>/dev/null; then
        log_error "无法连接到服务器 $SERVER_HOST"
        log_info "请检查:"
        log_info "  1. 服务器IP地址是否正确"
        log_info "  2. 服务器是否运行"
        log_info "  3. SSH服务是否启动"
        log_info "  4. 用户名和密码是否正确"
        exit 1
    fi
    
    log_success "服务器连接正常"
}

# 执行服务器配置
run_server_setup() {
    log_info "⚙️ 配置服务器环境..."
    
    if [[ -f "server-setup-complete.sh" ]]; then
        chmod +x server-setup-complete.sh
        ./server-setup-complete.sh
    else
        log_error "未找到服务器配置脚本 server-setup-complete.sh"
        exit 1
    fi
}

# 执行应用部署
run_app_deployment() {
    log_info "🚀 部署应用..."
    
    if [[ -f "deploy-complete.sh" ]]; then
        chmod +x deploy-complete.sh
        ./deploy-complete.sh
    else
        log_error "未找到应用部署脚本 deploy-complete.sh"
        exit 1
    fi
}

# 验证部署结果
verify_deployment() {
    log_info "🧪 验证部署结果..."
    
    # 等待服务启动
    sleep 10
    
    # 检查前端
    if curl -f -s -o /dev/null "http://$SERVER_HOST"; then
        log_success "✅ 前端应用正常访问"
    else
        log_warning "⚠️ 前端应用可能未正常启动"
    fi
    
    # 检查后端API
    if curl -f -s -o /dev/null "http://$SERVER_HOST:8000/health"; then
        log_success "✅ 后端API服务正常"
    else
        log_warning "⚠️ 后端API服务可能未正常启动"
    fi
    
    # 检查监控服务
    if curl -f -s -o /dev/null "http://$SERVER_HOST:5000/api/health"; then
        log_success "✅ 股票监控服务正常"
    else
        log_warning "⚠️ 股票监控服务可能未正常启动"
    fi
}

# 显示部署结果
show_deployment_result() {
    echo ""
    echo -e "${GREEN}========================================="
    echo "🎉 部署完成!"
    echo "=========================================${NC}"
    echo ""
    echo "📱 访问地址:"
    echo "   前端应用: http://$SERVER_HOST"
    echo "   后端API: http://$SERVER_HOST:8000"
    echo "   API文档: http://$SERVER_HOST:8000/docs"
    echo "   监控服务: http://$SERVER_HOST:5000"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看状态: ssh root@$SERVER_HOST 'stock-status.sh'"
    echo "   重启服务: ssh root@$SERVER_HOST 'systemctl restart stock-backend stock-monitor'"
    echo "   查看日志: ssh root@$SERVER_HOST 'journalctl -u stock-backend -f'"
    echo ""
    echo "📚 下一步:"
    echo "   1. 访问前端应用测试功能"
    echo "   2. 查看API文档了解接口"
    echo "   3. 配置股票监控规则"
    echo "   4. 设置SSL证书（可选）"
    echo ""
    echo -e "${YELLOW}注意: 首次访问可能需要等待1-2分钟服务完全启动${NC}"
}

# 主函数
main() {
    show_welcome
    check_local_environment
    test_server_connection
    
    log_info "开始一键部署流程..."
    
    # 第一阶段：服务器配置
    log_info "📋 第一阶段：配置服务器环境"
    run_server_setup
    
    # 第二阶段：应用部署
    log_info "📋 第二阶段：部署应用"
    run_app_deployment
    
    # 第三阶段：验证部署
    log_info "📋 第三阶段：验证部署"
    verify_deployment
    
    # 显示结果
    show_deployment_result
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"

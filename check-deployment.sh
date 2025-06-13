#!/bin/bash
# 股票分析学习网站 - 部署状态检查脚本

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

# 检查网络连接
check_network() {
    log_info "🌐 检查网络连接..."
    
    if ping -c 1 $SERVER_HOST &> /dev/null; then
        log_success "服务器网络连接正常"
    else
        log_error "无法连接到服务器"
        return 1
    fi
}

# 检查前端应用
check_frontend() {
    log_info "🌐 检查前端应用..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST" --connect-timeout 10)
    
    if [ "$response" = "200" ]; then
        log_success "前端应用运行正常 (HTTP $response)"
    else
        log_error "前端应用异常 (HTTP $response)"
        return 1
    fi
}

# 检查后端API
check_backend_api() {
    log_info "🐍 检查FastAPI后端..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST:8000/health" --connect-timeout 10)
    
    if [ "$response" = "200" ]; then
        log_success "FastAPI后端运行正常 (HTTP $response)"
    else
        log_error "FastAPI后端异常 (HTTP $response)"
        return 1
    fi
}

# 检查股票监控服务
check_monitor_service() {
    log_info "📈 检查股票监控服务..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST:5000/api/health" --connect-timeout 10)
    
    if [ "$response" = "200" ]; then
        log_success "股票监控服务运行正常 (HTTP $response)"
    else
        log_error "股票监控服务异常 (HTTP $response)"
        return 1
    fi
}

# 检查服务器服务状态
check_server_services() {
    log_info "⚙️ 检查服务器服务状态..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        echo '=== Nginx状态 ==='
        systemctl is-active nginx
        
        echo '=== FastAPI后端状态 ==='
        systemctl is-active stock-backend 2>/dev/null || echo 'not configured'
        
        echo '=== 股票监控服务状态 ==='
        systemctl is-active stock-monitor 2>/dev/null || echo 'not configured'
        
        echo '=== MySQL状态 ==='
        systemctl is-active mysqld
        
        echo '=== 端口监听状态 ==='
        netstat -tlnp | grep -E ':(80|8000|5000|3306)' || echo 'No services listening'
    "
}

# 检查API响应内容
check_api_content() {
    log_info "📊 检查API响应内容..."
    
    # 检查前端首页
    local frontend_content=$(curl -s "http://$SERVER_HOST" --connect-timeout 10)
    if echo "$frontend_content" | grep -q "股票分析" || echo "$frontend_content" | grep -q "React"; then
        log_success "前端内容正常"
    else
        log_warning "前端内容可能异常"
    fi
    
    # 检查后端健康检查
    local backend_health=$(curl -s "http://$SERVER_HOST:8000/health" --connect-timeout 10)
    if echo "$backend_health" | grep -q "healthy"; then
        log_success "后端健康检查正常"
    else
        log_warning "后端健康检查异常"
    fi
    
    # 检查监控服务
    local monitor_health=$(curl -s "http://$SERVER_HOST:5000/api/health" --connect-timeout 10)
    if echo "$monitor_health" | grep -q "healthy"; then
        log_success "监控服务健康检查正常"
    else
        log_warning "监控服务健康检查异常"
    fi
}

# 性能测试
performance_test() {
    log_info "⚡ 性能测试..."
    
    # 测试前端响应时间
    local frontend_time=$(curl -o /dev/null -s -w "%{time_total}" "http://$SERVER_HOST")
    log_info "前端响应时间: ${frontend_time}s"
    
    # 测试后端响应时间
    local backend_time=$(curl -o /dev/null -s -w "%{time_total}" "http://$SERVER_HOST:8000/health")
    log_info "后端响应时间: ${backend_time}s"
    
    # 测试监控服务响应时间
    local monitor_time=$(curl -o /dev/null -s -w "%{time_total}" "http://$SERVER_HOST:5000/api/health")
    log_info "监控服务响应时间: ${monitor_time}s"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo -e "${GREEN}========================================="
    echo "📊 部署状态总结"
    echo "=========================================${NC}"
    echo ""
    echo "🌐 访问地址:"
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
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "========================================="
    echo "   股票分析学习网站 - 部署状态检查"
    echo "========================================="
    echo -e "${NC}"
    echo "🎯 目标服务器: $SERVER_HOST"
    echo "🕐 检查时间: $(date)"
    echo ""
    
    local errors=0
    
    # 执行检查
    check_network || ((errors++))
    echo ""
    
    check_frontend || ((errors++))
    echo ""
    
    check_backend_api || ((errors++))
    echo ""
    
    check_monitor_service || ((errors++))
    echo ""
    
    check_server_services
    echo ""
    
    check_api_content
    echo ""
    
    performance_test
    echo ""
    
    # 显示结果
    if [ $errors -eq 0 ]; then
        log_success "🎉 所有服务运行正常!"
    else
        log_error "❌ 发现 $errors 个问题，请检查服务状态"
    fi
    
    show_deployment_info
    
    return $errors
}

# 执行主函数
main "$@"

#!/bin/bash

# 部署测试脚本
# 用于验证云主机部署是否成功

set -e

SERVER_HOST="101.42.14.209"
SERVER_USER="root"

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

# 测试服务器连接
test_server_connection() {
    log_info "测试服务器连接..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
        log_success "服务器连接正常"
        return 0
    else
        log_error "无法连接到服务器"
        return 1
    fi
}

# 测试网站可访问性
test_website_accessibility() {
    log_info "测试网站可访问性..."
    
    local url="http://$SERVER_HOST"
    
    if curl -f -s -o /dev/null --max-time 10 "$url"; then
        log_success "网站可正常访问: $url"
        return 0
    else
        log_error "网站无法访问: $url"
        return 1
    fi
}

# 测试响应时间
test_response_time() {
    log_info "测试网站响应时间..."
    
    local url="http://$SERVER_HOST"
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 "$url" 2>/dev/null || echo "timeout")
    
    if [[ "$response_time" == "timeout" ]]; then
        log_error "响应超时"
        return 1
    fi
    
    local response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "unknown")
    
    if (( $(echo "$response_time < 2.0" | bc -l 2>/dev/null || echo 0) )); then
        log_success "响应时间: ${response_ms%.*}ms (优秀)"
    elif (( $(echo "$response_time < 5.0" | bc -l 2>/dev/null || echo 0) )); then
        log_warning "响应时间: ${response_ms%.*}ms (良好)"
    else
        log_warning "响应时间: ${response_ms%.*}ms (较慢)"
    fi
}

# 测试关键页面
test_key_pages() {
    log_info "测试关键页面..."
    
    local base_url="http://$SERVER_HOST"
    local pages=("/" "/indicators" "/practice")
    local failed_pages=0
    
    for page in "${pages[@]}"; do
        local url="${base_url}${page}"
        local status_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")
        
        if [[ "$status_code" == "200" ]]; then
            log_success "$page: $status_code"
        else
            log_error "$page: $status_code"
            ((failed_pages++))
        fi
    done
    
    if [[ $failed_pages -eq 0 ]]; then
        log_success "所有关键页面测试通过"
        return 0
    else
        log_error "$failed_pages 个页面测试失败"
        return 1
    fi
}

# 测试页面内容
test_page_content() {
    log_info "测试页面内容..."
    
    local url="http://$SERVER_HOST"
    local content=$(curl -s --max-time 10 "$url" 2>/dev/null || echo "")
    
    if [[ -z "$content" ]]; then
        log_error "无法获取页面内容"
        return 1
    fi
    
    # 检查关键内容
    if echo "$content" | grep -q "股票分析学习"; then
        log_success "页面标题正常"
    else
        log_warning "页面标题可能异常"
    fi
    
    if echo "$content" | grep -q "技术指标"; then
        log_success "页面内容正常"
    else
        log_warning "页面内容可能异常"
    fi
    
    # 检查是否是完整的 HTML
    if echo "$content" | grep -q "</html>"; then
        log_success "HTML 结构完整"
    else
        log_warning "HTML 结构可能不完整"
    fi
}

# 测试服务器状态
test_server_status() {
    log_info "测试服务器状态..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        echo "=== 系统信息 ==="
        uname -a
        
        echo -e "\n=== 内存使用 ==="
        free -h
        
        echo -e "\n=== 磁盘使用 ==="
        df -h /
        
        echo -e "\n=== Nginx 状态 ==="
        systemctl is-active nginx
        
        echo -e "\n=== 防火墙状态 ==="
        if command -v firewall-cmd &> /dev/null; then
            firewall-cmd --state
            firewall-cmd --list-ports
        elif command -v ufw &> /dev/null; then
            ufw status
        fi
        
        echo -e "\n=== 端口监听 ==="
        netstat -tlnp | grep :80 || ss -tlnp | grep :80
        
        echo -e "\n=== 项目文件 ==="
        ls -la /var/www/stock-analysis/dist/ | head -10
        
        echo -e "\n=== Git 信息 ==="
        cd /var/www/stock-analysis
        git log -1 --pretty=format:'%h - %s (%an, %ar)'
        echo
EOF
    
    log_success "服务器状态检查完成"
}

# 测试安全头部
test_security_headers() {
    log_info "测试安全头部..."
    
    local url="http://$SERVER_HOST"
    local headers=$(curl -s -I --max-time 10 "$url" 2>/dev/null || echo "")
    
    if [[ -z "$headers" ]]; then
        log_error "无法获取响应头部"
        return 1
    fi
    
    # 检查安全头部
    if echo "$headers" | grep -qi "x-frame-options"; then
        log_success "X-Frame-Options 头部存在"
    else
        log_warning "X-Frame-Options 头部缺失"
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options 头部存在"
    else
        log_warning "X-Content-Type-Options 头部缺失"
    fi
    
    if echo "$headers" | grep -qi "x-xss-protection"; then
        log_success "X-XSS-Protection 头部存在"
    else
        log_warning "X-XSS-Protection 头部缺失"
    fi
}

# 性能测试
test_performance() {
    log_info "执行性能测试..."
    
    local url="http://$SERVER_HOST"
    
    # 测试并发请求
    log_info "测试并发请求处理能力..."
    
    for i in {1..5}; do
        curl -s -o /dev/null --max-time 10 "$url" &
    done
    wait
    
    log_success "并发请求测试完成"
    
    # 测试静态资源
    log_info "测试静态资源加载..."
    
    local static_urls=(
        "$url/assets/"
        "$url/favicon.ico"
    )
    
    for static_url in "${static_urls[@]}"; do
        local status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$static_url" 2>/dev/null || echo "000")
        if [[ "$status" =~ ^(200|404)$ ]]; then
            log_info "静态资源 $static_url: $status"
        else
            log_warning "静态资源 $static_url: $status"
        fi
    done
}

# 生成测试报告
generate_report() {
    local total_tests=$1
    local passed_tests=$2
    local failed_tests=$((total_tests - passed_tests))
    
    log_info "========================================="
    log_info "部署测试报告"
    log_info "========================================="
    log_info "测试时间: $(date)"
    log_info "服务器: $SERVER_HOST"
    log_info "总测试数: $total_tests"
    log_success "通过测试: $passed_tests"
    
    if [[ $failed_tests -gt 0 ]]; then
        log_error "失败测试: $failed_tests"
        log_warning "部署可能存在问题，请检查失败的测试项"
    else
        log_success "所有测试通过！部署成功 🎉"
    fi
    
    log_info "========================================="
    log_info "网站地址: http://$SERVER_HOST"
    log_info "========================================="
}

# 主函数
main() {
    log_info "========================================="
    log_info "开始部署测试"
    log_info "目标服务器: $SERVER_HOST"
    log_info "测试时间: $(date)"
    log_info "========================================="
    
    local total_tests=0
    local passed_tests=0
    
    # 执行测试
    tests=(
        "test_server_connection"
        "test_website_accessibility"
        "test_response_time"
        "test_key_pages"
        "test_page_content"
        "test_security_headers"
    )
    
    for test in "${tests[@]}"; do
        ((total_tests++))
        if $test; then
            ((passed_tests++))
        fi
        echo
    done
    
    # 额外信息测试（不计入通过/失败）
    test_server_status
    echo
    test_performance
    echo
    
    # 生成报告
    generate_report $total_tests $passed_tests
}

# 检查依赖
if ! command -v curl &> /dev/null; then
    log_error "curl 未安装"
    exit 1
fi

if ! command -v ssh &> /dev/null; then
    log_error "ssh 未安装"
    exit 1
fi

# 执行主函数
main "$@"

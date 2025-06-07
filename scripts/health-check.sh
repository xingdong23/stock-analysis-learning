#!/bin/bash

# 网站健康检查脚本
# 使用方法: ./scripts/health-check.sh [URL]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认URL
DEFAULT_URL="http://localhost:5173"
URL=${1:-$DEFAULT_URL}

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

# 检查网站可访问性
check_accessibility() {
    log_info "检查网站可访问性: $URL"
    
    if curl -f -s -o /dev/null "$URL"; then
        log_success "网站可正常访问"
        return 0
    else
        log_error "网站无法访问"
        return 1
    fi
}

# 检查响应时间
check_response_time() {
    log_info "检查响应时间..."
    
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$URL")
    local response_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        log_success "响应时间: ${response_ms%.*}ms (良好)"
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        log_warning "响应时间: ${response_ms%.*}ms (一般)"
    else
        log_error "响应时间: ${response_ms%.*}ms (较慢)"
    fi
}

# 检查HTTP状态码
check_status_codes() {
    log_info "检查关键页面状态码..."
    
    local pages=(
        "/"
        "/indicators"
        "/practice"
    )
    
    for page in "${pages[@]}"; do
        local full_url="${URL}${page}"
        local status_code=$(curl -s -o /dev/null -w '%{http_code}' "$full_url")
        
        if [[ "$status_code" == "200" ]]; then
            log_success "$page: $status_code"
        else
            log_error "$page: $status_code"
        fi
    done
}

# 检查资源加载
check_resources() {
    log_info "检查静态资源..."
    
    # 获取页面内容
    local page_content=$(curl -s "$URL")
    
    # 检查是否包含关键元素
    if echo "$page_content" | grep -q "股票分析学习"; then
        log_success "页面标题正常"
    else
        log_error "页面标题缺失"
    fi
    
    if echo "$page_content" | grep -q "技术指标"; then
        log_success "页面内容正常"
    else
        log_error "页面内容异常"
    fi
}

# 检查SEO元素
check_seo() {
    log_info "检查SEO元素..."
    
    local page_content=$(curl -s "$URL")
    
    # 检查meta标签
    if echo "$page_content" | grep -q "<meta.*description"; then
        log_success "Description meta标签存在"
    else
        log_warning "Description meta标签缺失"
    fi
    
    if echo "$page_content" | grep -q "<title>"; then
        log_success "Title标签存在"
    else
        log_error "Title标签缺失"
    fi
}

# 检查安全头部
check_security_headers() {
    log_info "检查安全头部..."
    
    local headers=$(curl -s -I "$URL")
    
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
}

# 主函数
main() {
    log_info "========================================="
    log_info "股票分析学习网站健康检查"
    log_info "检查URL: $URL"
    log_info "时间: $(date)"
    log_info "========================================="
    
    local failed_checks=0
    
    check_accessibility || ((failed_checks++))
    check_response_time
    check_status_codes || ((failed_checks++))
    check_resources || ((failed_checks++))
    check_seo
    check_security_headers
    
    log_info "========================================="
    if [[ $failed_checks -eq 0 ]]; then
        log_success "所有检查通过! ✅"
        exit 0
    else
        log_error "有 $failed_checks 项检查失败 ❌"
        exit 1
    fi
}

# 检查依赖
if ! command -v curl &> /dev/null; then
    log_error "curl 未安装"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_warning "bc 未安装，跳过响应时间检查"
fi

# 执行主函数
main "$@"

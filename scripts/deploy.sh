#!/bin/bash

# 股票分析学习网站部署脚本
# 使用方法: ./scripts/deploy.sh [环境]
# 环境选项: dev, staging, production

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查参数
ENVIRONMENT=${1:-production}
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    log_error "无效的环境参数: $ENVIRONMENT"
    log_info "使用方法: $0 [dev|staging|production]"
    exit 1
fi

log_info "开始部署到 $ENVIRONMENT 环境..."

# 检查必要工具
check_dependencies() {
    log_info "检查依赖工具..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "git 未安装"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 检查代码状态
check_git_status() {
    log_info "检查 Git 状态..."
    
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "存在未提交的更改"
        read -p "是否继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    log_success "Git 状态检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    npm ci
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # TypeScript 类型检查
    log_info "执行 TypeScript 类型检查..."
    npx tsc --noEmit
    
    # ESLint 检查
    log_info "执行 ESLint 检查..."
    npm run lint
    
    log_success "测试完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 清理旧的构建文件
    rm -rf dist
    
    # 根据环境设置构建命令
    case $ENVIRONMENT in
        dev)
            npm run build
            ;;
        staging)
            npm run build
            ;;
        production)
            npm run build
            ;;
    esac
    
    log_success "项目构建完成"
}

# 部署到不同平台
deploy_to_platform() {
    case $ENVIRONMENT in
        dev)
            deploy_to_dev
            ;;
        staging)
            deploy_to_staging
            ;;
        production)
            deploy_to_production
            ;;
    esac
}

# 开发环境部署
deploy_to_dev() {
    log_info "部署到开发环境..."
    # 这里可以添加开发环境特定的部署逻辑
    log_success "开发环境部署完成"
}

# 预发布环境部署
deploy_to_staging() {
    log_info "部署到预发布环境..."
    # 这里可以添加预发布环境特定的部署逻辑
    log_success "预发布环境部署完成"
}

# 生产环境部署
deploy_to_production() {
    log_info "部署到生产环境..."
    
    # 确认部署
    log_warning "即将部署到生产环境!"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 创建 Git 标签
    VERSION=$(date +%Y%m%d_%H%M%S)
    git tag -a "v$VERSION" -m "Production deployment $VERSION"
    git push origin "v$VERSION"
    
    log_success "生产环境部署完成"
    log_info "部署版本: v$VERSION"
}

# 部署后验证
post_deploy_verification() {
    log_info "执行部署后验证..."
    
    # 检查构建文件
    if [[ ! -d "dist" ]]; then
        log_error "构建目录不存在"
        exit 1
    fi
    
    if [[ ! -f "dist/index.html" ]]; then
        log_error "index.html 文件不存在"
        exit 1
    fi
    
    # 检查关键文件
    local js_files=$(find dist -name "*.js" | wc -l)
    local css_files=$(find dist -name "*.css" | wc -l)
    
    if [[ $js_files -eq 0 ]]; then
        log_error "没有找到 JavaScript 文件"
        exit 1
    fi
    
    if [[ $css_files -eq 0 ]]; then
        log_error "没有找到 CSS 文件"
        exit 1
    fi
    
    log_success "部署后验证完成"
    log_info "JavaScript 文件: $js_files 个"
    log_info "CSS 文件: $css_files 个"
}

# 清理临时文件
cleanup() {
    log_info "清理临时文件..."
    # 这里可以添加清理逻辑
    log_success "清理完成"
}

# 主函数
main() {
    log_info "========================================="
    log_info "股票分析学习网站部署脚本"
    log_info "环境: $ENVIRONMENT"
    log_info "时间: $(date)"
    log_info "========================================="
    
    check_dependencies
    check_git_status
    install_dependencies
    run_tests
    build_project
    deploy_to_platform
    post_deploy_verification
    cleanup
    
    log_success "========================================="
    log_success "部署完成! 🎉"
    log_success "环境: $ENVIRONMENT"
    log_success "时间: $(date)"
    log_success "========================================="
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"

#!/bin/bash

# 云主机自动部署脚本
# 使用方法: ./scripts/deploy-to-server.sh

set -e

# 服务器配置
SERVER_HOST="101.42.14.209"
SERVER_USER="root"
SERVER_PATH="/var/www/stock-analysis"
PROJECT_NAME="stock-analysis-learning"
GIT_REPO="git@github.com:xingdong23/stock-analysis-learning.git"

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

# 检查本地环境
check_local_environment() {
    log_info "检查本地环境..."
    
    if ! command -v ssh &> /dev/null; then
        log_error "SSH 未安装"
        exit 1
    fi
    
    if ! command -v scp &> /dev/null; then
        log_error "SCP 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "本地环境检查完成"
}

# 检查本地代码状态
check_local_code() {
    log_info "检查本地代码状态..."

    # 检查是否有未提交的更改
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "存在未提交的更改"
        read -p "是否先提交并推送代码? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            read -p "请输入提交信息: " commit_message
            git commit -m "$commit_message"
            git push origin main
            log_success "代码已推送到远程仓库"
        else
            log_warning "将使用远程仓库的最新代码进行部署"
        fi
    else
        log_info "本地代码无未提交更改"
        # 推送最新代码到远程
        git push origin main
        log_success "最新代码已推送到远程仓库"
    fi
}

# 测试服务器连接
test_server_connection() {
    log_info "测试服务器连接..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
        log_success "服务器连接正常"
    else
        log_error "无法连接到服务器 $SERVER_HOST"
        log_info "请确保："
        log_info "1. 服务器地址正确"
        log_info "2. SSH 密钥已配置或密码正确"
        log_info "3. 服务器防火墙允许 SSH 连接"
        exit 1
    fi
}

# 初始化服务器环境
init_server_environment() {
    log_info "初始化服务器环境..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        # 检测操作系统 - 优先使用 CentOS/RHEL 命令
        if command -v yum &> /dev/null; then
            PACKAGE_MANAGER="yum"
            UPDATE_CMD="yum update -y"
            INSTALL_CMD="yum install -y"
            echo "检测到 CentOS/RHEL 系统"
        elif command -v dnf &> /dev/null; then
            PACKAGE_MANAGER="dnf"
            UPDATE_CMD="dnf update -y"
            INSTALL_CMD="dnf install -y"
            echo "检测到较新的 CentOS/RHEL 系统 (dnf)"
        elif command -v apt-get &> /dev/null; then
            PACKAGE_MANAGER="apt"
            UPDATE_CMD="apt update && apt upgrade -y"
            INSTALL_CMD="apt install -y"
            echo "检测到 Ubuntu/Debian 系统"
        else
            echo "不支持的操作系统"
            exit 1
        fi
        
        echo "检测到包管理器: $PACKAGE_MANAGER"
        
        # 更新系统
        echo "更新系统..."
        $UPDATE_CMD
        
        # 安装必要软件
        echo "安装必要软件..."

        # CentOS 需要先安装 EPEL 仓库
        if [[ "$PACKAGE_MANAGER" == "yum" ]]; then
            $INSTALL_CMD epel-release
            $INSTALL_CMD curl wget git nginx

            # 安装 Node.js (CentOS)
            if ! command -v node &> /dev/null; then
                echo "安装 Node.js..."
                curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
                $INSTALL_CMD nodejs
            fi
        elif [[ "$PACKAGE_MANAGER" == "dnf" ]]; then
            $INSTALL_CMD curl wget git nginx

            # 安装 Node.js (较新的 CentOS)
            if ! command -v node &> /dev/null; then
                echo "安装 Node.js..."
                curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
                $INSTALL_CMD nodejs
            fi
        else
            # Ubuntu/Debian
            $INSTALL_CMD curl wget git nginx

            if ! command -v node &> /dev/null; then
                echo "安装 Node.js..."
                curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                $INSTALL_CMD nodejs
            fi
        fi
        
        # 检查 Node.js 版本
        echo "Node.js 版本: $(node --version)"
        echo "npm 版本: $(npm --version)"
        
        # 安装 Git（如果未安装）
        if ! command -v git &> /dev/null; then
            echo "安装 Git..."
            $INSTALL_CMD git
        fi

        # 创建项目目录
        mkdir -p /var/www/stock-analysis
        
        # 配置防火墙 (CentOS 使用 firewalld)
        if command -v firewall-cmd &> /dev/null; then
            echo "配置 firewalld 防火墙..."
            systemctl start firewalld
            systemctl enable firewalld
            firewall-cmd --permanent --add-port=22/tcp
            firewall-cmd --permanent --add-port=80/tcp
            firewall-cmd --permanent --add-port=443/tcp
            firewall-cmd --reload
        elif command -v ufw &> /dev/null; then
            echo "配置 ufw 防火墙..."
            ufw allow 22
            ufw allow 80
            ufw allow 443
            ufw --force enable
        fi

        # 启动并启用 Nginx
        systemctl start nginx
        systemctl enable nginx
        
        echo "服务器环境初始化完成"
EOF
    
    log_success "服务器环境初始化完成"
}

# 克隆或更新代码
clone_or_update_code() {
    log_info "克隆或更新代码..."

    ssh $SERVER_USER@$SERVER_HOST << EOF
        if [[ -d "$SERVER_PATH/.git" ]]; then
            log_info "项目已存在，更新代码..."
            cd $SERVER_PATH
            git fetch origin
            git reset --hard origin/main
            git clean -fd
        else
            log_info "首次部署，克隆代码..."
            rm -rf $SERVER_PATH
            git clone $GIT_REPO $SERVER_PATH
            cd $SERVER_PATH
        fi

        # 显示当前版本信息
        echo "当前版本: \$(git rev-parse --short HEAD)"
        echo "最新提交: \$(git log -1 --pretty=format:'%h - %s (%an, %ar)')"

        # 设置文件权限
        chown -R www-data:www-data $SERVER_PATH 2>/dev/null || chown -R nginx:nginx $SERVER_PATH 2>/dev/null || true
EOF

    log_success "代码更新完成"
}

# 在服务器上构建项目
build_on_server() {
    log_info "在服务器上构建项目..."
    
    ssh $SERVER_USER@$SERVER_HOST << EOF
        cd $SERVER_PATH
        
        # 安装依赖
        npm ci --production=false
        
        # 构建项目
        npm run build
        
        # 检查构建结果
        if [[ ! -d "dist" ]]; then
            echo "构建失败"
            exit 1
        fi
        
        echo "服务器构建完成"
EOF
    
    log_success "服务器构建完成"
}

# 配置 Nginx
configure_nginx() {
    log_info "配置 Nginx..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        # 检测 Nginx 配置目录结构
        if [[ -d "/etc/nginx/sites-available" ]]; then
            # Ubuntu/Debian 风格
            NGINX_CONF_DIR="/etc/nginx/sites-available"
            NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
            CONF_FILE="$NGINX_CONF_DIR/stock-analysis"
        else
            # CentOS/RHEL 风格
            NGINX_CONF_DIR="/etc/nginx/conf.d"
            CONF_FILE="$NGINX_CONF_DIR/stock-analysis.conf"
        fi

        echo "使用 Nginx 配置目录: $NGINX_CONF_DIR"

        # 创建 Nginx 配置文件
        cat > "$CONF_FILE" << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 101.42.14.209;
    root /var/www/stock-analysis/dist;
    index index.html;

    # 启用 Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 安全头部
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 错误页面
    error_page 404 /index.html;
}
NGINX_CONFIG

        # 启用站点 (仅对 Ubuntu/Debian)
        if [[ -d "/etc/nginx/sites-enabled" ]]; then
            ln -sf "$CONF_FILE" /etc/nginx/sites-enabled/
            # 删除默认站点
            rm -f /etc/nginx/sites-enabled/default
        fi

        # 对于 CentOS，删除默认配置
        if [[ -f "/etc/nginx/conf.d/default.conf" ]]; then
            mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
        fi
        
        # 测试配置
        nginx -t
        
        # 重启 Nginx
        systemctl restart nginx
        
        echo "Nginx 配置完成"
EOF
    
    log_success "Nginx 配置完成"
}

# 创建部署脚本
create_deploy_script() {
    log_info "创建服务器部署脚本..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cat > /var/www/stock-analysis/server-deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
cd /var/www/stock-analysis
echo "开始部署: $(date)"

# 拉取最新代码
git fetch origin
git reset --hard origin/main
git clean -fd

echo "当前版本: $(git rev-parse --short HEAD)"

# 安装依赖
npm ci --production=false

# 构建项目
npm run build

# 重启 Nginx
systemctl reload nginx

echo "部署完成: $(date)"
DEPLOY_SCRIPT

        chmod +x /var/www/stock-analysis/server-deploy.sh
        echo "部署脚本创建完成"
EOF
    
    log_success "部署脚本创建完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 5
    
    # 检查网站是否可访问
    if curl -f -s -o /dev/null "http://$SERVER_HOST"; then
        log_success "网站可正常访问: http://$SERVER_HOST"
    else
        log_error "网站无法访问"
        return 1
    fi
    
    # 检查关键页面
    local pages=("/" "/indicators" "/practice")
    for page in "${pages[@]}"; do
        local url="http://$SERVER_HOST$page"
        local status_code=$(curl -s -o /dev/null -w '%{http_code}' "$url")
        
        if [[ "$status_code" == "200" ]]; then
            log_success "$page: $status_code"
        else
            log_warning "$page: $status_code"
        fi
    done
}

# 显示部署信息
show_deployment_info() {
    log_success "========================================="
    log_success "部署完成! 🎉"
    log_success "========================================="
    log_info "网站地址: http://$SERVER_HOST"
    log_info "服务器: $SERVER_HOST"
    log_info "项目路径: $SERVER_PATH"
    log_info "部署时间: $(date)"
    log_success "========================================="
    log_info "后续操作："
    log_info "1. 访问网站测试功能"
    log_info "2. 配置域名（可选）"
    log_info "3. 配置 SSL 证书（推荐）"
    log_info "4. 设置监控和备份"
    log_success "========================================="
}

# 主函数
main() {
    log_info "========================================="
    log_info "云主机自动部署脚本"
    log_info "目标服务器: $SERVER_HOST"
    log_info "开始时间: $(date)"
    log_info "========================================="
    
    check_local_environment
    check_local_code
    test_server_connection
    init_server_environment
    clone_or_update_code
    build_on_server
    configure_nginx
    create_deploy_script
    health_check
    show_deployment_info
}

# 错误处理
trap 'log_error "部署过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"

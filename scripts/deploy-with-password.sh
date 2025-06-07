#!/bin/bash

# 支持密码认证的部署脚本
# 使用 sshpass 工具进行密码认证

set -e

# 服务器配置
SERVER_HOST="101.42.14.209"
SERVER_USER="root"
SERVER_PASSWORD="czbcxy25809*"
SERVER_PATH="/var/www/stock-analysis"
GIT_REPO="https://github.com/xingdong23/stock-analysis-learning.git"

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

# 检查并安装 sshpass
install_sshpass() {
    if ! command -v sshpass &> /dev/null; then
        log_info "安装 sshpass..."
        if command -v brew &> /dev/null; then
            brew install hudochenkov/sshpass/sshpass
        elif command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y sshpass
        elif command -v yum &> /dev/null; then
            sudo yum install -y sshpass
        else
            log_error "无法自动安装 sshpass，请手动安装"
            exit 1
        fi
    fi
}

# 执行远程命令
remote_exec() {
    local command="$1"
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "$command"
}

# 测试连接
test_connection() {
    log_info "测试服务器连接..."
    if remote_exec "echo 'Connection successful'"; then
        log_success "服务器连接成功"
    else
        log_error "服务器连接失败"
        exit 1
    fi
}

# 推送本地代码
push_local_code() {
    log_info "推送本地代码到 GitHub..."
    
    if [[ -n $(git status --porcelain) ]]; then
        git add .
        git commit -m "Deploy to server $(date)"
    fi
    
    git push origin main
    log_success "代码推送完成"
}

# 服务器环境初始化
init_server() {
    log_info "初始化服务器环境..."
    
    remote_exec "
        # 更新系统
        yum update -y
        
        # 安装 EPEL 仓库
        yum install -y epel-release
        
        # 安装基础软件
        yum install -y curl wget git nginx
        
        # 配置 npm 镜像源并安装 Node.js
        if ! command -v node &> /dev/null; then
            yum install -y nodejs npm
            npm config set registry https://registry.npmmirror.com
        fi
        
        # 配置防火墙
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-port=22/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --reload
        
        echo 'Server environment initialized'
    "
    
    log_success "服务器环境初始化完成"
}

# 部署代码
deploy_code() {
    log_info "部署代码到服务器..."
    
    remote_exec "
        # 创建项目目录
        mkdir -p $SERVER_PATH
        cd $SERVER_PATH
        
        # 克隆或更新代码
        if [[ -d '.git' ]]; then
            git fetch origin
            git reset --hard origin/main
            git clean -fd
        else
            rm -rf *
            git clone $GIT_REPO .
        fi
        
        echo 'Code deployment completed'
    "
    
    log_success "代码部署完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    remote_exec "
        cd $SERVER_PATH
        
        # 安装依赖
        npm install
        
        # 构建项目
        npm run build
        
        echo 'Project build completed'
    "
    
    log_success "项目构建完成"
}

# 配置 Nginx
configure_nginx() {
    log_info "配置 Nginx..."
    
    remote_exec "
        # 备份默认配置
        mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
        
        # 创建项目配置
        cat > /etc/nginx/conf.d/stock-analysis.conf << 'EOF'
server {
    listen 80;
    server_name $SERVER_HOST;
    root $SERVER_PATH/dist;
    index index.html;

    access_log /var/log/nginx/stock-analysis.access.log;
    error_log /var/log/nginx/stock-analysis.error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
        access_log off;
    }

    add_header X-Frame-Options \"DENY\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;

    error_page 404 /index.html;
}
EOF
        
        # 设置权限
        chown -R nginx:nginx $SERVER_PATH
        chmod -R 755 $SERVER_PATH
        
        # 测试并启动 Nginx
        nginx -t
        systemctl start nginx
        systemctl enable nginx
        
        echo 'Nginx configuration completed'
    "
    
    log_success "Nginx 配置完成"
}

# 创建更新脚本
create_update_script() {
    log_info "创建更新脚本..."
    
    remote_exec "
        cat > $SERVER_PATH/update.sh << 'EOF'
#!/bin/bash
echo \"开始更新: \$(date)\"
cd $SERVER_PATH
git fetch origin
git reset --hard origin/main
git clean -fd
echo \"当前版本: \$(git rev-parse --short HEAD)\"
npm install
npm run build
systemctl reload nginx
echo \"更新完成: \$(date)\"
EOF
        
        chmod +x $SERVER_PATH/update.sh
        echo 'Update script created'
    "
    
    log_success "更新脚本创建完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    sleep 5
    
    if curl -f -s -o /dev/null "http://$SERVER_HOST"; then
        log_success "✅ 网站可正常访问: http://$SERVER_HOST"
    else
        log_error "❌ 网站无法访问"
        return 1
    fi
    
    # 检查关键页面
    local pages=("/" "/indicators" "/practice")
    for page in "${pages[@]}"; do
        local url="http://$SERVER_HOST$page"
        local status_code=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")
        
        if [[ "$status_code" == "200" ]]; then
            log_success "✅ $page: $status_code"
        else
            log_warning "⚠️  $page: $status_code"
        fi
    done
}

# 显示部署信息
show_deployment_info() {
    log_success "========================================="
    log_success "🎉 部署完成！"
    log_success "========================================="
    log_info "网站地址: http://$SERVER_HOST"
    log_info "服务器: $SERVER_HOST"
    log_info "项目路径: $SERVER_PATH"
    log_info "部署时间: $(date)"
    log_success "========================================="
    log_info "后续更新命令:"
    log_info "sshpass -p '$SERVER_PASSWORD' ssh $SERVER_USER@$SERVER_HOST '$SERVER_PATH/update.sh'"
    log_success "========================================="
}

# 主函数
main() {
    log_info "========================================="
    log_info "自动部署脚本（密码认证）"
    log_info "目标服务器: $SERVER_HOST"
    log_info "开始时间: $(date)"
    log_info "========================================="
    
    install_sshpass
    test_connection
    push_local_code
    init_server
    deploy_code
    build_project
    configure_nginx
    create_update_script
    health_check
    show_deployment_info
}

# 错误处理
trap 'log_error "部署过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"

#!/bin/bash
# 服务器初始化脚本 - 只需要在首次部署时运行一次

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
        log_info "安装方法:"
        log_info "  macOS: brew install hudochenkov/sshpass/sshpass"
        log_info "  Ubuntu: sudo apt-get install sshpass"
        log_info "  CentOS: sudo yum install sshpass"
        exit 1
    fi
}

# 服务器初始化
init_server() {
    log_info "🔧 初始化服务器环境..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        echo '开始服务器初始化...'
        
        # 更新系统
        echo '更新系统...'
        yum update -y
        
        # 安装软件
        echo '安装必要软件...'
        yum install -y epel-release curl wget git nginx
        yum install -y nodejs npm
        
        # 配置防火墙
        echo '配置防火墙...'
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-port=22/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --reload
        
        # 禁用冲突的配置
        echo '清理旧配置...'
        mv /etc/nginx/conf.d/shuzhongren.com.conf /etc/nginx/conf.d/shuzhongren.com.conf.disabled 2>/dev/null || true
        mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
        
        # 创建 Nginx 配置
        echo '创建 Nginx 配置...'
        cat > /etc/nginx/conf.d/stock-analysis.conf << 'EOF'
server {
    listen 80;
    server_name 101.42.14.209;
    root /var/www/stock-analysis/dist;
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
        
        # 启动服务
        echo '启动 Nginx 服务...'
        nginx -t
        killall -9 nginx 2>/dev/null || true
        sleep 2
        systemctl start nginx
        systemctl enable nginx
        
        echo '✅ 服务器初始化完成!'
    "
    
    log_success "服务器初始化完成"
}

# 测试服务器
test_server() {
    log_info "🧪 测试服务器状态..."
    
    if sshpass -p "$SERVER_PASSWORD" ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "systemctl is-active nginx"; then
        log_success "✅ Nginx 服务正常运行"
    else
        log_error "❌ Nginx 服务异常"
        return 1
    fi
}

# 主函数
main() {
    log_info "========================================="
    log_info "服务器初始化脚本"
    log_info "目标服务器: $SERVER_HOST"
    log_info "开始时间: $(date)"
    log_info "========================================="
    
    check_dependencies
    init_server
    test_server
    
    log_success "========================================="
    log_success "🎉 服务器初始化完成!"
    log_success "现在可以运行 ./deploy-final.sh 进行部署"
    log_success "完成时间: $(date)"
    log_success "========================================="
}

# 错误处理
trap 'log_error "初始化过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"

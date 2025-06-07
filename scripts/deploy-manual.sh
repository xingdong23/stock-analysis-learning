#!/bin/bash

# 手动部署脚本 - 分步执行
# 使用方法: ./scripts/deploy-manual.sh [step]

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

# 显示帮助信息
show_help() {
    echo "手动部署脚本 - 分步执行"
    echo ""
    echo "使用方法: $0 [步骤]"
    echo ""
    echo "可用步骤:"
    echo "  1 - 连接测试"
    echo "  2 - 生成服务器命令"
    echo "  3 - 测试部署结果"
    echo "  all - 显示完整部署指南"
    echo ""
    echo "示例:"
    echo "  $0 1        # 测试服务器连接"
    echo "  $0 2        # 生成服务器执行命令"
    echo "  $0 3        # 测试部署结果"
    echo "  $0 all      # 显示完整指南"
}

# 步骤1：连接测试
step1_connection_test() {
    log_info "========================================="
    log_info "步骤1: 测试服务器连接"
    log_info "========================================="
    
    log_info "正在测试连接到 $SERVER_HOST..."
    log_warning "请准备输入密码: czbcxy25809*"
    
    echo ""
    echo "请手动执行以下命令测试连接："
    echo "ssh $SERVER_USER@$SERVER_HOST"
    echo ""
    echo "如果连接成功，请输入 'exit' 退出，然后运行下一步："
    echo "./scripts/deploy-manual.sh 2"
}

# 步骤2：生成服务器命令
step2_generate_commands() {
    log_info "========================================="
    log_info "步骤2: 生成服务器执行命令"
    log_info "========================================="
    
    cat << 'EOF'

请连接到服务器并执行以下命令：

ssh root@101.42.14.209

然后在服务器上依次执行：

# ===== 1. 更新系统并安装软件 =====
yum update -y
yum install -y epel-release
yum install -y curl wget git nginx
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node --version
npm --version

# ===== 2. 配置防火墙 =====
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# ===== 3. 克隆项目 =====
mkdir -p /var/www
cd /var/www
git clone https://github.com/xingdong23/stock-analysis-learning.git stock-analysis
cd stock-analysis

# ===== 4. 安装依赖并构建 =====
npm ci
npm run build

# ===== 5. 配置 Nginx =====
mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

cat > /etc/nginx/conf.d/stock-analysis.conf << 'NGINX_EOF'
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
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    error_page 404 /index.html;
}
NGINX_EOF

# ===== 6. 启动服务 =====
nginx -t
chown -R nginx:nginx /var/www/stock-analysis
chmod -R 755 /var/www/stock-analysis
systemctl start nginx
systemctl enable nginx

# ===== 7. 创建更新脚本 =====
cat > /var/www/stock-analysis/update.sh << 'UPDATE_EOF'
#!/bin/bash
echo "开始更新: $(date)"
cd /var/www/stock-analysis
git fetch origin
git reset --hard origin/main
git clean -fd
echo "当前版本: $(git rev-parse --short HEAD)"
npm ci
npm run build
systemctl reload nginx
echo "更新完成: $(date)"
UPDATE_EOF

chmod +x /var/www/stock-analysis/update.sh

# ===== 8. 测试部署 =====
systemctl status nginx
curl -I http://localhost
echo "部署完成！"

EOF

    echo ""
    log_success "命令已生成完毕！"
    log_info "执行完服务器命令后，运行下一步测试："
    log_info "./scripts/deploy-manual.sh 3"
}

# 步骤3：测试部署结果
step3_test_deployment() {
    log_info "========================================="
    log_info "步骤3: 测试部署结果"
    log_info "========================================="
    
    log_info "正在测试网站访问..."
    
    # 测试网站可访问性
    if curl -f -s -o /dev/null --max-time 10 "http://$SERVER_HOST"; then
        log_success "✅ 网站可正常访问: http://$SERVER_HOST"
    else
        log_error "❌ 网站无法访问"
        log_info "请检查："
        log_info "1. Nginx 是否正常启动"
        log_info "2. 防火墙是否开放 80 端口"
        log_info "3. 项目是否正确构建"
        return 1
    fi
    
    # 测试关键页面
    log_info "测试关键页面..."
    local pages=("/" "/indicators" "/practice")
    
    for page in "${pages[@]}"; do
        local url="http://$SERVER_HOST$page"
        local status_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")
        
        if [[ "$status_code" == "200" ]]; then
            log_success "✅ $page: $status_code"
        else
            log_warning "⚠️  $page: $status_code"
        fi
    done
    
    # 测试页面内容
    log_info "测试页面内容..."
    local content=$(curl -s --max-time 10 "http://$SERVER_HOST" 2>/dev/null || echo "")
    
    if echo "$content" | grep -q "股票分析学习"; then
        log_success "✅ 页面内容正常"
    else
        log_warning "⚠️  页面内容可能异常"
    fi
    
    log_success "========================================="
    log_success "🎉 部署测试完成！"
    log_success "========================================="
    log_info "网站地址: http://$SERVER_HOST"
    log_info "后续更新命令:"
    log_info "ssh root@$SERVER_HOST '/var/www/stock-analysis/update.sh'"
    log_success "========================================="
}

# 显示完整指南
show_full_guide() {
    log_info "========================================="
    log_info "完整部署指南"
    log_info "========================================="
    
    echo ""
    echo "请按以下步骤操作："
    echo ""
    echo "1. 测试服务器连接："
    echo "   ./scripts/deploy-manual.sh 1"
    echo ""
    echo "2. 获取服务器执行命令："
    echo "   ./scripts/deploy-manual.sh 2"
    echo ""
    echo "3. 在服务器上执行生成的命令"
    echo ""
    echo "4. 测试部署结果："
    echo "   ./scripts/deploy-manual.sh 3"
    echo ""
    echo "或者直接查看详细文档："
    echo "   cat MANUAL_DEPLOY_STEPS.md"
    echo ""
}

# 主函数
main() {
    local step=${1:-help}
    
    case $step in
        1)
            step1_connection_test
            ;;
        2)
            step2_generate_commands
            ;;
        3)
            step3_test_deployment
            ;;
        all)
            show_full_guide
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知步骤: $step"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"

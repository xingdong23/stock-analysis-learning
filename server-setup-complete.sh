#!/bin/bash
# 股票分析学习网站 - 完整服务器配置脚本

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

# 配置服务器环境
setup_server() {
    log_info "🔧 配置服务器环境..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 更新系统
        yum update -y
        
        # 安装EPEL仓库
        yum install -y epel-release
        
        # 安装基础软件
        yum install -y curl wget git vim htop tree
        yum install -y nginx mysql-server
        yum install -y python3 python3-pip python3-devel
        yum install -y gcc gcc-c++ make
        
        # 升级pip
        pip3 install --upgrade pip setuptools wheel
        
        # 安装常用Python包
        pip3 install virtualenv
        
        echo '✅ 基础软件安装完成'
    "
}

# 配置MySQL数据库
setup_mysql() {
    log_info "🗄️ 配置MySQL数据库..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 启动MySQL服务
        systemctl start mysqld
        systemctl enable mysqld
        
        # 等待MySQL启动
        sleep 10
        
        # 获取临时密码
        TEMP_PASSWORD=\$(grep 'temporary password' /var/log/mysqld.log | awk '{print \$NF}' | tail -1)
        
        if [ -n \"\$TEMP_PASSWORD\" ]; then
            # 首次安装，需要设置密码
            mysql -u root -p\"\$TEMP_PASSWORD\" --connect-expired-password << 'MYSQL_EOF'
ALTER USER 'root'@'localhost' IDENTIFIED BY 'StockAnalysis2024!';
FLUSH PRIVILEGES;
MYSQL_EOF
        fi
        
        # 创建数据库和用户
        mysql -u root -p'StockAnalysis2024!' << 'MYSQL_EOF'
CREATE DATABASE IF NOT EXISTS stock_analysis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'stock_user'@'localhost' IDENTIFIED BY 'stock_password';
GRANT ALL PRIVILEGES ON stock_analysis.* TO 'stock_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_EOF
        
        echo '✅ MySQL配置完成'
    "
}

# 配置防火墙
setup_firewall() {
    log_info "🔥 配置防火墙..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 启动防火墙
        systemctl start firewalld
        systemctl enable firewalld
        
        # 开放端口
        firewall-cmd --permanent --add-port=22/tcp    # SSH
        firewall-cmd --permanent --add-port=80/tcp    # HTTP
        firewall-cmd --permanent --add-port=443/tcp   # HTTPS
        firewall-cmd --permanent --add-port=8000/tcp  # FastAPI
        firewall-cmd --permanent --add-port=5000/tcp  # Flask监控
        firewall-cmd --permanent --add-port=3306/tcp  # MySQL
        
        # 重载防火墙规则
        firewall-cmd --reload
        
        # 显示开放的端口
        firewall-cmd --list-ports
        
        echo '✅ 防火墙配置完成'
    "
}

# 配置Nginx
setup_nginx() {
    log_info "🌐 配置Nginx..."
    
    # 上传Nginx配置文件
    sshpass -p "$SERVER_PASSWORD" scp nginx-complete.conf $SERVER_USER@$SERVER_HOST:/tmp/
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 备份原配置
        cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
        
        # 禁用默认配置
        mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled 2>/dev/null || true
        
        # 安装新配置
        cp /tmp/nginx-complete.conf /etc/nginx/conf.d/stock-analysis.conf
        
        # 创建日志目录
        mkdir -p /var/log/nginx
        
        # 测试配置
        nginx -t
        
        # 启动Nginx
        systemctl start nginx
        systemctl enable nginx
        
        echo '✅ Nginx配置完成'
    "
}

# 创建目录结构
create_directories() {
    log_info "📁 创建目录结构..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 创建应用目录
        mkdir -p /var/www/stock-analysis
        mkdir -p /opt/stock-analysis-backend
        mkdir -p /opt/stock-monitor
        
        # 创建日志目录
        mkdir -p /var/log/stock-analysis
        
        # 创建数据目录
        mkdir -p /var/lib/stock-analysis
        
        # 设置权限
        chown -R nginx:nginx /var/www/stock-analysis
        chown -R root:root /opt/stock-analysis-backend
        chown -R root:root /opt/stock-monitor
        
        echo '✅ 目录结构创建完成'
    "
}

# 配置系统服务
setup_systemd_services() {
    log_info "⚙️ 配置系统服务..."
    
    # 上传服务配置脚本
    sshpass -p "$SERVER_PASSWORD" scp systemd-services.sh $SERVER_USER@$SERVER_HOST:/tmp/
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        chmod +x /tmp/systemd-services.sh
        /tmp/systemd-services.sh
        
        echo '✅ 系统服务配置完成'
    "
}

# 安装监控工具
setup_monitoring() {
    log_info "📊 安装监控工具..."
    
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_HOST "
        # 安装系统监控工具
        yum install -y htop iotop nethogs
        
        # 创建监控脚本
        cat > /usr/local/bin/stock-status.sh << 'EOF'
#!/bin/bash
echo '=== 股票分析系统状态 ==='
echo
echo '--- 系统资源 ---'
free -h
echo
df -h
echo
echo '--- 服务状态 ---'
systemctl status nginx --no-pager -l
systemctl status stock-backend --no-pager -l
systemctl status stock-monitor --no-pager -l
systemctl status mysqld --no-pager -l
echo
echo '--- 网络连接 ---'
netstat -tlnp | grep -E ':(80|443|8000|5000|3306)'
echo
echo '--- 最近日志 ---'
journalctl -u stock-backend --no-pager -n 5
journalctl -u stock-monitor --no-pager -n 5
EOF
        
        chmod +x /usr/local/bin/stock-status.sh
        
        echo '✅ 监控工具安装完成'
        echo '使用 stock-status.sh 查看系统状态'
    "
}

# 主函数
main() {
    log_info "========================================="
    log_info "股票分析学习网站 - 服务器完整配置"
    log_info "目标服务器: $SERVER_HOST"
    log_info "开始时间: $(date)"
    log_info "========================================="
    
    setup_server
    setup_mysql
    setup_firewall
    create_directories
    setup_nginx
    setup_systemd_services
    setup_monitoring
    
    log_success "========================================="
    log_success "🎉 服务器配置完成!"
    log_success "下一步: 运行 ./deploy-complete.sh 部署应用"
    log_success "监控命令: ssh root@$SERVER_HOST 'stock-status.sh'"
    log_success "完成时间: $(date)"
    log_success "========================================="
}

# 错误处理
trap 'log_error "配置过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"

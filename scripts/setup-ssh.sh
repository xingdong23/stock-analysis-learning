#!/bin/bash

# SSH 配置脚本
# 用于配置 SSH 密钥认证，提高安全性

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

# 生成 SSH 密钥
generate_ssh_key() {
    log_info "生成 SSH 密钥..."
    
    local key_path="$HOME/.ssh/id_rsa_stock_server"
    
    if [[ -f "$key_path" ]]; then
        log_warning "SSH 密钥已存在: $key_path"
        read -p "是否重新生成? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "跳过密钥生成"
            return 0
        fi
    fi
    
    ssh-keygen -t rsa -b 4096 -f "$key_path" -N "" -C "stock-analysis-server"
    
    log_success "SSH 密钥生成完成: $key_path"
}

# 上传公钥到服务器
upload_public_key() {
    log_info "上传公钥到服务器..."
    
    local key_path="$HOME/.ssh/id_rsa_stock_server.pub"
    
    if [[ ! -f "$key_path" ]]; then
        log_error "公钥文件不存在: $key_path"
        exit 1
    fi
    
    # 使用 ssh-copy-id 上传公钥
    if command -v ssh-copy-id &> /dev/null; then
        ssh-copy-id -i "$key_path" $SERVER_USER@$SERVER_HOST
    else
        # 手动上传公钥
        cat "$key_path" | ssh $SERVER_USER@$SERVER_HOST "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
    fi
    
    log_success "公钥上传完成"
}

# 配置本地 SSH 客户端
configure_ssh_client() {
    log_info "配置本地 SSH 客户端..."
    
    local ssh_config="$HOME/.ssh/config"
    local config_entry="
# 股票分析服务器
Host stock-server
    HostName $SERVER_HOST
    User $SERVER_USER
    IdentityFile ~/.ssh/id_rsa_stock_server
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
"
    
    # 检查配置是否已存在
    if grep -q "Host stock-server" "$ssh_config" 2>/dev/null; then
        log_warning "SSH 配置已存在"
        read -p "是否更新配置? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # 删除旧配置
            sed -i '/# 股票分析服务器/,/ServerAliveCountMax 3/d' "$ssh_config"
        else
            log_info "跳过配置更新"
            return 0
        fi
    fi
    
    # 添加新配置
    echo "$config_entry" >> "$ssh_config"
    chmod 600 "$ssh_config"
    
    log_success "SSH 客户端配置完成"
    log_info "现在可以使用 'ssh stock-server' 连接服务器"
}

# 测试 SSH 连接
test_ssh_connection() {
    log_info "测试 SSH 密钥连接..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes stock-server exit 2>/dev/null; then
        log_success "SSH 密钥认证成功"
    else
        log_error "SSH 密钥认证失败"
        log_info "请检查："
        log_info "1. 公钥是否正确上传"
        log_info "2. 服务器 SSH 配置是否正确"
        log_info "3. 防火墙是否允许 SSH 连接"
        exit 1
    fi
}

# 配置服务器 SSH 安全设置
configure_server_ssh() {
    log_info "配置服务器 SSH 安全设置..."
    
    ssh stock-server << 'EOF'
        # 备份原始配置
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
        
        # 修改 SSH 配置
        sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
        sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
        
        # 重启 SSH 服务
        systemctl restart sshd
        
        echo "SSH 安全配置完成"
EOF
    
    log_success "服务器 SSH 安全配置完成"
    log_warning "密码认证已禁用，请确保密钥认证正常工作"
}

# 创建快捷脚本
create_shortcuts() {
    log_info "创建快捷脚本..."
    
    # 创建连接脚本
    cat > scripts/connect-server.sh << 'EOF'
#!/bin/bash
echo "连接到股票分析服务器..."
ssh stock-server
EOF
    
    # 创建文件传输脚本
    cat > scripts/upload-to-server.sh << 'EOF'
#!/bin/bash
if [[ $# -eq 0 ]]; then
    echo "使用方法: $0 <本地文件路径> [远程路径]"
    exit 1
fi

LOCAL_PATH="$1"
REMOTE_PATH="${2:-/var/www/stock-analysis/}"

echo "上传文件到服务器..."
scp -r "$LOCAL_PATH" stock-server:"$REMOTE_PATH"
echo "上传完成"
EOF
    
    chmod +x scripts/connect-server.sh
    chmod +x scripts/upload-to-server.sh
    
    log_success "快捷脚本创建完成"
}

# 显示使用说明
show_usage() {
    log_success "========================================="
    log_success "SSH 配置完成! 🔐"
    log_success "========================================="
    log_info "现在你可以使用以下命令："
    log_info ""
    log_info "连接服务器:"
    log_info "  ssh stock-server"
    log_info "  或者: ./scripts/connect-server.sh"
    log_info ""
    log_info "上传文件:"
    log_info "  scp file.txt stock-server:/var/www/stock-analysis/"
    log_info "  或者: ./scripts/upload-to-server.sh file.txt"
    log_info ""
    log_info "部署项目:"
    log_info "  ./scripts/deploy-to-server.sh"
    log_info ""
    log_success "========================================="
    log_warning "重要提醒："
    log_warning "1. 密码认证已禁用，请妥善保管私钥文件"
    log_warning "2. 私钥文件位置: ~/.ssh/id_rsa_stock_server"
    log_warning "3. 如果丢失私钥，需要通过其他方式重新配置"
    log_success "========================================="
}

# 主函数
main() {
    log_info "========================================="
    log_info "SSH 安全配置脚本"
    log_info "目标服务器: $SERVER_HOST"
    log_info "========================================="
    
    generate_ssh_key
    upload_public_key
    configure_ssh_client
    test_ssh_connection
    
    # 询问是否配置服务器安全设置
    log_warning "是否配置服务器 SSH 安全设置（禁用密码认证）？"
    read -p "这将禁用密码登录，只能使用密钥认证 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        configure_server_ssh
        test_ssh_connection  # 再次测试
    fi
    
    create_shortcuts
    show_usage
}

# 错误处理
trap 'log_error "SSH 配置过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"

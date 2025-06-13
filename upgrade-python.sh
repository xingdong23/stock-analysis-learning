#!/bin/bash

# CentOS 7 升级Python到3.8+的脚本

echo "🐍 升级服务器Python版本..."

SERVER_HOST="101.42.14.209"
SERVER_USER="root"

echo "🔧 在服务器上升级Python..."

ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'

echo "📦 当前Python版本:"
python3 --version

echo "🔧 安装开发工具和依赖..."
yum groupinstall -y "Development Tools"
yum install -y gcc openssl-devel bzip2-devel libffi-devel zlib-devel readline-devel sqlite-devel wget

echo "📥 下载Python 3.9.18 (稳定版本)..."
cd /tmp
wget https://www.python.org/ftp/python/3.9.18/Python-3.9.18.tgz

echo "📦 解压并编译Python..."
tar xzf Python-3.9.18.tgz
cd Python-3.9.18

# 配置编译选项
./configure --enable-optimizations --with-ensurepip=install

echo "🔨 编译Python (这可能需要几分钟)..."
make altinstall

echo "✅ Python 3.9安装完成"

# 检查安装结果
/usr/local/bin/python3.9 --version

echo "🔗 创建符号链接..."
# 备份原有的python3
if [ -f /usr/bin/python3 ]; then
    mv /usr/bin/python3 /usr/bin/python3.6.backup
fi

# 创建新的符号链接
ln -sf /usr/local/bin/python3.9 /usr/bin/python3
ln -sf /usr/local/bin/pip3.9 /usr/bin/pip3

echo "🔧 升级pip..."
/usr/local/bin/python3.9 -m pip install --upgrade pip

echo "✅ Python升级完成!"
echo "新版本: $(python3 --version)"

# 清理临时文件
cd /
rm -rf /tmp/Python-3.9.18*

ENDSSH

echo "🎉 Python升级完成！现在重新部署后端..."

# 重新部署后端
./deploy-backend.sh

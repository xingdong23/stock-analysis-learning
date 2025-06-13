#!/bin/bash
# 股票监控系统部署脚本

set -e

echo "=== 股票监控系统部署脚本 ==="

# 检查Python版本
echo "检查Python版本..."
python3 --version

# 更新系统包
echo "更新系统包..."
if command -v yum &> /dev/null; then
    # CentOS/RHEL
    sudo yum update -y
    sudo yum install -y python3-pip git
elif command -v apt &> /dev/null; then
    # Ubuntu/Debian
    sudo apt update
    sudo apt install -y python3-pip git
fi

# 安装Python依赖
echo "安装Python依赖..."
pip3 install --upgrade pip
pip3 install -r requirements.txt

# 检查依赖是否安装成功
echo "检查关键依赖..."
python3 -c "import pandas_ta; print('pandas-ta 安装成功')"
python3 -c "import flask; print('Flask 安装成功')"
python3 -c "import requests; print('requests 安装成功')"

# 创建日志目录
mkdir -p logs

# 设置环境变量
export PORT=5000
export DEBUG=false

echo "=== 部署完成 ==="
echo "启动服务: python3 app.py"
echo "或者后台运行: nohup python3 app.py > logs/app.log 2>&1 &"

#!/bin/bash

# 股票监控系统Python后端启动脚本

echo "🐍 启动股票监控系统Python后端..."

# 检查Python版本
PYTHON_VERSION=$(python3 --version 2>&1)
echo "📦 Python版本: $PYTHON_VERSION"

# 检查是否在虚拟环境中
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "🔧 虚拟环境: $VIRTUAL_ENV"
else
    echo "⚠️  建议使用虚拟环境运行"
fi

# 创建必要的目录
mkdir -p data
mkdir -p logs
mkdir -p temp

# 复制环境配置文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 创建环境配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置相关参数"
fi

# 安装依赖
echo "📦 安装Python依赖包..."
pip install -r requirements.txt

# 启动开发服务器
echo "🔥 启动开发服务器..."
python main.py

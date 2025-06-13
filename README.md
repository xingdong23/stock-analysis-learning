# 股票分析学习网站

一个完整的股票技术分析学习平台，包含前端React应用和Python后端服务，支持实时股票数据获取、技术指标计算和监控预警功能。

## 🚀 功能特性

### 前端功能
- 📈 **技术指标学习**: 详细介绍移动平均线、MACD、RSI等常用技术指标
- 📊 **交互式图表**: 使用ECharts展示股票数据和技术指标
- 🎯 **实时演示**: 动态展示技术指标的计算过程
- 📱 **响应式设计**: 支持桌面和移动设备
- 🎨 **现代UI**: 使用Tailwind CSS和Framer Motion

### 后端功能
- 🔄 **实时数据**: 免费股票数据API集成
- 📊 **技术分析**: 完整的技术指标计算引擎
- 🚨 **监控预警**: 自定义股票监控规则和预警
- 💾 **数据存储**: MySQL数据库持久化存储
- 🔗 **RESTful API**: 完整的API接口服务

## 🛠 技术栈

### 前端
- **框架**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Framer Motion
- **图表**: ECharts + echarts-for-react
- **路由**: React Router DOM
- **图标**: Lucide React

### 后端
- **主服务**: FastAPI + SQLAlchemy + MySQL
- **监控服务**: Flask + pandas-ta
- **数据源**: Yahoo Finance API (免费)
- **部署**: Nginx + systemd + CentOS 7

## 📦 快速部署

### 一键部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/xingdong23/stock-analysis-learning.git
cd stock-analysis-learning

# 2. 安装本地依赖
npm install

# 3. 安装sshpass（如果没有）
# macOS: brew install hudochenkov/sshpass/sshpass
# Ubuntu: sudo apt install sshpass
# CentOS: sudo yum install sshpass

# 4. 一键部署
chmod +x deploy-one-click.sh
./deploy-one-click.sh
```

### 分步部署

```bash
# 1. 配置服务器环境
chmod +x server-setup-complete.sh
./server-setup-complete.sh

# 2. 部署应用
chmod +x deploy-complete.sh
./deploy-complete.sh
```

### 日常更新

```bash
# 快速更新
chmod +x update.sh
./update.sh
```

## 🌐 访问地址

部署完成后可通过以下地址访问：

- **前端应用**: http://101.42.14.209
- **后端API**: http://101.42.14.209:8000
- **API文档**: http://101.42.14.209:8000/docs
- **监控服务**: http://101.42.14.209:5000

## 🔧 本地开发

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 后端开发

```bash
# 进入后端目录
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 启动FastAPI服务
python main.py

# 或使用启动脚本
chmod +x start.sh
./start.sh
```

### 股票监控服务

```bash
# 进入监控服务目录
cd stock-monitor

# 安装依赖
pip install -r requirements.txt

# 启动Flask服务
python app.py
```

## 📋 项目结构

```
stock-analysis-learning/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── hooks/             # 自定义Hooks
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript类型
├── backend/               # FastAPI后端服务
│   ├── app/              # 应用代码
│   ├── main.py           # 主入口
│   └── requirements.txt  # Python依赖
├── stock-monitor/        # Flask监控服务
│   ├── app.py           # 监控应用
│   └── requirements.txt # Python依赖
├── docker/              # Docker配置
├── deploy-*.sh         # 部署脚本
└── nginx-*.conf       # Nginx配置
```

## 🔧 管理命令

```bash
# 查看系统状态
ssh root@101.42.14.209 'stock-status.sh'

# 重启服务
ssh root@101.42.14.209 'systemctl restart stock-backend stock-monitor'

# 查看日志
ssh root@101.42.14.209 'journalctl -u stock-backend -f'
ssh root@101.42.14.209 'journalctl -u stock-monitor -f'

# 更新应用
./update.sh
```

## 📚 API文档

部署完成后访问 http://101.42.14.209:8000/docs 查看完整的API文档。

主要接口：
- `GET /health` - 健康检查
- `GET /api/v1/alerts` - 获取预警列表
- `POST /api/v1/alerts` - 创建预警规则
- `GET /monitor/api/stock/{symbol}` - 获取股票数据
- `GET /monitor/api/indicators/{symbol}` - 获取技术指标

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

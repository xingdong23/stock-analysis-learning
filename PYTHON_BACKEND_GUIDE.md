# Python后端股票监控系统部署指南

## 🐍 Python后端架构

### 技术栈
- **框架**: FastAPI (现代、快速、自动生成API文档)
- **数据库**: SQLite (开发) → MySQL (生产)
- **ORM**: SQLAlchemy (强大的Python ORM)
- **数据处理**: pandas, numpy (股票数据分析)
- **API文档**: 自动生成Swagger文档

### 项目结构
```
backend/
├── main.py                 # 主应用入口
├── requirements.txt        # Python依赖
├── .env.example           # 环境配置示例
├── start.sh               # 启动脚本
└── app/
    ├── __init__.py
    ├── core/
    │   ├── __init__.py
    │   └── config.py      # 应用配置
    ├── database/
    │   ├── __init__.py
    │   ├── base.py        # 数据库基础配置
    │   └── database.py    # 数据库连接管理
    ├── models/
    │   ├── __init__.py
    │   ├── stock_alert.py # 股票预警模型
    │   └── alert_trigger.py # 预警触发模型
    └── api/
        └── v1/
            ├── __init__.py
            └── alerts.py  # 预警API路由
```

## 🚀 快速开始

### 1. 环境准备

#### Python环境
```bash
# 检查Python版本 (需要3.8+)
python3 --version

# 创建虚拟环境 (推荐)
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows
```

#### 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

#### 开发环境配置 (.env)
```env
# 应用配置
ENVIRONMENT=development
DEBUG=true
PORT=8000

# 数据库配置 (SQLite)
DATABASE_TYPE=sqlite
SQLITE_PATH=data/stock_monitor.db

# CORS配置
CORS_ORIGINS=["http://localhost:3000","http://101.42.14.209"]
```

#### 生产环境配置 (.env)
```env
# 应用配置
ENVIRONMENT=production
DEBUG=false
PORT=8000

# 数据库配置 (MySQL)
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=stock_monitor

# 安全配置
SECRET_KEY=your-very-secure-secret-key-here
```

### 3. 启动服务

#### 开发环境
```bash
# 使用启动脚本
./start.sh

# 或直接运行
python main.py
```

#### 生产环境
```bash
# 使用Gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# 或使用uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. 验证部署

访问以下URL验证服务：
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health
- **API根路径**: http://localhost:8000/

## 📊 数据库配置

### SQLite (开发环境)
- **优点**: 无需安装，零配置，适合开发
- **文件位置**: `data/stock_monitor.db`
- **自动创建**: 首次运行时自动创建表和示例数据

### MySQL (生产环境)

#### 1. 安装MySQL
```bash
# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### 2. 创建数据库
```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE stock_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户 (可选)
CREATE USER 'stock_monitor'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON stock_monitor.* TO 'stock_monitor'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. 配置连接
```env
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=stock_monitor
DATABASE_PASSWORD=your_password
DATABASE_NAME=stock_monitor
```

## 🔧 API接口说明

### 基础信息
- **基础URL**: `http://localhost:8000/api/v1`
- **认证方式**: Header中的 `X-User-Id`
- **响应格式**: JSON

### 主要接口

#### 1. 获取预警列表
```http
GET /api/v1/alerts
Headers: X-User-Id: your_user_id
```

#### 2. 创建预警
```http
POST /api/v1/alerts
Headers: X-User-Id: your_user_id
Content-Type: application/json

{
  "symbol": "IONQ",
  "name": "IonQ Inc",
  "indicator": {
    "type": "MA",
    "period": 20
  },
  "condition": "CROSS_BELOW",
  "description": "IONQ跌破MA20预警"
}
```

#### 3. 更新预警
```http
PUT /api/v1/alerts/{alert_id}
Headers: X-User-Id: your_user_id
Content-Type: application/json

{
  "is_active": false
}
```

#### 4. 删除预警
```http
DELETE /api/v1/alerts/{alert_id}
Headers: X-User-Id: your_user_id
```

#### 5. 获取统计信息
```http
GET /api/v1/alerts/stats
Headers: X-User-Id: your_user_id
```

## 🌐 前端集成

### 更新前端配置

#### 1. 环境变量 (.env)
```env
# 后端API地址
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

#### 2. 生产环境
```env
# 后端API地址
VITE_API_BASE_URL=http://101.42.14.209:8000/api/v1
```

### API服务已更新
前端的 `src/services/apiService.ts` 已更新为连接Python后端。

## 🚀 生产环境部署

### 1. 服务器准备
```bash
# 更新系统
sudo yum update -y

# 安装Python 3.8+
sudo yum install python3 python3-pip python3-venv -y

# 安装MySQL
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### 2. 部署应用
```bash
# 创建应用目录
sudo mkdir -p /opt/stock-monitor-backend
cd /opt/stock-monitor-backend

# 克隆代码 (或上传文件)
# 设置权限
sudo chown -R $USER:$USER /opt/stock-monitor-backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境
cp .env.example .env
# 编辑 .env 文件配置生产环境参数
```

### 3. 配置系统服务
```bash
# 创建systemd服务文件
sudo nano /etc/systemd/system/stock-monitor-backend.service
```

```ini
[Unit]
Description=Stock Monitor Backend
After=network.target mysql.service

[Service]
Type=exec
User=your_user
Group=your_group
WorkingDirectory=/opt/stock-monitor-backend
Environment=PATH=/opt/stock-monitor-backend/venv/bin
ExecStart=/opt/stock-monitor-backend/venv/bin/python main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable stock-monitor-backend
sudo systemctl start stock-monitor-backend

# 检查状态
sudo systemctl status stock-monitor-backend
```

### 4. 配置Nginx反向代理
```nginx
# /etc/nginx/conf.d/stock-monitor-backend.conf
server {
    listen 8000;
    server_name 101.42.14.209;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📈 功能特性

### 已实现功能
- ✅ **完整的预警CRUD**: 创建、读取、更新、删除预警规则
- ✅ **多种技术指标**: MA、RSI、MACD、均线缠绕、均线附近
- ✅ **用户隔离**: 基于User-ID的数据隔离
- ✅ **数据持久化**: SQLite/MySQL数据库存储
- ✅ **API文档**: 自动生成Swagger文档
- ✅ **健康检查**: 系统状态监控
- ✅ **错误处理**: 完善的异常处理机制
- ✅ **日志系统**: 结构化日志记录

### 数据模型
- **StockAlert**: 股票预警规则
- **AlertTrigger**: 预警触发记录
- **支持字段**: 股票代码、技术指标、触发条件、目标值等

### API特性
- **RESTful设计**: 标准的REST API
- **数据验证**: Pydantic模型验证
- **错误处理**: 统一的错误响应格式
- **CORS支持**: 跨域请求支持
- **请求日志**: 详细的请求日志

## 🔍 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查MySQL服务状态
sudo systemctl status mysqld

# 检查数据库配置
mysql -u root -p -e "SHOW DATABASES;"

# 检查Python依赖
pip list | grep -i mysql
```

#### 2. 端口占用
```bash
# 检查端口占用
sudo netstat -tlnp | grep :8000

# 杀死占用进程
sudo kill -9 <PID>
```

#### 3. 权限问题
```bash
# 检查文件权限
ls -la data/
sudo chown -R $USER:$USER data/
```

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看系统服务日志
sudo journalctl -u stock-monitor-backend -f
```

## 🎯 下一步计划

- [ ] 添加预警触发记录API
- [ ] 实现后台监控任务
- [ ] 添加邮件/Webhook通知
- [ ] 集成Redis缓存
- [ ] 添加用户认证系统
- [ ] 性能优化和监控

---

**现在你有了一个完整的Python后端系统，支持H2/SQLite开发环境和MySQL生产环境！** 🎉

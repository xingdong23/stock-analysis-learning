# 股票监控系统

基于Flask + pandas-ta的股票技术分析和监控预警系统。

## 功能特性

- 📈 实时股票数据获取（Yahoo Finance API）
- 📊 技术指标计算（SMA、EMA、MACD、RSI、布林带、KDJ等）
- 🔔 监控预警功能
- 🌐 RESTful API接口
- 📱 跨域支持（CORS）

## 技术栈

- **后端**: Python 3.9+, Flask
- **数据分析**: pandas, pandas-ta
- **数据源**: Yahoo Finance API（免费）
- **部署**: CentOS 7

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd stock-monitor
```

### 2. 安装依赖

```bash
# 自动部署（推荐）
chmod +x deploy.sh
./deploy.sh

# 或手动安装
pip3 install -r requirements.txt
```

### 3. 启动服务

```bash
# 开发模式
python3 app.py

# 生产模式（后台运行）
nohup python3 app.py > logs/app.log 2>&1 &
```

### 4. 访问API

- 健康检查: http://your-server:5000/api/health
- 股票数据: http://your-server:5000/api/stock/AAPL
- 技术指标: http://your-server:5000/api/indicators/AAPL

## API文档

### 获取股票数据
```
GET /api/stock/<symbol>
```

示例响应：
```json
{
  "symbol": "AAPL",
  "last_update": "2025-06-13T15:30:00",
  "count": 30,
  "data": [...]
}
```

### 获取技术指标
```
GET /api/indicators/<symbol>
```

示例响应：
```json
{
  "symbol": "AAPL",
  "timestamp": "2025-06-13T15:30:00",
  "price": {
    "current": 150.25,
    "open": 149.80,
    "high": 151.00,
    "low": 149.50,
    "volume": 1000000
  },
  "indicators": {
    "sma_20": 148.75,
    "rsi": 65.2,
    "macd": 1.25,
    "macd_signal": 1.10
  }
}
```

## 部署说明

### 服务器要求
- CentOS 7+
- Python 3.9+
- 2GB+ RAM
- 网络连接（访问Yahoo Finance API）

### 环境变量
- `PORT`: 服务端口（默认5000）
- `DEBUG`: 调试模式（默认false）

### 依赖问题解决

如果遇到SSL版本问题：
```bash
pip3 install urllib3==1.26.18
```

如果遇到numpy兼容性问题：
```bash
pip3 install numpy==1.24.3
```

## 常见问题

### Q: 无法获取股票数据？
A: 检查网络连接和股票代码是否正确。支持的格式：AAPL、TSLA、000001.SS等。

### Q: 技术指标计算失败？
A: 确保股票数据足够（至少20天），某些指标需要足够的历史数据。

### Q: 服务启动失败？
A: 检查端口是否被占用，确保所有依赖都已正确安装。

## 开发计划

- [ ] 数据库持久化
- [ ] 用户认证系统
- [ ] 更多技术指标
- [ ] 实时推送功能
- [ ] Web前端界面

## 许可证

MIT License

#!/bin/bash
# 创建系统服务配置文件

# 创建FastAPI后端服务
cat > /etc/systemd/system/stock-backend.service << 'EOF'
[Unit]
Description=Stock Analysis Backend API Service
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/stock-analysis-backend
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=PYTHONPATH=/opt/stock-analysis-backend
ExecStart=/usr/bin/python3 main.py
ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=stock-backend

# 安全配置
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/stock-analysis-backend /var/log /tmp

[Install]
WantedBy=multi-user.target
EOF

# 创建股票监控服务
cat > /etc/systemd/system/stock-monitor.service << 'EOF'
[Unit]
Description=Stock Monitor Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/stock-monitor
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=PYTHONPATH=/opt/stock-monitor
ExecStart=/usr/bin/python3 app.py
ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=stock-monitor

# 安全配置
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/stock-monitor /var/log /tmp

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
systemctl daemon-reload

# 启用服务
systemctl enable stock-backend.service
systemctl enable stock-monitor.service

# 启动服务
systemctl start stock-backend.service
systemctl start stock-monitor.service

# 检查服务状态
echo "=== 服务状态检查 ==="
systemctl status stock-backend.service --no-pager
systemctl status stock-monitor.service --no-pager

echo "=== 服务配置完成 ==="
echo "管理命令:"
echo "  查看后端状态: systemctl status stock-backend"
echo "  查看监控状态: systemctl status stock-monitor"
echo "  重启后端: systemctl restart stock-backend"
echo "  重启监控: systemctl restart stock-monitor"
echo "  查看日志: journalctl -u stock-backend -f"
echo "  查看日志: journalctl -u stock-monitor -f"

"""
应用配置
"""
import os
from pathlib import Path
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """应用配置类"""
    
    # 应用基础配置
    APP_NAME: str = Field(default="股票监控系统", description="应用名称")
    APP_VERSION: str = Field(default="1.0.0", description="应用版本")
    ENVIRONMENT: str = Field(default="development", description="运行环境")
    DEBUG: bool = Field(default=True, description="调试模式")
    
    # 服务器配置
    HOST: str = Field(default="0.0.0.0", description="服务器主机")
    PORT: int = Field(default=8000, description="服务器端口")
    RELOAD: bool = Field(default=True, description="自动重载")
    
    # 数据库配置
    DATABASE_TYPE: str = Field(default="sqlite", description="数据库类型")
    DATABASE_HOST: str = Field(default="localhost", description="数据库主机")
    DATABASE_PORT: int = Field(default=3306, description="数据库端口")
    DATABASE_USERNAME: str = Field(default="root", description="数据库用户名")
    DATABASE_PASSWORD: str = Field(default="", description="数据库密码")
    DATABASE_NAME: str = Field(default="stock_monitor", description="数据库名称")
    DATABASE_ECHO: bool = Field(default=False, description="是否打印SQL")
    
    # SQLite配置
    SQLITE_PATH: str = Field(default="data/stock_monitor.db", description="SQLite数据库路径")
    
    # Redis配置（可选）
    REDIS_HOST: str = Field(default="localhost", description="Redis主机")
    REDIS_PORT: int = Field(default=6379, description="Redis端口")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis密码")
    REDIS_DB: int = Field(default=0, description="Redis数据库")
    
    # CORS配置
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="允许的CORS源"
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True, description="允许凭证")
    CORS_ALLOW_METHODS: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        description="允许的HTTP方法"
    )
    CORS_ALLOW_HEADERS: List[str] = Field(
        default=["*"],
        description="允许的HTTP头"
    )
    
    # 安全配置
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        description="密钥"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="访问令牌过期时间")
    
    # API配置
    API_V1_PREFIX: str = Field(default="/api/v1", description="API v1前缀")
    API_RATE_LIMIT: str = Field(default="100/minute", description="API限流")
    
    # 日志配置
    LOG_LEVEL: str = Field(default="INFO", description="日志级别")
    LOG_FILE: Optional[str] = Field(default=None, description="日志文件路径")
    LOG_ROTATION: str = Field(default="1 day", description="日志轮转")
    LOG_RETENTION: str = Field(default="30 days", description="日志保留时间")
    
    # 股票数据API配置
    YAHOO_FINANCE_TIMEOUT: int = Field(default=10, description="Yahoo Finance超时时间")
    API_RETRY_ATTEMPTS: int = Field(default=3, description="API重试次数")
    API_RETRY_DELAY: float = Field(default=1.0, description="API重试延迟")
    
    # 监控配置
    MONITOR_CHECK_INTERVAL: int = Field(default=60, description="监控检查间隔(秒)")
    MAX_ALERTS_PER_USER: int = Field(default=100, description="每用户最大预警数")
    MAX_TRIGGERS_HISTORY: int = Field(default=1000, description="最大触发历史记录数")
    ALERT_COOLDOWN_MINUTES: int = Field(default=5, description="预警冷却时间(分钟)")
    
    # 文件上传配置
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024, description="最大上传文件大小")
    UPLOAD_DIR: str = Field(default="uploads", description="上传目录")
    
    # 缓存配置
    CACHE_TTL: int = Field(default=300, description="缓存TTL(秒)")
    CACHE_MAX_SIZE: int = Field(default=1000, description="缓存最大条目数")
    
    # 邮件配置（可选）
    SMTP_HOST: Optional[str] = Field(default=None, description="SMTP主机")
    SMTP_PORT: int = Field(default=587, description="SMTP端口")
    SMTP_USERNAME: Optional[str] = Field(default=None, description="SMTP用户名")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP密码")
    SMTP_USE_TLS: bool = Field(default=True, description="SMTP使用TLS")
    
    # 通知配置
    ENABLE_EMAIL_NOTIFICATIONS: bool = Field(default=False, description="启用邮件通知")
    ENABLE_WEBHOOK_NOTIFICATIONS: bool = Field(default=False, description="启用Webhook通知")
    WEBHOOK_URL: Optional[str] = Field(default=None, description="Webhook URL")
    
    # 性能配置
    WORKER_PROCESSES: int = Field(default=1, description="工作进程数")
    WORKER_CONNECTIONS: int = Field(default=1000, description="工作连接数")
    KEEPALIVE_TIMEOUT: int = Field(default=5, description="保持连接超时")
    
    # 监控和健康检查
    HEALTH_CHECK_INTERVAL: int = Field(default=30, description="健康检查间隔(秒)")
    METRICS_ENABLED: bool = Field(default=True, description="启用指标收集")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    def get_database_url(self) -> str:
        """获取数据库连接URL"""
        if self.DATABASE_TYPE.lower() == "sqlite":
            return f"sqlite:///{self.SQLITE_PATH}"
        elif self.DATABASE_TYPE.lower() == "mysql":
            return (
                f"mysql+pymysql://{self.DATABASE_USERNAME}:{self.DATABASE_PASSWORD}"
                f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
                f"?charset=utf8mb4"
            )
        else:
            raise ValueError(f"不支持的数据库类型: {self.DATABASE_TYPE}")
    
    def get_redis_url(self) -> str:
        """获取Redis连接URL"""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        else:
            return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    def is_production(self) -> bool:
        """是否为生产环境"""
        return self.ENVIRONMENT.lower() == "production"
    
    def is_development(self) -> bool:
        """是否为开发环境"""
        return self.ENVIRONMENT.lower() == "development"
    
    def get_log_config(self) -> dict:
        """获取日志配置"""
        config = {
            "level": self.LOG_LEVEL,
            "format": "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            "rotation": self.LOG_ROTATION,
            "retention": self.LOG_RETENTION,
            "compression": "zip"
        }
        
        if self.LOG_FILE:
            config["sink"] = self.LOG_FILE
        
        return config


# 创建全局配置实例
settings = Settings()


def get_settings() -> Settings:
    """获取配置实例（FastAPI依赖）"""
    return settings


# 确保必要的目录存在
def ensure_directories():
    """确保必要的目录存在"""
    directories = [
        Path(settings.SQLITE_PATH).parent,
        Path(settings.UPLOAD_DIR),
        Path("logs"),
        Path("data"),
        Path("temp")
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

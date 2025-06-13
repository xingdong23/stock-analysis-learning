"""
数据库连接和初始化
"""
import os
from pathlib import Path
from typing import Optional

from sqlalchemy import text
from loguru import logger

from app.database.base import (
    Base, 
    get_database_url, 
    create_database_engine, 
    create_session_factory,
    engine,
    SessionLocal
)
from app.core.config import settings


class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        self.engine = None
        self.session_factory = None
        self._is_initialized = False
    
    def initialize(
        self,
        db_type: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
        sqlite_path: Optional[str] = None
    ):
        """
        初始化数据库连接
        
        Args:
            db_type: 数据库类型
            host: 数据库主机
            port: 数据库端口
            username: 用户名
            password: 密码
            database: 数据库名
            sqlite_path: SQLite数据库文件路径
        """
        try:
            # 使用传入参数或配置文件中的值
            db_type = db_type or settings.DATABASE_TYPE
            host = host or settings.DATABASE_HOST
            port = port or settings.DATABASE_PORT
            username = username or settings.DATABASE_USERNAME
            password = password or settings.DATABASE_PASSWORD
            database = database or settings.DATABASE_NAME
            sqlite_path = sqlite_path or settings.SQLITE_PATH
            
            # 确保SQLite数据库目录存在
            if db_type.lower() == "sqlite":
                sqlite_dir = Path(sqlite_path).parent
                sqlite_dir.mkdir(parents=True, exist_ok=True)
                logger.info(f"SQLite数据库目录: {sqlite_dir}")
            
            # 生成数据库URL
            database_url = get_database_url(
                db_type=db_type,
                host=host,
                port=port,
                username=username,
                password=password,
                database=database,
                sqlite_path=sqlite_path
            )
            
            logger.info(f"数据库类型: {db_type}")
            logger.info(f"数据库URL: {database_url.split('@')[0]}@***")  # 隐藏密码
            
            # 创建引擎
            self.engine = create_database_engine(
                database_url,
                echo=settings.DATABASE_ECHO
            )
            
            # 创建会话工厂
            self.session_factory = create_session_factory(self.engine)
            
            # 更新全局变量
            global engine, SessionLocal
            engine = self.engine
            SessionLocal = self.session_factory
            
            # 测试连接
            self._test_connection()
            
            # 创建表
            self._create_tables()
            
            # 创建示例数据（开发环境）
            if settings.ENVIRONMENT == "development":
                self._create_sample_data()
            
            self._is_initialized = True
            logger.success("✅ 数据库初始化成功")
            
        except Exception as e:
            logger.error(f"❌ 数据库初始化失败: {e}")
            raise
    
    def _test_connection(self):
        """测试数据库连接"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
            logger.info("✅ 数据库连接测试成功")
        except Exception as e:
            logger.error(f"❌ 数据库连接测试失败: {e}")
            raise
    
    def _create_tables(self):
        """创建数据库表"""
        try:
            # 导入所有模型以确保它们被注册
            from app.models.stock_alert import StockAlert
            from app.models.alert_trigger import AlertTrigger
            
            # 创建所有表
            Base.metadata.create_all(bind=self.engine)
            logger.info("✅ 数据库表创建成功")
            
        except Exception as e:
            logger.error(f"❌ 创建数据库表失败: {e}")
            raise
    
    def _create_sample_data(self):
        """创建示例数据（仅开发环境）"""
        try:
            from app.models.stock_alert import StockAlert
            import uuid
            
            db = self.session_factory()
            
            # 检查是否已有数据
            existing_count = db.query(StockAlert).count()
            if existing_count > 0:
                logger.info(f"数据库中已有 {existing_count} 条预警记录，跳过示例数据创建")
                db.close()
                return
            
            # 创建示例预警
            sample_alerts = [
                StockAlert(
                    id=str(uuid.uuid4()),
                    symbol="AAPL",
                    name="Apple Inc",
                    indicator_type="MA",
                    indicator_period=20,
                    condition="CROSS_BELOW",
                    is_active=True,
                    user_id="demo",
                    description="苹果股票跌破MA20预警"
                ),
                StockAlert(
                    id=str(uuid.uuid4()),
                    symbol="IONQ",
                    name="IonQ Inc",
                    indicator_type="MA_CONVERGENCE",
                    indicator_periods=[5, 10, 20],
                    indicator_threshold=2.0,
                    condition="CONVERGING",
                    is_active=True,
                    user_id="demo",
                    description="IONQ均线缠绕预警"
                ),
                StockAlert(
                    id=str(uuid.uuid4()),
                    symbol="TSLA",
                    name="Tesla Inc",
                    indicator_type="PRICE",
                    condition="BELOW",
                    target_value=200.0,
                    is_active=True,
                    user_id="demo",
                    description="特斯拉价格预警"
                )
            ]
            
            for alert in sample_alerts:
                db.add(alert)
            
            db.commit()
            db.close()
            
            logger.info(f"✅ 创建了 {len(sample_alerts)} 条示例预警数据")
            
        except Exception as e:
            logger.error(f"❌ 创建示例数据失败: {e}")
            # 不抛出异常，示例数据创建失败不应该影响应用启动
    
    def close(self):
        """关闭数据库连接"""
        if self.engine:
            self.engine.dispose()
            logger.info("✅ 数据库连接已关闭")
    
    def get_stats(self) -> dict:
        """获取数据库统计信息"""
        if not self._is_initialized:
            return {"status": "not_initialized"}
        
        try:
            from app.models.stock_alert import StockAlert
            from app.models.alert_trigger import AlertTrigger
            
            db = self.session_factory()
            
            total_alerts = db.query(StockAlert).filter(StockAlert.is_deleted == False).count()
            active_alerts = db.query(StockAlert).filter(
                StockAlert.is_active == True,
                StockAlert.is_deleted == False
            ).count()
            total_triggers = db.query(AlertTrigger).count()
            
            db.close()
            
            return {
                "status": "connected",
                "database_type": settings.DATABASE_TYPE,
                "total_alerts": total_alerts,
                "active_alerts": active_alerts,
                "total_triggers": total_triggers,
                "is_initialized": self._is_initialized
            }
            
        except Exception as e:
            logger.error(f"获取数据库统计失败: {e}")
            return {"status": "error", "error": str(e)}
    
    def health_check(self) -> bool:
        """数据库健康检查"""
        try:
            if not self._is_initialized or not self.engine:
                return False
            
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            return True
            
        except Exception as e:
            logger.error(f"数据库健康检查失败: {e}")
            return False


# 全局数据库管理器实例
db_manager = DatabaseManager()


def init_database():
    """初始化数据库（应用启动时调用）"""
    db_manager.initialize()


def close_database():
    """关闭数据库连接（应用关闭时调用）"""
    db_manager.close()


def get_database_stats():
    """获取数据库统计信息"""
    return db_manager.get_stats()


def check_database_health():
    """检查数据库健康状态"""
    return db_manager.health_check()


def get_session_factory():
    """获取会话工厂"""
    return db_manager.session_factory if db_manager._is_initialized else None

"""
数据库基础配置
"""
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# 创建基础模型类
Base = declarative_base()

# 元数据
metadata = MetaData()

# 数据库引擎和会话（将在 database.py 中初始化）
engine = None
SessionLocal = None


def get_database_url(
    db_type: str = "sqlite",
    host: str = "localhost",
    port: int = 3306,
    username: str = "root",
    password: str = "",
    database: str = "stock_monitor",
    sqlite_path: str = "data/stock_monitor.db"
) -> str:
    """
    生成数据库连接URL
    
    Args:
        db_type: 数据库类型 (sqlite, mysql)
        host: 数据库主机
        port: 数据库端口
        username: 用户名
        password: 密码
        database: 数据库名
        sqlite_path: SQLite数据库文件路径
    
    Returns:
        数据库连接URL
    """
    if db_type.lower() == "sqlite":
        return f"sqlite:///{sqlite_path}"
    elif db_type.lower() == "mysql":
        return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}?charset=utf8mb4"
    else:
        raise ValueError(f"不支持的数据库类型: {db_type}")


def create_database_engine(database_url: str, **kwargs):
    """
    创建数据库引擎
    
    Args:
        database_url: 数据库连接URL
        **kwargs: 额外的引擎参数
    
    Returns:
        SQLAlchemy引擎实例
    """
    # 默认引擎参数
    engine_kwargs = {
        "echo": False,  # 是否打印SQL语句
        "pool_pre_ping": True,  # 连接池预检查
        "pool_recycle": 3600,  # 连接回收时间（秒）
    }
    
    # SQLite特殊配置
    if database_url.startswith("sqlite"):
        engine_kwargs.update({
            "poolclass": StaticPool,
            "connect_args": {
                "check_same_thread": False,
                "timeout": 20
            }
        })
    
    # MySQL特殊配置
    elif "mysql" in database_url:
        engine_kwargs.update({
            "pool_size": 10,
            "max_overflow": 20,
            "pool_timeout": 30,
            "connect_args": {
                "charset": "utf8mb4",
                "autocommit": False
            }
        })
    
    # 合并用户提供的参数
    engine_kwargs.update(kwargs)
    
    return create_engine(database_url, **engine_kwargs)


def create_session_factory(engine):
    """
    创建会话工厂
    
    Args:
        engine: 数据库引擎
    
    Returns:
        会话工厂类
    """
    return sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )


# 数据库会话依赖
def get_db():
    """
    获取数据库会话（FastAPI依赖）
    """
    # 动态导入以避免循环导入
    from app.database.database import get_session_factory

    session_factory = get_session_factory()
    if session_factory is None:
        raise RuntimeError("数据库未初始化")

    db = session_factory()
    try:
        yield db
    finally:
        db.close()


# 异步数据库会话依赖（如果需要）
async def get_async_db():
    """
    获取异步数据库会话（FastAPI依赖）
    """
    # 这里可以实现异步数据库会话
    # 目前使用同步版本
    async for db in get_db():
        yield db

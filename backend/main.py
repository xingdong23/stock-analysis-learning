"""
股票监控系统后端主应用
"""
import sys
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger
import uvicorn

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent))

from app.core.config import settings, ensure_directories
from app.database.database import init_database, close_database, get_database_stats, check_database_health
from app.api.v1 import alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("🚀 启动股票监控系统后端...")
    
    try:
        # 确保必要目录存在
        ensure_directories()
        
        # 初始化数据库
        init_database()
        
        # 这里可以添加其他初始化任务
        # 比如启动后台监控任务、连接Redis等
        
        logger.success("✅ 应用启动完成")
        
    except Exception as e:
        logger.error(f"❌ 应用启动失败: {e}")
        raise
    
    yield
    
    # 关闭时执行
    logger.info("🛑 关闭股票监控系统后端...")
    
    try:
        # 关闭数据库连接
        close_database()
        
        # 这里可以添加其他清理任务
        
        logger.success("✅ 应用关闭完成")
        
    except Exception as e:
        logger.error(f"❌ 应用关闭失败: {e}")


# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    description="专业的股票技术分析监控系统，支持多种技术指标预警",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# 添加Gzip压缩中间件
app.add_middleware(GZipMiddleware, minimum_size=1000)


# 全局异常处理
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP异常处理"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url)
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """请求验证异常处理"""
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "请求参数验证失败",
            "errors": exc.errors(),
            "status_code": 422,
            "path": str(request.url)
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理"""
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "服务器内部错误",
            "status_code": 500,
            "path": str(request.url),
            **({"detail": str(exc)} if settings.DEBUG else {})
        }
    )


# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录请求日志"""
    start_time = asyncio.get_event_loop().time()
    
    # 处理请求
    response = await call_next(request)
    
    # 计算处理时间
    process_time = asyncio.get_event_loop().time() - start_time
    
    # 记录日志
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    # 添加处理时间到响应头
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# 根路径
@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "股票监控系统后端API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.DEBUG else "文档已禁用",
        "endpoints": {
            "health": "/health",
            "alerts": f"{settings.API_V1_PREFIX}/alerts",
            "triggers": f"{settings.API_V1_PREFIX}/triggers",
            "stats": f"{settings.API_V1_PREFIX}/alerts/stats"
        }
    }


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查"""
    try:
        # 检查数据库连接
        db_health = check_database_health()
        db_stats = get_database_stats()
        
        # 检查系统资源
        import psutil
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "status": "healthy" if db_health else "unhealthy",
            "timestamp": asyncio.get_event_loop().time(),
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "database": {
                "status": "connected" if db_health else "disconnected",
                **db_stats
            },
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": (disk.used / disk.total) * 100,
                "uptime": asyncio.get_event_loop().time()
            }
        }
        
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": asyncio.get_event_loop().time()
        }


# 注册API路由
app.include_router(
    alerts.router,
    prefix=settings.API_V1_PREFIX,
    tags=["alerts"]
)


# 配置日志
def setup_logging():
    """配置日志"""
    # 移除默认的日志处理器
    logger.remove()
    
    # 添加控制台日志
    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True
    )
    
    # 添加文件日志（如果配置了）
    if settings.LOG_FILE:
        logger.add(
            settings.LOG_FILE,
            level=settings.LOG_LEVEL,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
            rotation=settings.LOG_ROTATION,
            retention=settings.LOG_RETENTION,
            compression="zip"
        )


# 主函数
def main():
    """主函数"""
    # 配置日志
    setup_logging()
    
    logger.info(f"启动 {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"环境: {settings.ENVIRONMENT}")
    logger.info(f"调试模式: {settings.DEBUG}")
    
    # 启动服务器
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD and settings.is_development(),
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        workers=1 if settings.RELOAD else settings.WORKER_PROCESSES
    )


if __name__ == "__main__":
    main()

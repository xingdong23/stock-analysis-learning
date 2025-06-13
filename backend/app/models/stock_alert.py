"""
股票预警模型
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text
from sqlalchemy.dialects.mysql import DECIMAL
from sqlalchemy.sql import func
from pydantic import BaseModel, Field

from app.database.base import Base


class IndicatorType(str, Enum):
    """技术指标类型"""
    MA = "MA"  # 移动平均线
    EMA = "EMA"  # 指数移动平均线
    RSI = "RSI"  # 相对强弱指数
    MACD = "MACD"  # MACD指标
    BOLL = "BOLL"  # 布林带
    KDJ = "KDJ"  # KDJ指标
    PRICE = "PRICE"  # 价格本身
    VOLUME = "VOLUME"  # 成交量
    MA_CONVERGENCE = "MA_CONVERGENCE"  # 均线缠绕
    MA_PROXIMITY = "MA_PROXIMITY"  # 均线附近


class AlertCondition(str, Enum):
    """预警条件"""
    ABOVE = "ABOVE"  # 高于
    BELOW = "BELOW"  # 低于
    CROSS_ABOVE = "CROSS_ABOVE"  # 向上突破
    CROSS_BELOW = "CROSS_BELOW"  # 向下突破
    EQUAL = "EQUAL"  # 等于（在误差范围内）
    PERCENT_CHANGE = "PERCENT_CHANGE"  # 百分比变化
    CONVERGING = "CONVERGING"  # 正在缠绕
    DIVERGING = "DIVERGING"  # 正在发散
    NEAR = "NEAR"  # 接近
    WITHIN_RANGE = "WITHIN_RANGE"  # 在范围内


class StockAlert(Base):
    """股票预警数据库模型"""
    __tablename__ = "stock_alerts"

    id = Column(String(36), primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True, comment="股票代码")
    name = Column(String(100), nullable=False, comment="股票名称")
    
    # 技术指标配置
    indicator_type = Column(String(20), nullable=False, comment="指标类型")
    indicator_period = Column(Integer, nullable=True, comment="指标周期")
    indicator_periods = Column(JSON, nullable=True, comment="多个周期")
    indicator_threshold = Column(DECIMAL(10, 4), nullable=True, comment="指标阈值")
    indicator_parameters = Column(JSON, nullable=True, comment="其他参数")
    
    # 预警条件
    condition = Column(String(20), nullable=False, comment="触发条件")
    target_value = Column(DECIMAL(15, 4), nullable=True, comment="目标值")
    
    # 状态信息
    is_active = Column(Boolean, default=True, comment="是否启用")
    trigger_count = Column(Integer, default=0, comment="触发次数")
    last_triggered = Column(DateTime, nullable=True, comment="最后触发时间")
    
    # 用户和管理信息
    user_id = Column(String(100), default="anonymous", index=True, comment="用户ID")
    description = Column(Text, nullable=True, comment="预警描述")
    priority = Column(Integer, default=1, comment="优先级")
    tags = Column(JSON, nullable=True, comment="标签")
    
    # 软删除
    is_deleted = Column(Boolean, default=False, comment="是否已删除")
    
    # 时间戳
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "id": self.id,
            "symbol": self.symbol,
            "name": self.name,
            "indicator": {
                "type": self.indicator_type,
                "period": self.indicator_period,
                "periods": self.indicator_periods,
                "threshold": float(self.indicator_threshold) if self.indicator_threshold else None,
                "parameters": self.indicator_parameters
            },
            "condition": self.condition,
            "targetValue": float(self.target_value) if self.target_value else None,
            "isActive": self.is_active,
            "triggerCount": self.trigger_count,
            "lastTriggered": self.last_triggered.isoformat() if self.last_triggered else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "description": self.description,
            "priority": self.priority,
            "tags": self.tags
        }


# Pydantic 模型用于API
class TechnicalIndicator(BaseModel):
    """技术指标配置"""
    type: IndicatorType
    period: Optional[int] = None
    periods: Optional[List[int]] = None
    threshold: Optional[float] = None
    parameters: Optional[Dict[str, float]] = None


class StockAlertCreate(BaseModel):
    """创建股票预警请求"""
    symbol: str = Field(..., min_length=1, max_length=20, description="股票代码")
    name: str = Field(..., min_length=1, max_length=100, description="股票名称")
    indicator: TechnicalIndicator = Field(..., description="技术指标配置")
    condition: AlertCondition = Field(..., description="触发条件")
    target_value: Optional[float] = Field(None, description="目标值")
    description: Optional[str] = Field(None, max_length=500, description="预警描述")
    priority: int = Field(1, ge=1, le=5, description="优先级(1-5)")
    tags: Optional[List[str]] = Field(None, description="标签")


class StockAlertUpdate(BaseModel):
    """更新股票预警请求"""
    symbol: Optional[str] = Field(None, min_length=1, max_length=20)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    indicator: Optional[TechnicalIndicator] = None
    condition: Optional[AlertCondition] = None
    target_value: Optional[float] = None
    is_active: Optional[bool] = None
    description: Optional[str] = Field(None, max_length=500)
    priority: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[List[str]] = None


class StockAlertResponse(BaseModel):
    """股票预警响应"""
    id: str
    symbol: str
    name: str
    indicator: TechnicalIndicator
    condition: AlertCondition
    target_value: Optional[float] = None
    is_active: bool
    trigger_count: int
    last_triggered: Optional[datetime] = None
    created_at: datetime
    description: Optional[str] = None
    priority: int
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True


class StockAlertToggle(BaseModel):
    """切换预警状态请求"""
    is_active: bool = Field(..., description="是否启用")


class StockAlertStats(BaseModel):
    """预警统计信息"""
    total_alerts: int = Field(..., description="总预警数")
    active_alerts: int = Field(..., description="活跃预警数")
    total_triggers: int = Field(..., description="总触发数")
    today_triggers: int = Field(..., description="今日触发数")
    is_running: bool = Field(..., description="监控是否运行中")
    connected_stocks: List[str] = Field(..., description="监控的股票列表")
    last_update: datetime = Field(..., description="最后更新时间")


# 预警规则模板
ALERT_RULE_TEMPLATES = [
    {
        "name": "MA20突破",
        "description": "股价向上突破20日移动平均线",
        "indicator": {"type": "MA", "period": 20},
        "condition": "CROSS_ABOVE",
        "example": "当IONQ股价向上突破MA20时提醒"
    },
    {
        "name": "MA20支撑",
        "description": "股价跌破20日移动平均线",
        "indicator": {"type": "MA", "period": 20},
        "condition": "CROSS_BELOW",
        "example": "当IONQ股价跌破MA20时提醒"
    },
    {
        "name": "价格预警",
        "description": "股价达到指定价位",
        "indicator": {"type": "PRICE"},
        "condition": "BELOW",
        "example": "当IONQ股价低于$10时提醒"
    },
    {
        "name": "RSI超买",
        "description": "RSI指标超买信号",
        "indicator": {"type": "RSI", "period": 14},
        "condition": "ABOVE",
        "example": "当RSI > 70时提醒超买"
    },
    {
        "name": "RSI超卖",
        "description": "RSI指标超卖信号",
        "indicator": {"type": "RSI", "period": 14},
        "condition": "BELOW",
        "example": "当RSI < 30时提醒超卖"
    },
    {
        "name": "均线缠绕",
        "description": "多条均线相互缠绕，市场震荡整理",
        "indicator": {"type": "MA_CONVERGENCE", "periods": [5, 10, 20], "threshold": 2},
        "condition": "CONVERGING",
        "example": "当MA5、MA10、MA20缠绕时提醒"
    },
    {
        "name": "均线发散",
        "description": "多条均线开始发散，趋势明确",
        "indicator": {"type": "MA_CONVERGENCE", "periods": [5, 10, 20], "threshold": 2},
        "condition": "DIVERGING",
        "example": "当均线从缠绕状态发散时提醒"
    },
    {
        "name": "接近均线",
        "description": "股价接近重要均线支撑阻力位",
        "indicator": {"type": "MA_PROXIMITY", "period": 20, "threshold": 2},
        "condition": "NEAR",
        "example": "当股价接近MA20时提醒"
    },
    {
        "name": "均线附近震荡",
        "description": "股价在均线附近小幅震荡",
        "indicator": {"type": "MA_PROXIMITY", "period": 20, "threshold": 1},
        "condition": "WITHIN_RANGE",
        "example": "当股价在MA20±1%范围内震荡时提醒"
    }
]

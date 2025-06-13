"""
预警触发记录模型
"""
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.dialects.mysql import DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field

from app.database.base import Base


class TriggerSeverity(int, Enum):
    """触发严重程度"""
    LOW = 1      # 低
    MEDIUM = 2   # 中
    HIGH = 3     # 高
    CRITICAL = 4 # 严重


class AlertTrigger(Base):
    """预警触发记录数据库模型"""
    __tablename__ = "alert_triggers"

    id = Column(String(36), primary_key=True, index=True)
    alert_id = Column(String(36), ForeignKey("stock_alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 触发时的股票信息
    symbol = Column(String(20), nullable=False, index=True, comment="股票代码")
    current_price = Column(DECIMAL(15, 4), nullable=False, comment="当前价格")
    indicator_value = Column(DECIMAL(15, 4), nullable=True, comment="指标值")
    
    # 触发条件和消息
    condition = Column(String(20), nullable=False, comment="触发条件")
    message = Column(String(500), nullable=False, comment="触发消息")
    
    # 用户信息
    user_id = Column(String(100), default="anonymous", index=True, comment="用户ID")
    
    # 触发时的额外数据
    metadata = Column(JSON, nullable=True, comment="额外元数据")
    
    # 状态信息
    is_read = Column(Boolean, default=False, comment="是否已读")
    severity = Column(Integer, default=1, comment="严重程度")
    
    # 时间戳
    timestamp = Column(DateTime, default=func.now(), index=True, comment="触发时间")
    
    # 关联关系
    # alert = relationship("StockAlert", back_populates="triggers")

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "id": self.id,
            "alertId": self.alert_id,
            "symbol": self.symbol,
            "currentPrice": float(self.current_price),
            "indicatorValue": float(self.indicator_value) if self.indicator_value else None,
            "condition": self.condition,
            "message": self.message,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "metadata": self.metadata,
            "isRead": self.is_read,
            "severity": self.severity
        }


# Pydantic 模型用于API
class AlertTriggerCreate(BaseModel):
    """创建触发记录请求"""
    alert_id: str = Field(..., description="预警规则ID")
    symbol: str = Field(..., min_length=1, max_length=20, description="股票代码")
    current_price: float = Field(..., gt=0, description="当前价格")
    indicator_value: Optional[float] = Field(None, description="指标值")
    condition: str = Field(..., min_length=1, max_length=20, description="触发条件")
    message: str = Field(..., min_length=1, max_length=500, description="触发消息")
    metadata: Optional[Dict[str, Any]] = Field(None, description="额外元数据")
    severity: int = Field(1, ge=1, le=4, description="严重程度")


class AlertTriggerResponse(BaseModel):
    """触发记录响应"""
    id: str
    alert_id: str
    symbol: str
    current_price: float
    indicator_value: Optional[float] = None
    condition: str
    message: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    is_read: bool
    severity: int

    class Config:
        from_attributes = True


class AlertTriggerUpdate(BaseModel):
    """更新触发记录请求"""
    is_read: Optional[bool] = Field(None, description="是否已读")
    severity: Optional[int] = Field(None, ge=1, le=4, description="严重程度")


class AlertTriggerList(BaseModel):
    """触发记录列表响应"""
    triggers: list[AlertTriggerResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class AlertTriggerStats(BaseModel):
    """触发统计信息"""
    total_triggers: int = Field(..., description="总触发数")
    today_triggers: int = Field(..., description="今日触发数")
    unread_triggers: int = Field(..., description="未读触发数")
    high_severity_triggers: int = Field(..., description="高严重程度触发数")
    triggers_by_symbol: Dict[str, int] = Field(..., description="按股票分组的触发数")
    triggers_by_condition: Dict[str, int] = Field(..., description="按条件分组的触发数")


class TriggerMetadata(BaseModel):
    """触发元数据"""
    market_status: Optional[str] = Field(None, description="市场状态")
    volume: Optional[int] = Field(None, description="成交量")
    change: Optional[float] = Field(None, description="价格变化")
    change_percent: Optional[float] = Field(None, description="价格变化百分比")
    ma_values: Optional[Dict[str, float]] = Field(None, description="均线值")
    rsi_value: Optional[float] = Field(None, description="RSI值")
    macd_values: Optional[Dict[str, float]] = Field(None, description="MACD值")
    bollinger_bands: Optional[Dict[str, float]] = Field(None, description="布林带值")
    
    # 市场相关信息
    market_cap: Optional[float] = Field(None, description="市值")
    pe_ratio: Optional[float] = Field(None, description="市盈率")
    dividend_yield: Optional[float] = Field(None, description="股息率")
    
    # 技术分析相关
    support_level: Optional[float] = Field(None, description="支撑位")
    resistance_level: Optional[float] = Field(None, description="阻力位")
    trend_direction: Optional[str] = Field(None, description="趋势方向")
    volatility: Optional[float] = Field(None, description="波动率")


# 触发消息模板
TRIGGER_MESSAGE_TEMPLATES = {
    "ABOVE": "{symbol} 价格 ${current_price:.2f} 高于 ${target_value:.2f}",
    "BELOW": "{symbol} 价格 ${current_price:.2f} 低于 ${target_value:.2f}",
    "CROSS_ABOVE": "{symbol} 价格 ${current_price:.2f} 向上突破 {indicator_name}",
    "CROSS_BELOW": "{symbol} 价格 ${current_price:.2f} 跌破 {indicator_name}",
    "CONVERGING": "{symbol} 均线缠绕 MA({periods}) 价格 ${current_price:.2f}",
    "DIVERGING": "{symbol} 均线发散 MA({periods}) 价格 ${current_price:.2f}",
    "NEAR": "{symbol} 价格 ${current_price:.2f} 接近 {indicator_name}",
    "WITHIN_RANGE": "{symbol} 价格 ${current_price:.2f} 在 {indicator_name} 附近震荡",
    "EQUAL": "{symbol} 价格 ${current_price:.2f} 达到目标价位 ${target_value:.2f}"
}


def generate_trigger_message(
    symbol: str,
    condition: str,
    current_price: float,
    target_value: Optional[float] = None,
    indicator_name: Optional[str] = None,
    periods: Optional[list] = None
) -> str:
    """生成触发消息"""
    template = TRIGGER_MESSAGE_TEMPLATES.get(condition, "{symbol} 触发预警条件")
    
    # 准备格式化参数
    format_params = {
        "symbol": symbol,
        "current_price": current_price,
        "target_value": target_value or 0,
        "indicator_name": indicator_name or "指标",
        "periods": ",".join(map(str, periods)) if periods else "5,10,20"
    }
    
    try:
        return template.format(**format_params)
    except KeyError:
        return f"{symbol} 触发预警条件 价格 ${current_price:.2f}"

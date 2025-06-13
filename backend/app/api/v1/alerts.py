"""
股票预警API路由
"""
import uuid
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from loguru import logger

from app.database.base import get_db
from app.models.stock_alert import (
    StockAlert,
    StockAlertCreate,
    StockAlertUpdate,
    StockAlertResponse,
    StockAlertToggle,
    StockAlertStats,
    ALERT_RULE_TEMPLATES
)
from app.models.alert_trigger import AlertTrigger
from app.core.config import settings

router = APIRouter()


def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """获取用户ID"""
    return x_user_id or "anonymous"


@router.get("/alerts", response_model=List[StockAlertResponse])
async def get_alerts(
    user_id: str = Depends(get_user_id),
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回记录数"),
    symbol: Optional[str] = Query(None, description="股票代码过滤"),
    is_active: Optional[bool] = Query(None, description="是否启用过滤"),
    indicator_type: Optional[str] = Query(None, description="指标类型过滤"),
    db: Session = Depends(get_db)
):
    """获取用户的所有预警规则"""
    try:
        query = db.query(StockAlert).filter(
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        )
        
        # 应用过滤条件
        if symbol:
            query = query.filter(StockAlert.symbol.ilike(f"%{symbol}%"))
        
        if is_active is not None:
            query = query.filter(StockAlert.is_active == is_active)
        
        if indicator_type:
            query = query.filter(StockAlert.indicator_type == indicator_type)
        
        # 排序和分页
        alerts = query.order_by(desc(StockAlert.created_at)).offset(skip).limit(limit).all()
        
        # 转换为响应格式
        result = []
        for alert in alerts:
            alert_dict = alert.to_dict()
            result.append(StockAlertResponse(**alert_dict))
        
        logger.info(f"用户 {user_id} 获取了 {len(result)} 个预警规则")
        return result
        
    except Exception as e:
        logger.error(f"获取预警规则失败: {e}")
        raise HTTPException(status_code=500, detail="获取预警规则失败")


@router.post("/alerts", response_model=StockAlertResponse)
async def create_alert(
    alert_data: StockAlertCreate,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """创建新的预警规则"""
    try:
        # 检查用户预警数量限制
        user_alert_count = db.query(StockAlert).filter(
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        ).count()
        
        if user_alert_count >= settings.MAX_ALERTS_PER_USER:
            raise HTTPException(
                status_code=400,
                detail=f"预警规则数量已达上限 ({settings.MAX_ALERTS_PER_USER})"
            )
        
        # 创建预警规则
        alert = StockAlert(
            id=str(uuid.uuid4()),
            symbol=alert_data.symbol.upper(),
            name=alert_data.name,
            indicator_type=alert_data.indicator.type,
            indicator_period=alert_data.indicator.period,
            indicator_periods=alert_data.indicator.periods,
            indicator_threshold=alert_data.indicator.threshold,
            indicator_parameters=alert_data.indicator.parameters,
            condition=alert_data.condition,
            target_value=alert_data.target_value,
            user_id=user_id,
            description=alert_data.description,
            priority=alert_data.priority,
            tags=alert_data.tags
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        # 转换为响应格式
        alert_dict = alert.to_dict()
        result = StockAlertResponse(**alert_dict)
        
        logger.info(f"用户 {user_id} 创建了预警规则: {alert.symbol} - {alert.indicator_type}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"创建预警规则失败: {e}")
        raise HTTPException(status_code=500, detail="创建预警规则失败")


@router.get("/alerts/{alert_id}", response_model=StockAlertResponse)
async def get_alert(
    alert_id: str,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """获取单个预警规则"""
    try:
        alert = db.query(StockAlert).filter(
            StockAlert.id == alert_id,
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        ).first()
        
        if not alert:
            raise HTTPException(status_code=404, detail="预警规则不存在")
        
        alert_dict = alert.to_dict()
        return StockAlertResponse(**alert_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取预警规则失败: {e}")
        raise HTTPException(status_code=500, detail="获取预警规则失败")


@router.put("/alerts/{alert_id}", response_model=StockAlertResponse)
async def update_alert(
    alert_id: str,
    alert_data: StockAlertUpdate,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """更新预警规则"""
    try:
        alert = db.query(StockAlert).filter(
            StockAlert.id == alert_id,
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        ).first()
        
        if not alert:
            raise HTTPException(status_code=404, detail="预警规则不存在")
        
        # 更新字段
        update_data = alert_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "indicator" and value:
                # 处理嵌套的indicator字段
                alert.indicator_type = value.type
                alert.indicator_period = value.period
                alert.indicator_periods = value.periods
                alert.indicator_threshold = value.threshold
                alert.indicator_parameters = value.parameters
            else:
                setattr(alert, field, value)
        
        db.commit()
        db.refresh(alert)
        
        alert_dict = alert.to_dict()
        result = StockAlertResponse(**alert_dict)
        
        logger.info(f"用户 {user_id} 更新了预警规则: {alert.symbol}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"更新预警规则失败: {e}")
        raise HTTPException(status_code=500, detail="更新预警规则失败")


@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: str,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """删除预警规则（软删除）"""
    try:
        alert = db.query(StockAlert).filter(
            StockAlert.id == alert_id,
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        ).first()
        
        if not alert:
            raise HTTPException(status_code=404, detail="预警规则不存在")
        
        # 软删除
        alert.is_deleted = True
        db.commit()
        
        logger.info(f"用户 {user_id} 删除了预警规则: {alert.symbol}")
        return {"message": "预警规则删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"删除预警规则失败: {e}")
        raise HTTPException(status_code=500, detail="删除预警规则失败")


@router.patch("/alerts/{alert_id}/toggle", response_model=StockAlertResponse)
async def toggle_alert(
    alert_id: str,
    toggle_data: StockAlertToggle,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """切换预警规则启用状态"""
    try:
        alert = db.query(StockAlert).filter(
            StockAlert.id == alert_id,
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        ).first()
        
        if not alert:
            raise HTTPException(status_code=404, detail="预警规则不存在")
        
        alert.is_active = toggle_data.is_active
        db.commit()
        db.refresh(alert)
        
        alert_dict = alert.to_dict()
        result = StockAlertResponse(**alert_dict)
        
        status = "启用" if toggle_data.is_active else "禁用"
        logger.info(f"用户 {user_id} {status}了预警规则: {alert.symbol}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"切换预警状态失败: {e}")
        raise HTTPException(status_code=500, detail="切换预警状态失败")


@router.get("/alerts/stats", response_model=StockAlertStats)
async def get_alert_stats(
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """获取预警统计信息"""
    try:
        # 获取预警统计
        total_alerts = db.query(StockAlert).filter(
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        ).count()
        
        active_alerts = db.query(StockAlert).filter(
            StockAlert.user_id == user_id,
            StockAlert.is_active == True,
            StockAlert.is_deleted == False
        ).count()
        
        # 获取触发统计
        total_triggers = db.query(AlertTrigger).filter(
            AlertTrigger.user_id == user_id
        ).count()
        
        # 今日触发数
        today = datetime.now().date()
        today_triggers = db.query(AlertTrigger).filter(
            AlertTrigger.user_id == user_id,
            func.date(AlertTrigger.timestamp) == today
        ).count()
        
        # 获取监控的股票列表
        connected_stocks = db.query(StockAlert.symbol).filter(
            StockAlert.user_id == user_id,
            StockAlert.is_active == True,
            StockAlert.is_deleted == False
        ).distinct().all()
        
        connected_stocks = [stock[0] for stock in connected_stocks]
        
        return StockAlertStats(
            total_alerts=total_alerts,
            active_alerts=active_alerts,
            total_triggers=total_triggers,
            today_triggers=today_triggers,
            is_running=True,  # 这个需要从监控服务获取
            connected_stocks=connected_stocks,
            last_update=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"获取预警统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取预警统计失败")


@router.get("/alert-templates")
async def get_alert_templates():
    """获取预警规则模板"""
    return {
        "templates": ALERT_RULE_TEMPLATES,
        "total": len(ALERT_RULE_TEMPLATES)
    }


@router.post("/alerts/batch-toggle")
async def batch_toggle_alerts(
    alert_ids: List[str],
    is_active: bool,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """批量切换预警状态"""
    try:
        updated_count = db.query(StockAlert).filter(
            StockAlert.id.in_(alert_ids),
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        ).update(
            {"is_active": is_active},
            synchronize_session=False
        )
        
        db.commit()
        
        status = "启用" if is_active else "禁用"
        logger.info(f"用户 {user_id} 批量{status}了 {updated_count} 个预警规则")
        
        return {
            "message": f"成功{status} {updated_count} 个预警规则",
            "updated_count": updated_count
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"批量切换预警状态失败: {e}")
        raise HTTPException(status_code=500, detail="批量切换预警状态失败")


@router.delete("/alerts/batch-delete")
async def batch_delete_alerts(
    alert_ids: List[str],
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    """批量删除预警规则"""
    try:
        updated_count = db.query(StockAlert).filter(
            StockAlert.id.in_(alert_ids),
            StockAlert.user_id == user_id,
            StockAlert.is_deleted == False
        ).update(
            {"is_deleted": True},
            synchronize_session=False
        )
        
        db.commit()
        
        logger.info(f"用户 {user_id} 批量删除了 {updated_count} 个预警规则")
        
        return {
            "message": f"成功删除 {updated_count} 个预警规则",
            "deleted_count": updated_count
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"批量删除预警规则失败: {e}")
        raise HTTPException(status_code=500, detail="批量删除预警规则失败")

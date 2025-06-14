// 股票监控服务

import { 
  type StockAlert, 
  type AlertTrigger, 
  type MonitoringStatus,
  type LongPortQuote,
  type StockMonitorConfig
} from '../types/monitor.ts';
import { LongPortApiService } from './longportApi.ts';
import { TechnicalIndicatorService } from './technicalIndicators.ts';

export class StockMonitorService {
  private apiService: LongPortApiService;
  private alerts: Map<string, StockAlert> = new Map();
  private isRunning: boolean = false;
  private config: StockMonitorConfig;
  private lastValues: Map<string, number> = new Map(); // 存储上一次的指标值，用于检测交叉
  private notificationCallbacks: Array<(trigger: AlertTrigger) => void> = [];

  constructor(config: StockMonitorConfig) {
    this.config = config;
    this.apiService = new LongPortApiService({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      accessToken: config.accessToken,
      environment: config.environment
    });
  }

  // 添加预警规则
  addAlert(alert: StockAlert): void {
    this.alerts.set(alert.id, alert);
    
    if (this.isRunning && alert.is_active) {
      this.subscribeToStock(alert.symbol);
    }
  }

  // 删除预警规则
  removeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      this.alerts.delete(alertId);
      
      // 检查是否还有其他预警需要这个股票
      const hasOtherAlerts = Array.from(this.alerts.values())
        .some(a => a.symbol === alert.symbol && a.is_active);
      
      if (!hasOtherAlerts) {
        this.apiService.unsubscribeQuote(alert.symbol);
      }
    }
  }

  // 启用/禁用预警
  toggleAlert(alertId: string, isActive: boolean): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.is_active = isActive;
      
      if (this.isRunning) {
        if (isActive) {
          this.subscribeToStock(alert.symbol);
        } else {
          // 检查是否还有其他启用的预警需要这个股票
          const hasOtherActiveAlerts = Array.from(this.alerts.values())
            .some(a => a.symbol === alert.symbol && a.is_active && a.id !== alertId);
          
          if (!hasOtherActiveAlerts) {
            this.apiService.unsubscribeQuote(alert.symbol);
          }
        }
      }
    }
  }

  // 开始监控
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log('监控已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('开始股票监控...');

    // 订阅所有活跃预警的股票
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.is_active);
    const uniqueSymbols = [...new Set(activeAlerts.map(alert => alert.symbol))];

    for (const symbol of uniqueSymbols) {
      this.subscribeToStock(symbol);
    }
  }

  // 停止监控
  stopMonitoring(): void {
    if (!this.isRunning) {
      console.log('监控未在运行');
      return;
    }

    this.isRunning = false;
    this.apiService.disconnect();
    console.log('股票监控已停止');
  }

  // 订阅股票实时行情
  private subscribeToStock(symbol: string): void {
    this.apiService.subscribeQuote(symbol, (quote: LongPortQuote) => {
      this.handleQuoteUpdate(quote);
    });
  }

  // 处理行情更新
  private async handleQuoteUpdate(quote: LongPortQuote): Promise<void> {
    // 获取该股票的所有活跃预警
    const stockAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.symbol === quote.symbol && alert.is_active);

    for (const alert of stockAlerts) {
      try {
        const shouldTrigger = await this.checkAlertCondition(alert, quote);
        
        if (shouldTrigger) {
          await this.triggerAlert(alert, quote);
        }
      } catch (error) {
        console.error(`检查预警条件失败 (${alert.id}):`, error);
      }
    }
  }

  // 检查预警条件
  private async checkAlertCondition(alert: StockAlert, quote: LongPortQuote): Promise<boolean> {
    const currentPrice = parseFloat(quote.last_done);
    
    // 如果是价格预警
    if (alert.indicator.type === 'PRICE') {
      if (!alert.target_value) return false;

      switch (alert.condition) {
        case 'ABOVE':
          return currentPrice > alert.target_value;
        case 'BELOW':
          return currentPrice < alert.target_value;
        case 'EQUAL':
          const tolerance = alert.target_value * 0.001; // 0.1% 误差
          return Math.abs(currentPrice - alert.target_value) <= tolerance;
        default:
          return false;
      }
    }

    // 技术指标预警需要获取K线数据
    try {
      const candlesticks = await this.apiService.getCandlesticks(alert.symbol, 'Day', 100);
      if (candlesticks.length === 0) return false;

      // 更新最新价格到K线数据
      const latestCandle = candlesticks[candlesticks.length - 1];
      latestCandle.close = quote.last_done;
      latestCandle.high = Math.max(parseFloat(latestCandle.high), currentPrice).toString();
      latestCandle.low = Math.min(parseFloat(latestCandle.low), currentPrice).toString();

      const currentIndicatorValue = TechnicalIndicatorService.getLatestIndicatorValue(
        candlesticks,
        alert.indicator.type,
        alert.indicator.period,
        alert.indicator.periods,
        alert.indicator.threshold
      );

      if (currentIndicatorValue === null) return false;

      // 获取上一次的指标值
      const lastValueKey = `${alert.symbol}_${alert.indicator.type}_${alert.indicator.period}`;
      const previousIndicatorValue = this.lastValues.get(lastValueKey);
      
      // 更新最新值
      this.lastValues.set(lastValueKey, currentIndicatorValue);

      // 检查条件
      switch (alert.condition) {
        case 'ABOVE':
          return alert.target_value ? currentPrice > alert.target_value : false;

        case 'BELOW':
          return alert.target_value ? currentPrice < alert.target_value : false;

        case 'CROSS_ABOVE':
          if (!alert.target_value || previousIndicatorValue === undefined) return false;
          return TechnicalIndicatorService.checkCrossover(
            currentPrice,
            previousIndicatorValue,
            currentIndicatorValue,
            'above'
          );

        case 'CROSS_BELOW':
          if (!alert.target_value || previousIndicatorValue === undefined) return false;
          return TechnicalIndicatorService.checkCrossover(
            currentPrice,
            previousIndicatorValue,
            currentIndicatorValue,
            'below'
          );

        case 'CONVERGING': {
          // 均线缠绕检测
          if (alert.indicator.type !== 'MA_CONVERGENCE') return false;
          const convergenceStatus = TechnicalIndicatorService.getLatestConvergenceStatus(
            candlesticks,
            alert.indicator.periods || [5, 10, 20],
            alert.indicator.threshold || 2
          );
          return convergenceStatus ? convergenceStatus.isConverging : false;
        }

        case 'DIVERGING': {
          // 均线发散检测
          if (alert.indicator.type !== 'MA_CONVERGENCE') return false;
          const convergenceStatus = TechnicalIndicatorService.getLatestConvergenceStatus(
            candlesticks,
            alert.indicator.periods || [5, 10, 20],
            alert.indicator.threshold || 2
          );

          // 检查是否从缠绕状态转为发散
          const lastValueKey = `${alert.symbol}_convergence_${alert.indicator.periods?.join('_')}`;
          const previousConvergence = this.lastValues.get(lastValueKey);

          if (convergenceStatus) {
            this.lastValues.set(lastValueKey, convergenceStatus.isConverging ? 1 : 0);

            if (previousConvergence === 1 && !convergenceStatus.isConverging) {
              return true; // 从缠绕转为发散
            }
          }
          return false;
        }

        case 'NEAR': {
          // 接近均线检测
          if (alert.indicator.type !== 'MA_PROXIMITY') return false;
          const maValue = TechnicalIndicatorService.getLatestIndicatorValue(
            candlesticks,
            'ma',
            alert.indicator.period
          );
          if (maValue === null) return false;

          const proximity = TechnicalIndicatorService.checkMAProximity(
            currentPrice,
            maValue,
            alert.indicator.threshold || 2
          );
          return proximity.isNear;
        }

        case 'WITHIN_RANGE': {
          // 在均线附近范围内
          if (alert.indicator.type !== 'MA_PROXIMITY') return false;
          const maValue = TechnicalIndicatorService.getLatestIndicatorValue(
            candlesticks,
            'ma',
            alert.indicator.period
          );
          if (maValue === null) return false;

          const proximity = TechnicalIndicatorService.checkMAProximity(
            currentPrice,
            maValue,
            alert.indicator.threshold || 1
          );
          return proximity.isWithinRange;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error('获取技术指标数据失败:', error);
      return false;
    }
  }

  // 触发预警
  private async triggerAlert(alert: StockAlert, quote: LongPortQuote): Promise<void> {
    const now = new Date();
    
    // 检查是否在冷却期内（避免频繁触发）
    if (alert.last_triggered) {
      const timeSinceLastTrigger = now.getTime() - new Date(alert.last_triggered).getTime();
      const cooldownPeriod = 5 * 60 * 1000; // 5分钟冷却期
      
      if (timeSinceLastTrigger < cooldownPeriod) {
        return;
      }
    }

    // 更新预警状态
    alert.last_triggered = now.toISOString();
    alert.trigger_count++;

    // 创建触发事件
    const trigger: AlertTrigger = {
      alertId: alert.id,
      symbol: alert.symbol,
      currentPrice: parseFloat(quote.last_done),
      indicatorValue: 0, // 这里需要根据实际指标值填充
      condition: alert.condition,
      message: this.generateAlertMessage(alert, quote),
      timestamp: now
    };

    // 发送通知
    this.sendNotification(trigger);
  }

  // 生成预警消息
  private generateAlertMessage(alert: StockAlert, quote: LongPortQuote): string {
    const price = parseFloat(quote.last_done);
    const symbol = alert.symbol;
    const indicatorName = alert.indicator.type + (alert.indicator.period ? alert.indicator.period : '');

    switch (alert.condition) {
      case 'ABOVE':
        return `${symbol} 价格 $${price} 高于 ${alert.target_value}`;
      case 'BELOW':
        return `${symbol} 价格 $${price} 低于 ${alert.target_value}`;
      case 'CROSS_ABOVE':
        return `${symbol} 价格 $${price} 向上突破 ${indicatorName}`;
      case 'CROSS_BELOW':
        return `${symbol} 价格 $${price} 跌破 ${indicatorName}`;
      case 'CONVERGING':
        const periods = alert.indicator.periods?.join(',') || '5,10,20';
        return `${symbol} 均线缠绕 MA(${periods}) 价格 $${price}`;
      case 'DIVERGING':
        const divergePeriods = alert.indicator.periods?.join(',') || '5,10,20';
        return `${symbol} 均线发散 MA(${divergePeriods}) 价格 $${price}`;
      case 'NEAR':
        return `${symbol} 价格 $${price} 接近 ${indicatorName}`;
      case 'WITHIN_RANGE':
        return `${symbol} 价格 $${price} 在 ${indicatorName} 附近震荡`;
      default:
        return `${symbol} 触发预警条件`;
    }
  }

  // 发送通知
  private sendNotification(trigger: AlertTrigger): void {
    console.log('🚨 预警触发:', trigger.message);
    
    // 调用所有注册的回调函数
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(trigger);
      } catch (error) {
        console.error('通知回调执行失败:', error);
      }
    });

    // 浏览器通知
    if (this.config.enableNotifications && this.config.notificationMethods.includes('BROWSER_NOTIFICATION')) {
      this.sendBrowserNotification(trigger);
    }
  }

  // 发送浏览器通知
  private sendBrowserNotification(trigger: AlertTrigger): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('股票预警', {
        body: trigger.message,
        icon: '/favicon.ico',
        tag: trigger.alertId
      });
    }
  }

  // 注册通知回调
  onAlertTriggered(callback: (trigger: AlertTrigger) => void): void {
    this.notificationCallbacks.push(callback);
  }

  // 获取监控状态
  getStatus(): MonitoringStatus {
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.is_active);
    const connectedStocks = [...new Set(activeAlerts.map(alert => alert.symbol))];
    const triggeredToday = Array.from(this.alerts.values())
      .filter(alert => {
        if (!alert.last_triggered) return false;
        const today = new Date();
        const triggerDate = new Date(alert.last_triggered);
        return triggerDate.toDateString() === today.toDateString();
      }).length;

    return {
      isRunning: this.isRunning,
      connectedStocks,
      lastUpdate: new Date(),
      totalAlerts: this.alerts.size,
      activeAlerts: activeAlerts.length,
      triggeredToday
    };
  }

  // 获取所有预警
  getAllAlerts(): StockAlert[] {
    return Array.from(this.alerts.values());
  }
}

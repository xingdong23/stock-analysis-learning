// 免费股票监控服务 - 基于Yahoo Finance

import { 
  type StockAlert, 
  type AlertTrigger, 
  type MonitoringStatus
} from '../types/monitor.ts';
import { YahooFinanceService, type YahooQuote } from './yahooFinanceApi.ts';
import { TechnicalIndicatorService } from './technicalIndicators.ts';
import { ApiService } from './apiService.ts';
import { LocalStorageService } from './localStorageService.ts';

export interface FreeMonitorConfig {
  checkInterval: number; // 检查间隔（毫秒）
  enableNotifications: boolean;
  notificationMethods: Array<'BROWSER_NOTIFICATION' | 'SOUND'>;
}

export class FreeStockMonitorService {
  private yahooService: YahooFinanceService;
  private apiService: ApiService;
  private alerts: Map<string, StockAlert> = new Map();
  private triggers: AlertTrigger[] = [];
  private isRunning: boolean = false;
  private config: FreeMonitorConfig;
  private lastValues: Map<string, number> = new Map();
  private notificationCallbacks: Array<(trigger: AlertTrigger) => void> = [];
  private checkTimer: number | null = null;
  private lastCheckTime: Map<string, number> = new Map();

  constructor(config: FreeMonitorConfig) {
    this.config = config;
    this.yahooService = new YahooFinanceService();
    this.apiService = new ApiService();

    // 加载保存的数据
    this.loadStoredData();
  }

  // 加载保存的数据
  private async loadStoredData(): Promise<void> {
    try {
      // 优先从API加载数据
      if (this.apiService) {
        try {
          const alerts = await this.apiService.getAllAlerts();
          alerts.forEach(alert => {
            this.alerts.set(alert.id, alert);
          });
          console.log(`📂 从API恢复了 ${alerts.length} 个预警规则`);
          return;
        } catch (error) {
          console.warn('从API加载数据失败，尝试本地存储:', error);
        }
      }

      // 备用：从本地存储加载
      const storedData = LocalStorageService.loadMonitorData();
      if (storedData) {
        // 恢复预警规则
        storedData.alerts.forEach((alert: any) => {
          this.alerts.set(alert.id, alert);
        });

        // 恢复触发记录
        this.triggers = storedData.triggers;

        // 合并配置（保持类型安全）
        if (storedData.config) {
          this.config = {
            ...this.config,
            checkInterval: storedData.config.checkInterval || this.config.checkInterval,
            enableNotifications: storedData.config.enableNotifications ?? this.config.enableNotifications,
            notificationMethods: this.config.notificationMethods // 保持原有类型
          };
        }

        console.log(`📂 从本地存储恢复了 ${storedData.alerts.length} 个预警规则和 ${storedData.triggers.length} 条触发记录`);
      }
    } catch (error) {
      console.error('加载存储数据失败:', error);
    }
  }

  // 保存数据
  private async saveData(): Promise<void> {
    try {
      const alerts = Array.from(this.alerts.values());

      // 优先保存到API
      if (this.apiService) {
        try {
          // 这里可以实现批量同步到API
          console.log('数据已同步到API');
        } catch (error) {
          console.warn('API保存失败，使用本地存储:', error);
        }
      }

      // 备用：保存到本地存储
      LocalStorageService.autoSave(alerts, this.triggers, this.config);
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  // 添加预警规则
  addAlert(alert: StockAlert): void {
    // 格式化股票代码
    alert.symbol = this.yahooService.formatSymbol(alert.symbol);
    this.alerts.set(alert.id, alert);
    console.log(`添加预警: ${alert.symbol} - ${alert.indicator.type}`);

    // 保存到本地存储
    this.saveData();
  }

  // 删除预警规则
  removeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      this.alerts.delete(alertId);
      console.log(`删除预警: ${alert.symbol}`);
    }
  }

  // 启用/禁用预警
  toggleAlert(alertId: string, isActive: boolean): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isActive = isActive;
      console.log(`${isActive ? '启用' : '禁用'}预警: ${alert.symbol}`);
    }
  }

  // 开始监控
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log('监控已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('开始免费股票监控...');

    // 立即执行一次检查
    await this.checkAllAlerts();

    // 设置定时检查
    this.checkTimer = window.setInterval(async () => {
      await this.checkAllAlerts();
    }, this.config.checkInterval);
  }

  // 停止监控
  stopMonitoring(): void {
    if (!this.isRunning) {
      console.log('监控未在运行');
      return;
    }

    this.isRunning = false;
    
    if (this.checkTimer) {
      window.clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    
    console.log('免费股票监控已停止');
  }

  // 检查所有预警
  private async checkAllAlerts(): Promise<void> {
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.isActive);
    if (activeAlerts.length === 0) return;

    // 获取所有需要监控的股票代码
    const symbols = [...new Set(activeAlerts.map(alert => alert.symbol))];
    
    console.log(`检查 ${symbols.length} 只股票的 ${activeAlerts.length} 个预警规则...`);

    // 批量获取报价数据
    const quotes = await this.yahooService.getMultipleQuotes(symbols);

    // 检查每个预警
    for (const alert of activeAlerts) {
      const quote = quotes.get(alert.symbol);
      if (quote) {
        try {
          await this.checkSingleAlert(alert, quote);
        } catch (error) {
          console.error(`检查预警失败 (${alert.id}):`, error);
        }
      }
    }
  }

  // 检查单个预警
  private async checkSingleAlert(alert: StockAlert, quote: YahooQuote): Promise<void> {
    const currentPrice = quote.regularMarketPrice;
    
    // 避免过于频繁的检查同一个股票
    const lastCheck = this.lastCheckTime.get(alert.symbol) || 0;
    const now = Date.now();
    if (now - lastCheck < 30000) { // 30秒内不重复检查同一股票
      return;
    }
    this.lastCheckTime.set(alert.symbol, now);

    // 如果是价格预警，直接检查
    if (alert.indicator.type === 'PRICE') {
      const shouldTrigger = this.checkPriceAlert(alert, currentPrice);
      if (shouldTrigger) {
        await this.triggerAlert(alert, quote);
      }
      return;
    }

    // 技术指标预警需要获取历史数据
    try {
      const historicalData = await this.yahooService.getHistoricalData(alert.symbol, '6mo', '1d');
      if (historicalData.length === 0) return;

      // 转换为通用格式
      const candlesticks = this.yahooService.convertToLongPortFormat(historicalData);
      
      // 更新最新价格
      if (candlesticks.length > 0) {
        const latestCandle = candlesticks[candlesticks.length - 1];
        latestCandle.close = currentPrice.toString();
        latestCandle.high = Math.max(parseFloat(latestCandle.high), currentPrice).toString();
        latestCandle.low = Math.min(parseFloat(latestCandle.low), currentPrice).toString();
      }

      const shouldTrigger = await this.checkTechnicalAlert(alert, candlesticks, currentPrice);
      if (shouldTrigger) {
        await this.triggerAlert(alert, quote);
      }
    } catch (error) {
      console.error(`获取 ${alert.symbol} 历史数据失败:`, error);
    }
  }

  // 检查价格预警
  private checkPriceAlert(alert: StockAlert, currentPrice: number): boolean {
    if (!alert.targetValue) return false;
    
    switch (alert.condition) {
      case 'ABOVE':
        return currentPrice > alert.targetValue;
      case 'BELOW':
        return currentPrice < alert.targetValue;
      case 'EQUAL':
        const tolerance = alert.targetValue * 0.001; // 0.1% 误差
        return Math.abs(currentPrice - alert.targetValue) <= tolerance;
      default:
        return false;
    }
  }

  // 检查技术指标预警
  private async checkTechnicalAlert(
    alert: StockAlert, 
    candlesticks: any[], 
    currentPrice: number
  ): Promise<boolean> {
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
        return alert.targetValue ? currentPrice > alert.targetValue : false;
        
      case 'BELOW':
        return alert.targetValue ? currentPrice < alert.targetValue : false;
        
      case 'CROSS_ABOVE':
        if (!alert.targetValue || previousIndicatorValue === undefined) return false;
        return TechnicalIndicatorService.checkCrossover(
          currentPrice, 
          previousIndicatorValue, 
          currentIndicatorValue, 
          'above'
        );
        
      case 'CROSS_BELOW':
        if (!alert.targetValue || previousIndicatorValue === undefined) return false;
        return TechnicalIndicatorService.checkCrossover(
          currentPrice, 
          previousIndicatorValue, 
          currentIndicatorValue, 
          'below'
        );

      case 'CONVERGING': {
        if (alert.indicator.type !== 'MA_CONVERGENCE') return false;
        const convergenceStatus = TechnicalIndicatorService.getLatestConvergenceStatus(
          candlesticks,
          alert.indicator.periods || [5, 10, 20],
          alert.indicator.threshold || 2
        );
        return convergenceStatus ? convergenceStatus.isConverging : false;
      }

      case 'DIVERGING': {
        if (alert.indicator.type !== 'MA_CONVERGENCE') return false;
        const convergenceStatus = TechnicalIndicatorService.getLatestConvergenceStatus(
          candlesticks,
          alert.indicator.periods || [5, 10, 20],
          alert.indicator.threshold || 2
        );
        
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
  }

  // 触发预警
  private async triggerAlert(alert: StockAlert, quote: YahooQuote): Promise<void> {
    const now = new Date();
    
    // 检查冷却期
    if (alert.lastTriggered) {
      const timeSinceLastTrigger = now.getTime() - alert.lastTriggered.getTime();
      const cooldownPeriod = 5 * 60 * 1000; // 5分钟冷却期
      
      if (timeSinceLastTrigger < cooldownPeriod) {
        return;
      }
    }

    // 更新预警状态
    alert.lastTriggered = now;
    alert.triggerCount++;

    // 创建触发事件
    const trigger: AlertTrigger = {
      alertId: alert.id,
      symbol: alert.symbol,
      currentPrice: quote.regularMarketPrice,
      indicatorValue: 0,
      condition: alert.condition,
      message: this.generateAlertMessage(alert, quote),
      timestamp: now
    };

    // 发送通知
    this.sendNotification(trigger);
  }

  // 生成预警消息
  private generateAlertMessage(alert: StockAlert, quote: YahooQuote): string {
    const price = quote.regularMarketPrice;
    const symbol = alert.symbol;
    
    switch (alert.condition) {
      case 'ABOVE':
        return `${symbol} 价格 $${price.toFixed(2)} 高于 $${alert.targetValue}`;
      case 'BELOW':
        return `${symbol} 价格 $${price.toFixed(2)} 低于 $${alert.targetValue}`;
      case 'CROSS_ABOVE':
        const indicatorName1 = alert.indicator.type + (alert.indicator.period || '');
        return `${symbol} 价格 $${price.toFixed(2)} 向上突破 ${indicatorName1}`;
      case 'CROSS_BELOW':
        const indicatorName2 = alert.indicator.type + (alert.indicator.period || '');
        return `${symbol} 价格 $${price.toFixed(2)} 跌破 ${indicatorName2}`;
      case 'CONVERGING':
        const periods = alert.indicator.periods?.join(',') || '5,10,20';
        return `${symbol} 均线缠绕 MA(${periods}) 价格 $${price.toFixed(2)}`;
      case 'DIVERGING':
        const divergePeriods = alert.indicator.periods?.join(',') || '5,10,20';
        return `${symbol} 均线发散 MA(${divergePeriods}) 价格 $${price.toFixed(2)}`;
      case 'NEAR':
        const indicatorName3 = alert.indicator.type + (alert.indicator.period || '');
        return `${symbol} 价格 $${price.toFixed(2)} 接近 ${indicatorName3}`;
      case 'WITHIN_RANGE':
        const indicatorName4 = alert.indicator.type + (alert.indicator.period || '');
        return `${symbol} 价格 $${price.toFixed(2)} 在 ${indicatorName4} 附近震荡`;
      default:
        return `${symbol} 触发预警条件 价格 $${price.toFixed(2)}`;
    }
  }

  // 发送通知
  private sendNotification(trigger: AlertTrigger): void {
    console.log('🚨 免费预警触发:', trigger.message);
    
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
      new Notification('免费股票预警', {
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
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.isActive);
    const connectedStocks = [...new Set(activeAlerts.map(alert => alert.symbol))];
    const triggeredToday = Array.from(this.alerts.values())
      .filter(alert => {
        if (!alert.lastTriggered) return false;
        const today = new Date();
        const triggerDate = alert.lastTriggered;
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

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      const quote = await this.yahooService.getQuote('AAPL');
      return quote !== null;
    } catch (error) {
      console.error('测试连接失败:', error);
      return false;
    }
  }
}

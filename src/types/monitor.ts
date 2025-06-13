// 股票监控相关类型定义

export interface StockAlert {
  id: string;
  symbol: string; // 股票代码，如 "IONQ.US"
  name: string; // 股票名称
  indicator: TechnicalIndicator; // 技术指标类型
  condition: AlertCondition; // 触发条件
  targetValue?: number; // 目标值（如果是固定值比较）
  isActive: boolean; // 是否启用
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number; // 触发次数
}

export interface TechnicalIndicator {
  type: IndicatorType;
  period?: number; // 周期，如MA20的20
  parameters?: Record<string, number>; // 其他参数
}

export type IndicatorType = 
  | 'MA' // 移动平均线
  | 'EMA' // 指数移动平均线
  | 'RSI' // 相对强弱指数
  | 'MACD' // MACD指标
  | 'BOLL' // 布林带
  | 'KDJ' // KDJ指标
  | 'PRICE' // 价格本身
  | 'VOLUME'; // 成交量

export type AlertCondition = 
  | 'ABOVE' // 高于
  | 'BELOW' // 低于
  | 'CROSS_ABOVE' // 向上突破
  | 'CROSS_BELOW' // 向下突破
  | 'EQUAL' // 等于（在误差范围内）
  | 'PERCENT_CHANGE'; // 百分比变化

export interface AlertTrigger {
  alertId: string;
  symbol: string;
  currentPrice: number;
  indicatorValue: number;
  condition: AlertCondition;
  message: string;
  timestamp: Date;
}

export interface StockMonitorConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  environment: 'sandbox' | 'production';
  checkInterval: number; // 检查间隔（毫秒）
  enableNotifications: boolean;
  notificationMethods: NotificationMethod[];
}

export type NotificationMethod = 
  | 'EMAIL'
  | 'SMS' 
  | 'WEBHOOK'
  | 'BROWSER_NOTIFICATION'
  | 'SOUND';

export interface MonitoringStatus {
  isRunning: boolean;
  connectedStocks: string[];
  lastUpdate: Date;
  totalAlerts: number;
  activeAlerts: number;
  triggeredToday: number;
}

// 长桥API相关类型
export interface LongPortQuote {
  symbol: string;
  last_done: string; // 最新价
  open: string; // 开盘价
  high: string; // 最高价
  low: string; // 最低价
  volume: number; // 成交量
  turnover: string; // 成交额
  timestamp: number;
}

export interface LongPortCandlestick {
  close: string;
  open: string;
  low: string;
  high: string;
  volume: number;
  turnover: string;
  timestamp: number;
}

// 技术指标计算结果
export interface IndicatorResult {
  value: number;
  timestamp: number;
  period?: number;
}

export interface MAResult extends IndicatorResult {
  type: 'MA';
  period: number;
}

export interface RSIResult extends IndicatorResult {
  type: 'RSI';
  period: number;
}

export interface MACDResult extends IndicatorResult {
  type: 'MACD';
  dif: number;
  dea: number;
  histogram: number;
}

// 预警规则示例
export interface AlertRule {
  name: string;
  description: string;
  indicator: TechnicalIndicator;
  condition: AlertCondition;
  example: string;
}

export const ALERT_RULES: AlertRule[] = [
  {
    name: 'MA20突破',
    description: '股价突破20日移动平均线',
    indicator: { type: 'MA', period: 20 },
    condition: 'CROSS_ABOVE',
    example: '当IONQ股价向上突破MA20时提醒'
  },
  {
    name: 'MA20支撑',
    description: '股价跌破20日移动平均线',
    indicator: { type: 'MA', period: 20 },
    condition: 'CROSS_BELOW',
    example: '当IONQ股价跌破MA20时提醒'
  },
  {
    name: '价格预警',
    description: '股价达到指定价位',
    indicator: { type: 'PRICE' },
    condition: 'BELOW',
    example: '当IONQ股价低于$10时提醒'
  },
  {
    name: 'RSI超买',
    description: 'RSI指标超买信号',
    indicator: { type: 'RSI', period: 14 },
    condition: 'ABOVE',
    example: '当RSI > 70时提醒超买'
  },
  {
    name: 'RSI超卖',
    description: 'RSI指标超卖信号',
    indicator: { type: 'RSI', period: 14 },
    condition: 'BELOW',
    example: '当RSI < 30时提醒超卖'
  }
];

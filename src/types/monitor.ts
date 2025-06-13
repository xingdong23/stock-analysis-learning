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
  periods?: number[]; // 多个周期，用于均线缠绕等
  threshold?: number; // 阈值，用于缠绕判断或距离判断
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
  | 'VOLUME' // 成交量
  | 'MA_CONVERGENCE' // 均线缠绕
  | 'MA_PROXIMITY'; // 均线附近

export type AlertCondition =
  | 'ABOVE' // 高于
  | 'BELOW' // 低于
  | 'CROSS_ABOVE' // 向上突破
  | 'CROSS_BELOW' // 向下突破
  | 'EQUAL' // 等于（在误差范围内）
  | 'PERCENT_CHANGE' // 百分比变化
  | 'CONVERGING' // 正在缠绕
  | 'DIVERGING' // 正在发散
  | 'NEAR' // 接近
  | 'WITHIN_RANGE'; // 在范围内

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
  },
  {
    name: '均线缠绕',
    description: '多条均线相互缠绕，市场震荡整理',
    indicator: { type: 'MA_CONVERGENCE', periods: [5, 10, 20], threshold: 2 },
    condition: 'CONVERGING',
    example: '当MA5、MA10、MA20缠绕时提醒'
  },
  {
    name: '均线发散',
    description: '多条均线开始发散，趋势明确',
    indicator: { type: 'MA_CONVERGENCE', periods: [5, 10, 20], threshold: 2 },
    condition: 'DIVERGING',
    example: '当均线从缠绕状态发散时提醒'
  },
  {
    name: '接近均线',
    description: '股价接近重要均线支撑阻力位',
    indicator: { type: 'MA_PROXIMITY', period: 20, threshold: 2 },
    condition: 'NEAR',
    example: '当股价接近MA20时提醒'
  },
  {
    name: '均线附近震荡',
    description: '股价在均线附近小幅震荡',
    indicator: { type: 'MA_PROXIMITY', period: 20, threshold: 1 },
    condition: 'WITHIN_RANGE',
    example: '当股价在MA20±1%范围内震荡时提醒'
  }
];

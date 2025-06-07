// 图表相关类型定义

// K线数据点
export interface CandlestickData {
  date: string;      // 日期
  open: number;      // 开盘价
  high: number;      // 最高价
  low: number;       // 最低价
  close: number;     // 收盘价
  volume: number;    // 成交量
}

// 技术指标数据点
export interface IndicatorData {
  date: string;
  value: number | number[] | null;
  [key: string]: any;
}

// MACD数据
export interface MACDData {
  date: string;
  dif: number;       // DIF线
  dea: number;       // DEA线
  macd: number;      // MACD柱状图
}

// RSI数据
export interface RSIData {
  date: string;
  rsi: number;       // RSI值
}

// 布林带数据
export interface BollingerBandsData {
  date: string;
  upper: number;     // 上轨
  middle: number;    // 中轨
  lower: number;     // 下轨
}

// KDJ数据
export interface KDJData {
  date: string;
  k: number;         // K值
  d: number;         // D值
  j: number;         // J值
}

// 图表配置
export interface ChartConfig {
  type: 'candlestick' | 'line' | 'bar' | 'area';
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number;
  showDataZoom?: boolean;
  showToolbox?: boolean;
  showLegend?: boolean;
  theme?: 'light' | 'dark';
}

// 图表系列数据
export interface ChartSeries {
  name: string;
  type: string;
  data: any[];
  color?: string;
  lineWidth?: number;
  smooth?: boolean;
  symbol?: string;
  symbolSize?: number;
}

// 图表选项
export interface ChartOptions {
  title?: {
    text: string;
    subtext?: string;
  };
  tooltip?: any;
  legend?: any;
  grid?: any;
  xAxis?: any;
  yAxis?: any;
  series: ChartSeries[];
  dataZoom?: any[];
  toolbox?: any;
}

// 时间周期
export enum TimeFrame {
  MINUTE_1 = '1m',
  MINUTE_5 = '5m',
  MINUTE_15 = '15m',
  MINUTE_30 = '30m',
  HOUR_1 = '1h',
  HOUR_4 = '4h',
  DAY_1 = '1d',
  WEEK_1 = '1w',
  MONTH_1 = '1M'
}

// 图表主题
export interface ChartTheme {
  backgroundColor: string;
  textColor: string;
  axisLineColor: string;
  gridLineColor: string;
  candlestick: {
    upColor: string;
    downColor: string;
    borderUpColor: string;
    borderDownColor: string;
  };
  indicators: {
    [key: string]: string[];
  };
}

// 图表事件
export interface ChartEvent {
  type: 'click' | 'mouseover' | 'mouseout' | 'dataZoom';
  data: any;
  timestamp: number;
}

// 技术指标计算服务

import { type LongPortCandlestick, type IndicatorResult, type MAResult, type RSIResult, type MACDResult } from '../types/monitor.ts';

export class TechnicalIndicatorService {
  
  // 计算移动平均线 (MA)
  static calculateMA(candlesticks: LongPortCandlestick[], period: number): MAResult[] {
    const results: MAResult[] = [];
    
    if (candlesticks.length < period) {
      return results;
    }

    for (let i = period - 1; i < candlesticks.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += parseFloat(candlesticks[j].close);
      }
      
      const ma = sum / period;
      results.push({
        type: 'MA',
        value: ma,
        period,
        timestamp: candlesticks[i].timestamp
      });
    }

    return results;
  }

  // 计算指数移动平均线 (EMA)
  static calculateEMA(candlesticks: LongPortCandlestick[], period: number): IndicatorResult[] {
    const results: IndicatorResult[] = [];
    
    if (candlesticks.length < period) {
      return results;
    }

    const multiplier = 2 / (period + 1);
    let ema = parseFloat(candlesticks[0].close);

    // 第一个值使用简单平均
    for (let i = 1; i < period; i++) {
      ema = (ema * i + parseFloat(candlesticks[i].close)) / (i + 1);
    }

    results.push({
      value: ema,
      timestamp: candlesticks[period - 1].timestamp
    });

    // 后续使用EMA公式
    for (let i = period; i < candlesticks.length; i++) {
      const close = parseFloat(candlesticks[i].close);
      ema = (close - ema) * multiplier + ema;
      
      results.push({
        value: ema,
        timestamp: candlesticks[i].timestamp
      });
    }

    return results;
  }

  // 计算相对强弱指数 (RSI)
  static calculateRSI(candlesticks: LongPortCandlestick[], period: number = 14): RSIResult[] {
    const results: RSIResult[] = [];
    
    if (candlesticks.length < period + 1) {
      return results;
    }

    const gains: number[] = [];
    const losses: number[] = [];

    // 计算价格变化
    for (let i = 1; i < candlesticks.length; i++) {
      const change = parseFloat(candlesticks[i].close) - parseFloat(candlesticks[i - 1].close);
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // 计算初始平均增益和损失
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

    // 计算第一个RSI值
    let rs = avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    
    results.push({
      type: 'RSI',
      value: rsi,
      period,
      timestamp: candlesticks[period].timestamp
    });

    // 计算后续RSI值
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      
      results.push({
        type: 'RSI',
        value: rsi,
        period,
        timestamp: candlesticks[i + 1].timestamp
      });
    }

    return results;
  }

  // 计算MACD指标
  static calculateMACD(
    candlesticks: LongPortCandlestick[], 
    fastPeriod: number = 12, 
    slowPeriod: number = 26, 
    signalPeriod: number = 9
  ): MACDResult[] {
    const results: MACDResult[] = [];
    
    if (candlesticks.length < slowPeriod + signalPeriod) {
      return results;
    }

    // 计算快线和慢线EMA
    const fastEMA = this.calculateEMA(candlesticks, fastPeriod);
    const slowEMA = this.calculateEMA(candlesticks, slowPeriod);

    // 计算DIF线 (快线 - 慢线)
    const difValues: number[] = [];
    const startIndex = slowPeriod - fastPeriod;
    
    for (let i = 0; i < slowEMA.length; i++) {
      const dif = fastEMA[i + startIndex].value - slowEMA[i].value;
      difValues.push(dif);
    }

    // 计算DEA线 (DIF的EMA)
    const deaValues: number[] = [];
    let dea = difValues[0];
    deaValues.push(dea);

    const signalMultiplier = 2 / (signalPeriod + 1);
    for (let i = 1; i < difValues.length; i++) {
      dea = (difValues[i] - dea) * signalMultiplier + dea;
      deaValues.push(dea);
    }

    // 生成MACD结果
    for (let i = 0; i < difValues.length; i++) {
      const histogram = difValues[i] - deaValues[i];
      
      results.push({
        type: 'MACD',
        value: histogram, // MACD柱状图值
        dif: difValues[i],
        dea: deaValues[i],
        histogram,
        timestamp: slowEMA[i].timestamp
      });
    }

    return results;
  }

  // 计算布林带
  static calculateBollingerBands(
    candlesticks: LongPortCandlestick[], 
    period: number = 20, 
    stdDev: number = 2
  ): Array<{
    timestamp: number;
    middle: number; // 中轨 (MA)
    upper: number;  // 上轨
    lower: number;  // 下轨
  }> {
    const results: Array<{
      timestamp: number;
      middle: number;
      upper: number;
      lower: number;
    }> = [];

    if (candlesticks.length < period) {
      return results;
    }

    for (let i = period - 1; i < candlesticks.length; i++) {
      // 计算移动平均
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += parseFloat(candlesticks[j].close);
      }
      const ma = sum / period;

      // 计算标准差
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = parseFloat(candlesticks[j].close) - ma;
        variance += diff * diff;
      }
      const standardDeviation = Math.sqrt(variance / period);

      results.push({
        timestamp: candlesticks[i].timestamp,
        middle: ma,
        upper: ma + (stdDev * standardDeviation),
        lower: ma - (stdDev * standardDeviation)
      });
    }

    return results;
  }

  // 获取最新指标值
  static getLatestIndicatorValue(
    candlesticks: LongPortCandlestick[],
    indicatorType: string,
    period?: number,
    periods?: number[],
    threshold?: number
  ): number | null {
    if (candlesticks.length === 0) return null;

    switch (indicatorType.toLowerCase()) {
      case 'ma': {
        if (!period) return null;
        const maResults = this.calculateMA(candlesticks, period);
        return maResults.length > 0 ? maResults[maResults.length - 1].value : null;
      }

      case 'ema': {
        if (!period) return null;
        const emaResults = this.calculateEMA(candlesticks, period);
        return emaResults.length > 0 ? emaResults[emaResults.length - 1].value : null;
      }

      case 'rsi': {
        const rsiResults = this.calculateRSI(candlesticks, period || 14);
        return rsiResults.length > 0 ? rsiResults[rsiResults.length - 1].value : null;
      }

      case 'price': {
        return parseFloat(candlesticks[candlesticks.length - 1].close);
      }

      case 'volume': {
        return candlesticks[candlesticks.length - 1].volume;
      }

      case 'ma_convergence': {
        const convergenceStatus = this.getLatestConvergenceStatus(
          candlesticks,
          periods || [5, 10, 20],
          threshold || 2
        );
        return convergenceStatus ? convergenceStatus.convergenceRatio : null;
      }

      case 'ma_proximity': {
        if (!period) return null;
        const currentPrice = parseFloat(candlesticks[candlesticks.length - 1].close);
        const maValue = this.getLatestIndicatorValue(candlesticks, 'ma', period);
        if (maValue === null) return null;

        const proximity = this.checkMAProximity(currentPrice, maValue, threshold || 2);
        return proximity.distance;
      }

      default:
        return null;
    }
  }

  // 检查指标交叉
  static checkCrossover(
    currentValue: number,
    previousValue: number,
    targetValue: number,
    direction: 'above' | 'below'
  ): boolean {
    if (direction === 'above') {
      return previousValue <= targetValue && currentValue > targetValue;
    } else {
      return previousValue >= targetValue && currentValue < targetValue;
    }
  }

  // 计算均线缠绕状态
  static calculateMAConvergence(
    candlesticks: LongPortCandlestick[],
    periods: number[] = [5, 10, 20],
    threshold: number = 2
  ): Array<{
    timestamp: number;
    isConverging: boolean;
    convergenceRatio: number; // 缠绕程度 (0-100%)
    maValues: number[]; // 各均线值
  }> {
    const results: Array<{
      timestamp: number;
      isConverging: boolean;
      convergenceRatio: number;
      maValues: number[];
    }> = [];

    if (candlesticks.length < Math.max(...periods)) {
      return results;
    }

    // 计算所有周期的均线
    const maResults = periods.map(period => this.calculateMA(candlesticks, period));

    // 找到最短的均线数据长度
    const minLength = Math.min(...maResults.map(ma => ma.length));

    for (let i = 0; i < minLength; i++) {
      const maValues = maResults.map(ma => ma[i].value);
      const maxMA = Math.max(...maValues);
      const minMA = Math.min(...maValues);

      // 计算缠绕程度：(最大值-最小值)/平均值 * 100%
      const avgMA = maValues.reduce((sum, val) => sum + val, 0) / maValues.length;
      const convergenceRatio = ((maxMA - minMA) / avgMA) * 100;

      // 判断是否缠绕：差距小于阈值
      const isConverging = convergenceRatio <= threshold;

      results.push({
        timestamp: maResults[0][i].timestamp,
        isConverging,
        convergenceRatio,
        maValues
      });
    }

    return results;
  }

  // 检查股价与均线的距离
  static checkMAProximity(
    currentPrice: number,
    maValue: number,
    threshold: number = 2
  ): {
    distance: number; // 距离百分比
    isNear: boolean; // 是否接近
    isWithinRange: boolean; // 是否在范围内
    direction: 'above' | 'below' | 'on'; // 相对位置
  } {
    const distance = Math.abs((currentPrice - maValue) / maValue) * 100;
    const isNear = distance <= threshold;
    const isWithinRange = distance <= threshold / 2; // 更严格的范围

    let direction: 'above' | 'below' | 'on' = 'on';
    if (currentPrice > maValue) {
      direction = 'above';
    } else if (currentPrice < maValue) {
      direction = 'below';
    }

    return {
      distance,
      isNear,
      isWithinRange,
      direction
    };
  }

  // 检测均线缠绕状态变化
  static detectConvergenceChange(
    currentConvergence: boolean,
    previousConvergence: boolean
  ): 'converging' | 'diverging' | 'stable' {
    if (!previousConvergence && currentConvergence) {
      return 'converging'; // 开始缠绕
    } else if (previousConvergence && !currentConvergence) {
      return 'diverging'; // 开始发散
    } else {
      return 'stable'; // 状态未变
    }
  }

  // 获取最新的均线缠绕状态
  static getLatestConvergenceStatus(
    candlesticks: LongPortCandlestick[],
    periods: number[] = [5, 10, 20],
    threshold: number = 2
  ): {
    isConverging: boolean;
    convergenceRatio: number;
    maValues: number[];
  } | null {
    const convergenceData = this.calculateMAConvergence(candlesticks, periods, threshold);
    if (convergenceData.length === 0) return null;

    const latest = convergenceData[convergenceData.length - 1];
    return {
      isConverging: latest.isConverging,
      convergenceRatio: latest.convergenceRatio,
      maValues: latest.maValues
    };
  }
}

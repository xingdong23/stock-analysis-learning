// 技术指标计算工具函数

// 简单移动平均线计算
export const calculateSMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      result.push(sum / period);
    }
  }
  
  return result;
};

// 指数移动平均线计算
export const calculateEMA = (data: number[], period: number): number[] => {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i]);
    } else {
      const ema = (data[i] * multiplier) + (result[i - 1] * (1 - multiplier));
      result.push(ema);
    }
  }
  
  return result;
};

// RSI计算
export const calculateRSI = (data: number[], period: number = 14): number[] => {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // 计算价格变化
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // 计算RSI
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0) / period;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
  }
  
  return [NaN, ...result]; // 添加第一个NaN以匹配原始数据长度
};

// MACD计算
export const calculateMACD = (
  data: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
) => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // 计算DIF线（MACD线）
  const macdLine = fastEMA.map((fast, i) => 
    isNaN(fast) || isNaN(slowEMA[i]) ? NaN : fast - slowEMA[i]
  );
  
  // 计算DEA线（信号线）
  const validMacdValues = macdLine.filter(val => !isNaN(val));
  const signalEMA = calculateEMA(validMacdValues, signalPeriod);
  
  // 将信号线对齐到原始数据长度
  const signalLine = new Array(macdLine.length).fill(NaN);
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (!isNaN(macdLine[i])) {
      signalLine[i] = signalEMA[signalIndex] || NaN;
      signalIndex++;
    }
  }
  
  // 计算MACD柱状图
  const histogram = macdLine.map((macd, i) => 
    isNaN(macd) || isNaN(signalLine[i]) ? NaN : (macd - signalLine[i]) * 2
  );
  
  return {
    macdLine,
    signalLine,
    histogram
  };
};

// 布林带计算
export const calculateBollingerBands = (
  data: number[], 
  period: number = 20, 
  stdDev: number = 2
) => {
  const sma = calculateSMA(data, period);
  const upperBand: number[] = [];
  const lowerBand: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upperBand.push(NaN);
      lowerBand.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upperBand.push(mean + (standardDeviation * stdDev));
      lowerBand.push(mean - (standardDeviation * stdDev));
    }
  }
  
  return {
    upperBand,
    middleBand: sma,
    lowerBand
  };
};

// KDJ计算
export const calculateKDJ = (
  high: number[], 
  low: number[], 
  close: number[], 
  period: number = 9
) => {
  const rsv: number[] = [];
  const k: number[] = [];
  const d: number[] = [];
  const j: number[] = [];
  
  // 计算RSV
  for (let i = 0; i < close.length; i++) {
    if (i < period - 1) {
      rsv.push(NaN);
    } else {
      const highestHigh = Math.max(...high.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...low.slice(i - period + 1, i + 1));
      
      if (highestHigh === lowestLow) {
        rsv.push(50);
      } else {
        const rsvValue = ((close[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
        rsv.push(rsvValue);
      }
    }
  }
  
  // 计算K、D、J值
  for (let i = 0; i < rsv.length; i++) {
    if (i === 0 || isNaN(rsv[i])) {
      k.push(isNaN(rsv[i]) ? NaN : 50);
      d.push(isNaN(rsv[i]) ? NaN : 50);
    } else {
      const kValue = (2/3) * (k[i-1] || 50) + (1/3) * rsv[i];
      const dValue = (2/3) * (d[i-1] || 50) + (1/3) * kValue;
      
      k.push(kValue);
      d.push(dValue);
    }
    
    // 计算J值
    if (isNaN(k[i]) || isNaN(d[i])) {
      j.push(NaN);
    } else {
      j.push(3 * k[i] - 2 * d[i]);
    }
  }
  
  return { k, d, j };
};

// 威廉指标计算
export const calculateWilliamsR = (
  high: number[], 
  low: number[], 
  close: number[], 
  period: number = 14
): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < close.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const highestHigh = Math.max(...high.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...low.slice(i - period + 1, i + 1));
      
      if (highestHigh === lowestLow) {
        result.push(-50);
      } else {
        const williamsR = ((highestHigh - close[i]) / (highestHigh - lowestLow)) * (-100);
        result.push(williamsR);
      }
    }
  }
  
  return result;
};

// OBV计算
export const calculateOBV = (close: number[], volume: number[]): number[] => {
  const result: number[] = [0]; // 第一天OBV为0
  
  for (let i = 1; i < close.length; i++) {
    let direction = 0;
    if (close[i] > close[i - 1]) {
      direction = 1;
    } else if (close[i] < close[i - 1]) {
      direction = -1;
    }
    
    const obv = result[i - 1] + (volume[i] * direction);
    result.push(obv);
  }
  
  return result;
};

// ATR计算
export const calculateATR = (
  high: number[], 
  low: number[], 
  close: number[], 
  period: number = 14
): number[] => {
  const trueRange: number[] = [];
  
  // 计算真实波幅
  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      trueRange.push(high[i] - low[i]);
    } else {
      const tr1 = high[i] - low[i];
      const tr2 = Math.abs(high[i] - close[i - 1]);
      const tr3 = Math.abs(low[i] - close[i - 1]);
      trueRange.push(Math.max(tr1, tr2, tr3));
    }
  }
  
  // 计算ATR（真实波幅的移动平均）
  return calculateSMA(trueRange, period);
};

// 生成模拟股票数据
export const generateMockStockData = (days: number = 100, startPrice: number = 100) => {
  const data = [];
  let price = startPrice;
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 0.04; // ±2%的随机变化
    const open = price;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 1000000 + 500000);
    
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    price = close;
  }
  
  return data;
};

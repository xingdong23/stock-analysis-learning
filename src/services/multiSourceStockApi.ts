// 多数据源股票数据API服务

export interface StockQuote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MultiSourceStockService {
  private sources: Array<() => Promise<any>> = [];
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    // 初始化数据源（按优先级排序）
    this.sources = [
      () => this.getFromBackendService(),
      () => this.getFromYahooFinance(),
      () => this.getFromAlphaVantage(),
      () => this.getFromCache()
    ];
  }

  // 获取股票报价
  async getQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = `quote_${symbol}`;
    
    // 检查缓存
    const cached = this.getFromCacheSync(cacheKey);
    if (cached) {
      return cached;
    }

    // 尝试各个数据源
    for (let i = 0; i < this.sources.length - 1; i++) {
      try {
        console.log(`尝试数据源 ${i + 1} 获取报价: ${symbol}`);
        const quote = await this.getQuoteFromSource(symbol, i);
        
        if (quote) {
          this.saveToCache(cacheKey, quote);
          return quote;
        }
      } catch (error) {
        console.warn(`数据源 ${i + 1} 失败:`, error);
        continue;
      }
    }

    // 所有数据源失败，返回旧缓存
    return this.getFromCacheSync(cacheKey, true);
  }

  // 获取历史数据
  async getHistoricalData(
    symbol: string, 
    period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '1mo'
  ): Promise<HistoricalData[]> {
    const cacheKey = `history_${symbol}_${period}`;
    
    // 检查缓存
    const cached = this.getFromCacheSync(cacheKey);
    if (cached) {
      return cached;
    }

    // 尝试各个数据源
    for (let i = 0; i < this.sources.length - 1; i++) {
      try {
        console.log(`尝试数据源 ${i + 1} 获取历史数据: ${symbol}`);
        const data = await this.getHistoricalFromSource(symbol, period, i);
        
        if (data && data.length > 0) {
          this.saveToCache(cacheKey, data);
          return data;
        }
      } catch (error) {
        console.warn(`数据源 ${i + 1} 失败:`, error);
        continue;
      }
    }

    // 所有数据源失败，返回旧缓存
    return this.getFromCacheSync(cacheKey, true) || [];
  }

  // 从后端服务获取数据
  private async getFromBackendService(): Promise<any> {
    const baseUrl = import.meta.env.VITE_MONITOR_API_BASE_URL || 'http://localhost:5000/api';
    return { baseUrl, source: 'backend' };
  }

  // 从Yahoo Finance获取数据
  private async getFromYahooFinance(): Promise<any> {
    return { source: 'yahoo' };
  }

  // 从Alpha Vantage获取数据
  private async getFromAlphaVantage(): Promise<any> {
    return { source: 'alphavantage' };
  }

  // 从缓存获取数据
  private async getFromCache(): Promise<any> {
    return { source: 'cache' };
  }

  // 从指定数据源获取报价
  private async getQuoteFromSource(symbol: string, sourceIndex: number): Promise<StockQuote | null> {
    switch (sourceIndex) {
      case 0: // 后端服务
        return this.getQuoteFromBackend(symbol);
      case 1: // Yahoo Finance
        return this.getQuoteFromYahoo(symbol);
      case 2: // Alpha Vantage
        return this.getQuoteFromAlphaVantage(symbol);
      default:
        return null;
    }
  }

  // 从指定数据源获取历史数据
  private async getHistoricalFromSource(
    symbol: string, 
    period: string, 
    sourceIndex: number
  ): Promise<HistoricalData[] | null> {
    switch (sourceIndex) {
      case 0: // 后端服务
        return this.getHistoricalFromBackend(symbol, period);
      case 1: // Yahoo Finance
        return this.getHistoricalFromYahoo(symbol, period);
      case 2: // Alpha Vantage
        return this.getHistoricalFromAlphaVantage(symbol, period);
      default:
        return null;
    }
  }

  // 从后端获取报价
  private async getQuoteFromBackend(symbol: string): Promise<StockQuote | null> {
    try {
      const baseUrl = import.meta.env.VITE_MONITOR_API_BASE_URL || 'http://101.42.14.209/monitor/api';
      const response = await fetch(`${baseUrl}/indicators/${symbol}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        symbol: data.symbol,
        price: data.price.current,
        open: data.price.open,
        high: data.price.high,
        low: data.price.low,
        volume: data.price.volume,
        timestamp: new Date(data.timestamp).getTime()
      };
    } catch (error) {
      console.error('后端获取报价失败:', error);
      return null;
    }
  }

  // 从后端获取历史数据
  private async getHistoricalFromBackend(symbol: string, period: string): Promise<HistoricalData[] | null> {
    try {
      const baseUrl = import.meta.env.VITE_MONITOR_API_BASE_URL || 'http://101.42.14.209/monitor/api';
      const response = await fetch(`${baseUrl}/stock/${symbol}?period=${period}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.data.map((item: any) => ({
        date: item.Date || new Date(item.timestamp * 1000).toISOString().split('T')[0],
        open: item.Open || item.open,
        high: item.High || item.high,
        low: item.Low || item.low,
        close: item.Close || item.close,
        volume: item.Volume || item.volume
      }));
    } catch (error) {
      console.error('后端获取历史数据失败:', error);
      return null;
    }
  }

  // 从Yahoo Finance获取报价
  private async getQuoteFromYahoo(symbol: string): Promise<StockQuote | null> {
    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const url = `${corsProxy}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) {
        throw new Error('No data found');
      }

      const meta = result.meta;
      return {
        symbol: meta.symbol,
        price: meta.regularMarketPrice,
        open: meta.regularMarketOpen || meta.previousClose,
        high: meta.regularMarketDayHigh || meta.regularMarketPrice,
        low: meta.regularMarketDayLow || meta.regularMarketPrice,
        volume: meta.regularMarketVolume || 0,
        timestamp: meta.regularMarketTime * 1000
      };
    } catch (error) {
      console.error('Yahoo Finance获取报价失败:', error);
      return null;
    }
  }

  // 从Yahoo Finance获取历史数据
  private async getHistoricalFromYahoo(symbol: string, period: string): Promise<HistoricalData[] | null> {
    try {
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const url = `${corsProxy}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${period}&interval=1d`)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) {
        throw new Error('No historical data found');
      }

      const timestamps = result.timestamp;
      const quotes = result.indicators?.quote?.[0];

      if (!timestamps || !quotes) {
        throw new Error('Invalid data format');
      }

      const historicalData: HistoricalData[] = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        if (quotes.close[i] !== null) {
          historicalData.push({
            date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
            open: quotes.open[i] || quotes.close[i],
            high: quotes.high[i] || quotes.close[i],
            low: quotes.low[i] || quotes.close[i],
            close: quotes.close[i],
            volume: quotes.volume[i] || 0
          });
        }
      }

      return historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Yahoo Finance获取历史数据失败:', error);
      return null;
    }
  }

  // 从Alpha Vantage获取报价
  private async getQuoteFromAlphaVantage(symbol: string): Promise<StockQuote | null> {
    try {
      // 使用演示API密钥
      const apiKey = 'demo';
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const quote = data['Global Quote'];
      
      if (!quote) {
        throw new Error('No quote data found');
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date().getTime()
      };
    } catch (error) {
      console.error('Alpha Vantage获取报价失败:', error);
      return null;
    }
  }

  // 从Alpha Vantage获取历史数据
  private async getHistoricalFromAlphaVantage(symbol: string, _period: string): Promise<HistoricalData[] | null> {
    try {
      const apiKey = 'demo';
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const timeSeries = data['Time Series (Daily)'];
      
      if (!timeSeries) {
        throw new Error('No historical data found');
      }

      const historicalData: HistoricalData[] = [];
      
      for (const [date, values] of Object.entries(timeSeries)) {
        const dayData = values as any;
        historicalData.push({
          date,
          open: parseFloat(dayData['1. open']),
          high: parseFloat(dayData['2. high']),
          low: parseFloat(dayData['3. low']),
          close: parseFloat(dayData['4. close']),
          volume: parseInt(dayData['5. volume'])
        });
      }

      return historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Alpha Vantage获取历史数据失败:', error);
      return null;
    }
  }

  // 缓存操作
  private saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getFromCacheSync(key: string, ignoreTimeout = false): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (!ignoreTimeout && Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // 清理过期缓存
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 创建全局实例
export const multiSourceStockService = new MultiSourceStockService();

// 定期清理缓存
setInterval(() => {
  multiSourceStockService.clearExpiredCache();
}, 60000); // 每分钟清理一次

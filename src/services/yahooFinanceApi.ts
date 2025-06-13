// Yahoo Finance API 免费数据服务

export interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketTime: number;
}

export interface YahooHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export class YahooFinanceService {
  private baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private corsProxy = 'https://api.allorigins.win/raw?url=';

  // 获取实时报价
  async getQuote(symbol: string): Promise<YahooQuote | null> {
    try {
      const url = `${this.corsProxy}${encodeURIComponent(`${this.baseUrl}/${symbol}`)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) {
        throw new Error('No data found');
      }

      const meta = result.meta;
      return {
        symbol: meta.symbol,
        regularMarketPrice: meta.regularMarketPrice,
        regularMarketOpen: meta.regularMarketOpen || meta.previousClose,
        regularMarketDayHigh: meta.regularMarketDayHigh || meta.regularMarketPrice,
        regularMarketDayLow: meta.regularMarketDayLow || meta.regularMarketPrice,
        regularMarketVolume: meta.regularMarketVolume || 0,
        regularMarketTime: meta.regularMarketTime
      };
    } catch (error) {
      console.error('获取Yahoo Finance报价失败:', error);
      return null;
    }
  }

  // 获取历史K线数据
  async getHistoricalData(
    symbol: string, 
    period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max' = '1y',
    interval: '1d' | '5d' | '1wk' | '1mo' | '3mo' = '1d'
  ): Promise<YahooHistoricalData[]> {
    try {
      const url = `${this.corsProxy}${encodeURIComponent(`${this.baseUrl}/${symbol}?range=${period}&interval=${interval}`)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) {
        throw new Error('No historical data found');
      }

      const timestamps = result.timestamp;
      const quotes = result.indicators?.quote?.[0];
      const adjClose = result.indicators?.adjclose?.[0]?.adjclose;

      if (!timestamps || !quotes) {
        throw new Error('Invalid data format');
      }

      const historicalData: YahooHistoricalData[] = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        if (quotes.close[i] !== null) {
          historicalData.push({
            date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
            open: quotes.open[i] || quotes.close[i],
            high: quotes.high[i] || quotes.close[i],
            low: quotes.low[i] || quotes.close[i],
            close: quotes.close[i],
            volume: quotes.volume[i] || 0,
            adjClose: adjClose?.[i] || quotes.close[i]
          });
        }
      }

      return historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('获取Yahoo Finance历史数据失败:', error);
      return [];
    }
  }

  // 搜索股票
  async searchStock(query: string): Promise<Array<{symbol: string, name: string, type: string}>> {
    try {
      const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
      const url = `${this.corsProxy}${encodeURIComponent(searchUrl)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const quotes = data.quotes || [];
      
      return quotes
        .filter((quote: any) => quote.typeDisp === 'Equity')
        .slice(0, 10)
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.longname || quote.shortname || quote.symbol,
          type: quote.typeDisp
        }));
    } catch (error) {
      console.error('搜索股票失败:', error);
      // 返回一些常见股票作为fallback
      return [
        { symbol: 'IONQ', name: 'IonQ Inc', type: 'Equity' },
        { symbol: 'AAPL', name: 'Apple Inc', type: 'Equity' },
        { symbol: 'TSLA', name: 'Tesla Inc', type: 'Equity' },
        { symbol: 'NVDA', name: 'NVIDIA Corp', type: 'Equity' },
        { symbol: 'MSFT', name: 'Microsoft Corp', type: 'Equity' }
      ].filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  // 转换为通用格式
  convertToLongPortFormat(yahooData: YahooHistoricalData[]): Array<{
    close: string;
    open: string;
    low: string;
    high: string;
    volume: number;
    turnover: string;
    timestamp: number;
  }> {
    return yahooData.map(data => ({
      close: data.close.toString(),
      open: data.open.toString(),
      low: data.low.toString(),
      high: data.high.toString(),
      volume: data.volume,
      turnover: (data.close * data.volume).toString(),
      timestamp: new Date(data.date).getTime() / 1000
    }));
  }

  // 获取多个股票的报价
  async getMultipleQuotes(symbols: string[]): Promise<Map<string, YahooQuote>> {
    const quotes = new Map<string, YahooQuote>();
    
    // 并发获取，但限制并发数量避免被限流
    const batchSize = 3;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.getQuote(symbol));
      
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          quotes.set(batch[index], result.value);
        }
      });
      
      // 添加延迟避免被限流
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return quotes;
  }

  // 检查股票代码格式
  formatSymbol(symbol: string): string {
    // 移除常见的后缀，Yahoo Finance 通常不需要
    const cleanSymbol = symbol.replace(/\.(US|HK|SH|SZ)$/i, '');
    
    // 港股需要添加.HK后缀
    if (/^\d{4,5}$/.test(cleanSymbol)) {
      return `${cleanSymbol}.HK`;
    }
    
    return cleanSymbol;
  }

  // 获取市场状态
  async getMarketStatus(symbol: string): Promise<{
    isOpen: boolean;
    nextOpenTime?: string;
    nextCloseTime?: string;
  }> {
    try {
      const quote = await this.getQuote(symbol);
      if (!quote) {
        return { isOpen: false };
      }

      // 简单的市场时间判断（可以根据需要完善）
      const now = new Date();
      const marketTime = new Date(quote.regularMarketTime * 1000);
      const timeDiff = now.getTime() - marketTime.getTime();
      
      // 如果最新数据在1小时内，认为市场开放
      const isOpen = timeDiff < 60 * 60 * 1000;
      
      return { isOpen };
    } catch (error) {
      console.error('获取市场状态失败:', error);
      return { isOpen: false };
    }
  }
}

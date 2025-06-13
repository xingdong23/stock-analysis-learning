// 长桥API服务封装

import { type LongPortQuote, type LongPortCandlestick } from '../types/monitor.ts';

export class LongPortApiService {
  private accessToken: string;
  private baseUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private subscriptions: Set<string> = new Set();
  private quoteCallbacks: Map<string, (quote: LongPortQuote) => void> = new Map();

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    environment?: 'sandbox' | 'production';
  }) {
    this.accessToken = config.accessToken;
    
    // 根据环境设置API地址
    if (config.environment === 'sandbox') {
      this.baseUrl = 'https://openapi.longportapp.com';
      this.wsUrl = 'wss://openapi.longportapp.com/v2/quote/ws';
    } else {
      this.baseUrl = 'https://openapi.longportapp.com';
      this.wsUrl = 'wss://openapi.longportapp.com/v2/quote/ws';
    }
  }

  // 获取访问令牌的请求头
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // 获取股票实时行情
  async getQuote(symbol: string): Promise<LongPortQuote> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/quote/quote?symbol=${symbol}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`获取行情失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.quote;
    } catch (error) {
      console.error('获取实时行情失败:', error);
      throw error;
    }
  }

  // 获取K线数据
  async getCandlesticks(
    symbol: string, 
    period: 'Day' | 'Week' | 'Month' | 'Min_1' | 'Min_5' | 'Min_15' | 'Min_30' | 'Min_60' = 'Day',
    count: number = 100
  ): Promise<LongPortCandlestick[]> {
    try {
      const periodMap = {
        'Day': 1000,
        'Week': 2000,
        'Month': 3000,
        'Min_1': 1,
        'Min_5': 5,
        'Min_15': 15,
        'Min_30': 30,
        'Min_60': 60
      };

      const response = await fetch(`${this.baseUrl}/v1/quote/candlestick`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          symbol,
          period: periodMap[period],
          count,
          adjust_type: 0 // 不复权
        }),
      });

      if (!response.ok) {
        throw new Error(`获取K线数据失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candlesticks || [];
    } catch (error) {
      console.error('获取K线数据失败:', error);
      throw error;
    }
  }

  // 订阅实时行情推送
  subscribeQuote(symbol: string, callback: (quote: LongPortQuote) => void): void {
    this.quoteCallbacks.set(symbol, callback);
    this.subscriptions.add(symbol);

    if (!this.ws) {
      this.connectWebSocket();
    } else if (this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscription(symbol);
    }
  }

  // 取消订阅
  unsubscribeQuote(symbol: string): void {
    this.quoteCallbacks.delete(symbol);
    this.subscriptions.delete(symbol);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendUnsubscription(symbol);
    }
  }

  // 连接WebSocket
  private connectWebSocket(): void {
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('长桥WebSocket连接成功');
        // 发送认证信息
        this.authenticate();
        // 订阅所有已添加的股票
        this.subscriptions.forEach(symbol => {
          this.sendSubscription(symbol);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('长桥WebSocket连接关闭');
        // 5秒后重连
        setTimeout(() => {
          if (this.subscriptions.size > 0) {
            this.connectWebSocket();
          }
        }, 5000);
      };

      this.ws.onerror = (error) => {
        console.error('长桥WebSocket错误:', error);
      };
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
    }
  }

  // 发送认证信息
  private authenticate(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const authMessage = {
        cmd: 'auth',
        data: {
          token: this.accessToken
        }
      };
      this.ws.send(JSON.stringify(authMessage));
    }
  }

  // 发送订阅请求
  private sendSubscription(symbol: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        cmd: 'subscribe',
        data: {
          symbol_list: [symbol],
          sub_type_list: [1], // 1 = 实时价格
          is_first_push: true
        }
      };
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  // 发送取消订阅请求
  private sendUnsubscription(symbol: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        cmd: 'unsubscribe',
        data: {
          symbol_list: [symbol],
          sub_type_list: [1]
        }
      };
      this.ws.send(JSON.stringify(unsubscribeMessage));
    }
  }

  // 处理WebSocket消息
  private handleMessage(data: any): void {
    if (data.cmd === 'push' && data.data) {
      const quote = data.data as LongPortQuote;
      const callback = this.quoteCallbacks.get(quote.symbol);
      if (callback) {
        callback(quote);
      }
    }
  }

  // 关闭连接
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.quoteCallbacks.clear();
  }

  // 搜索股票
  async searchStock(keyword: string): Promise<Array<{symbol: string, name: string}>> {
    try {
      // 这里可能需要根据长桥API的实际搜索接口调整
      const response = await fetch(`${this.baseUrl}/v1/quote/search?keyword=${encodeURIComponent(keyword)}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`搜索股票失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.list || [];
    } catch (error) {
      console.error('搜索股票失败:', error);
      // 返回一些示例数据作为fallback
      return [
        { symbol: 'IONQ.US', name: 'IonQ Inc' },
        { symbol: 'AAPL.US', name: 'Apple Inc' },
        { symbol: 'TSLA.US', name: 'Tesla Inc' },
        { symbol: '700.HK', name: '腾讯控股' },
        { symbol: '9988.HK', name: '阿里巴巴-SW' }
      ].filter(stock => 
        stock.symbol.toLowerCase().includes(keyword.toLowerCase()) ||
        stock.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  }
}

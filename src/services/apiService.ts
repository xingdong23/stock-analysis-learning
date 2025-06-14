// 后端API服务

import { type StockAlert, type AlertTrigger, type MonitoringStatus } from '../types/monitor.ts';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export class ApiService {
  private baseUrl: string;
  private userId: string;

  constructor() {
    // 根据环境自动选择API地址
    const isDevelopment = import.meta.env.DEV;
    const defaultUrl = isDevelopment ? 'http://localhost:8001/api/v1' : 'http://101.42.14.209/api/v1';
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || defaultUrl;
    this.userId = this.getUserId();
  }

  // 获取用户ID（简单实现）
  private getUserId(): string {
    let userId = localStorage.getItem('stock_monitor_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('stock_monitor_user_id', userId);
    }
    return userId;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': this.userId,
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // 预警规则相关API
  async getAllAlerts(): Promise<StockAlert[]> {
    const response = await this.request<StockAlert[]>('/alerts');
    // 后端直接返回数组，而不是包装在data字段中
    if (response.data) {
      return response.data;
    } else {
      // 如果没有data字段，说明response本身就是数组
      return response as any as StockAlert[];
    }
  }

  async createAlert(alert: Omit<StockAlert, 'id' | 'createdAt' | 'triggerCount' | 'lastTriggered'>): Promise<StockAlert> {
    const response = await this.request<StockAlert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });

    // 后端直接返回预警对象，而不是包装在data字段中
    if (response.data) {
      return response.data;
    } else {
      // 如果没有data字段，说明response本身就是预警对象
      return response as any as StockAlert;
    }
  }

  async updateAlert(id: string, alert: Partial<StockAlert>): Promise<StockAlert> {
    const response = await this.request<StockAlert>(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alert),
    });
    
    if (!response.data) {
      throw new Error('更新预警失败');
    }
    
    return response.data;
  }

  async deleteAlert(id: string): Promise<void> {
    await this.request(`/alerts/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleAlert(id: string, isActive: boolean): Promise<StockAlert> {
    const response = await this.request<StockAlert>(`/alerts/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    
    if (!response.data) {
      throw new Error('切换预警状态失败');
    }
    
    return response.data;
  }

  // 触发记录相关API
  async getTriggers(page: number = 1, limit: number = 50, alertId?: string): Promise<{
    triggers: AlertTrigger[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (alertId) {
      params.append('alertId', alertId);
    }

    const response = await this.request<AlertTrigger[]>(`/triggers?${params}`);
    
    return {
      triggers: response.data || [],
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 50,
      totalPages: response.totalPages || 1,
    };
  }

  async createTrigger(trigger: Omit<AlertTrigger, 'id' | 'timestamp'>): Promise<AlertTrigger> {
    const response = await this.request<AlertTrigger>('/triggers', {
      method: 'POST',
      body: JSON.stringify(trigger),
    });
    
    if (!response.data) {
      throw new Error('创建触发记录失败');
    }
    
    return response.data;
  }

  async markTriggerAsRead(id: string): Promise<void> {
    await this.request(`/triggers/${id}/read`, {
      method: 'PATCH',
    });
  }

  // 统计信息API
  async getStats(): Promise<MonitoringStatus> {
    const response = await this.request<MonitoringStatus>('/stats');
    return response.data || {
      isRunning: false,
      connectedStocks: [],
      lastUpdate: new Date(),
      totalAlerts: 0,
      activeAlerts: 0,
      triggeredToday: 0,
    };
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('健康检查失败:', error);
      return false;
    }
  }

  // 批量操作
  async batchToggleAlerts(ids: string[], isActive: boolean): Promise<void> {
    const promises = ids.map(id => this.toggleAlert(id, isActive));
    await Promise.all(promises);
  }

  async batchDeleteAlerts(ids: string[]): Promise<void> {
    const promises = ids.map(id => this.deleteAlert(id));
    await Promise.all(promises);
  }

  // 导出数据
  async exportAlerts(): Promise<string> {
    const alerts = await this.getAllAlerts();
    return JSON.stringify(alerts, null, 2);
  }

  // 导入数据
  async importAlerts(alertsJson: string): Promise<StockAlert[]> {
    try {
      const alerts = JSON.parse(alertsJson) as StockAlert[];
      const promises = alerts.map(alert => {
        const { id, createdAt, triggerCount, lastTriggered, ...alertData } = alert;
        return this.createAlert(alertData as any);
      });
      
      return await Promise.all(promises);
    } catch (error) {
      throw new Error('导入数据格式错误');
    }
  }

  // 获取用户信息
  getUserInfo(): { userId: string } {
    return { userId: this.userId };
  }

  // 重置用户ID（用于测试）
  resetUserId(): void {
    localStorage.removeItem('stock_monitor_user_id');
    this.userId = this.getUserId();
  }
}

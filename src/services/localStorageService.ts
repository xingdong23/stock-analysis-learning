// 本地存储服务 - 管理股票监控数据的持久化

import { type StockAlert, type AlertTrigger } from '../types/monitor.ts';

export interface StoredMonitorData {
  alerts: StockAlert[];
  triggers: AlertTrigger[];
  config: {
    checkInterval: number;
    enableNotifications: boolean;
    notificationMethods: string[];
  };
  lastUpdate: string;
  version: string;
}

export class LocalStorageService {
  private static readonly STORAGE_KEY = 'stockMonitor';
  private static readonly VERSION = '1.0.0';
  private static readonly MAX_TRIGGERS = 100; // 最多保存100条触发记录

  // 保存监控数据
  static saveMonitorData(
    alerts: StockAlert[],
    triggers: AlertTrigger[],
    config: any
  ): boolean {
    try {
      // 限制触发记录数量，只保留最新的
      const limitedTriggers = triggers
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.MAX_TRIGGERS);

      const data: StoredMonitorData = {
        alerts: alerts.map(alert => ({
          ...alert,
          createdAt: alert.created_at,
          lastTriggered: alert.last_triggered
        })),
        triggers: limitedTriggers.map(trigger => ({
          ...trigger,
          timestamp: trigger.timestamp
        })),
        config,
        lastUpdate: new Date().toISOString(),
        version: this.VERSION
      };

      const jsonString = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, jsonString);
      
      console.log(`✅ 监控数据已保存: ${alerts.length} 个预警规则, ${limitedTriggers.length} 条触发记录`);
      return true;
    } catch (error) {
      console.error('保存监控数据失败:', error);
      return false;
    }
  }

  // 加载监控数据
  static loadMonitorData(): StoredMonitorData | null {
    try {
      const jsonString = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonString) {
        console.log('📝 未找到保存的监控数据');
        return null;
      }

      const data: StoredMonitorData = JSON.parse(jsonString);
      
      // 版本检查
      if (data.version !== this.VERSION) {
        console.log(`🔄 数据版本不匹配，当前: ${this.VERSION}, 存储: ${data.version || '未知'}`);
        // 可以在这里进行数据迁移
        return this.migrateData(data);
      }

      // 恢复日期对象
      const restoredData: StoredMonitorData = {
        ...data,
        alerts: data.alerts.map(alert => ({
          ...alert,
          createdAt: new Date(alert.created_at),
          lastTriggered: alert.last_triggered ? new Date(alert.last_triggered) : undefined
        })),
        triggers: data.triggers.map(trigger => ({
          ...trigger,
          timestamp: new Date(trigger.timestamp)
        }))
      };

      console.log(`📂 监控数据已加载: ${restoredData.alerts.length} 个预警规则, ${restoredData.triggers.length} 条触发记录`);
      return restoredData;
    } catch (error) {
      console.error('加载监控数据失败:', error);
      return null;
    }
  }

  // 数据迁移（处理版本升级）
  private static migrateData(oldData: any): StoredMonitorData | null {
    try {
      // 这里可以处理不同版本的数据迁移
      console.log('🔄 正在迁移数据到新版本...');
      
      const migratedData: StoredMonitorData = {
        alerts: oldData.alerts || [],
        triggers: oldData.triggers || [],
        config: oldData.config || {
          checkInterval: 60000,
          enableNotifications: true,
          notificationMethods: ['BROWSER_NOTIFICATION']
        },
        lastUpdate: new Date().toISOString(),
        version: this.VERSION
      };

      // 保存迁移后的数据
      this.saveMonitorData(migratedData.alerts, migratedData.triggers, migratedData.config);
      
      console.log('✅ 数据迁移完成');
      return migratedData;
    } catch (error) {
      console.error('数据迁移失败:', error);
      return null;
    }
  }

  // 清除所有数据
  static clearAllData(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ 所有监控数据已清除');
      return true;
    } catch (error) {
      console.error('清除数据失败:', error);
      return false;
    }
  }

  // 导出数据（用于备份）
  static exportData(): string | null {
    try {
      const data = this.loadMonitorData();
      if (!data) return null;
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('导出数据失败:', error);
      return null;
    }
  }

  // 导入数据（用于恢复）
  static importData(jsonString: string): boolean {
    try {
      const data: StoredMonitorData = JSON.parse(jsonString);
      
      // 验证数据格式
      if (!data.alerts || !Array.isArray(data.alerts)) {
        throw new Error('无效的数据格式');
      }

      localStorage.setItem(this.STORAGE_KEY, jsonString);
      console.log('📥 数据导入成功');
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }

  // 获取存储使用情况
  static getStorageInfo(): {
    used: number;
    total: number;
    percentage: number;
    dataSize: number;
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const dataSize = data ? new Blob([data]).size : 0;
      
      // 估算localStorage总容量（通常5-10MB）
      const estimatedTotal = 5 * 1024 * 1024; // 5MB
      let used = 0;
      
      // 计算已使用空间
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length;
        }
      }

      return {
        used,
        total: estimatedTotal,
        percentage: (used / estimatedTotal) * 100,
        dataSize
      };
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return {
        used: 0,
        total: 0,
        percentage: 0,
        dataSize: 0
      };
    }
  }

  // 检查存储是否可用
  static isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.error('localStorage不可用:', error);
      return false;
    }
  }

  // 自动保存（防抖）
  private static saveTimeout: number | null = null;
  
  static autoSave(
    alerts: StockAlert[],
    triggers: AlertTrigger[],
    config: any,
    delay: number = 1000
  ): void {
    if (this.saveTimeout) {
      window.clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = window.setTimeout(() => {
      this.saveMonitorData(alerts, triggers, config);
      this.saveTimeout = null;
    }, delay);
  }

  // 获取数据统计
  static getDataStats(): {
    totalAlerts: number;
    activeAlerts: number;
    totalTriggers: number;
    lastUpdate: string;
    dataAge: number; // 数据年龄（小时）
  } {
    const data = this.loadMonitorData();
    if (!data) {
      return {
        totalAlerts: 0,
        activeAlerts: 0,
        totalTriggers: 0,
        lastUpdate: '无',
        dataAge: 0
      };
    }

    const lastUpdate = new Date(data.lastUpdate);
    const dataAge = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60); // 小时

    return {
      totalAlerts: data.alerts.length,
      activeAlerts: data.alerts.filter(alert => alert.is_active).length,
      totalTriggers: data.triggers.length,
      lastUpdate: lastUpdate.toLocaleString(),
      dataAge
    };
  }
}

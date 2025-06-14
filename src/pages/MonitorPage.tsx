import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Play,
  Pause,
  Bell,
  TrendingUp,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { type StockAlert, type AlertTrigger, type MonitoringStatus, ALERT_RULES } from '../types/monitor.ts';
import { FreeStockMonitorService } from '../services/freeStockMonitor.ts';
import { ApiService } from '../services/apiService.ts';

const MonitorPage: React.FC = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [monitorStatus, setMonitorStatus] = useState<MonitoringStatus>({
    isRunning: false,
    connectedStocks: [],
    lastUpdate: new Date(),
    totalAlerts: 0,
    activeAlerts: 0,
    triggeredToday: 0
  });
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [recentTriggers, setRecentTriggers] = useState<AlertTrigger[]>([]);
  const [monitorService, setMonitorService] = useState<FreeStockMonitorService | null>(null);
  const [apiService] = useState(() => new ApiService());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载预警规则
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const alertsData = await apiService.getAllAlerts();
      setAlerts(alertsData);

      // 更新监控状态
      setMonitorStatus(prev => ({
        ...prev,
        totalAlerts: alertsData.length,
        activeAlerts: alertsData.filter((alert: StockAlert) => alert.isActive).length,
        connectedStocks: [...new Set(alertsData.map((alert: StockAlert) => alert.symbol))],
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('加载预警规则失败:', error);
      setError('加载预警规则失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    // 加载预警规则
    loadAlerts();

    // 免费服务配置
    const config = {
      checkInterval: 60000, // 1分钟检查一次（免费服务不需要太频繁）
      enableNotifications: true,
      notificationMethods: ['BROWSER_NOTIFICATION' as const]
    };

    const service = new FreeStockMonitorService(config);

    // 注册预警触发回调
    service.onAlertTriggered((trigger) => {
      setRecentTriggers(prev => [trigger, ...prev.slice(0, 9)]); // 保留最近10条
    });

    setMonitorService(service);

    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      service.stopMonitoring();
    };
  }, []);

  // 更新状态
  useEffect(() => {
    if (!monitorService) return;

    const updateStatus = () => {
      const status = monitorService.getStatus();
      setMonitorStatus(status);
      setAlerts(monitorService.getAllAlerts());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [monitorService]);

  // 开始/停止监控
  const toggleMonitoring = async () => {
    if (!monitorService) return;

    if (monitorStatus.isRunning) {
      monitorService.stopMonitoring();
    } else {
      await monitorService.startMonitoring();
    }
  };

  // 切换预警状态
  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);

      // 调用API更新状态
      await apiService.toggleAlert(alertId, isActive);

      // 重新加载预警列表
      await loadAlerts();

      // 同时更新本地监控服务
      if (monitorService) {
        monitorService.toggleAlert(alertId, isActive);
      }
    } catch (error) {
      console.error('切换预警状态失败:', error);
      setError('切换预警状态失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除预警
  const deleteAlert = async (alertId: string) => {
    try {
      setLoading(true);
      setError(null);

      // 调用API删除
      await apiService.deleteAlert(alertId);

      // 重新加载预警列表
      await loadAlerts();

      // 同时从本地监控服务删除
      if (monitorService) {
        monitorService.removeAlert(alertId);
      }
    } catch (error) {
      console.error('删除预警失败:', error);
      setError('删除预警失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 格式化预警描述
  const formatAlertDescription = (alert: StockAlert): string => {
    const { indicator, condition, target_value } = alert;

    switch (indicator.type) {
      case 'MA_CONVERGENCE':
        const periods = indicator.periods?.join(', ') || '5, 10, 20';
        return `均线缠绕 MA(${periods}) ${condition === 'CONVERGING' ? '正在缠绕' : '开始发散'} (阈值: ${indicator.threshold || 2}%)`;

      case 'MA_PROXIMITY':
        const proximityDesc = condition === 'NEAR' ? '接近' : '在附近震荡';
        return `${proximityDesc} MA${indicator.period} (距离: ±${indicator.threshold || 2}%)`;

      case 'MA':
        return `MA${indicator.period} ${condition === 'CROSS_ABOVE' ? '向上突破' : condition === 'CROSS_BELOW' ? '跌破' : condition}`;

      case 'RSI':
        return `RSI${indicator.period || 14} ${condition} ${target_value || (condition === 'ABOVE' ? '70' : '30')}`;

      case 'PRICE':
        return `价格 ${condition === 'ABOVE' ? '高于' : '低于'} $${target_value}`;

      default:
        return `${indicator.type}${indicator.period || ''} ${condition} ${target_value || ''}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">股票监控中心</h1>
          <p className="text-gray-600">实时监控股票价格和技术指标，及时获取预警通知</p>
        </motion.div>

        {/* 监控状态卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">监控状态</p>
                <p className={`text-2xl font-bold ${monitorStatus.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                  {monitorStatus.isRunning ? '运行中' : '已停止'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${monitorStatus.isRunning ? 'bg-green-100' : 'bg-red-100'}`}>
                {monitorStatus.isRunning ? (
                  <Play className="w-6 h-6 text-green-600" />
                ) : (
                  <Pause className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">监控股票</p>
                <p className="text-2xl font-bold text-blue-600">{monitorStatus.connectedStocks.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">活跃预警</p>
                <p className="text-2xl font-bold text-purple-600">{monitorStatus.activeAlerts}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今日触发</p>
                <p className="text-2xl font-bold text-orange-600">{monitorStatus.triggeredToday}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 预警列表 */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">预警规则</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddAlert(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加预警
                  </button>
                  <button
                    onClick={toggleMonitoring}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      monitorStatus.isRunning
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {monitorStatus.isRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        停止监控
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        开始监控
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">暂无预警规则</p>
                    <p className="text-gray-400">点击"添加预警"创建您的第一个监控规则</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 ${
                        alert.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-lg">{alert.symbol}</span>
                            <span className="text-sm text-gray-600">{alert.name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {alert.is_active ? '运行中' : '已暂停'}
                            </span>
                          </div>
                          <p className="text-gray-700">
                            {formatAlertDescription(alert)}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>触发次数: {alert.trigger_count}</span>
                            {alert.last_triggered && (
                              <span>最后触发: {new Date(alert.last_triggered).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAlert(alert.id, !alert.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              alert.isActive
                                ? 'text-green-600 hover:bg-green-100'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {alert.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteAlert(alert.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* 最近触发 */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">最近触发</h3>
              <div className="space-y-3">
                {recentTriggers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无触发记录</p>
                ) : (
                  recentTriggers.map((trigger, index) => (
                    <motion.div
                      key={`${trigger.alertId}-${trigger.timestamp.getTime()}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-l-4 border-orange-400 bg-orange-50 p-3 rounded-r-lg"
                    >
                      <p className="font-medium text-gray-900">{trigger.symbol}</p>
                      <p className="text-sm text-gray-600">{trigger.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {trigger.timestamp.toLocaleTimeString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 添加预警弹窗 */}
      {showAddAlert && (
        <AddAlertModal
          onClose={() => setShowAddAlert(false)}
          onAdd={async (alert) => {
            try {
              setLoading(true);
              setError(null);

              // 调用API保存到后端
              await apiService.createAlert(alert);

              // 重新加载预警列表
              await loadAlerts();

              // 同时添加到本地监控服务
              if (monitorService) {
                monitorService.addAlert(alert);
              }

              setShowAddAlert(false);
            } catch (error) {
              console.error('创建预警失败:', error);
              setError('创建预警失败，请重试');
            } finally {
              setLoading(false);
            }
          }}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
};

// 添加预警弹窗组件
const AddAlertModal: React.FC<{
  onClose: () => void;
  onAdd: (alert: StockAlert) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}> = ({ onClose, onAdd, loading = false, error }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    indicatorType: 'MA',
    period: 20,
    periods: [5, 10, 20],
    threshold: 2,
    condition: 'CROSS_BELOW',
    targetValue: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const alert: StockAlert = {
      id: Date.now().toString(),
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      indicator: {
        type: formData.indicatorType as any,
        period: formData.period,
        periods: formData.indicatorType === 'MA_CONVERGENCE' ? formData.periods : undefined,
        threshold: ['MA_CONVERGENCE', 'MA_PROXIMITY'].includes(formData.indicatorType) ? formData.threshold : undefined
      },
      condition: formData.condition as any,
      target_value: formData.targetValue || undefined,
      is_active: true,
      createdAt: new Date(),
      triggerCount: 0
    };

    await onAdd(alert);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-xl font-bold mb-4">添加预警规则</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              股票代码
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
              placeholder="例如: IONQ.US"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              股票名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如: IonQ Inc"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              预警规则
            </label>
            <select
              value={`${formData.indicatorType}_${formData.condition}`}
              onChange={(e) => {
                const [indicatorType, condition] = e.target.value.split('_');
                setFormData(prev => ({ ...prev, indicatorType, condition }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ALERT_RULES.map((rule) => (
                <option key={rule.name} value={`${rule.indicator.type}_${rule.condition}`}>
                  {rule.name} - {rule.description}
                </option>
              ))}
            </select>
          </div>

          {formData.indicatorType === 'MA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MA周期
              </label>
              <input
                type="number"
                value={formData.period}
                onChange={(e) => setFormData(prev => ({ ...prev, period: parseInt(e.target.value) }))}
                min="1"
                max="200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {formData.indicatorType === 'MA_CONVERGENCE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  均线周期组合
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.periods.map((period, index) => (
                    <input
                      key={index}
                      type="number"
                      value={period}
                      onChange={(e) => {
                        const newPeriods = [...formData.periods];
                        newPeriods[index] = parseInt(e.target.value);
                        setFormData(prev => ({ ...prev, periods: newPeriods }));
                      }}
                      min="1"
                      max="200"
                      placeholder={`MA${index + 1}`}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">默认: MA5, MA10, MA20</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  缠绕阈值 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                  min="0.1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">均线差距小于此值时认为缠绕</p>
              </div>
            </>
          )}

          {formData.indicatorType === 'MA_PROXIMITY' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  均线周期
                </label>
                <input
                  type="number"
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: parseInt(e.target.value) }))}
                  min="1"
                  max="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  距离阈值 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                  min="0.1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">股价与均线距离小于此值时触发</p>
              </div>
            </>
          )}

          {formData.indicatorType === 'RSI' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RSI周期
              </label>
              <input
                type="number"
                value={formData.period}
                onChange={(e) => setFormData(prev => ({ ...prev, period: parseInt(e.target.value) }))}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {(formData.condition === 'ABOVE' || formData.condition === 'BELOW') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标价格
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.targetValue}
                onChange={(e) => setFormData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? '保存中...' : '添加预警'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default MonitorPage;

// 设置页面

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  BookOpen, 
  BarChart3,
  Save,
  RotateCcw,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    newIndicators: boolean;
    practiceReminders: boolean;
    learningProgress: boolean;
  };
  display: {
    chartTheme: 'light' | 'dark';
    animationsEnabled: boolean;
    compactMode: boolean;
  };
  learning: {
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all';
    autoProgress: boolean;
    showHints: boolean;
  };
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'light',
    notifications: {
      newIndicators: true,
      practiceReminders: true,
      learningProgress: true
    },
    display: {
      chartTheme: 'light',
      animationsEnabled: true,
      compactMode: false
    },
    learning: {
      difficulty: 'all',
      autoProgress: true,
      showHints: true
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSettings = (section: keyof SettingsState, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // 这里可以添加保存到localStorage或发送到服务器的逻辑
    localStorage.setItem('stockAnalysisSettings', JSON.stringify(settings));
    setHasChanges(false);
    
    // 显示保存成功提示
    alert('设置已保存！');
  };

  const handleReset = () => {
    const defaultSettings: SettingsState = {
      theme: 'light',
      notifications: {
        newIndicators: true,
        practiceReminders: true,
        learningProgress: true
      },
      display: {
        chartTheme: 'light',
        animationsEnabled: true,
        compactMode: false
      },
      learning: {
        difficulty: 'all',
        autoProgress: true,
        showHints: true
      }
    };
    
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const settingSections = [
    {
      id: 'appearance',
      title: '外观设置',
      icon: Palette,
      description: '自定义界面主题和显示效果'
    },
    {
      id: 'notifications',
      title: '通知设置',
      icon: Bell,
      description: '管理各类通知和提醒'
    },
    {
      id: 'display',
      title: '显示设置',
      icon: Monitor,
      description: '调整图表和界面显示选项'
    },
    {
      id: 'learning',
      title: '学习设置',
      icon: BookOpen,
      description: '个性化学习体验和进度管理'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">设置</h1>
          </div>
          <p className="text-lg text-gray-600">
            个性化你的股票分析学习体验
          </p>
        </motion.div>

        {/* 设置内容 */}
        <div className="space-y-8">
          {/* 外观设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="h-6 w-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">外观设置</h2>
                <p className="text-sm text-gray-600">自定义界面主题和显示效果</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  主题模式
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: '浅色', icon: Sun },
                    { value: 'dark', label: '深色', icon: Moon },
                    { value: 'system', label: '跟随系统', icon: Monitor }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateTheme(value as any)}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all ${
                        settings.theme === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 通知设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="h-6 w-6 text-yellow-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">通知设置</h2>
                <p className="text-sm text-gray-600">管理各类通知和提醒</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'newIndicators', label: '新指标通知', description: '当添加新的技术指标时通知我' },
                { key: 'practiceReminders', label: '练习提醒', description: '定期提醒我进行模拟练习' },
                { key: 'learningProgress', label: '学习进度', description: '学习进度更新时通知我' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <button
                    onClick={() => updateSettings('notifications', key, !settings.notifications[key as keyof typeof settings.notifications])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notifications[key as keyof typeof settings.notifications]
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.notifications[key as keyof typeof settings.notifications]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 显示设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="h-6 w-6 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">显示设置</h2>
                <p className="text-sm text-gray-600">调整图表和界面显示选项</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  图表主题
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'light', label: '浅色图表' },
                    { value: 'dark', label: '深色图表' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateSettings('display', 'chartTheme', value)}
                      className={`p-3 rounded-lg border transition-all ${
                        settings.display.chartTheme === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {[
                { key: 'animationsEnabled', label: '启用动画效果', description: '页面切换和交互动画' },
                { key: 'compactMode', label: '紧凑模式', description: '减少界面间距，显示更多内容' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <button
                    onClick={() => updateSettings('display', key, !settings.display[key as keyof typeof settings.display])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.display[key as keyof typeof settings.display]
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.display[key as keyof typeof settings.display]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 学习设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">学习设置</h2>
                <p className="text-sm text-gray-600">个性化学习体验和进度管理</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  默认难度等级
                </label>
                <select
                  value={settings.learning.difficulty}
                  onChange={(e) => updateSettings('learning', 'difficulty', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部难度</option>
                  <option value="beginner">初级</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                </select>
              </div>

              {[
                { key: 'autoProgress', label: '自动记录学习进度', description: '自动保存你的学习进度和完成状态' },
                { key: 'showHints', label: '显示学习提示', description: '在学习过程中显示有用的提示和建议' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <button
                    onClick={() => updateSettings('learning', key, !settings.learning[key as keyof typeof settings.learning])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.learning[key as keyof typeof settings.learning]
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.learning[key as keyof typeof settings.learning]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between pt-8"
        >
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>恢复默认</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>保存设置</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

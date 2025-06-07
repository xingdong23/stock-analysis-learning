// 技术指标分类数据

import { type CategoryInfo, IndicatorCategory, type DifficultyInfo, type DifficultyLevel } from '../types/simple.ts';

export const indicatorCategories: CategoryInfo[] = [
  {
    id: IndicatorCategory.TREND,
    name: '趋势指标',
    description: '用于识别和跟踪价格趋势方向的技术指标',
    icon: '📈',
    color: 'blue',
    count: 0 // 将在运行时计算
  },
  {
    id: IndicatorCategory.MOMENTUM,
    name: '动量指标',
    description: '衡量价格变化速度和强度的技术指标',
    icon: '⚡',
    color: 'green',
    count: 0
  },
  {
    id: IndicatorCategory.VOLUME,
    name: '成交量指标',
    description: '分析成交量与价格关系的技术指标',
    icon: '📊',
    color: 'purple',
    count: 0
  },
  {
    id: IndicatorCategory.VOLATILITY,
    name: '波动率指标',
    description: '测量价格波动程度和市场风险的技术指标',
    icon: '🌊',
    color: 'orange',
    count: 0
  },
  {
    id: IndicatorCategory.THEORY,
    name: '技术理论',
    description: '技术分析的基础理论和核心概念',
    icon: '📚',
    color: 'red',
    count: 0
  }
];

// 难度等级配置
export const difficultyLevels: Record<DifficultyLevel, DifficultyInfo> = {
  beginner: {
    name: '初级',
    color: 'green',
    description: '适合初学者，概念简单易懂'
  },
  intermediate: {
    name: '中级',
    color: 'yellow',
    description: '需要一定基础，理解稍有难度'
  },
  advanced: {
    name: '高级',
    color: 'red',
    description: '需要深厚基础，概念复杂'
  }
};

// 常用标签
export const commonTags = [
  '趋势跟踪',
  '反转信号',
  '超买超卖',
  '背离分析',
  '金叉死叉',
  '支撑阻力',
  '量价关系',
  '波动率',
  '风险管理',
  '入门必学',
  '实战常用',
  '高级策略'
];

// 导出指标数量统计函数

// 技术指标卡片组件

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, TrendingUp, Zap, BarChart3, Activity } from 'lucide-react';
import { type TechnicalIndicator, IndicatorCategory } from '../../types/simple.ts';

interface IndicatorCardProps {
  indicator: TechnicalIndicator;
  index?: number;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({ indicator, index = 0 }) => {
  // 根据分类获取图标
  const getCategoryIcon = (category: IndicatorCategory) => {
    switch (category) {
      case IndicatorCategory.TREND:
        return <TrendingUp className="h-5 w-5" />;
      case IndicatorCategory.MOMENTUM:
        return <Zap className="h-5 w-5" />;
      case IndicatorCategory.VOLUME:
        return <BarChart3 className="h-5 w-5" />;
      case IndicatorCategory.VOLATILITY:
        return <Activity className="h-5 w-5" />;
      case IndicatorCategory.THEORY:
        return <BookOpen className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  // 根据分类获取颜色
  const getCategoryColor = (category: IndicatorCategory) => {
    switch (category) {
      case IndicatorCategory.TREND:
        return 'blue';
      case IndicatorCategory.MOMENTUM:
        return 'green';
      case IndicatorCategory.VOLUME:
        return 'purple';
      case IndicatorCategory.VOLATILITY:
        return 'orange';
      case IndicatorCategory.THEORY:
        return 'red';
      default:
        return 'blue';
    }
  };

  // 根据难度获取样式
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取难度中文名称
  const getDifficultyName = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '初级';
      case 'intermediate':
        return '中级';
      case 'advanced':
        return '高级';
      default:
        return '未知';
    }
  };

  const categoryColor = getCategoryColor(indicator.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Link to={`/indicators/${indicator.id}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-gray-300">
          {/* 头部信息 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-${categoryColor}-100 text-${categoryColor}-600`}>
                {getCategoryIcon(indicator.category)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {indicator.name}
                </h3>
                <p className="text-sm text-gray-500">{indicator.englishName}</p>
              </div>
            </div>
            
            {/* 难度标签 */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyStyle(indicator.difficulty)}`}>
              {getDifficultyName(indicator.difficulty)}
            </span>
          </div>

          {/* 描述 */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {indicator.description}
          </p>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {indicator.tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {indicator.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{indicator.tags.length - 3}
              </span>
            )}
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {indicator.examples.length} 案例
              </span>
              <span>热度 {indicator.popularity}</span>
            </div>
            
            <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
              学习详情
              <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

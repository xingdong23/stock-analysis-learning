// 技术指标详情组件

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Calculator, TrendingUp, AlertTriangle, Lightbulb, Target, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type TechnicalIndicator } from '../../types/simple.ts';
import { TechnicalChart } from '../Chart/TechnicalChart';

interface IndicatorDetailProps {
  indicator: TechnicalIndicator;
}

export const IndicatorDetail: React.FC<IndicatorDetailProps> = ({ indicator }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'formula' | 'signals' | 'examples' | 'chart'>('overview');

  const tabs = [
    { id: 'overview', label: '概述', icon: BookOpen },
    { id: 'formula', label: '计算公式', icon: Calculator },
    { id: 'signals', label: '买卖信号', icon: TrendingUp },
    { id: 'examples', label: '实战案例', icon: Target },
    { id: 'chart', label: '图表演示', icon: BarChart3 }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'yellow';
      case 'advanced': return 'red';
      default: return 'gray';
    }
  };

  const getDifficultyName = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初级';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return '未知';
    }
  };

  const getSignalTypeColor = (type: string) => {
    switch (type) {
      case 'buy': return 'text-green-600 bg-green-50';
      case 'sell': return 'text-red-600 bg-red-50';
      case 'hold': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSignalTypeName = (type: string) => {
    switch (type) {
      case 'buy': return '买入';
      case 'sell': return '卖出';
      case 'hold': return '持有';
      default: return '未知';
    }
  };

  const getStrengthName = (strength: string) => {
    switch (strength) {
      case 'weak': return '弱';
      case 'medium': return '中';
      case 'strong': return '强';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/indicators"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回指标列表
          </Link>
        </motion.div>

        {/* 指标头部信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {indicator.name}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {indicator.englishName}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {indicator.detailedDescription}
              </p>
            </div>
            
            <div className="flex flex-col space-y-3 mt-4 md:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${getDifficultyColor(indicator.difficulty)}-100 text-${getDifficultyColor(indicator.difficulty)}-800 text-center`}>
                难度：{getDifficultyName(indicator.difficulty)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 text-center">
                热度：{indicator.popularity}
              </span>
            </div>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {indicator.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 选项卡导航 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 选项卡内容 */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* 使用场景 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    使用场景
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {indicator.usageScenarios.map((scenario, index) => (
                      <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        <span className="text-gray-700">{scenario}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 市场条件 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    适用市场条件
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {indicator.marketConditions.map((condition, index) => (
                      <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        <span className="text-gray-700">{condition}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 关键要点 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                    关键要点
                  </h3>
                  <div className="space-y-3">
                    {indicator.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3 mt-2"></div>
                        <span className="text-gray-700">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 常见错误 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    常见错误
                  </h3>
                  <div className="space-y-3">
                    {indicator.commonMistakes.map((mistake, index) => (
                      <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-3 mt-2"></div>
                        <span className="text-gray-700">{mistake}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'formula' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {indicator.formulas.map((formula, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      {formula.name}
                    </h4>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border mb-4">
                      <code className="text-lg font-mono text-gray-800">
                        {formula.formula}
                      </code>
                    </div>
                    <p className="text-gray-700 mb-4">{formula.explanation}</p>
                    
                    {/* 变量说明 */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">变量说明：</h5>
                      <div className="space-y-2">
                        {Object.entries(formula.variables).map(([variable, description]) => (
                          <div key={variable} className="flex items-start">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono mr-3 mt-0.5">
                              {variable}
                            </code>
                            <span className="text-gray-700 text-sm">{description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'signals' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {indicator.signals.map((signal, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSignalTypeColor(signal.type)}`}>
                        {getSignalTypeName(signal.type)}信号
                      </span>
                      <span className="text-sm text-gray-500">
                        强度：{getStrengthName(signal.strength)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {signal.condition}
                    </h4>
                    <p className="text-gray-700">
                      {signal.description}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'examples' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {indicator.examples.map((example, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      {example.title}
                    </h4>
                    <p className="text-gray-700 mb-4">{example.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">分析过程：</h5>
                        <p className="text-gray-700 text-sm">{example.analysis}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">结果说明：</h5>
                        <p className="text-gray-700 text-sm">{example.result}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'chart' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-blue-800 font-medium mb-2">📊 图表演示说明</h4>
                  <p className="text-blue-700 text-sm">
                    以下图表使用模拟数据演示 {indicator.name} 的计算和应用效果。
                    实际使用时请结合真实市场数据进行分析。
                  </p>
                </div>

                {/* 根据指标类型显示不同的图表 */}
                {indicator.id === 'macd' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">MACD指标图表</h4>
                    <TechnicalChart
                      indicatorType="macd"
                      height={500}
                      title="MACD指标演示"
                    />
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">图表说明：</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• 上方为股价走势图</li>
                        <li>• 下方为MACD指标，包含DIF线（红色）、DEA线（绿色）和MACD柱状图</li>
                        <li>• 当DIF线上穿DEA线时形成金叉（买入信号）</li>
                        <li>• 当DIF线下穿DEA线时形成死叉（卖出信号）</li>
                      </ul>
                    </div>
                  </div>
                )}

                {indicator.id === 'rsi' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">RSI指标图表</h4>
                    <TechnicalChart
                      indicatorType="rsi"
                      height={500}
                      title="RSI指标演示"
                    />
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">图表说明：</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• 上方为股价走势图</li>
                        <li>• 下方为RSI指标，数值在0-100之间</li>
                        <li>• 红色虚线（70）为超买线，绿色虚线（30）为超卖线</li>
                        <li>• RSI超过70时可能超买，低于30时可能超卖</li>
                      </ul>
                    </div>
                  </div>
                )}

                {indicator.id === 'ma' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">移动平均线图表</h4>
                    <TechnicalChart
                      indicatorType="ma"
                      height={400}
                      title="移动平均线演示"
                    />
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">图表说明：</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• 蓝色线为股价走势</li>
                        <li>• 红色线为5日移动平均线（短期均线）</li>
                        <li>• 绿色线为20日移动平均线（长期均线）</li>
                        <li>• 短期均线上穿长期均线时形成金叉（买入信号）</li>
                      </ul>
                    </div>
                  </div>
                )}

                {!['macd', 'rsi', 'ma'].includes(indicator.id) && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">K线图表</h4>
                    <TechnicalChart
                      indicatorType="candlestick"
                      height={400}
                      title={`${indicator.name}相关图表`}
                    />
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">图表说明：</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• 上方为K线图，显示开盘价、收盘价、最高价、最低价</li>
                        <li>• 红色K线表示上涨，绿色K线表示下跌</li>
                        <li>• 下方为成交量柱状图</li>
                        <li>• 可结合 {indicator.name} 理论进行分析</li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

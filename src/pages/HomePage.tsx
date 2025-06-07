// 首页组件

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  BookOpen,
  Target,
  Users,
  ArrowRight,
  BarChart3,
  Award
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [indicatorData, setIndicatorData] = useState<{
    indicatorCategories: any[];
    technicalIndicators: any[];
  }>({
    indicatorCategories: [],
    technicalIndicators: []
  });

  useEffect(() => {
    // 异步加载数据以避免循环依赖
    const loadData = async () => {
      try {
        const [categoriesModule, indicatorsModule] = await Promise.all([
          import('../data/categories'),
          import('../data/indicators')
        ]);

        setIndicatorData({
          indicatorCategories: categoriesModule.indicatorCategories,
          technicalIndicators: indicatorsModule.technicalIndicators
        });
      } catch (error) {
        console.error('Error loading indicator data:', error);
      }
    };

    loadData();
  }, []);

  const { indicatorCategories, technicalIndicators } = indicatorData;
  const featuredIndicators = technicalIndicators.slice(0, 3);
  
  const features = [
    {
      icon: BookOpen,
      title: '系统化学习',
      description: '从基础理论到高级策略，循序渐进掌握技术分析',
      color: 'blue'
    },
    {
      icon: Target,
      title: '实战案例',
      description: '真实市场案例分析，理论与实践相结合',
      color: 'green'
    },
    {
      icon: BarChart3,
      title: '交互图表',
      description: '动态图表演示，直观理解指标原理',
      color: 'purple'
    },
    {
      icon: Users,
      title: '社区交流',
      description: '与其他学习者交流心得，共同进步',
      color: 'orange'
    }
  ];

  const stats = [
    { label: '技术指标', value: technicalIndicators.length, icon: TrendingUp },
    { label: '学习案例', value: '50+', icon: BookOpen },
    { label: '用户数量', value: '10K+', icon: Users },
    { label: '好评率', value: '98%', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                掌握股票技术分析
                <br />
                <span className="text-blue-200">从零开始学习</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                系统学习所有主要技术指标，通过交互式图表和模拟练习，快速提升你的股票分析能力。
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/indicators"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                >
                  开始学习
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/practice"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
                >
                  模拟练习
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                          className="text-center"
                        >
                          <Icon className="h-8 w-8 mx-auto mb-2 text-blue-200" />
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <div className="text-blue-200 text-sm">{stat.label}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 特色功能 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              为什么选择我们？
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              专业的技术分析学习平台，帮助您系统掌握股票技术指标
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                    feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    feature.color === 'green' ? 'bg-green-100 text-green-600' :
                    feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 指标分类 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              技术指标分类
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              按照功能和用途分类，系统学习各类技术指标
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {indicatorCategories.slice(0, 6).map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/indicators?category=${category.id}`}>
                  <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors group-hover:shadow-lg">
                    <div className="flex items-center mb-4">
                      <span className="text-3xl mr-3">{category.icon}</span>
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      {category.description}
                    </p>
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      查看指标
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link
              to="/indicators"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              查看所有指标
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 热门指标 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              热门技术指标
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              最受欢迎的技术指标，从这里开始你的学习之旅
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/indicators/${indicator.id}`}>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group-hover:border-gray-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {indicator.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        热度 {indicator.popularity}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {indicator.description}
                    </p>
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      开始学习
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              准备开始你的技术分析学习之旅？
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              加入我们，掌握专业的股票技术分析技能
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              <Link
                to="/indicators"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
              >
                立即开始学习
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/practice"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
              >
                模拟练习
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

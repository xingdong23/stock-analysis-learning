// 技术指标列表页面

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, SortAsc, SortDesc } from 'lucide-react';
import { IndicatorCard } from '../components/IndicatorCard/IndicatorCard';
import { technicalIndicators } from '../data/indicators';
import { indicatorCategories } from '../data/categories';
import { type IndicatorCategory, type DifficultyLevel } from '../types/simple.ts';

export const IndicatorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'difficulty'>('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // 筛选和排序指标
  const filteredAndSortedIndicators = useMemo(() => {
    let filtered = technicalIndicators.filter(indicator => {
      // 搜索筛选
      const matchesSearch = searchQuery === '' || 
        indicator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // 分类筛选
      const matchesCategory = selectedCategory === 'all' || indicator.category === selectedCategory;

      // 难度筛选
      const matchesDifficulty = selectedDifficulty === 'all' || indicator.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'popularity':
          comparison = a.popularity - b.popularity;
          break;
        case 'difficulty':
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy, sortOrder]);

  const getDifficultyName = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初级';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return '全部';
    }
  };

  const getSortName = (sort: string) => {
    switch (sort) {
      case 'name': return '名称';
      case 'popularity': return '热度';
      case 'difficulty': return '难度';
      default: return '热度';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">技术指标大全</h1>
          <p className="text-lg text-gray-600">
            系统学习股票技术分析指标，掌握专业的分析技能
          </p>
        </motion.div>

        {/* 搜索和筛选栏 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          {/* 搜索框 */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索技术指标..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* 筛选按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>筛选</span>
              </button>

              {/* 视图切换 */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 筛选选项 */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 分类筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    指标分类
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">全部分类</option>
                    {indicatorCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 难度筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    难度等级
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">全部难度</option>
                    <option value="beginner">初级</option>
                    <option value="intermediate">中级</option>
                    <option value="advanced">高级</option>
                  </select>
                </div>

                {/* 排序方式 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序方式
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="popularity">按热度</option>
                    <option value="name">按名称</option>
                    <option value="difficulty">按难度</option>
                  </select>
                </div>

                {/* 排序顺序 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序顺序
                  </label>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center justify-center w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {sortOrder === 'asc' ? (
                      <>
                        <SortAsc className="h-4 w-4 mr-2" />
                        升序
                      </>
                    ) : (
                      <>
                        <SortDesc className="h-4 w-4 mr-2" />
                        降序
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 结果统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              找到 <span className="font-semibold text-gray-900">{filteredAndSortedIndicators.length}</span> 个技术指标
            </p>
            
            {/* 当前筛选条件 */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {selectedCategory !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {indicatorCategories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedDifficulty !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  {getDifficultyName(selectedDifficulty)}
                </span>
              )}
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {getSortName(sortBy)} {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 指标列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {filteredAndSortedIndicators.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredAndSortedIndicators.map((indicator, index) => (
                <IndicatorCard
                  key={indicator.id}
                  indicator={indicator}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                没有找到匹配的技术指标
              </h3>
              <p className="text-gray-500 mb-4">
                请尝试调整搜索条件或筛选选项
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                清除所有筛选条件
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

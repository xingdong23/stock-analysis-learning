// 技术指标相关的自定义Hook

import { useState, useMemo } from 'react';
import { technicalIndicators } from '../data/indicators';
import { IndicatorCategory, type DifficultyLevel, type TechnicalIndicator } from '../types/simple.ts';

export interface UseIndicatorsOptions {
  searchQuery?: string;
  category?: IndicatorCategory | 'all';
  difficulty?: DifficultyLevel | 'all';
  tags?: string[];
  sortBy?: 'name' | 'popularity' | 'difficulty' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const useIndicators = (options: UseIndicatorsOptions = {}) => {
  const {
    searchQuery = '',
    category = 'all',
    difficulty = 'all',
    tags = [],
    sortBy = 'popularity',
    sortOrder = 'desc'
  } = options;

  // 筛选和排序指标
  const filteredIndicators = useMemo(() => {
    let filtered = technicalIndicators.filter(indicator => {
      // 搜索筛选
      const matchesSearch = searchQuery === '' || 
        indicator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.detailedDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        indicator.keyPoints.some(point => point.toLowerCase().includes(searchQuery.toLowerCase()));

      // 分类筛选
      const matchesCategory = category === 'all' || indicator.category === category;

      // 难度筛选
      const matchesDifficulty = difficulty === 'all' || indicator.difficulty === difficulty;

      // 标签筛选
      const matchesTags = tags.length === 0 || 
        tags.some(tag => indicator.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesDifficulty && matchesTags;
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
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [searchQuery, category, difficulty, tags, sortBy, sortOrder]);

  // 获取指标统计信息
  const statistics = useMemo(() => {
    const total = technicalIndicators.length;
    const byCategory = {
      trend: technicalIndicators.filter(i => i.category === IndicatorCategory.TREND).length,
      momentum: technicalIndicators.filter(i => i.category === IndicatorCategory.MOMENTUM).length,
      volume: technicalIndicators.filter(i => i.category === IndicatorCategory.VOLUME).length,
      volatility: technicalIndicators.filter(i => i.category === IndicatorCategory.VOLATILITY).length,
      theory: technicalIndicators.filter(i => i.category === IndicatorCategory.THEORY).length,
    };
    
    const byDifficulty = {
      beginner: technicalIndicators.filter(i => i.difficulty === 'beginner').length,
      intermediate: technicalIndicators.filter(i => i.difficulty === 'intermediate').length,
      advanced: technicalIndicators.filter(i => i.difficulty === 'advanced').length,
    };

    return {
      total,
      byCategory,
      byDifficulty,
      filtered: filteredIndicators.length
    };
  }, [filteredIndicators.length]);

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    technicalIndicators.forEach(indicator => {
      indicator.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, []);

  // 获取热门指标
  const popularIndicators = useMemo(() => {
    return [...technicalIndicators]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6);
  }, []);

  // 获取最新指标
  const latestIndicators = useMemo(() => {
    return [...technicalIndicators]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, []);

  // 根据ID获取指标
  const getIndicatorById = (id: string): TechnicalIndicator | undefined => {
    return technicalIndicators.find(indicator => indicator.id === id);
  };

  // 获取相关指标
  const getRelatedIndicators = (indicatorId: string): TechnicalIndicator[] => {
    const indicator = getIndicatorById(indicatorId);
    if (!indicator) return [];

    return indicator.relatedIndicators
      .map(id => getIndicatorById(id))
      .filter((ind): ind is TechnicalIndicator => ind !== undefined);
  };

  // 搜索建议
  const getSearchSuggestions = (query: string): string[] => {
    if (query.length < 2) return [];

    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();

    technicalIndicators.forEach(indicator => {
      // 指标名称匹配
      if (indicator.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(indicator.name);
      }
      
      // 英文名称匹配
      if (indicator.englishName.toLowerCase().includes(lowerQuery)) {
        suggestions.add(indicator.englishName);
      }

      // 标签匹配
      indicator.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, 8);
  };

  return {
    indicators: filteredIndicators,
    statistics,
    allTags,
    popularIndicators,
    latestIndicators,
    getIndicatorById,
    getRelatedIndicators,
    getSearchSuggestions
  };
};

// 学习进度管理Hook
export const useLearningProgress = () => {
  const [progress, setProgress] = useState<Record<string, {
    status: 'not_started' | 'in_progress' | 'completed';
    lastAccessTime: string;
    completionPercentage: number;
    notes?: string;
  }>>({});

  const updateProgress = (
    indicatorId: string, 
    status: 'not_started' | 'in_progress' | 'completed',
    completionPercentage: number = 0,
    notes?: string
  ) => {
    setProgress(prev => ({
      ...prev,
      [indicatorId]: {
        status,
        lastAccessTime: new Date().toISOString(),
        completionPercentage,
        notes
      }
    }));
  };

  const getProgress = (indicatorId: string) => {
    return progress[indicatorId] || {
      status: 'not_started' as const,
      lastAccessTime: '',
      completionPercentage: 0
    };
  };

  const getOverallProgress = () => {
    const totalIndicators = technicalIndicators.length;
    const completedCount = Object.values(progress).filter(p => p.status === 'completed').length;
    const inProgressCount = Object.values(progress).filter(p => p.status === 'in_progress').length;
    
    return {
      total: totalIndicators,
      completed: completedCount,
      inProgress: inProgressCount,
      notStarted: totalIndicators - completedCount - inProgressCount,
      completionRate: totalIndicators > 0 ? (completedCount / totalIndicators) * 100 : 0
    };
  };

  return {
    updateProgress,
    getProgress,
    getOverallProgress
  };
};

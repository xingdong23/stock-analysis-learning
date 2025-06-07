// 简化的类型定义文件 - 用于测试

export enum IndicatorCategory {
  TREND = 'trend',
  MOMENTUM = 'momentum',
  VOLUME = 'volume',
  VOLATILITY = 'volatility',
  THEORY = 'theory'
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DifficultyInfo {
  name: string;
  color: string;
  description: string;
}

export interface TechnicalIndicator {
  id: string;
  name: string;
  englishName: string;
  category: IndicatorCategory;
  difficulty: DifficultyLevel;
  description: string;
  detailedDescription: string;
  formulas: Array<{
    name: string;
    formula: string;
    explanation: string;
    variables: Record<string, string>;
  }>;
  parameters: Array<{
    name: string;
    description: string;
    defaultValue: number;
    min: number;
    max: number;
    step: number;
  }>;
  usageScenarios: string[];
  marketConditions: string[];
  signals: Array<{
    type: 'buy' | 'sell' | 'hold';
    condition: string;
    description: string;
    strength: 'weak' | 'medium' | 'strong';
  }>;
  keyPoints: string[];
  commonMistakes: string[];
  examples: Array<{
    title: string;
    description: string;
    analysis: string;
    result: string;
  }>;
  relatedIndicators: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  popularity: number;
}

export interface CategoryInfo {
  id: IndicatorCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

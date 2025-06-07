// 模拟练习页面

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, CheckCircle, XCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { TechnicalChart } from '../components/Chart/TechnicalChart';
import { technicalIndicators } from '../data/indicators';

interface Question {
  id: string;
  type: 'chart_analysis' | 'signal_identification' | 'theory_application';
  question: string;
  chartType: 'candlestick' | 'ma' | 'rsi' | 'macd';
  options: string[];
  correctAnswer: number;
  explanation: string;
  relatedIndicator: string;
}

const practiceQuestions: Question[] = [
  {
    id: 'q1',
    type: 'signal_identification',
    question: '观察下方MACD图表，当前形成了什么信号？',
    chartType: 'macd',
    options: [
      'DIF线上穿DEA线，形成金叉买入信号',
      'DIF线下穿DEA线，形成死叉卖出信号',
      'MACD柱状图由负转正，确认上涨趋势',
      '没有明显信号，继续观察'
    ],
    correctAnswer: 0,
    explanation: '当DIF线从下方向上突破DEA线时，形成金叉，这是MACD指标的经典买入信号。同时要注意成交量的配合确认。',
    relatedIndicator: 'macd'
  },
  {
    id: 'q2',
    type: 'chart_analysis',
    question: '根据RSI指标的当前数值，市场处于什么状态？',
    chartType: 'rsi',
    options: [
      '超买状态，RSI > 70',
      '超卖状态，RSI < 30',
      '正常区间，30 < RSI < 70',
      '指标钝化，需要结合其他指标'
    ],
    correctAnswer: 2,
    explanation: 'RSI在30-70之间属于正常区间，表示市场既不超买也不超卖。只有当RSI超过70或低于30时，才考虑超买超卖信号。',
    relatedIndicator: 'rsi'
  },
  {
    id: 'q3',
    type: 'theory_application',
    question: '观察移动平均线图表，5日均线和20日均线的关系说明了什么？',
    chartType: 'ma',
    options: [
      '短期均线在长期均线之上，趋势向好',
      '短期均线在长期均线之下，趋势偏弱',
      '两条均线纠缠，市场处于震荡状态',
      '均线发散，趋势明确'
    ],
    correctAnswer: 0,
    explanation: '当短期移动平均线位于长期移动平均线之上时，表明短期价格强于长期价格，通常被视为上涨趋势的信号。',
    relatedIndicator: 'ma'
  }
];

export const PracticePage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(practiceQuestions.length).fill(false));

  const question = practiceQuestions[currentQuestion];

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    
    if (selectedAnswer === question.correctAnswer) {
      if (!answeredQuestions[currentQuestion]) {
        setScore(prev => prev + 1);
      }
    }
    
    const newAnsweredQuestions = [...answeredQuestions];
    newAnsweredQuestions[currentQuestion] = true;
    setAnsweredQuestions(newAnsweredQuestions);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < practiceQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredQuestions(new Array(practiceQuestions.length).fill(false));
  };

  const getRelatedIndicator = () => {
    return technicalIndicators.find(indicator => indicator.id === question.relatedIndicator);
  };

  const isCorrect = selectedAnswer === question.correctAnswer;
  const progress = ((currentQuestion + 1) / practiceQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">技术指标模拟练习</h1>
          <p className="text-lg text-gray-600">
            通过实际图表练习，提升你的技术分析能力
          </p>
        </motion.div>

        {/* 进度条 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                题目 {currentQuestion + 1} / {practiceQuestions.length}
              </span>
              <span className="text-sm text-gray-500">
                得分: {score} / {answeredQuestions.filter(Boolean).length}
              </span>
            </div>
            <button
              onClick={handleRestart}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span>重新开始</span>
            </button>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>

        {/* 练习内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 图表区域 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 图表分析
            </h3>
            <TechnicalChart 
              indicatorType={question.chartType}
              height={400}
              title={`${question.relatedIndicator.toUpperCase()}指标练习`}
            />
            
            {/* 相关指标信息 */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  相关指标: {getRelatedIndicator()?.name}
                </span>
              </div>
              <p className="text-sm text-blue-700">
                {getRelatedIndicator()?.description}
              </p>
            </div>
          </motion.div>

          {/* 问题区域 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ❓ 问题 {currentQuestion + 1}
            </h3>
            
            <p className="text-gray-700 mb-6 leading-relaxed">
              {question.question}
            </p>

            {/* 选项 */}
            <div className="space-y-3 mb-6">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedAnswer === index
                      ? showResult
                        ? index === question.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-red-500 bg-red-50 text-red-800'
                        : 'border-blue-500 bg-blue-50 text-blue-800'
                      : showResult && index === question.correctAnswer
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                    {showResult && selectedAnswer === index && (
                      index === question.correctAnswer ? (
                        <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 ml-auto" />
                      )
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 结果和解释 */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg mb-6 ${
                  isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? '回答正确！' : '回答错误'}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {question.explanation}
                  </p>
                </div>
              </motion.div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestion === 0}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一题
              </button>

              <div className="flex space-x-3">
                {!showResult ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    提交答案
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestion === practiceQuestions.length - 1}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {currentQuestion === practiceQuestions.length - 1 ? '练习完成' : '下一题'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 练习完成提示 */}
        {currentQuestion === practiceQuestions.length - 1 && showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl p-8 text-center"
          >
            <h3 className="text-2xl font-bold mb-4">🎉 练习完成！</h3>
            <p className="text-lg mb-4">
              你的得分：{score} / {practiceQuestions.length} 
              ({Math.round((score / practiceQuestions.length) * 100)}%)
            </p>
            <button
              onClick={handleRestart}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              再次练习
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

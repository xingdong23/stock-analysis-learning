// 技术指标数据

import { type TechnicalIndicator, IndicatorCategory } from '../types/simple.ts';

export const technicalIndicators: TechnicalIndicator[] = [
  {
    id: 'macd',
    name: 'MACD',
    englishName: 'Moving Average Convergence Divergence',
    category: IndicatorCategory.TREND,
    difficulty: 'intermediate',
    description: '移动平均收敛发散指标，用于判断趋势变化和买卖时机',
    detailedDescription: 'MACD是一种趋势跟踪动量指标，通过计算两条不同周期的指数移动平均线的差值来分析价格趋势的变化。它能够同时反映趋势方向和动量强度，是技术分析中最重要的指标之一。',
    
    formulas: [
      {
        name: 'DIF线',
        formula: 'DIF = EMA(12) - EMA(26)',
        explanation: '快线减慢线，反映短期与长期趋势的差异',
        variables: {
          'EMA(12)': '12日指数移动平均线',
          'EMA(26)': '26日指数移动平均线'
        }
      },
      {
        name: 'DEA线',
        formula: 'DEA = EMA(DIF, 9)',
        explanation: 'DIF的9日指数移动平均线，也称信号线',
        variables: {
          'DIF': 'DIF线数值',
          '9': '信号线周期参数'
        }
      },
      {
        name: 'MACD柱状图',
        formula: 'MACD = (DIF - DEA) × 2',
        explanation: 'DIF与DEA的差值乘以2，放大显示两线差异',
        variables: {
          'DIF': 'DIF线数值',
          'DEA': 'DEA线数值'
        }
      }
    ],
    
    parameters: [
      {
        name: '快线周期',
        description: '短期EMA的计算周期',
        defaultValue: 12,
        min: 5,
        max: 20,
        step: 1
      },
      {
        name: '慢线周期',
        description: '长期EMA的计算周期',
        defaultValue: 26,
        min: 20,
        max: 40,
        step: 1
      },
      {
        name: '信号线周期',
        description: 'DEA线的计算周期',
        defaultValue: 9,
        min: 5,
        max: 15,
        step: 1
      }
    ],
    
    usageScenarios: [
      '趋势确认和跟踪',
      '买卖时机判断',
      '背离分析',
      '趋势转折预警'
    ],
    
    marketConditions: [
      '趋势性市场效果最佳',
      '震荡市场容易产生假信号',
      '适用于中长期分析',
      '需要结合其他指标确认'
    ],
    
    signals: [
      {
        type: 'buy',
        condition: 'DIF上穿DEA形成金叉',
        description: '当DIF线从下方向上突破DEA线时，形成买入信号',
        strength: 'medium'
      },
      {
        type: 'sell',
        condition: 'DIF下穿DEA形成死叉',
        description: '当DIF线从上方向下跌破DEA线时，形成卖出信号',
        strength: 'medium'
      },
      {
        type: 'buy',
        condition: 'MACD柱状图由负转正',
        description: '当MACD柱状图从负值转为正值时，确认上涨趋势',
        strength: 'strong'
      },
      {
        type: 'sell',
        condition: 'MACD柱状图由正转负',
        description: '当MACD柱状图从正值转为负值时，确认下跌趋势',
        strength: 'strong'
      }
    ],
    
    keyPoints: [
      'MACD是趋势跟踪指标，具有滞后性',
      '金叉死叉是最基本的买卖信号',
      '背离现象往往预示趋势转折',
      '零轴上下反映多空力量对比',
      '柱状图变化领先于DIF和DEA线'
    ],
    
    commonMistakes: [
      '在震荡市场中盲目跟随金叉死叉信号',
      '忽略背离信号的重要性',
      '不结合价格走势单独使用MACD',
      '参数设置过于频繁调整',
      '忽略成交量的配合确认'
    ],
    
    examples: [
      {
        title: 'MACD金叉买入案例',
        description: '某股票在下跌后出现MACD金叉信号',
        analysis: 'DIF线上穿DEA线，同时MACD柱状图由负转正，确认上涨趋势开始',
        result: '后续股价上涨15%，信号有效'
      },
      {
        title: 'MACD背离卖出案例',
        description: '股价创新高但MACD指标未创新高',
        analysis: '价格与MACD出现顶背离，预示上涨动能衰竭',
        result: '后续股价回调20%，背离信号准确'
      }
    ],
    
    relatedIndicators: ['rsi', 'kdj', 'ma'],
    tags: ['趋势跟踪', '金叉死叉', '背离分析', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 95
  },
  
  {
    id: 'rsi',
    name: 'RSI',
    englishName: 'Relative Strength Index',
    category: IndicatorCategory.MOMENTUM,
    difficulty: 'beginner',
    description: '相对强弱指标，用于判断超买超卖状态',
    detailedDescription: 'RSI是一种动量振荡器，通过比较一段时期内的平均收盘涨数和平均收盘跌数来分析市场买卖盘的意向和实力，从而判断未来市场的走向。',
    
    formulas: [
      {
        name: 'RSI计算公式',
        formula: 'RSI = 100 - (100 / (1 + RS))',
        explanation: '相对强弱指数的基本计算公式',
        variables: {
          'RS': '相对强弱值，等于平均涨幅除以平均跌幅',
          '100': '标准化系数，使RSI值在0-100之间'
        }
      },
      {
        name: 'RS计算公式',
        formula: 'RS = 平均涨幅 / 平均跌幅',
        explanation: '相对强弱值的计算方法',
        variables: {
          '平均涨幅': 'N日内上涨日收盘价涨幅的平均值',
          '平均跌幅': 'N日内下跌日收盘价跌幅的平均值'
        }
      }
    ],
    
    parameters: [
      {
        name: '计算周期',
        description: 'RSI指标的计算天数',
        defaultValue: 14,
        min: 6,
        max: 30,
        step: 1
      }
    ],
    
    usageScenarios: [
      '判断超买超卖状态',
      '寻找买卖时机',
      '确认趋势强度',
      '背离分析'
    ],
    
    marketConditions: [
      '震荡市场效果较好',
      '趋势市场容易钝化',
      '适用于短中期分析',
      '需要结合支撑阻力位'
    ],
    
    signals: [
      {
        type: 'buy',
        condition: 'RSI从超卖区域(30以下)向上突破',
        description: '当RSI从30以下向上突破30时，表示超卖状态结束',
        strength: 'medium'
      },
      {
        type: 'sell',
        condition: 'RSI从超买区域(70以上)向下跌破',
        description: '当RSI从70以上向下跌破70时，表示超买状态结束',
        strength: 'medium'
      },
      {
        type: 'buy',
        condition: 'RSI底背离',
        description: '价格创新低而RSI未创新低，形成底背离',
        strength: 'strong'
      },
      {
        type: 'sell',
        condition: 'RSI顶背离',
        description: '价格创新高而RSI未创新高，形成顶背离',
        strength: 'strong'
      }
    ],
    
    keyPoints: [
      'RSI值在0-100之间波动',
      '70以上为超买区域，30以下为超卖区域',
      '背离信号比超买超卖信号更可靠',
      '强势市场中RSI可能长期保持高位',
      '弱势市场中RSI可能长期保持低位'
    ],
    
    commonMistakes: [
      '机械地按照70和30进行买卖操作',
      '忽略RSI的钝化现象',
      '不考虑市场整体趋势',
      '过分依赖单一指标',
      '忽略成交量的配合'
    ],
    
    examples: [
      {
        title: 'RSI超卖反弹案例',
        description: '某股票RSI跌至20以下后反弹',
        analysis: 'RSI进入深度超卖区域，随后向上突破30，确认反弹开始',
        result: '股价反弹12%，RSI信号有效'
      }
    ],
    
    relatedIndicators: ['macd', 'kdj', 'williams'],
    tags: ['超买超卖', '背离分析', '入门必学', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 90
  },

  // 布林带指标
  {
    id: 'bollinger_bands',
    name: '布林带',
    englishName: 'Bollinger Bands',
    category: IndicatorCategory.TREND,
    difficulty: 'intermediate',
    description: '基于统计学原理的趋势指标，用于判断价格的相对高低位置',
    detailedDescription: '布林带由约翰·布林格发明，是一种基于统计学原理的技术分析工具。它由三条线组成：中轨（移动平均线）、上轨（中轨+2倍标准差）、下轨（中轨-2倍标准差）。布林带能够动态调整宽度，反映市场波动性的变化。',

    formulas: [
      {
        name: '中轨（MB）',
        formula: 'MB = MA(CLOSE, N)',
        explanation: 'N日简单移动平均线，通常N=20',
        variables: {
          'MA': '移动平均线',
          'CLOSE': '收盘价',
          'N': '计算周期，默认20'
        }
      },
      {
        name: '上轨（UP）',
        formula: 'UP = MB + K × STD(CLOSE, N)',
        explanation: '中轨加上K倍标准差，通常K=2',
        variables: {
          'MB': '中轨值',
          'K': '标准差倍数，默认2',
          'STD': '标准差函数'
        }
      },
      {
        name: '下轨（DN）',
        formula: 'DN = MB - K × STD(CLOSE, N)',
        explanation: '中轨减去K倍标准差',
        variables: {
          'MB': '中轨值',
          'K': '标准差倍数，默认2',
          'STD': '标准差函数'
        }
      }
    ],

    parameters: [
      {
        name: '计算周期',
        description: '移动平均线的计算天数',
        defaultValue: 20,
        min: 10,
        max: 50,
        step: 1
      },
      {
        name: '标准差倍数',
        description: '上下轨距离中轨的标准差倍数',
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 0.1
      }
    ],

    usageScenarios: [
      '判断价格相对高低位置',
      '识别超买超卖状态',
      '预测价格突破方向',
      '测量市场波动性'
    ],

    marketConditions: [
      '震荡市场中效果最佳',
      '趋势市场中容易产生假突破',
      '适用于各种时间周期',
      '需要结合成交量确认'
    ],

    signals: [
      {
        type: 'buy',
        condition: '价格触及下轨后反弹',
        description: '当价格跌至下轨附近并出现反弹时，可能是买入机会',
        strength: 'medium'
      },
      {
        type: 'sell',
        condition: '价格触及上轨后回落',
        description: '当价格涨至上轨附近并出现回落时，可能是卖出机会',
        strength: 'medium'
      },
      {
        type: 'buy',
        condition: '布林带收缩后向上突破',
        description: '当布林带收缩后价格向上突破上轨，确认上涨趋势',
        strength: 'strong'
      },
      {
        type: 'sell',
        condition: '布林带收缩后向下突破',
        description: '当布林带收缩后价格向下突破下轨，确认下跌趋势',
        strength: 'strong'
      }
    ],

    keyPoints: [
      '布林带宽度反映市场波动性',
      '价格在布林带内运行的概率约95%',
      '布林带收缩往往预示着大行情',
      '中轨是重要的支撑阻力位',
      '需要结合其他指标确认信号'
    ],

    commonMistakes: [
      '认为价格触及上下轨就是绝对的买卖点',
      '忽略布林带宽度的变化',
      '在强趋势中逆势操作',
      '不考虑成交量的配合',
      '参数设置过于频繁调整'
    ],

    examples: [
      {
        title: '布林带收缩突破案例',
        description: '某股票经过长期横盘后布林带收缩',
        analysis: '布林带宽度收缩至历史低位，随后价格向上突破上轨，成交量放大',
        result: '后续股价上涨25%，突破信号有效'
      },
      {
        title: '布林带支撑反弹案例',
        description: '股价在下跌过程中触及布林带下轨',
        analysis: '价格跌至下轨获得支撑，出现长下影线，成交量萎缩',
        result: '股价从下轨反弹18%，支撑有效'
      }
    ],

    relatedIndicators: ['ma', 'rsi', 'macd'],
    tags: ['趋势跟踪', '支撑阻力', '波动率', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 88
  },

  // 移动平均线
  {
    id: 'ma',
    name: '移动平均线',
    englishName: 'Moving Average',
    category: IndicatorCategory.TREND,
    difficulty: 'beginner',
    description: '最基础的趋势跟踪指标，平滑价格波动显示趋势方向',
    detailedDescription: '移动平均线是技术分析中最基本也是最重要的指标之一。它通过计算一定时期内价格的平均值来平滑价格波动，从而更清晰地显示价格趋势的方向。常用的移动平均线包括简单移动平均线（SMA）、指数移动平均线（EMA）和加权移动平均线（WMA）。',

    formulas: [
      {
        name: '简单移动平均线（SMA）',
        formula: 'SMA = (C1 + C2 + ... + Cn) / n',
        explanation: 'n个周期收盘价的算术平均值',
        variables: {
          'C1, C2, ..., Cn': '各周期的收盘价',
          'n': '计算周期数'
        }
      },
      {
        name: '指数移动平均线（EMA）',
        formula: 'EMA = α × Ct + (1-α) × EMAt-1',
        explanation: '给予近期价格更高权重的移动平均线',
        variables: {
          'α': '平滑系数，α = 2/(n+1)',
          'Ct': '当前收盘价',
          'EMAt-1': '前一日EMA值'
        }
      }
    ],

    parameters: [
      {
        name: '短期均线周期',
        description: '短期移动平均线的计算天数',
        defaultValue: 5,
        min: 3,
        max: 20,
        step: 1
      },
      {
        name: '长期均线周期',
        description: '长期移动平均线的计算天数',
        defaultValue: 20,
        min: 10,
        max: 250,
        step: 1
      }
    ],

    usageScenarios: [
      '确定价格趋势方向',
      '寻找支撑阻力位',
      '生成买卖信号',
      '过滤市场噪音'
    ],

    marketConditions: [
      '趋势性市场效果最佳',
      '震荡市场容易产生假信号',
      '适用于所有时间周期',
      '需要结合成交量分析'
    ],

    signals: [
      {
        type: 'buy',
        condition: '短期均线上穿长期均线（金叉）',
        description: '当短期移动平均线从下方向上突破长期移动平均线时',
        strength: 'medium'
      },
      {
        type: 'sell',
        condition: '短期均线下穿长期均线（死叉）',
        description: '当短期移动平均线从上方向下跌破长期移动平均线时',
        strength: 'medium'
      },
      {
        type: 'buy',
        condition: '价格站上均线且均线向上',
        description: '价格突破移动平均线且均线方向向上',
        strength: 'strong'
      }
    ],

    keyPoints: [
      '移动平均线具有滞后性',
      '周期越长，滞后性越强但信号越可靠',
      '均线的方向反映趋势方向',
      '均线可以作为动态支撑阻力位',
      '多条均线组合使用效果更佳'
    ],

    commonMistakes: [
      '在震荡市场中频繁交易',
      '忽略均线的滞后性',
      '单纯依赖金叉死叉信号',
      '不考虑均线的斜率',
      '参数设置不当'
    ],

    examples: [
      {
        title: '均线金叉买入案例',
        description: '5日均线上穿20日均线形成金叉',
        analysis: '短期均线向上突破长期均线，成交量放大，确认上涨趋势',
        result: '后续股价上涨30%，金叉信号有效'
      }
    ],

    relatedIndicators: ['macd', 'bollinger_bands', 'ema'],
    tags: ['趋势跟踪', '支撑阻力', '入门必学', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 95
  },

  // KDJ随机指标
  {
    id: 'kdj',
    name: 'KDJ随机指标',
    englishName: 'KDJ Stochastic Oscillator',
    category: IndicatorCategory.MOMENTUM,
    difficulty: 'intermediate',
    description: '基于随机理论的动量指标，用于判断超买超卖和买卖时机',
    detailedDescription: 'KDJ指标是在KD指标基础上发展而来的，它综合了动量观念、强弱指标和移动平均线的优点。KDJ指标由K值、D值、J值三条曲线组成，其中J值的敏感性最强，K值次之，D值最稳定。',

    formulas: [
      {
        name: 'RSV（未成熟随机值）',
        formula: 'RSV = (Ct - Ln) / (Hn - Ln) × 100',
        explanation: '计算当前收盘价在最近n日价格区间中的相对位置',
        variables: {
          'Ct': '当日收盘价',
          'Ln': 'n日内最低价',
          'Hn': 'n日内最高价'
        }
      },
      {
        name: 'K值',
        formula: 'K = (2/3) × K前值 + (1/3) × RSV',
        explanation: 'RSV的移动平均值，初始值为50',
        variables: {
          'K前值': '前一日的K值',
          'RSV': '当日未成熟随机值'
        }
      },
      {
        name: 'D值',
        formula: 'D = (2/3) × D前值 + (1/3) × K',
        explanation: 'K值的移动平均值，初始值为50',
        variables: {
          'D前值': '前一日的D值',
          'K': '当日K值'
        }
      },
      {
        name: 'J值',
        formula: 'J = 3K - 2D',
        explanation: 'J值是K值和D值的加权平均，敏感性最强',
        variables: {
          'K': '当日K值',
          'D': '当日D值'
        }
      }
    ],

    parameters: [
      {
        name: '计算周期',
        description: 'RSV计算的天数',
        defaultValue: 9,
        min: 5,
        max: 20,
        step: 1
      },
      {
        name: 'K值平滑周期',
        description: 'K值的移动平均周期',
        defaultValue: 3,
        min: 2,
        max: 5,
        step: 1
      },
      {
        name: 'D值平滑周期',
        description: 'D值的移动平均周期',
        defaultValue: 3,
        min: 2,
        max: 5,
        step: 1
      }
    ],

    usageScenarios: [
      '判断超买超卖状态',
      '寻找买卖时机',
      '确认价格反转',
      '短线交易指导'
    ],

    marketConditions: [
      '震荡市场效果较好',
      '趋势市场容易钝化',
      '适用于短中期分析',
      '需要结合趋势分析'
    ],

    signals: [
      {
        type: 'buy',
        condition: 'K线上穿D线形成金叉',
        description: '当K线从下方向上突破D线时，形成买入信号',
        strength: 'medium'
      },
      {
        type: 'sell',
        condition: 'K线下穿D线形成死叉',
        description: '当K线从上方向下跌破D线时，形成卖出信号',
        strength: 'medium'
      },
      {
        type: 'buy',
        condition: 'KDJ在超卖区域金叉',
        description: '当KDJ在20以下的超卖区域形成金叉时',
        strength: 'strong'
      },
      {
        type: 'sell',
        condition: 'KDJ在超买区域死叉',
        description: '当KDJ在80以上的超买区域形成死叉时',
        strength: 'strong'
      }
    ],

    keyPoints: [
      'KDJ值在0-100之间波动',
      '80以上为超买区域，20以下为超卖区域',
      'J值最敏感，K值次之，D值最稳定',
      '金叉死叉是主要的买卖信号',
      '需要注意指标的钝化现象'
    ],

    commonMistakes: [
      '在强趋势中逆势操作',
      '忽略KDJ的钝化现象',
      '过分依赖单一信号',
      '不考虑市场整体环境',
      '参数调整过于频繁'
    ],

    examples: [
      {
        title: 'KDJ超卖金叉案例',
        description: '某股票KDJ在超卖区域形成金叉',
        analysis: 'KDJ指标在15附近形成金叉，J值率先向上，确认反弹开始',
        result: '股价反弹20%，KDJ信号有效'
      }
    ],

    relatedIndicators: ['rsi', 'macd', 'williams'],
    tags: ['超买超卖', '金叉死叉', '短线交易', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 85
  },

  // 威廉指标
  {
    id: 'williams',
    name: '威廉指标',
    englishName: 'Williams %R',
    category: IndicatorCategory.MOMENTUM,
    difficulty: 'intermediate',
    description: '衡量股价是否处于超买或超卖状态的动量指标',
    detailedDescription: '威廉指标（Williams %R）是由拉里·威廉斯发明的技术分析指标，用于衡量股价是否处于超买或超卖状态。该指标的计算原理与随机指标相似，但数值范围在-100到0之间，数值越接近0表示越超买，越接近-100表示越超卖。',

    formulas: [
      {
        name: 'Williams %R',
        formula: '%R = (Hn - Ct) / (Hn - Ln) × (-100)',
        explanation: '计算当前收盘价在最近n日价格区间中的相对位置',
        variables: {
          'Hn': 'n日内最高价',
          'Ct': '当日收盘价',
          'Ln': 'n日内最低价'
        }
      }
    ],

    parameters: [
      {
        name: '计算周期',
        description: 'Williams %R的计算天数',
        defaultValue: 14,
        min: 6,
        max: 30,
        step: 1
      }
    ],

    usageScenarios: [
      '判断超买超卖状态',
      '寻找短期反转机会',
      '确认价格转折点',
      '配合其他指标使用'
    ],

    marketConditions: [
      '震荡市场效果较好',
      '强趋势中容易钝化',
      '适用于短期分析',
      '需要结合成交量确认'
    ],

    signals: [
      {
        type: 'buy',
        condition: '%R从超卖区域(-80以下)向上突破',
        description: '当%R从-80以下向上突破-80时，表示超卖状态结束',
        strength: 'medium'
      },
      {
        type: 'sell',
        condition: '%R从超买区域(-20以上)向下跌破',
        description: '当%R从-20以上向下跌破-20时，表示超买状态结束',
        strength: 'medium'
      },
      {
        type: 'buy',
        condition: '%R底背离',
        description: '价格创新低而%R未创新低，形成底背离',
        strength: 'strong'
      },
      {
        type: 'sell',
        condition: '%R顶背离',
        description: '价格创新高而%R未创新高，形成顶背离',
        strength: 'strong'
      }
    ],

    keyPoints: [
      '%R值在-100到0之间波动',
      '-20以上为超买区域，-80以下为超卖区域',
      '背离信号比超买超卖信号更可靠',
      '与RSI指标原理相似但计算方法不同',
      '适合与其他指标组合使用'
    ],

    commonMistakes: [
      '机械地按照-20和-80进行买卖操作',
      '忽略威廉指标的钝化现象',
      '不考虑市场整体趋势',
      '过分依赖单一指标',
      '忽略背离信号的重要性'
    ],

    examples: [
      {
        title: '威廉指标超卖反弹案例',
        description: '某股票威廉指标跌至-90以下后反弹',
        analysis: '威廉指标进入深度超卖区域，随后向上突破-80，确认反弹开始',
        result: '股价反弹15%，威廉指标信号有效'
      }
    ],

    relatedIndicators: ['rsi', 'kdj', 'macd'],
    tags: ['超买超卖', '背离分析', '短线交易', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 75
  },

  // OBV能量潮指标
  {
    id: 'obv',
    name: 'OBV能量潮',
    englishName: 'On-Balance Volume',
    category: IndicatorCategory.VOLUME,
    difficulty: 'intermediate',
    description: '通过累计成交量变化来预测价格趋势的指标',
    detailedDescription: 'OBV（On-Balance Volume）能量潮指标是由约瑟夫·格兰维尔发明的技术分析工具。它基于"成交量先于价格"的理论，通过累计成交量的变化来预测价格的未来走势。OBV将成交量与价格变化相结合，当价格上涨时成交量为正，价格下跌时成交量为负。',

    formulas: [
      {
        name: 'OBV计算公式',
        formula: 'OBV = 前日OBV + 今日成交量×方向',
        explanation: '根据价格变化方向累计成交量',
        variables: {
          '方向': '价格上涨时为+1，下跌时为-1，平盘时为0',
          '今日成交量': '当日的成交量',
          '前日OBV': '前一日的OBV值'
        }
      }
    ],

    parameters: [
      {
        name: '平滑周期',
        description: 'OBV的移动平均周期（可选）',
        defaultValue: 10,
        min: 5,
        max: 30,
        step: 1
      }
    ],

    usageScenarios: [
      '确认价格趋势',
      '寻找背离信号',
      '预测趋势转折',
      '验证突破有效性'
    ],

    marketConditions: [
      '趋势性市场效果最佳',
      '适用于中长期分析',
      '需要结合价格走势分析',
      '在成交量活跃的市场中更有效'
    ],

    signals: [
      {
        type: 'buy',
        condition: 'OBV向上突破前期高点',
        description: '当OBV突破前期高点时，预示价格可能跟随上涨',
        strength: 'medium'
      },
      {
        type: 'sell',
        condition: 'OBV向下跌破前期低点',
        description: '当OBV跌破前期低点时，预示价格可能跟随下跌',
        strength: 'medium'
      },
      {
        type: 'buy',
        condition: 'OBV与价格正背离',
        description: '价格创新低而OBV未创新低，形成底背离',
        strength: 'strong'
      },
      {
        type: 'sell',
        condition: 'OBV与价格负背离',
        description: '价格创新高而OBV未创新高，形成顶背离',
        strength: 'strong'
      }
    ],

    keyPoints: [
      'OBV是累计性指标，反映资金流向',
      '背离信号是OBV最重要的应用',
      'OBV趋势应与价格趋势一致',
      '突破确认需要OBV配合',
      '适合与价格技术分析结合使用'
    ],

    commonMistakes: [
      '忽略OBV与价格的背离现象',
      '单独使用OBV而不结合价格分析',
      '在成交量不活跃的市场中过度依赖',
      '不考虑OBV的累计特性',
      '忽略OBV趋势线的重要性'
    ],

    examples: [
      {
        title: 'OBV背离预警案例',
        description: '某股票价格创新高但OBV未创新高',
        analysis: '股价连续上涨创新高，但OBV指标未能同步创新高，形成顶背离',
        result: '后续股价回调25%，OBV背离信号准确'
      }
    ],

    relatedIndicators: ['volume_ma', 'macd', 'rsi'],
    tags: ['量价关系', '背离分析', '趋势确认', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 80
  },

  // ATR平均真实波幅
  {
    id: 'atr',
    name: 'ATR平均真实波幅',
    englishName: 'Average True Range',
    category: IndicatorCategory.VOLATILITY,
    difficulty: 'intermediate',
    description: '衡量市场波动性的指标，用于风险管理和止损设置',
    detailedDescription: 'ATR（Average True Range）平均真实波幅是由威尔斯·威尔德发明的技术指标，用于衡量市场的波动性。ATR不预测价格方向，而是衡量价格变动的幅度。它通过计算真实波幅的移动平均值来反映市场的波动程度，是风险管理和止损设置的重要工具。',

    formulas: [
      {
        name: '真实波幅（TR）',
        formula: 'TR = MAX(H-L, |H-PC|, |L-PC|)',
        explanation: '当日最高价与最低价差值、最高价与前收盘价差值、最低价与前收盘价差值中的最大值',
        variables: {
          'H': '当日最高价',
          'L': '当日最低价',
          'PC': '前一日收盘价',
          'MAX': '取最大值函数'
        }
      },
      {
        name: 'ATR计算公式',
        formula: 'ATR = MA(TR, N)',
        explanation: 'N日真实波幅的移动平均值',
        variables: {
          'MA': '移动平均函数',
          'TR': '真实波幅',
          'N': '计算周期，通常为14'
        }
      }
    ],

    parameters: [
      {
        name: '计算周期',
        description: 'ATR的计算天数',
        defaultValue: 14,
        min: 7,
        max: 30,
        step: 1
      }
    ],

    usageScenarios: [
      '衡量市场波动性',
      '设置止损位置',
      '确定仓位大小',
      '识别市场状态变化'
    ],

    marketConditions: [
      '适用于所有市场环境',
      '波动性大的市场ATR值高',
      '波动性小的市场ATR值低',
      '可用于不同时间周期'
    ],

    signals: [
      {
        type: 'hold',
        condition: 'ATR值上升',
        description: '当ATR值上升时，表示市场波动性增加，需要谨慎操作',
        strength: 'medium'
      },
      {
        type: 'hold',
        condition: 'ATR值下降',
        description: '当ATR值下降时，表示市场波动性减少，可能进入整理期',
        strength: 'medium'
      }
    ],

    keyPoints: [
      'ATR不预测价格方向，只衡量波动性',
      'ATR值越高，市场波动性越大',
      '常用于设置止损和仓位管理',
      '可以识别市场状态的变化',
      '适合与趋势指标结合使用'
    ],

    commonMistakes: [
      '将ATR当作方向性指标使用',
      '忽略ATR在风险管理中的作用',
      '不根据ATR调整交易策略',
      '在低波动期过度交易',
      '不考虑ATR的相对水平'
    ],

    examples: [
      {
        title: 'ATR止损设置案例',
        description: '根据ATR值设置动态止损位',
        analysis: '当前ATR值为2.5，设置止损为入场价格减去2倍ATR（5元）',
        result: '有效控制了风险，避免了正常波动造成的止损'
      }
    ],

    relatedIndicators: ['bollinger_bands', 'rsi', 'macd'],
    tags: ['波动率', '风险管理', '止损设置', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 70
  },

  // 道氏理论
  {
    id: 'dow_theory',
    name: '道氏理论',
    englishName: 'Dow Theory',
    category: IndicatorCategory.THEORY,
    difficulty: 'advanced',
    description: '技术分析的鼻祖理论，奠定了现代技术分析的基础',
    detailedDescription: '道氏理论是技术分析的基础理论，由查尔斯·道创立。该理论认为市场价格反映一切信息，价格运动具有趋势性，并且这些趋势可以通过技术分析来识别和预测。道氏理论包含六大基本原则，是现代技术分析的理论基石。',

    formulas: [
      {
        name: '三重运动原理',
        formula: '主要趋势 + 次要趋势 + 日常波动',
        explanation: '市场价格运动由三种趋势组成',
        variables: {
          '主要趋势': '持续1年以上的长期趋势',
          '次要趋势': '持续3周到3个月的中期调整',
          '日常波动': '持续数天的短期波动'
        }
      }
    ],

    parameters: [
      {
        name: '主要趋势周期',
        description: '主要趋势的持续时间',
        defaultValue: 365,
        min: 180,
        max: 1095,
        step: 30
      }
    ],

    usageScenarios: [
      '判断市场主要趋势',
      '理解市场运动规律',
      '制定长期投资策略',
      '分析市场周期'
    ],

    marketConditions: [
      '适用于所有金融市场',
      '长期投资决策的重要依据',
      '需要结合基本面分析',
      '重视成交量的确认作用'
    ],

    signals: [
      {
        type: 'buy',
        condition: '主要趋势向上确认',
        description: '当工业指数和运输指数同时创新高时，确认牛市',
        strength: 'strong'
      },
      {
        type: 'sell',
        condition: '主要趋势向下确认',
        description: '当工业指数和运输指数同时创新低时，确认熊市',
        strength: 'strong'
      }
    ],

    keyPoints: [
      '市场价格反映一切信息',
      '价格运动具有趋势性',
      '主要趋势分为三个阶段',
      '指数必须相互确认',
      '成交量必须确认趋势',
      '趋势持续直到明确的反转信号出现'
    ],

    commonMistakes: [
      '忽视成交量的确认作用',
      '不理解三重运动的层次',
      '过分关注短期波动',
      '不等待指数相互确认',
      '混淆趋势的不同级别'
    ],

    examples: [
      {
        title: '道氏理论牛市确认案例',
        description: '2009年金融危机后的市场恢复',
        analysis: '工业指数和运输指数同时突破前期高点，成交量放大确认',
        result: '后续市场进入长达10年的牛市周期'
      }
    ],

    relatedIndicators: ['ma', 'macd', 'volume'],
    tags: ['技术理论', '趋势分析', '长期投资', '基础理论'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 92
  },

  // 支撑阻力理论
  {
    id: 'support_resistance',
    name: '支撑阻力理论',
    englishName: 'Support and Resistance Theory',
    category: IndicatorCategory.THEORY,
    difficulty: 'beginner',
    description: '技术分析中最基础的概念，用于识别价格的关键位置',
    detailedDescription: '支撑阻力理论是技术分析的核心概念之一。支撑位是指价格下跌过程中遇到买盘支撑而止跌的价位，阻力位是指价格上涨过程中遇到卖盘阻力而回落的价位。这些位置往往具有重要的心理意义和技术意义。',

    formulas: [
      {
        name: '支撑位识别',
        formula: '支撑位 = 前期低点 或 重要均线 或 整数关口',
        explanation: '通过历史价格数据识别潜在的支撑位置',
        variables: {
          '前期低点': '历史上的重要低点',
          '重要均线': '如20日、60日移动平均线',
          '整数关口': '如10元、20元等整数价位'
        }
      },
      {
        name: '阻力位识别',
        formula: '阻力位 = 前期高点 或 重要均线 或 整数关口',
        explanation: '通过历史价格数据识别潜在的阻力位置',
        variables: {
          '前期高点': '历史上的重要高点',
          '重要均线': '如20日、60日移动平均线',
          '整数关口': '如10元、20元等整数价位'
        }
      }
    ],

    parameters: [
      {
        name: '回测周期',
        description: '寻找支撑阻力位的历史周期',
        defaultValue: 60,
        min: 20,
        max: 250,
        step: 10
      }
    ],

    usageScenarios: [
      '确定买卖时机',
      '设置止损止盈位',
      '判断突破有效性',
      '制定交易计划'
    ],

    marketConditions: [
      '适用于所有市场环境',
      '震荡市场中更加明显',
      '需要结合成交量分析',
      '心理价位具有重要意义'
    ],

    signals: [
      {
        type: 'buy',
        condition: '价格在支撑位获得支撑',
        description: '当价格跌至支撑位附近并出现反弹时',
        strength: 'medium'
      },
      {
        type: 'sell',
        condition: '价格在阻力位遇到阻力',
        description: '当价格涨至阻力位附近并出现回落时',
        strength: 'medium'
      },
      {
        type: 'buy',
        condition: '有效突破阻力位',
        description: '当价格有效突破重要阻力位时',
        strength: 'strong'
      },
      {
        type: 'sell',
        condition: '有效跌破支撑位',
        description: '当价格有效跌破重要支撑位时',
        strength: 'strong'
      }
    ],

    keyPoints: [
      '支撑阻力位具有相互转换性',
      '成交量是确认突破的重要因素',
      '心理价位往往成为重要的支撑阻力',
      '多次测试的位置更加重要',
      '时间越久远的位置重要性越低'
    ],

    commonMistakes: [
      '忽视成交量的确认作用',
      '不理解支撑阻力的相对性',
      '过分依赖单一支撑阻力位',
      '不考虑市场整体环境',
      '忽视假突破的可能性'
    ],

    examples: [
      {
        title: '支撑位反弹案例',
        description: '某股票在重要支撑位获得支撑',
        analysis: '股价跌至前期低点附近，出现长下影线，成交量萎缩',
        result: '股价从支撑位反弹20%，支撑有效'
      }
    ],

    relatedIndicators: ['ma', 'bollinger_bands', 'volume'],
    tags: ['技术理论', '支撑阻力', '入门必学', '实战常用'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    popularity: 98
  }
];

// 导出指标数量统计函数
export const getIndicatorCountByCategory = (category: IndicatorCategory): number => {
  return technicalIndicators.filter(indicator => indicator.category === category).length;
};

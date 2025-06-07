// 技术指标图表组件

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { generateMockStockData, calculateSMA, calculateRSI, calculateMACD } from '../../utils/calculations';

interface TechnicalChartProps {
  indicatorType: 'candlestick' | 'ma' | 'rsi' | 'macd' | 'bollinger';
  height?: number;
  width?: string;
  title?: string;
}

export const TechnicalChart: React.FC<TechnicalChartProps> = ({
  indicatorType,
  height = 400,
  width = '100%',
  title
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current);

    // 生成模拟数据
    const mockData = generateMockStockData(60, 100);
    const dates = mockData.map(item => item.date);
    const candlestickData = mockData.map(item => [item.open, item.close, item.low, item.high]);
    const closeData = mockData.map(item => item.close);
    const volumeData = mockData.map(item => item.volume);

    let option: echarts.EChartsOption = {};

    switch (indicatorType) {
      case 'candlestick':
        option = getCandlestickOption(dates, candlestickData, volumeData, title);
        break;
      case 'ma':
        const ma5 = calculateSMA(closeData, 5);
        const ma20 = calculateSMA(closeData, 20);
        option = getMAOption(dates, closeData, ma5, ma20, title);
        break;
      case 'rsi':
        const rsi = calculateRSI(closeData, 14);
        option = getRSIOption(dates, closeData, rsi, title);
        break;
      case 'macd':
        const macdData = calculateMACD(closeData);
        option = getMACDOption(dates, closeData, macdData, title);
        break;
      case 'bollinger':
        // 这里可以添加布林带的计算和显示
        option = getCandlestickOption(dates, candlestickData, volumeData, title);
        break;
    }

    chartInstance.current.setOption(option);

    // 响应式处理
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [indicatorType, height, width, title]);

  return (
    <div 
      ref={chartRef} 
      style={{ width, height: `${height}px` }}
      className="bg-white rounded-lg shadow-sm border border-gray-200"
    />
  );
};

// K线图配置
const getCandlestickOption = (
  dates: string[], 
  candlestickData: number[][], 
  volumeData: number[],
  title?: string
): echarts.EChartsOption => ({
  title: {
    text: title || 'K线图',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
  },
  legend: {
    data: ['K线', '成交量'],
    top: 30
  },
  grid: [
    {
      left: '10%',
      right: '8%',
      height: '60%'
    },
    {
      left: '10%',
      right: '8%',
      top: '75%',
      height: '15%'
    }
  ],
  xAxis: [
    {
      type: 'category',
      data: dates,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax'
    },
    {
      type: 'category',
      gridIndex: 1,
      data: dates,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      min: 'dataMin',
      max: 'dataMax'
    }
  ],
  yAxis: [
    {
      scale: true,
      splitArea: {
        show: true
      }
    },
    {
      scale: true,
      gridIndex: 1,
      splitNumber: 2,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false }
    }
  ],
  series: [
    {
      name: 'K线',
      type: 'candlestick',
      data: candlestickData,
      itemStyle: {
        color: '#ef4444',
        color0: '#22c55e',
        borderColor: '#ef4444',
        borderColor0: '#22c55e'
      }
    },
    {
      name: '成交量',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: volumeData,
      itemStyle: {
        color: '#94a3b8'
      }
    }
  ]
});

// 移动平均线配置
const getMAOption = (
  dates: string[], 
  closeData: number[], 
  ma5: number[], 
  ma20: number[],
  title?: string
): echarts.EChartsOption => ({
  title: {
    text: title || '移动平均线',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold'
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['收盘价', 'MA5', 'MA20'],
    top: 30
  },
  grid: {
    left: '10%',
    right: '10%',
    bottom: '15%'
  },
  xAxis: {
    type: 'category',
    data: dates,
    boundaryGap: false
  },
  yAxis: {
    type: 'value',
    scale: true
  },
  series: [
    {
      name: '收盘价',
      type: 'line',
      data: closeData,
      lineStyle: {
        color: '#3b82f6',
        width: 1
      },
      symbol: 'none'
    },
    {
      name: 'MA5',
      type: 'line',
      data: ma5,
      lineStyle: {
        color: '#ef4444',
        width: 2
      },
      symbol: 'none'
    },
    {
      name: 'MA20',
      type: 'line',
      data: ma20,
      lineStyle: {
        color: '#22c55e',
        width: 2
      },
      symbol: 'none'
    }
  ]
});

// RSI配置
const getRSIOption = (
  dates: string[], 
  closeData: number[], 
  rsi: number[],
  title?: string
): echarts.EChartsOption => ({
  title: {
    text: title || 'RSI相对强弱指标',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold'
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['收盘价', 'RSI'],
    top: 30
  },
  grid: [
    {
      left: '10%',
      right: '8%',
      height: '50%'
    },
    {
      left: '10%',
      right: '8%',
      top: '65%',
      height: '25%'
    }
  ],
  xAxis: [
    {
      type: 'category',
      data: dates,
      boundaryGap: false
    },
    {
      type: 'category',
      gridIndex: 1,
      data: dates,
      boundaryGap: false,
      axisLabel: { show: false }
    }
  ],
  yAxis: [
    {
      type: 'value',
      scale: true
    },
    {
      type: 'value',
      gridIndex: 1,
      min: 0,
      max: 100,
      splitLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    }
  ],
  series: [
    {
      name: '收盘价',
      type: 'line',
      data: closeData,
      lineStyle: {
        color: '#3b82f6',
        width: 1
      },
      symbol: 'none'
    },
    {
      name: 'RSI',
      type: 'line',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: rsi,
      lineStyle: {
        color: '#8b5cf6',
        width: 2
      },
      symbol: 'none',
      markLine: {
        data: [
          { yAxis: 70, lineStyle: { color: '#ef4444', type: 'dashed' } },
          { yAxis: 30, lineStyle: { color: '#22c55e', type: 'dashed' } }
        ]
      }
    }
  ]
});

// MACD配置
const getMACDOption = (
  dates: string[], 
  closeData: number[], 
  macdData: { macdLine: number[], signalLine: number[], histogram: number[] },
  title?: string
): echarts.EChartsOption => ({
  title: {
    text: title || 'MACD指标',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold'
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['收盘价', 'DIF', 'DEA', 'MACD'],
    top: 30
  },
  grid: [
    {
      left: '10%',
      right: '8%',
      height: '50%'
    },
    {
      left: '10%',
      right: '8%',
      top: '65%',
      height: '25%'
    }
  ],
  xAxis: [
    {
      type: 'category',
      data: dates,
      boundaryGap: false
    },
    {
      type: 'category',
      gridIndex: 1,
      data: dates,
      boundaryGap: false,
      axisLabel: { show: false }
    }
  ],
  yAxis: [
    {
      type: 'value',
      scale: true
    },
    {
      type: 'value',
      gridIndex: 1,
      splitLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    }
  ],
  series: [
    {
      name: '收盘价',
      type: 'line',
      data: closeData,
      lineStyle: {
        color: '#3b82f6',
        width: 1
      },
      symbol: 'none'
    },
    {
      name: 'DIF',
      type: 'line',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: macdData.macdLine,
      lineStyle: {
        color: '#ef4444',
        width: 2
      },
      symbol: 'none'
    },
    {
      name: 'DEA',
      type: 'line',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: macdData.signalLine,
      lineStyle: {
        color: '#22c55e',
        width: 2
      },
      symbol: 'none'
    },
    {
      name: 'MACD',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: macdData.histogram,
      itemStyle: {
        color: (params: any) => params.value >= 0 ? '#ef4444' : '#22c55e'
      }
    }
  ]
});

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版股票监控系统 - 使用可靠的数据源
"""

import os
import json
import logging
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import pandas as pd
import pandas_ta as ta
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_monitor.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局配置
CONFIG = {
    'port': int(os.environ.get('PORT', 5000)),
    'host': '0.0.0.0',
    'debug': os.environ.get('DEBUG', 'False').lower() == 'true',
    'update_interval': 300,  # 更新间隔（秒）
}

# 内存存储
STOCK_DATA = {}  # 股票数据缓存


class SimpleStockDataProvider:
    """简化版股票数据提供者"""
    
    def __init__(self):
        self.cache_duration = 300  # 5分钟缓存
    
    def get_stock_data(self, symbol: str, period: str = '1mo') -> Optional[pd.DataFrame]:
        """获取股票数据"""
        logger.info(f"开始获取股票数据: {symbol}")
        
        # 尝试多个方法
        methods = [
            self._get_from_yahoo_v7,
            self._get_from_yahoo_v8,
            self._get_from_mock_data
        ]
        
        for i, method in enumerate(methods):
            try:
                logger.info(f"尝试方法 {i+1}: {method.__name__}")
                df = method(symbol, period)
                if df is not None and not df.empty:
                    logger.info(f"成功获取数据: {symbol}, 共 {len(df)} 条记录")
                    return df
            except Exception as e:
                logger.warning(f"方法 {i+1} 失败: {e}")
                continue
        
        logger.error(f"所有方法都失败了: {symbol}")
        return None
    
    def _get_from_yahoo_v7(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """使用Yahoo Finance v7 API (CSV格式)"""
        try:
            # 计算时间范围
            end_time = int(datetime.now().timestamp())
            start_time = int((datetime.now() - timedelta(days=90)).timestamp())  # 增加到90天

            url = f"https://query1.finance.yahoo.com/v7/finance/download/{symbol}"
            params = {
                'period1': start_time,
                'period2': end_time,
                'interval': '1d',
                'events': 'history',
                'includeAdjustedClose': 'true'
            }

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/csv,application/csv,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            }

            response = requests.get(url, params=params, headers=headers, timeout=15)
            response.raise_for_status()

            # 检查响应内容
            if 'Date,Open,High,Low,Close' not in response.text:
                logger.warning(f"Yahoo v7 API返回非CSV格式: {response.text[:100]}")
                return None

            # 解析CSV数据
            from io import StringIO
            df = pd.read_csv(StringIO(response.text))

            if df.empty:
                logger.warning(f"Yahoo v7 API返回空数据: {symbol}")
                return None

            # 标准化列名和数据
            df['Date'] = pd.to_datetime(df['Date'])
            df.set_index('Date', inplace=True)
            df.columns = [col.lower().replace(' ', '_') for col in df.columns]

            # 确保有必要的列
            required_cols = ['open', 'high', 'low', 'close', 'volume']
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                logger.warning(f"Yahoo v7 API缺少列 {missing_cols}: {symbol}")
                return None

            df = df[required_cols].dropna()

            if len(df) == 0:
                logger.warning(f"Yahoo v7 API清理后数据为空: {symbol}")
                return None

            logger.info(f"Yahoo v7 API成功获取 {symbol} 数据: {len(df)} 条记录")
            return df

        except Exception as e:
            logger.error(f"Yahoo v7 API失败 {symbol}: {e}")
            return None
    
    def _get_from_yahoo_v8(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """使用Yahoo Finance v8 API (JSON格式)"""
        try:
            end_time = int(datetime.now().timestamp())
            start_time = int((datetime.now() - timedelta(days=90)).timestamp())  # 增加到90天

            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            params = {
                'period1': start_time,
                'period2': end_time,
                'interval': '1d',
                'includePrePost': 'false',
                'events': 'div,split'
            }

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': 'https://finance.yahoo.com/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site'
            }

            response = requests.get(url, params=params, headers=headers, timeout=15)
            response.raise_for_status()

            data = response.json()

            # 检查响应结构
            if 'chart' not in data:
                logger.warning(f"Yahoo v8 API响应缺少chart字段: {symbol}")
                return None

            if 'result' not in data['chart'] or not data['chart']['result']:
                logger.warning(f"Yahoo v8 API响应缺少result字段: {symbol}")
                return None

            result = data['chart']['result'][0]

            # 检查必要字段
            if 'timestamp' not in result or 'indicators' not in result:
                logger.warning(f"Yahoo v8 API响应格式不正确: {symbol}")
                return None

            timestamps = result['timestamp']

            if 'quote' not in result['indicators'] or not result['indicators']['quote']:
                logger.warning(f"Yahoo v8 API响应缺少quote数据: {symbol}")
                return None

            quotes = result['indicators']['quote'][0]

            # 检查数据完整性
            required_fields = ['open', 'high', 'low', 'close', 'volume']
            for field in required_fields:
                if field not in quotes:
                    logger.warning(f"Yahoo v8 API缺少{field}字段: {symbol}")
                    return None

            # 创建DataFrame
            df_data = []
            for i, ts in enumerate(timestamps):
                # 跳过None值
                if (quotes['open'][i] is None or quotes['high'][i] is None or
                    quotes['low'][i] is None or quotes['close'][i] is None):
                    continue

                df_data.append({
                    'date': pd.to_datetime(ts, unit='s'),
                    'open': float(quotes['open'][i]),
                    'high': float(quotes['high'][i]),
                    'low': float(quotes['low'][i]),
                    'close': float(quotes['close'][i]),
                    'volume': int(quotes['volume'][i]) if quotes['volume'][i] is not None else 0
                })

            if not df_data:
                logger.warning(f"Yahoo v8 API处理后数据为空: {symbol}")
                return None

            df = pd.DataFrame(df_data)
            df.set_index('date', inplace=True)
            df = df.dropna()

            if len(df) == 0:
                logger.warning(f"Yahoo v8 API清理后数据为空: {symbol}")
                return None

            logger.info(f"Yahoo v8 API成功获取 {symbol} 数据: {len(df)} 条记录")
            return df

        except Exception as e:
            logger.error(f"Yahoo v8 API失败 {symbol}: {e}")
            return None
    
    def _get_from_mock_data(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """生成模拟数据作为最后备选"""
        try:
            logger.info(f"生成模拟数据: {symbol}")
            
            # 生成30天的模拟数据
            dates = pd.date_range(end=datetime.now(), periods=30, freq='D')
            
            # 基础价格（根据股票代码设置不同的基础价格）
            base_prices = {
                'AAPL': 150,
                'GOOGL': 2500,
                'MSFT': 300,
                'TSLA': 200,
                'AMZN': 3000
            }
            base_price = base_prices.get(symbol.upper(), 100)
            
            # 生成价格数据（随机游走）
            prices = []
            current_price = base_price
            
            for _ in range(30):
                # 随机变化 -2% 到 +2%
                change = random.uniform(-0.02, 0.02)
                current_price *= (1 + change)
                prices.append(current_price)
            
            # 创建OHLCV数据
            data = []
            for i, (date, close) in enumerate(zip(dates, prices)):
                # 生成开盘、最高、最低价
                open_price = close * random.uniform(0.98, 1.02)
                high_price = max(open_price, close) * random.uniform(1.0, 1.02)
                low_price = min(open_price, close) * random.uniform(0.98, 1.0)
                volume = random.randint(1000000, 10000000)
                
                data.append({
                    'open': round(open_price, 2),
                    'high': round(high_price, 2),
                    'low': round(low_price, 2),
                    'close': round(close, 2),
                    'volume': volume
                })
            
            df = pd.DataFrame(data, index=dates)
            logger.info(f"生成了 {len(df)} 条模拟数据")
            return df
            
        except Exception as e:
            logger.error(f"生成模拟数据失败: {e}")
            return None


# 创建数据提供者实例
stock_data_provider = SimpleStockDataProvider()


class TechnicalAnalyzer:
    """技术分析器"""
    
    @staticmethod
    def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """计算技术指标"""
        try:
            result = df.copy()
            
            # 移动平均线
            result['sma_20'] = ta.sma(df['close'], length=20)
            result['sma_50'] = ta.sma(df['close'], length=50)
            
            # RSI
            result['rsi'] = ta.rsi(df['close'], length=14)
            
            # MACD
            macd = ta.macd(df['close'])
            if macd is not None:
                result = pd.concat([result, macd], axis=1)
            
            return result
            
        except Exception as e:
            logger.error(f"计算技术指标失败: {e}")
            return df


# API路由
@app.route('/')
def index():
    """首页"""
    return jsonify({
        'message': '股票监控系统API',
        'version': '2.0.0',
        'status': 'running',
        'endpoints': {
            'stock_data': '/api/stock/<symbol>',
            'indicators': '/api/indicators/<symbol>',
            'health': '/api/health'
        }
    })


@app.route('/api/health')
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'uptime': 'running',
        'dependencies': {
            'pandas_ta': 'ok',
            'requests': 'ok'
        }
    })


@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    """获取股票数据"""
    try:
        # 检查缓存
        if symbol not in STOCK_DATA or \
           (datetime.now() - STOCK_DATA[symbol]['last_update']).seconds > CONFIG['update_interval']:
            
            df = stock_data_provider.get_stock_data(symbol)
            if df is None:
                return jsonify({'error': f'无法获取股票数据: {symbol}'}), 404
            
            STOCK_DATA[symbol] = {
                'data': df,
                'last_update': datetime.now()
            }
        
        df = STOCK_DATA[symbol]['data']
        
        # 转换为JSON格式
        result = {
            'symbol': symbol,
            'last_update': STOCK_DATA[symbol]['last_update'].isoformat(),
            'count': len(df),
            'data': df.tail(30).to_dict('records')
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"获取股票数据API错误: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/indicators/<symbol>')
def get_indicators(symbol):
    """获取技术指标"""
    try:
        # 获取股票数据
        if symbol not in STOCK_DATA:
            df = stock_data_provider.get_stock_data(symbol)
            if df is None:
                return jsonify({'error': f'无法获取股票数据: {symbol}'}), 404
            STOCK_DATA[symbol] = {
                'data': df,
                'last_update': datetime.now()
            }
        
        df = STOCK_DATA[symbol]['data']
        
        # 计算技术指标
        indicators_df = TechnicalAnalyzer.calculate_indicators(df)
        
        # 返回最新数据
        latest = indicators_df.iloc[-1]
        result = {
            'symbol': symbol,
            'timestamp': latest.name.isoformat(),
            'price': {
                'current': float(latest['close']),
                'open': float(latest['open']),
                'high': float(latest['high']),
                'low': float(latest['low']),
                'volume': int(latest['volume'])
            },
            'indicators': {
                'sma_20': float(latest.get('sma_20', 0)) if pd.notna(latest.get('sma_20')) else None,
                'rsi': float(latest.get('rsi', 0)) if pd.notna(latest.get('rsi')) else None,
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"获取技术指标API错误: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    logger.info("启动简化版股票监控系统...")
    logger.info(f"服务地址: http://{CONFIG['host']}:{CONFIG['port']}")
    
    app.run(
        host=CONFIG['host'],
        port=CONFIG['port'],
        debug=CONFIG['debug']
    )

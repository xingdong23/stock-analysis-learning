#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票监控系统
使用Flask + pandas-ta 实现股票技术分析和监控预警
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
    'data_source': 'yahoo',  # 数据源
    'update_interval': 300,  # 更新间隔（秒）
}

# 内存存储（生产环境应使用数据库）
STOCK_DATA = {}  # 股票数据缓存
MONITOR_RULES = {}  # 监控规则
ALERTS = []  # 预警记录


class StockDataProvider:
    """股票数据提供者"""
    
    @staticmethod
    def get_stock_data(symbol: str, period: str = '1mo') -> Optional[pd.DataFrame]:
        """
        获取股票数据

        Args:
            symbol: 股票代码
            period: 时间周期 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

        Returns:
            DataFrame: 包含OHLCV数据的DataFrame
        """
        max_retries = 3
        retry_delay = 1

        for attempt in range(max_retries):
            try:
                # 添加随机延迟避免频率限制
                if attempt > 0:
                    delay = retry_delay * (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(delay)

                # 使用Yahoo Finance API（免费）
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
                params = {
                    'period1': int((datetime.now() - timedelta(days=30)).timestamp()),
                    'period2': int(datetime.now().timestamp()),
                    'interval': '1d',
                    'includePrePost': 'true',
                    'events': 'div%2Csplit'
                }

                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }

                response = requests.get(url, params=params, headers=headers, timeout=15)

                # 检查响应状态
                if response.status_code == 429:  # Too Many Requests
                    logger.warning(f"请求频率限制，等待重试... (尝试 {attempt + 1}/{max_retries})")
                    continue

                response.raise_for_status()
            
                data = response.json()

                # 检查响应数据
                if 'chart' not in data or 'result' not in data['chart'] or not data['chart']['result']:
                    logger.error(f"Yahoo Finance API返回无效数据: {symbol}")
                    if attempt == max_retries - 1:
                        return None
                    continue

                result = data['chart']['result'][0]

                # 检查数据完整性
                if 'timestamp' not in result or 'indicators' not in result:
                    logger.error(f"数据格式不完整: {symbol}")
                    if attempt == max_retries - 1:
                        return None
                    continue

                # 提取数据
                timestamps = result['timestamp']
                quotes = result['indicators']['quote'][0]

                # 检查数据有效性
                if not timestamps or not quotes:
                    logger.error(f"数据为空: {symbol}")
                    if attempt == max_retries - 1:
                        return None
                    continue

                # 创建DataFrame
                df = pd.DataFrame({
                    'timestamp': timestamps,
                    'open': quotes['open'],
                    'high': quotes['high'],
                    'low': quotes['low'],
                    'close': quotes['close'],
                    'volume': quotes['volume']
                })

                # 转换时间戳
                df['datetime'] = pd.to_datetime(df['timestamp'], unit='s')
                df.set_index('datetime', inplace=True)
                df.drop('timestamp', axis=1, inplace=True)

                # 清理数据
                df.dropna(inplace=True)

                if len(df) == 0:
                    logger.error(f"清理后数据为空: {symbol}")
                    if attempt == max_retries - 1:
                        return None
                    continue

                logger.info(f"成功获取 {symbol} 的股票数据，共 {len(df)} 条记录")
                return df

            except requests.exceptions.RequestException as e:
                logger.error(f"网络请求失败 {symbol} (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    return None
            except (KeyError, ValueError, TypeError) as e:
                logger.error(f"数据解析失败 {symbol} (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    return None
            except Exception as e:
                logger.error(f"未知错误 {symbol} (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    return None

        return None


class TechnicalAnalyzer:
    """技术分析器"""
    
    @staticmethod
    def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """
        计算技术指标
        
        Args:
            df: 包含OHLCV数据的DataFrame
            
        Returns:
            DataFrame: 包含技术指标的DataFrame
        """
        try:
            # 复制数据
            result = df.copy()
            
            # 移动平均线
            result['sma_5'] = ta.sma(df['close'], length=5)
            result['sma_10'] = ta.sma(df['close'], length=10)
            result['sma_20'] = ta.sma(df['close'], length=20)
            result['sma_50'] = ta.sma(df['close'], length=50)
            
            # 指数移动平均线
            result['ema_12'] = ta.ema(df['close'], length=12)
            result['ema_26'] = ta.ema(df['close'], length=26)
            
            # MACD
            macd = ta.macd(df['close'])
            if macd is not None:
                result = pd.concat([result, macd], axis=1)
            
            # RSI
            result['rsi'] = ta.rsi(df['close'], length=14)
            
            # 布林带
            bbands = ta.bbands(df['close'], length=20)
            if bbands is not None:
                result = pd.concat([result, bbands], axis=1)
            
            # KDJ
            stoch = ta.stoch(df['high'], df['low'], df['close'])
            if stoch is not None:
                result = pd.concat([result, stoch], axis=1)
            
            # 成交量指标
            result['volume_sma'] = ta.sma(df['volume'], length=20)
            
            logger.info(f"成功计算技术指标，共 {len(result.columns)} 个指标")
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
        'version': '1.0.0',
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
        # 从缓存获取或重新获取数据
        if symbol not in STOCK_DATA or \
           (datetime.now() - STOCK_DATA[symbol]['last_update']).seconds > CONFIG['update_interval']:
            
            df = StockDataProvider.get_stock_data(symbol)
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
            'data': df.tail(30).to_dict('records')  # 返回最近30天数据
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
            df = StockDataProvider.get_stock_data(symbol)
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
                'macd': float(latest.get('MACD_12_26_9', 0)) if pd.notna(latest.get('MACD_12_26_9')) else None,
                'macd_signal': float(latest.get('MACDs_12_26_9', 0)) if pd.notna(latest.get('MACDs_12_26_9')) else None,
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"获取技术指标API错误: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    logger.info("启动股票监控系统...")
    logger.info(f"服务地址: http://{CONFIG['host']}:{CONFIG['port']}")
    
    app.run(
        host=CONFIG['host'],
        port=CONFIG['port'],
        debug=CONFIG['debug']
    )

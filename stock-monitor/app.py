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
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import sqlite3
from pathlib import Path

import pandas as pd
import pandas_ta as ta
import requests
import yfinance as yf
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
    'cache_duration': 3600,  # 缓存时间（秒）
    # API配置
    'api_keys': {
        'alphavantage': os.environ.get('ALPHAVANTAGE_API_KEY', 'demo'),
        'polygon': os.environ.get('POLYGON_API_KEY', ''),
        'finnhub': os.environ.get('FINNHUB_API_KEY', ''),
    },
    'api_limits': {
        'alphavantage': {'requests_per_minute': 5, 'requests_per_day': 500},
        'polygon': {'requests_per_minute': 5, 'requests_per_day': 1000},
        'finnhub': {'requests_per_minute': 60, 'requests_per_day': 1000},
        'yfinance': {'requests_per_minute': 30, 'requests_per_day': 10000},  # 估算值
    }
}

# 数据缓存配置
CACHE_DIR = Path("data/cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DB = CACHE_DIR / "stock_cache.db"

# 初始化缓存数据库
def init_cache_db():
    """初始化缓存数据库"""
    conn = sqlite3.connect(CACHE_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stock_cache (
            symbol TEXT,
            period TEXT,
            data TEXT,
            timestamp REAL,
            PRIMARY KEY (symbol, period)
        )
    ''')
    conn.commit()
    conn.close()

init_cache_db()

# 内存存储（生产环境应使用数据库）
STOCK_DATA = {}  # 股票数据缓存
MONITOR_RULES = {}  # 监控规则
ALERTS = []  # 预警记录

# API请求计数器
API_USAGE = {
    'alphavantage': {'minute': [], 'day': []},
    'polygon': {'minute': [], 'day': []},
    'finnhub': {'minute': [], 'day': []},
    'yfinance': {'minute': [], 'day': []},
}

# 缓存数据库路径
CACHE_DB = 'stock_cache.db'

def init_cache_db():
    """初始化缓存数据库"""
    try:
        conn = sqlite3.connect(CACHE_DB)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stock_cache (
                symbol TEXT,
                period TEXT,
                data TEXT,
                timestamp REAL,
                PRIMARY KEY (symbol, period)
            )
        ''')
        conn.commit()
        conn.close()
        logger.info("缓存数据库初始化成功")
    except Exception as e:
        logger.error(f"缓存数据库初始化失败: {e}")

# 初始化缓存数据库
init_cache_db()


class MultiSourceStockProvider:
    """多数据源股票数据提供者"""
    
    def __init__(self):
        self.cache_duration = 300  # 5分钟缓存
        self.sources = [
            self._get_from_yfinance,
            self._get_from_alpha_vantage_demo,
            self._get_from_finnhub_demo,
            self._get_from_cache_fallback
        ]
    
    def get_stock_data(self, symbol: str, period: str = '1mo') -> Optional[pd.DataFrame]:
        """
        从多个数据源获取股票数据，带缓存机制
        """
        logger.info(f"开始获取股票数据: {symbol} (period: {period})")
        
        # 首先尝试从缓存获取
        cached_data = self._get_from_cache(symbol, period)
        if cached_data is not None:
            logger.info(f"从缓存获取数据: {symbol}")
            return cached_data
        
        # 依次尝试各个数据源
        for i, source_func in enumerate(self.sources[:-1]):  # 排除缓存fallback
            try:
                logger.info(f"尝试数据源 {i+1}: {source_func.__name__}")
                df = source_func(symbol, period)
                
                if df is not None and not df.empty:
                    logger.info(f"成功从数据源 {i+1} 获取数据: {symbol}")
                    # 保存到缓存
                    self._save_to_cache(symbol, period, df)
                    return df
                    
            except Exception as e:
                logger.warning(f"数据源 {i+1} 失败: {e}")
                continue
        
        # 所有数据源都失败，尝试从旧缓存获取
        logger.warning(f"所有数据源失败，尝试旧缓存: {symbol}")
        return self._get_from_cache_fallback(symbol, period)
    
    def _get_from_cache(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """从缓存获取数据"""
        try:
            conn = sqlite3.connect(CACHE_DB)
            cursor = conn.cursor()
            cursor.execute(
                'SELECT data, timestamp FROM stock_cache WHERE symbol = ? AND period = ?',
                (symbol, period)
            )
            result = cursor.fetchone()
            conn.close()
            
            if result:
                data_json, timestamp = result
                # 检查缓存是否过期
                if time.time() - timestamp < self.cache_duration:
                    df = pd.read_json(data_json)
                    df.index = pd.to_datetime(df.index)
                    return df
            
            return None
        except Exception as e:
            logger.error(f"缓存读取失败: {e}")
            return None
    
    def _save_to_cache(self, symbol: str, period: str, df: pd.DataFrame):
        """保存数据到缓存"""
        try:
            conn = sqlite3.connect(CACHE_DB)
            cursor = conn.cursor()
            data_json = df.to_json()
            timestamp = time.time()
            
            cursor.execute('''
                INSERT OR REPLACE INTO stock_cache (symbol, period, data, timestamp)
                VALUES (?, ?, ?, ?)
            ''', (symbol, period, data_json, timestamp))
            
            conn.commit()
            conn.close()
            logger.info(f"数据已缓存: {symbol}")
        except Exception as e:
            logger.error(f"缓存保存失败: {e}")
    
    def _get_from_cache_fallback(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """从旧缓存获取数据（忽略过期时间）"""
        try:
            conn = sqlite3.connect(CACHE_DB)
            cursor = conn.cursor()
            cursor.execute(
                'SELECT data FROM stock_cache WHERE symbol = ? AND period = ?',
                (symbol, period)
            )
            result = cursor.fetchone()
            conn.close()
            
            if result:
                data_json = result[0]
                df = pd.read_json(data_json)
                df.index = pd.to_datetime(df.index)
                logger.info(f"使用旧缓存数据: {symbol}")
                return df
            
            return None
        except Exception as e:
            logger.error(f"旧缓存读取失败: {e}")
            return None
    
    def _get_from_yfinance(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """从yfinance获取数据"""
        try:
            # 添加随机延迟避免限流
            time.sleep(random.uniform(0.5, 2.0))
            
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period)
            
            if df is None or df.empty:
                return None
            
            # 标准化列名
            df.columns = [col.lower() for col in df.columns]
            required_columns = ['open', 'high', 'low', 'close', 'volume']
            
            if not all(col in df.columns for col in required_columns):
                return None
            
            df = df[required_columns].dropna()
            return df if len(df) > 0 else None
            
        except Exception as e:
            logger.error(f"yfinance获取失败: {e}")
            return None
    
    def _get_from_alpha_vantage_demo(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """从Alpha Vantage演示API获取数据（免费但有限制）"""
        try:
            # 使用演示API密钥（实际使用时应该申请自己的）
            api_key = "demo"
            url = f"https://www.alphavantage.co/query"
            params = {
                'function': 'TIME_SERIES_DAILY',
                'symbol': symbol,
                'apikey': api_key,
                'outputsize': 'compact'
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if 'Time Series (Daily)' not in data:
                return None
            
            # 转换为DataFrame
            time_series = data['Time Series (Daily)']
            df_data = []
            
            for date_str, values in time_series.items():
                df_data.append({
                    'date': pd.to_datetime(date_str),
                    'open': float(values['1. open']),
                    'high': float(values['2. high']),
                    'low': float(values['3. low']),
                    'close': float(values['4. close']),
                    'volume': int(values['5. volume'])
                })
            
            df = pd.DataFrame(df_data)
            df.set_index('date', inplace=True)
            df = df.sort_index()
            
            return df if len(df) > 0 else None
            
        except Exception as e:
            logger.error(f"Alpha Vantage获取失败: {e}")
            return None
    
    def _get_from_finnhub_demo(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """从Finnhub演示API获取数据"""
        try:
            # 计算时间范围
            end_date = datetime.now()
            if period == '1d':
                start_date = end_date - timedelta(days=1)
            elif period == '5d':
                start_date = end_date - timedelta(days=5)
            elif period == '1mo':
                start_date = end_date - timedelta(days=30)
            else:
                start_date = end_date - timedelta(days=30)
            
            # 使用演示token
            token = "sandbox_c8k2aiad3r6p5mqc8q10"
            url = "https://finnhub.io/api/v1/stock/candle"
            params = {
                'symbol': symbol,
                'resolution': 'D',
                'from': int(start_date.timestamp()),
                'to': int(end_date.timestamp()),
                'token': token
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get('s') != 'ok' or not data.get('c'):
                return None
            
            # 转换为DataFrame
            df_data = []
            for i in range(len(data['c'])):
                df_data.append({
                    'date': pd.to_datetime(data['t'][i], unit='s'),
                    'open': data['o'][i],
                    'high': data['h'][i],
                    'low': data['l'][i],
                    'close': data['c'][i],
                    'volume': data['v'][i]
                })
            
            df = pd.DataFrame(df_data)
            df.set_index('date', inplace=True)
            df = df.sort_index()
            
            return df if len(df) > 0 else None
            
        except Exception as e:
            logger.error(f"Finnhub获取失败: {e}")
            return None

# 创建全局数据提供者实例
stock_data_provider = MultiSourceStockProvider()

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

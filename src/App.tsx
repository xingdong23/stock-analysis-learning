import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Link } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { HomePage } from './pages/HomePage';
import { IndicatorsPage } from './pages/IndicatorsPage';
import { PracticePage } from './pages/PracticePage';
import { SettingsPage } from './pages/SettingsPage';
import MonitorPage from './pages/MonitorPage';

import { IndicatorDetail } from './components/IndicatorDetail/IndicatorDetail';
import { technicalIndicators } from './data/indicators';

function App() {
  const handleSearch = (query: string) => {
    // 实现搜索功能
    console.log('搜索:', query);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header onSearch={handleSearch} />

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/indicators" element={<IndicatorsPage />} />
            <Route
              path="/indicators/:id"
              element={
                <IndicatorDetailWrapper />
              }
            />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/settings" element={<SettingsPage />} />

          </Routes>
        </main>
      </div>
    </Router>
  );
}

// 指标详情页面包装器
const IndicatorDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const indicator = technicalIndicators.find(ind => ind.id === id);

  if (!indicator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">指标未找到</h1>
        <p className="text-lg text-gray-600 mb-8">
          抱歉，您要查找的技术指标不存在。
        </p>
        <Link
          to="/indicators"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          返回指标列表
        </Link>
      </div>
    );
  }

  return <IndicatorDetail indicator={indicator} />;
};

export default App;

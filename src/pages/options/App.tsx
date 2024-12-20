import React, { useEffect, useState } from 'react';
import { LLMConfig } from './components/LLMConfig';
import { createLogger } from '~/shared/utils/logger';

const logger = createLogger('options-app');

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general'); // 默认标签页

  useEffect(() => {
    // 从 URL 参数中获取目标标签页
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');
    
    if (targetTab) {
      logger.debug('从 URL 参数获取目标标签页:', targetTab);
      setActiveTab(targetTab);
      
      // 如果有对应的元素，滚动到可见位置
      const element = document.getElementById(`tab-${targetTab}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 标签页导航 */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            通用设置
          </button>
          <button
            id="tab-llm"
            onClick={() => setActiveTab('llm')}
            className={`${
              activeTab === 'llm'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            模型配置
          </button>
          {/* 其他标签页... */}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="tab-content">
        {activeTab === 'general' && (
          <div>
            {/* 通用设置内容 */}
          </div>
        )}
        {activeTab === 'llm' && (
          <div>
            <LLMConfig />
          </div>
        )}
        {/* 其他标签页内容... */}
      </div>
    </div>
  );
}; 
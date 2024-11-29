import React, { useState } from "react"

export const LLMConfig: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div>
      {/* 标题栏 */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">大语言模型配置</h2>
            <p className="text-sm text-gray-500 mt-1">配置你的AI助手</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        {/* API Key 输入框 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            OpenAI API KEY
          </label>
          <div className="relative group">
            <input
              type="password"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              placeholder="请输入 API Key"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Base URL 输入框 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            OpenAI API Host
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            placeholder="https://api.openai.com"
            defaultValue="https://api.openai.com"
          />
          <p className="text-sm text-gray-500">
            默认 https://api.openai.com
          </p>
        </div>

        {/* 模型选择下拉框 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            模型
          </label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            defaultValue="gpt-3.5-turbo"
          >
            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            <option value="gpt-4">gpt-4</option>
            <option value="gpt-4-turbo">gpt-4-turbo</option>
          </select>
        </div>

        {/* 验证并保存按钮 */}
        <div className="pt-4">
          <button
            className={`w-full px-4 py-2.5 rounded-lg font-medium text-white 
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
              transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
            disabled={isLoading}
            onClick={() => {
              setIsLoading(true)
              setTimeout(() => setIsLoading(false), 1500)
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>验证中...</span>
              </div>
            ) : '验证并保存'}
          </button>
        </div>
      </div>
    </div>
  )
} 
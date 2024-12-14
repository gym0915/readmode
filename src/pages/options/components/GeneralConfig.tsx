import React, { useState } from "react"

export const GeneralConfig: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false)
  const [autoSummary, setAutoSummary] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('light')
  const [selectedLanguage, setSelectedLanguage] = useState('zh')

  return (
    <div className="p-8 space-y-6">
      {/* 主题设置 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            主题设置
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedTheme('light')}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                selectedTheme === 'light'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-sm font-medium">日间模式</span>
            </button>
            <button
              onClick={() => setSelectedTheme('dark')}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                selectedTheme === 'dark'
                  ? 'border-blue-500 bg-gray-900 text-white'
                  : 'border-gray-200 bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              <span className="text-sm font-medium">夜间模式</span>
            </button>
            <button
              onClick={() => setSelectedTheme('system')}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                selectedTheme === 'system'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-sm font-medium">跟随系统</span>
            </button>
          </div>
        </div>
      </div>

      {/* 自动总结设置 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          自动总结
        </label>
        <div className="flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700">自动总结文章内容</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{autoSummary ? '开启' : '关闭'}</span>
            <button
              onClick={() => setAutoSummary(!autoSummary)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                autoSummary ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                  autoSummary ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 语言设置 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          语言设置
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              checked={selectedLanguage === 'zh'}
              onChange={() => setSelectedLanguage('zh')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">中文</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              checked={selectedLanguage === 'en'}
              onChange={() => setSelectedLanguage('en')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">English</span>
          </label>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="pt-4">
        <button
          className={`w-full px-4 py-2.5 rounded-lg font-medium text-white 
            ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
          disabled={isSaving}
          onClick={() => {
            setIsSaving(true)
            setTimeout(() => setIsSaving(false), 1500)
          }}
        >
          {isSaving ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>保存中...</span>
            </div>
          ) : '保存'}
        </button>
      </div>
    </div>
  )
} 
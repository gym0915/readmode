import React, { useState, useEffect } from 'react'
import "../../style.css"

interface IOptions {
  autoReadMode: boolean
  theme: 'light' | 'dark' | 'system'
  shortcut: string
}

const Options: React.FC = () => {
  const [options, setOptions] = useState<IOptions>({
    autoReadMode: false,
    theme: 'system',
    shortcut: 'Ctrl + R'
  })

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(['options'], (result) => {
      if (result.options) {
        setOptions(result.options)
      }
    })
  }, [])

  // 保存设置
  const saveOptions = (newOptions: Partial<IOptions>) => {
    const updatedOptions = { ...options, ...newOptions }
    setOptions(updatedOptions)
    chrome.storage.sync.set({ options: updatedOptions })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">选项</h1>
          
          {/* 阅读模式设置 */}
          <section className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">阅读模式设置</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">启用自动阅读模式</label>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500"
                  checked={options.autoReadMode}
                  onChange={(e) => saveOptions({ autoReadMode: e.target.checked })}
                />
              </div>
            </div>
          </section>

          {/* 快捷键设置 */}
          <section className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">快捷键设置</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">切换阅读模式</label>
                <input 
                  type="text" 
                  className="px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 block w-32 rounded-md sm:text-sm focus:ring-1" 
                  value={options.shortcut}
                  readOnly 
                  onClick={() => {
                    chrome.tabs.create({
                      url: 'chrome://extensions/shortcuts'
                    })
                  }}
                />
              </div>
            </div>
          </section>

          {/* 主题设置 */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">主题设置</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <button 
                  key={theme}
                  className={`p-4 border rounded-lg transition-colors ${
                    options.theme === theme 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => saveOptions({ theme })}
                >
                  {theme === 'light' && '浅色主题'}
                  {theme === 'dark' && '深色主题'}
                  {theme === 'system' && '跟随系统'}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Options 
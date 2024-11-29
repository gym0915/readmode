import React, { useState } from "react"

export const ProxyConfig: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [protocol, setProtocol] = useState("http")
  const [host, setHost] = useState("")
  const [port, setPort] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  return (
    <div className="p-8">
      {/* 开关按钮 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">启用代理</span>
          <span className="text-xs text-gray-500">{isEnabled ? '已开启' : '已关闭'}</span>
        </div>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
            isEnabled ? 'bg-purple-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-6">
          {/* Host 输入框 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Host
            </label>
            <input
              type="text"
              value={host || "127.0.0.1"}
              onChange={(e) => setHost(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
              placeholder="请输入 Host"
            />
          </div>

          {/* Port 输入框 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Port
            </label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
              placeholder="请输入端口号"
            />
          </div>

          {/* Protocol 选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Protocol
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>

          {/* 代理地址预览 */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              代理地址预览
            </label>
            <div className="text-sm font-mono bg-white px-3 py-2 rounded border border-gray-200">
              {`${protocol}://${host || '127.0.0.1'}${port ? ':' + port : ''}`}
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="pt-4">
            <button
              className={`w-full px-4 py-2.5 rounded-lg font-medium text-white 
                ${isSaving ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
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
      )}
    </div>
  )
} 
import React from "react"
import { LLMConfig } from "./components/LLMConfig"
import { ProxyConfig } from "./components/ProxyConfig"

const Options: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Readfun Settings</h1>
          <p className="text-gray-600">自定义你的阅读体验</p>
        </div>
        
        {/* 配置卡片容器 */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100">
            <LLMConfig />
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100">
            <ProxyConfig />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Options 
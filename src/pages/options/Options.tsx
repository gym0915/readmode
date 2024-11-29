import React from "react"
import { LLMConfig } from "~/pages/options/components/LLMConfig"
import { ProxyConfig } from "~/pages/options/components/ProxyConfig"
import logo from "data-base64:~/assets/icons/logo.svg"

const Options: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg mb-6">
            <img src={logo} alt="Readfun Logo" className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
            Readfun Settings
          </h1>
          <p className="text-gray-500 text-lg">让阅读更轻松，让知识更有趣</p>
        </div>
        
        {/* 配置卡片容器 */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <LLMConfig />
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <ProxyConfig />
          </div>
        </div>

        {/* 页脚 */}
        <div className="text-center mt-12 text-sm text-gray-400">
          <p>Version {process.env.VERSION || '0.0.1'}</p>
        </div>
      </div>
    </div>
  )
}

export default Options 
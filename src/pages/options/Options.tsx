import React, { useState } from "react"
import { LLMConfig } from "~/pages/options/components/LLMConfig"
import { GeneralConfig } from "~/pages/options/components/GeneralConfig"
import logo from "data-base64:~/assets/icons/logo.svg"
import { IconRobot, IconSettings } from "@tabler/icons-react"

// 定义导航项接口
interface NavItem {
  id: string
  name: string
  icon: React.ReactNode
  component: React.ReactNode
}

const Options: React.FC = () => {
  // 定义导航项
  const navItems: NavItem[] = [
    {
      id: "general",
      name: "通用",
      icon: <IconSettings className="w-6 h-6" />,
      component: <GeneralConfig />
    },
    {
      id: "model",
      name: "模型",
      icon: <IconRobot className="w-6 h-6" />,
      component: <LLMConfig />
    }
  ]

  const [activeTab, setActiveTab] = useState(navItems[0].id)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 设置面板容器 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mx-auto max-w-[1000px]">
          <div className="flex">
            {/* 左侧导航栏 */}
            <div className="w-64 border-r border-gray-200">
              {/* Logo 区域 */}
              <div className="h-16 flex items-center px-6 border-b border-gray-200">
                <img src={logo} alt="Readfun Logo" className="w-8 h-8 mr-3" />
                <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Readfun
                </span>
              </div>

              {/* 导航菜单 */}
              <nav className="py-6">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors duration-150 ${
                      activeTab === item.id
                        ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* 右侧内容区 */}
            <div className="flex-1">
              <div className="py-8 px-8">
                {/* 标题区域 */}
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {navItems.find((item) => item.id === activeTab)?.name}设置
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    管理您的{navItems.find((item) => item.id === activeTab)?.name}配置
                  </p>
                </div>

                {/* 内容区域 */}
                <div>
                  {navItems.find((item) => item.id === activeTab)?.component}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 页脚版本信息 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Version {process.env.VERSION || '0.0.1'}
        </div>
      </div>
    </div>
  )
}

export default Options 
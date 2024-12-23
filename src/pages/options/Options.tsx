import React, { useState, useEffect } from "react"
import { LLMConfig } from "~/pages/options/components/LLMConfig"
import { GeneralConfig } from "~/pages/options/components/GeneralConfig"
import logo from "data-base64:~/assets/icons/logo.svg"
import { IconRobot, IconSettings } from "@tabler/icons-react"
import { useTheme } from "../../shared/hooks/useTheme"
import { useI18n } from "../../i18n/hooks/useI18n"

// 定义导航项接口
interface NavItem {
  id: string
  name: string
  icon: React.ReactNode
  component: React.ReactNode
}

const Options: React.FC = () => {
  // 使用主题hook
  useTheme();
  // 使用 i18n hook
  const { t } = useI18n();

  const navItems: NavItem[] = [
    {
      id: "general",
      name: t('settings:tabs.general.name'),
      icon: <IconSettings className="w-6 h-6" />,
      component: <GeneralConfig />
    },
    {
      id: "model",
      name: t('settings:tabs.model.name'),
      icon: <IconRobot className="w-6 h-6" />,
      component: <LLMConfig />
    }
  ]

  const [activeTab, setActiveTab] = useState(navItems[0].id)

  // 处理 URL hash 变化
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      const targetTab = navItems.find(item => item.id === hash)
      if (targetTab) {
        setActiveTab(targetTab.id)
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // 处理标签切换
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    window.location.hash = tabId
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mx-auto max-w-[1000px]">
          <div className="flex">
            {/* 左侧导航栏 */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700">
              {/* Logo 区域 */}
              <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
                <img src={logo} alt={t('app:name')} className="w-8 h-8 mr-3" />
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('settings:title')}
                </span>
              </div>

              {/* 导航菜单 */}
              <nav className="py-6">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600 dark:border-blue-400"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* 右侧内容区 */}
            <div className="flex-1">
              <div className="py-8 px-8">
                {/* 标题区域 */}
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t(`settings:tabs.${activeTab}.name`)}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t(`settings:tabs.${activeTab}.description`)}
                  </p>
                </div>

                {/* 内容区域 */}
                <div>
                  {navItems.map((item) => (
                    <div
                      key={item.id}
                      className={activeTab === item.id ? 'block' : 'hidden'}
                    >
                      {item.component}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Options 
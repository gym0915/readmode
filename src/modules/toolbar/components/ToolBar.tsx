import React, { useEffect, useRef, useState } from 'react'
import styles from '../styles/ToolBar.module.css'
import { SummaryButton } from './SummaryButton'
import { IndexedDBManager } from '../../../shared/utils/indexed-db'

/**
 * ToolBar组件的属性接口定义
 * @interface ToolBarProps
 * @property {React.RefObject<HTMLDivElement>} articleCardRef - 文章卡片的DOM引用
 * @property {boolean} [visible=false] - 控制工具栏的显示状态，默认为隐藏
 */
interface ToolBarProps {
  articleCardRef: React.RefObject<HTMLDivElement>
  visible?: boolean
}

/**
 * 工具栏组件
 * 在文章右侧显示一个垂直居中的工具栏，支持显示/隐藏功能
 * 
 * @component
 * @param {ToolBarProps} props - 组件属性
 * @returns {JSX.Element} 工具栏组件
 */
export const ToolBar: React.FC<ToolBarProps> = ({ articleCardRef, visible = true }) => {
  // 工具栏DOM引用
  const toolbarRef = useRef<HTMLDivElement>(null)
  // 容器DOM引用
  const containerRef = useRef<HTMLDivElement>(null)
  // 配置状态
  const [isConfigured, setIsConfigured] = useState(false)

  // 检查配置状态
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const dbManager = IndexedDBManager.getInstance()
        await dbManager.initialize()

        const baseUrl = await dbManager.getData('baseUrl')
        const apiKey = await dbManager.getData('apiKey')
        const selectedModel = await dbManager.getData('selectedModel')

        setIsConfigured(!!baseUrl && !!apiKey && !!selectedModel)
      } catch (error) {
        console.error('检查配置时发生错误:', error)
        setIsConfigured(false)
      }
    }

    checkConfig()
  }, [])

  useEffect(() => {
    /**
     * 更新工具栏位置的函数
     * 根据文章卡片位置和浏览器窗口大小计算工具栏的最佳位置
     */
    const updateToolbarPosition = () => {
      if (!toolbarRef.current || !articleCardRef.current || !containerRef.current) return

      const articleCard = articleCardRef.current
      const articleRect = articleCard.getBoundingClientRect()
      
      // 更新容器位置到文章卡片右侧
      containerRef.current.style.position = 'absolute'
      containerRef.current.style.left = `${articleRect.right}px`
      containerRef.current.style.width = '0'
      containerRef.current.style.height = `${articleRect.height}px`
      
      // 计算工具栏在容器内的位置
      const toolbarHeight = toolbarRef.current.offsetHeight
      
      // 计算垂直居中位置（使用浏览器窗口高度）
      const browserHeight = window.innerHeight || document.documentElement.clientHeight
      const verticalCenter = Math.max(0, (browserHeight - toolbarHeight) / 2)
      
      // 更新工具栏位置和显示状态
      toolbarRef.current.style.position = 'fixed'
      toolbarRef.current.style.left = `${articleRect.right + 20}px` // 距离文章右侧20px
      toolbarRef.current.style.top = `${verticalCenter}px`
      // 根据visible属性控制显示状态
      toolbarRef.current.style.opacity = visible ? '1' : '0'
      toolbarRef.current.style.pointerEvents = visible ? 'auto' : 'none' // 控制鼠标事件
      toolbarRef.current.style.transition = 'opacity 0.3s ease-in-out' // 添加过渡动画
    }

    // 使用 ResizeObserver 监听文章卡片尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateToolbarPosition)
    })

    // 开始观察文章卡片尺寸变化
    if (articleCardRef.current) {
      resizeObserver.observe(articleCardRef.current)
    }

    // 初始化工具栏位置
    updateToolbarPosition()

    // 监听窗口大小变化
    window.addEventListener('resize', updateToolbarPosition)

    // 清理副作用
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateToolbarPosition)
    }
  }, [articleCardRef, visible]) // 依赖项：文章卡片引用和显示状态

  return (
    <div ref={containerRef} className={styles.toolbarContainer}>
      <div 
        ref={toolbarRef} 
        className={styles.toolbar}
        style={{
          visibility: visible ? 'visible' : 'hidden' // 控制DOM可见性
        }}
      >
        <div className={styles.toolbarContent}>
          <SummaryButton isConfigured={isConfigured} />
        </div>
      </div>
    </div>
  )
} 
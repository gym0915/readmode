import { useEffect, useRef } from 'react'
import styles from './ToolBar.module.css'

interface ToolBarProps {
  articleCardRef: React.RefObject<HTMLDivElement>
}

export function ToolBar({ articleCardRef }: ToolBarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
      
      // 更新工具栏位置
      toolbarRef.current.style.position = 'fixed' // 确保工具栏始终可见
      toolbarRef.current.style.left = `${articleRect.right + 20}px` // 距离文章右侧20px
      toolbarRef.current.style.top = `${verticalCenter}px`
      toolbarRef.current.style.opacity = '1'
    }

    // 使用 ResizeObserver 监听文章卡片尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateToolbarPosition)
    })

    if (articleCardRef.current) {
      resizeObserver.observe(articleCardRef.current)
    }

    // 初始化位置
    updateToolbarPosition()

    // 监听窗口大小变化
    window.addEventListener('resize', updateToolbarPosition)

    // 清理事件监听
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateToolbarPosition)
    }
  }, [articleCardRef])

  return (
    <div ref={containerRef} className={styles.toolbarContainer}>
      <div ref={toolbarRef} className={styles.toolbar}>
        <div className={styles.toolbarContent}>
          工具栏
        </div>
      </div>
    </div>
  )
} 
import React, { useEffect } from 'react'
import { ReaderContainer } from './ReaderContainer'
import type { IArticle } from '../types/article.types'
import { useReaderStore } from '../store/reader'

interface ReaderAppProps {
  article: IArticle
  autoSummaryEnabled?: boolean
}

export const ReaderApp: React.FC<ReaderAppProps> = ({ 
  article,
  autoSummaryEnabled = false
}) => {
  const toggleSummary = useReaderStore((state) => state.toggleSummary)
  const isSummaryVisible = useReaderStore((state) => state.isSummaryVisible)

  // 只在组件挂载时执行一次
  useEffect(() => {
    // 只在初始化且启用了自动总结时显示总结面板
    if (autoSummaryEnabled) {
      toggleSummary()
    }
  }, []) // 移除依赖数组中的 isSummaryVisible 和 toggleSummary

  return (
    <div id="readmode-root">
      <ReaderContainer article={article} />
    </div>
  )
} 
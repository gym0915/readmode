import React, { useState } from 'react'
import { ArticleCard } from './ArticleCard'
import { ToolBar } from '../../toolbar/components/ToolBar'
import type { IArticle } from '../types/article.types'
import styles from './ReaderContainer.module.css'

interface ReaderContainerProps {
  article: IArticle
}

export const ReaderContainer: React.FC<ReaderContainerProps> = ({ article }) => {
  const [isSummaryVisible, setIsSummaryVisible] = useState(false)

  return (
    <div className={styles.container}>
      <div className={`${styles.contentWrapper} ${isSummaryVisible ? styles.shifted : ''}`}>
        <ArticleCard article={article} />
        <ToolBar 
          onSummaryClick={() => setIsSummaryVisible(!isSummaryVisible)}
          visible={true}
        />
      </div>
      {/* 总结区域占位，稍后实现 */}
      {isSummaryVisible && (
        <div className={styles.summaryPanel}>
          {/* SummarySidebar组件将在后续步骤中实现 */}
        </div>
      )}
    </div>
  )
} 
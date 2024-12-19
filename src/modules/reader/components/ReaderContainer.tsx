import React, { useEffect, useState, useCallback } from 'react'
import { ArticleCard } from './ArticleCard'
import { ToolBar } from '../../toolbar/components/ToolBar'
import { SummarySidebar } from './SummarySidebar'
import type { IArticle } from '../types/article.types'
import styles from './ReaderContainer.module.css'
import { createLogger } from '~/shared/utils/logger'
import { useReaderStore } from '../store/reader'

const logger = createLogger('ReaderContainer')

interface ReaderContainerProps {
  article: IArticle
}

export const ReaderContainer: React.FC<ReaderContainerProps> = ({ article }) => {
  const isSummaryVisible = useReaderStore((state) => state.isSummaryVisible)
  const toggleSummary = useReaderStore((state) => state.toggleSummary)
  const [isSliding, setIsSliding] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(true)

  const handleSummaryClose = useCallback(() => {
    setIsSliding(true)
    toggleSummary()
    setTimeout(() => {
      setIsSliding(false)
      setToolbarVisible(true)
    }, 300)
  }, [toggleSummary])

  const handleSummaryClick = useCallback(() => {
    setToolbarVisible(false)
    setTimeout(() => {
      toggleSummary()
    }, 300)
  }, [toggleSummary])

  useEffect(() => {
    logger.info('ReaderContainer mounted', { 
      articleTitle: article.title,
      styles: Object.keys(styles),
      generatedClassNames: {
        container: styles.container,
        contentWrapper: styles.contentWrapper,
        summaryPanel: styles.summaryPanel
      }
    })
  }, [article])

  logger.info('ReaderContainer rendering', {
    hasArticle: !!article,
    cssModules: {
      container: styles.container,
      contentWrapper: styles.contentWrapper,
      summaryPanel: styles.summaryPanel
    }
  })

  return (
    <div 
      className={styles.reader_container}
      data-testid="reader-container"
    >
      <div 
        className={`${styles.reader_content_wrapper} ${isSummaryVisible ? styles.with_summary : ''}`}
        role="main"
        aria-label="文章内容区域"
        data-testid="content-wrapper"
      >
        <ArticleCard article={article} />
        <ToolBar 
          visible={toolbarVisible} 
          onSummaryClick={handleSummaryClick}
        />
      </div>
      {(isSummaryVisible || isSliding) && (
        <div 
          className={`${styles.reader_summary_panel} ${isSliding ? styles.sliding_out : ''}`}
          role="complementary"
          aria-label="文章总结面板"
          data-testid="summary-panel"
        >
          <SummarySidebar article={article} onClose={handleSummaryClose} />
        </div>
      )}
    </div>
  )
} 
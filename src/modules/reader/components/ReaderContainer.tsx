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
  const isToolbarVisible = useReaderStore((state) => state.isToolbarVisible)
  const toggleSummary = useReaderStore((state) => state.toggleSummary)
  const setToolbarVisible = useReaderStore((state) => state.setToolbarVisible)
  const resetState = useReaderStore((state) => state.resetState)
  
  useEffect(() => {
    if (!isSummaryVisible) {
      setToolbarVisible(true)
    }
  }, [isSummaryVisible, setToolbarVisible])

  useEffect(() => {
    const handleResetState = () => {
      resetState()
    }
    
    document.addEventListener('RESET_READER_STATE', handleResetState)
    return () => {
      document.removeEventListener('RESET_READER_STATE', handleResetState)
    }
  }, [resetState])

  return (
    <div className={styles.reader_container}>
      <div className={`${styles.reader_content_wrapper} ${isSummaryVisible ? styles.with_summary : ''}`}>
        <ArticleCard article={article} />
        <ToolBar 
          visible={isToolbarVisible}
          onSummaryClick={toggleSummary}
        />
      </div>
      {isSummaryVisible && (
        <div className={styles.reader_summary_panel}>
          <SummarySidebar article={article} onClose={toggleSummary} />
        </div>
      )}
    </div>
  )
} 
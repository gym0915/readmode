import React, { useEffect } from 'react'
import styles from './SummarySidebar.module.css'
import type { IArticle } from '../types/article.types'
import { createLogger, ELogLevel } from '~/shared/utils/logger'
import { useReaderStore } from '../store/reader'

const logger = createLogger('SummarySidebar', ELogLevel.DEBUG)

interface SummarySidebarProps {
  article: IArticle
  onClose: () => void
}

export const SummarySidebar: React.FC<SummarySidebarProps> = ({ article, onClose }) => {
  const toggleSummary = useReaderStore((state) => state.toggleSummary)

  useEffect(() => {
    logger.info('SummarySidebar mounted', {
      articleTitle: article.title,
      styles: Object.keys(styles)
    })
    
    return () => {
      logger.info('SummarySidebar unmounted')
    }
  }, [article])

  logger.info('SummarySidebar rendering', {
    hasArticle: !!article,
    cssModules: {
      container: styles.container,
      header: styles.header,
      content: styles.content
    }
  })

  return (
    <div className={styles.container} data-testid="summary-sidebar">
      <div className={styles.header}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="关闭总结面板"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className={styles.title}>文章总结</h2>
      </div>
      <div className={styles.content}>
        {/* 总结内容将在后续实现 */}
        <div className={styles.placeholder}>
          <p>正在生成文章总结...</p>
        </div>
      </div>
    </div>
  )
} 
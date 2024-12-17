import React, { useEffect } from 'react'
import styles from './SummarySidebar.module.css'
import type { IArticle } from '../types/article.types'
import { createLogger, ELogLevel } from '~/shared/utils/logger'

const logger = createLogger('SummarySidebar', ELogLevel.DEBUG)

interface SummarySidebarProps {
  article: IArticle
}

export const SummarySidebar: React.FC<SummarySidebarProps> = ({ article }) => {
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
import React, { useEffect } from 'react'
import { ArticleCard } from './ArticleCard'
import { ToolBar } from '../../toolbar/components/ToolBar'
import { SummarySidebar } from './SummarySidebar'
import type { IArticle } from '../types/article.types'
import styles from './ReaderContainer.module.css'
import { createLogger } from '~/shared/utils/logger'

const logger = createLogger('ReaderContainer')

interface ReaderContainerProps {
  article: IArticle
}

export const ReaderContainer: React.FC<ReaderContainerProps> = ({ article }) => {
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
        className={styles.reader_content_wrapper}
        role="main"
        aria-label="文章内容区域"
        data-testid="content-wrapper"
      >
        <ArticleCard article={article} />
        <ToolBar visible={true} />
      </div>
      <div 
        className={styles.reader_summary_panel}
        role="complementary"
        aria-label="文章总结面板"
        data-testid="summary-panel"
      >
        <SummarySidebar article={article} />
      </div>
    </div>
  )
} 
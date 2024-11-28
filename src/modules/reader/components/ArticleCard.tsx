import { useEffect, useRef } from 'react'
import styles from './ArticleCard.module.css'
import type { IArticle } from '../types/article.types'
import { ToolBar } from './ToolBar'

interface ArticleCardProps {
  article: IArticle
  onClose?: () => void
}

export function ArticleCard({ article, onClose }: ArticleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 添加动画效果
    requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.opacity = '1'
        cardRef.current.style.transform = 'translateY(0)'
      }
    })
  }, [])

  return (
    <div className={styles.cardContainer}>
      <div ref={cardRef} className={styles.card}>
        {/* 文章头部信息 */}
        <header className={styles.header}>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            {article.byline && <span className={styles.author}>{article.byline}</span>}
            {article.siteName && <span className={styles.siteName}>{article.siteName}</span>}
          </div>
        </header>

        {/* 文章摘要 */}
        {article.excerpt && (
          <div 
            className={styles.excerpt}
            dangerouslySetInnerHTML={{ __html: article.excerpt }}
          />
        )}

        {/* 文章内容 */}
        <div 
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
      <ToolBar articleCardRef={cardRef} />
    </div>
  )
} 
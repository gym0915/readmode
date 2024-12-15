import React, { useEffect, useRef, useState } from 'react'
import styles from './ArticleCard.module.css'
import type { IArticle } from '../types/article.types'
import { ToolBar } from '../../toolbar/components/ToolBar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '../../llm/styles/message.css'

interface ArticleCardProps {
  article: IArticle
  onClose?: () => void
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [toolbarVisible, setToolbarVisible] = useState(true)

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
    <>
      <div id="toast-root-container" style={{ 
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 2147483649 // 确保最高层级
      }}>
        <ToastContainer
          position="top-right"
          style={{ zIndex: 2147483649 }}
        />
      </div>
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
        <ToolBar 
          articleCardRef={cardRef} 
          visible={toolbarVisible} 
          onVisibilityChange={setToolbarVisible}
        />
      </div>
    </>
  )
} 
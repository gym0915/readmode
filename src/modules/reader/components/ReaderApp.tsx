import React from 'react'
import { ReaderContainer } from './ReaderContainer'
import type { IArticle } from '../types/article.types'

interface ReaderAppProps {
  article: IArticle
}

export const ReaderApp: React.FC<ReaderAppProps> = ({ article }) => {
  return (
    <div id="readmode-root">
      <ReaderContainer article={article} />
    </div>
  )
} 
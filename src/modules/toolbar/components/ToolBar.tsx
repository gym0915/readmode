import React, { useEffect, useRef } from 'react'
import styles from '../styles/ToolBar.module.css'
import { SummaryButton } from './SummaryButton'
import { FeedbackButton } from './FeedbackButton'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * ToolBar组件的属性接口定义
 * @interface ToolBarProps
 * @property {boolean} [visible=false] - 控制工具栏的显示状态，默认为隐藏
 * @property {function} [onVisibilityChange] - 控制工具栏显示状态的回调函数
 * @property {React.RefObject<HTMLDivElement>} [articleCardRef] - 文章卡片的 DOM 引用
 * @property {function} [onSummaryClick] - 点击总结按钮的回调函数
 * @property {function} [onClick] - 点击工具栏的回调函数
 */
interface ToolBarProps {
  visible?: boolean
  onVisibilityChange?: (visible: boolean) => void
  articleCardRef?: React.RefObject<HTMLDivElement>
  onSummaryClick?: () => void
  onClick?: () => void
}

/**
 * 工具栏组件
 * 在文章右侧显示一个垂直居中的工具栏，支持显示/隐藏功能
 * 
 * @component
 * @param {ToolBarProps} props - 组件属性
 * @returns {JSX.Element} 工具栏组件
 */
export const ToolBar: React.FC<ToolBarProps> = ({ 
  visible = true,
  onVisibilityChange,
  onSummaryClick
}) => {
  return (
    <div className={`${styles.toolbar} ${!visible ? styles.hidden : ''}`}>
      <div className={styles.toolbarContent}>
        <SummaryButton 
          onVisibilityChange={onVisibilityChange}
          onClick={onSummaryClick}
        />
        <FeedbackButton />
      </div>
    </div>
  )
} 
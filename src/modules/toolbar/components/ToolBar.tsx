import React, { useEffect, useRef } from 'react'
import styles from '../styles/ToolBar.module.css'
import { SummaryButton } from './SummaryButton'

/**
 * ToolBar组件的属性接口定义
 * @interface ToolBarProps
 * @property {boolean} [visible=false] - 控制工具栏的显示状态，默认为隐藏
 * @property {function} [onVisibilityChange] - 控制工具栏显示状态的回调函数
 */
interface ToolBarProps {
  visible?: boolean
  onVisibilityChange?: (visible: boolean) => void
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
  onVisibilityChange 
}) => {
  // 工具栏DOM引用
  const toolbarRef = useRef<HTMLDivElement>(null)

  return (
    <div 
      ref={toolbarRef} 
      className={styles.toolbar}
      style={{
        visibility: visible ? 'visible' : 'hidden',
        opacity: visible ? '1' : '0',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s ease-in-out'
      }}
      title="文章总结" // 添加悬浮提示
    >
      <div className={styles.toolbarContent}>
        <SummaryButton onVisibilityChange={onVisibilityChange} />
      </div>
    </div>
  )
} 
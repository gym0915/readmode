import React, { useState } from 'react'
import { messageService } from '~/core/services/message.service'
import { MessageHandler } from '~/shared/utils/message'

const messageHandler = MessageHandler.getInstance()

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    setIsLoading(true)
    const newMessages = [...messages, { role: 'user', content: inputValue }]
    setMessages(newMessages)
    setInputValue('')

    try {
      const response = await messageService.sendToBackground({
        type: 'CHAT_REQUEST',
        messages: newMessages
      })

      if (response.error) {
        messageHandler.error(response.error)
        return
      }

      if (response.data instanceof ReadableStream) {
        // 处理流式响应
        const reader = response.data.getReader()
        let content = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const text = new TextDecoder().decode(value)
          content += text
          
          // 更新UI显示部分响应
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content }
          ])
        }
      } else {
        // 处理非流式响应
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: response.data.choices[0].message.content }
        ])
      }
    } catch (error) {
      messageHandler.handleError(error, '对话请求失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 消息列表 */}
      <div className="space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className={`p-2 rounded ${
            msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {msg.content}
          </div>
        ))}
      </div>

      {/* 输入框和发送按钮 */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
          placeholder="输入消息..."
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  )
} 
import { useState, useRef, useEffect } from 'react'
import api from '../api'
import './ChatInterface.css'

const ChatInterface = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your QNA assistant. Upload a document and ask questions about it!',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentDocument, setCurrentDocument] = useState(null)
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load chat history when component mounts
    loadChatHistory()
  }, [])

  const loadChatHistory = async () => {
    try {
      const history = await api.chat.getChatHistory()
      console.log('Loaded chat history:', history) // Debug log
      
      if (history && history.length > 0) {
        const formattedHistory = history.map(item => ([
          {
            id: `${item.id}-q`,
            type: 'user',
            content: item.question,
            timestamp: new Date(item.created_at)
          },
          {
            id: `${item.id}-a`,
            type: 'bot',
            content: item.answer,
            timestamp: new Date(item.created_at)
          }
        ])).flat()
        
        // Keep welcome message and add history, but avoid replacing all messages during upload
        const welcomeMessage = {
          id: 1,
          type: 'bot',
          content: 'Hello! I\'m your QNA assistant. Upload a document and ask questions about it!',
          timestamp: new Date()
        }
        
        // Only update if we don't have messages already (initial load) or if we have new history
        setMessages(prev => {
          // If this is initial load (only welcome message) or history is significantly different
          if (prev.length <= 1 || formattedHistory.length !== prev.length - 1) {
            return [welcomeMessage, ...formattedHistory]
          }
          return prev // Don't update if history hasn't changed
        })
        console.log('Messages updated with history') // Debug log
      } else {
        console.log('No chat history found') // Debug log
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    console.log('Current document state:', currentDocument) // Debug log

    if (!currentDocument) {
      console.log('No current document, showing error') // Debug log
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'Please upload a document first before asking questions.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const question = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      console.log('Sending message with document ID:', currentDocument.id) // Debug log
      const response = await api.chat.sendMessage(question, currentDocument.id)
      console.log('Received response:', response) // Debug log
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.answer,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      
      // Reload chat history to make sure it's saved
      setTimeout(async () => {
        await loadChatHistory()
      }, 1000)
      
    } catch (error) {
      console.error('Send message error:', error) // Debug log
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Error: ${error.message || 'Failed to get response'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault() // Prevent any form submission
    const file = e.target.files[0]
    if (file) {
      console.log('Starting file upload:', file.name) // Debug log
      
      const uploadMessage = {
        id: Date.now(),
        type: 'user',
        content: `📎 Uploading: ${file.name}...`,
        timestamp: new Date(),
        isFile: true
      }
      setMessages(prev => [...prev, uploadMessage])
      
      try {
        const response = await api.chat.uploadDocument(file)
        console.log('Upload response:', response) // Debug log
        
        // Set the uploaded document as current document
        setCurrentDocument(response)
        setUploadedDocuments(prev => [...prev, response])
        
        console.log('Document uploaded and set as current:', response) // Debug log
        
        // Show success message immediately
        const successMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `✅ Document "${file.name}" uploaded successfully! You can now ask questions about it.`,
          timestamp: new Date()
        }
        
        // Replace upload message with success message
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== uploadMessage.id),
          successMessage
        ])
        
        // Wait a moment and then reload chat history to get the backend saved message
        setTimeout(async () => {
          await loadChatHistory()
        }, 1000) // Give backend time to save
        
      } catch (error) {
        console.error('Upload error:', error) // Debug log
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `❌ Failed to upload document: ${error.message}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev.filter(msg => msg.id !== uploadMessage.id), errorMessage])
      } finally {
        // Clear the file input to prevent re-submission and page refresh
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  const handleLogout = async () => {
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      onLogout()
    }
  }

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <h1 className="brand-name">QNA</h1>
        </div>
        <div className="header-right">
          <span className="user-name">Welcome, {user.name}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-bubble">
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        {/* File input outside of form to prevent conflicts */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.txt"
        />
        <form className="input-form" onSubmit={handleSendMessage}>
          <button
            type="button"
            className="attachment-button"
            onClick={() => fileInputRef.current?.click()}
          >
            📎
          </button>
          <input
            type="text"
            className="message-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatInterface

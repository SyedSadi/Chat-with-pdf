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
  const [showDocumentManager, setShowDocumentManager] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const dropdownRef = useRef(null)

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

  useEffect(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDocumentManager(false)
      }
    }

    if (showDocumentManager) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDocumentManager])

  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const documents = await api.chat.getDocuments()
      setUploadedDocuments(documents)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await api.chat.deleteDocument(documentId)
        
        // Remove from uploaded documents list
        setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId))
        
        // If this was the current document, clear it
        if (currentDocument && currentDocument.id === documentId) {
          setCurrentDocument(null)
        }
        
        // Reload chat history to reflect changes
        await loadChatHistory()
        
        // Show success message
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          content: '🗑️ Document deleted successfully!',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        
      } catch (error) {
        console.error('Failed to delete document:', error)
        
        const errorMessage = {
          id: Date.now(),
          type: 'bot',
          content: `❌ Failed to delete document: ${error.message}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    }
  }

  const handleShowDocumentManager = async () => {
    setShowDocumentManager(!showDocumentManager)
    if (!showDocumentManager) {
      await loadDocuments()
    }
  }

  const handleSelectDocument = (document) => {
    setCurrentDocument(document)
    setShowDocumentManager(false)
    
    const selectMessage = {
      id: Date.now(),
      type: 'bot',
      content: `📄 Switched to document: "${document.filename}". You can now ask questions about it.`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, selectMessage])
  }

  const loadChatHistory = async () => {
    try {
      const history = await api.chat.getChatHistory()
      
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
        
        const welcomeMessage = {
          id: 1,
          type: 'bot',
          content: 'Hello! I\'m your QNA assistant. Upload a document and ask questions about it!',
          timestamp: new Date()
        }
        
        setMessages(prev => {
          if (prev.length <= 1 || formattedHistory.length !== prev.length - 1) {
            return [welcomeMessage, ...formattedHistory]
          }
          return prev
        })
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    if (!currentDocument) {
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
      const response = await api.chat.sendMessage(question, currentDocument.id)
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.answer,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      
      setTimeout(async () => {
        await loadChatHistory()
      }, 1000)
      
    } catch (error) {
      console.error('Send message error:', error)
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
    e.preventDefault()
    const file = e.target.files[0]
    if (file) {
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
        
        setCurrentDocument(response)
        setUploadedDocuments(prev => [...prev, response])
        
        const successMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `✅ Document "${file.name}" uploaded successfully! You can now ask questions about it.`,
          timestamp: new Date()
        }
        
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== uploadMessage.id),
          successMessage
        ])
        
        setTimeout(async () => {
          await loadChatHistory()
        }, 1000)
        
      } catch (error) {
        console.error('Upload error:', error)
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `❌ Failed to upload document: ${error.message}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev.filter(msg => msg.id !== uploadMessage.id), errorMessage])
      } finally {
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
          <div className="user-dropdown" ref={dropdownRef}>
            <button 
              className="user-name-button" 
              onClick={handleShowDocumentManager}
            >
              Welcome, {user.name} ▼
            </button>
            {showDocumentManager && (
              <div className="document-manager-dropdown">
                <div className="dropdown-header">
                  <h3>Your Documents</h3>
                  <div className="current-doc">
                    {currentDocument ? (
                      <span>📄 Current: {currentDocument.filename}</span>
                    ) : (
                      <span>No document selected</span>
                    )}
                  </div>
                </div>
                <div className="document-list">
                  {isLoadingDocuments ? (
                    <div className="loading">Loading documents...</div>
                  ) : uploadedDocuments.length === 0 ? (
                    <div className="no-documents">No documents uploaded yet</div>
                  ) : (
                    uploadedDocuments.map(doc => (
                      <div key={doc.id} className="document-item">
                        <div className="document-info">
                          <div 
                            className="document-name" 
                            onClick={() => handleSelectDocument(doc)}
                            title="Click to select this document"
                          >
                            📄 {doc.filename}
                          </div>
                          <div className="document-date">
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete document"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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

// api.js - API service for frontend-backend communication

const API_BASE_URL = 'http://localhost:8000/api/qa/' 

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }))
    
    // Provide user-friendly error messages
    if (response.status === 401) {
      throw new Error('Invalid username or password')
    } else if (response.status === 400) {
      // Use the backend error message if available, otherwise provide a friendly message
      throw new Error(error.error || error.message || 'Invalid request')
    } else if (response.status >= 500) {
      throw new Error('Server error. Please try again later.')
    } else {
      throw new Error(error.error || error.message || 'Something went wrong')
    }
  }
  return response.json()
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })  // Changed from Bearer to Token
  }
}

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}login/`, {  // Removed /auth/
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.name || credentials.username,  // Support both field names
          password: credentials.password
        })
      })
      
      const data = await handleResponse(response)
      
      // Store auth token if provided
      if (data.token) {
        localStorage.setItem('authToken', data.token)
      }
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      // Provide user-friendly error message
      if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
        throw new Error('Invalid username or password')
      }
      throw error
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}register/`, {  // Removed /auth/
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.name || userData.username,  // Support both field names
          password: userData.password
        })
      })
      
      const data = await handleResponse(response)
      
      // Store auth token if provided
      if (data.token) {
        localStorage.setItem('authToken', data.token)
      }
      
      return data
    } catch (error) {
      console.error('Registration error:', error)
      // Provide user-friendly error messages for registration
      if (error.message.includes('Username already exists')) {
        throw new Error('Username already exists. Please choose a different username.')
      } else if (error.message.includes('Username and password required')) {
        throw new Error('Please fill in all required fields.')
      }
      throw error
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Since you don't have a logout endpoint, just clear local storage
      localStorage.removeItem('authToken')
      return { message: 'Logged out successfully' }
    } catch (error) {
      // Still clear local storage even if API call fails
      localStorage.removeItem('authToken')
      console.error('Logout error:', error)
      return { message: 'Logged out successfully' }
    }
  }
}

// Chat API calls
export const chatAPI = {
  // Send message and get response
  sendMessage: async (message, documentId = null) => {
    try {
      const requestData = {
        question: message
      }
      
      if (documentId) {
        requestData.document_id = documentId
      }

      const response = await fetch(`${API_BASE_URL}qa/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && { 
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          })
        },
        body: JSON.stringify(requestData)
      })
      
      return await handleResponse(response)
    } catch (error) {
      console.error('Send message error:', error)
      throw error
    }
  },

  // Get chat history
  getChatHistory: async () => {
    try {
      console.log('Making getChatHistory request...') // Debug log
      const response = await fetch(`${API_BASE_URL}history/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && { 
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          })
        }
      })
      
      console.log('getChatHistory response status:', response.status) // Debug log
      const data = await handleResponse(response)
      console.log('getChatHistory data:', data) // Debug log
      return data
    } catch (error) {
      console.error('Get chat history error:', error)
      throw error
    }
  },

  // Upload document
  uploadDocument: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)  // Changed from 'document' to 'file' to match Django

      const response = await fetch(`${API_BASE_URL}upload/`, {  // Changed to match Django URL
        method: 'POST',
        headers: {
          ...(localStorage.getItem('authToken') && { 
            'Authorization': `Token ${localStorage.getItem('authToken')}`  // Changed from Bearer to Token
          })
        },
        body: formData
      })
      
      return await handleResponse(response)
    } catch (error) {
      console.error('Document upload error:', error)
      throw error
    }
  },

  // Get uploaded documents
  getDocuments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}documents/`, {  // Fixed URL
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && { 
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          })
        }
      })
      
      return await handleResponse(response)
    } catch (error) {
      console.error('Get documents error:', error)
      throw error
    }
  },

  // Delete document
  deleteDocument: async (documentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        return { message: 'Document deleted successfully' }
      }
      
      return await handleResponse(response)
    } catch (error) {
      console.error('Delete document error:', error)
      throw error
    }
  }
}

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken')
  },

  // Get stored auth token
  getAuthToken: () => {
    return localStorage.getItem('authToken')
  },

  // Clear auth data
  clearAuthData: () => {
    localStorage.removeItem('authToken')
  },

  // Set API base URL (useful for different environments)
  setBaseURL: (url) => {
    API_BASE_URL = url
  },

  // Get current base URL
  getBaseURL: () => {
    return API_BASE_URL
  }
}

// Error types for better error handling
export const API_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND'
}

// Default export with all APIs
const api = {
  auth: authAPI,
  chat: chatAPI,
  utils: apiUtils,
  errors: API_ERRORS
}

export default api

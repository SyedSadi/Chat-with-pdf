let API_BASE_URL = 'http://localhost:8000/api/qa/' 

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }))
    
    if (response.status === 401) {
      throw new Error('Invalid username or password')
    } else if (response.status === 400) {
      throw new Error(error.error || error.message || 'Invalid request')
    } else if (response.status >= 500) {
      throw new Error('Server error. Please try again later.')
    } else {
      throw new Error(error.error || error.message || 'Something went wrong')
    }
  }
  return response.json()
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  }
}

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.name || credentials.username,
          password: credentials.password
        })
      })
      
      const data = await handleResponse(response)
      
      if (data.token) {
        localStorage.setItem('authToken', data.token)
      }
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
        throw new Error('Invalid username or password')
      }
      throw error
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.name || userData.username,
          password: userData.password
        })
      })
      
      const data = await handleResponse(response)
      
      if (data.token) {
        localStorage.setItem('authToken', data.token)
      }
      
      return data
    } catch (error) {
      console.error('Registration error:', error)
      if (error.message.includes('Username already exists')) {
        throw new Error('Username already exists. Please choose a different username.')
      } else if (error.message.includes('Username and password required')) {
        throw new Error('Please fill in all required fields.')
      }
      throw error
    }
  },

  logout: async () => {
    try {
      localStorage.removeItem('authToken')
      return { message: 'Logged out successfully' }
    } catch (error) {
      localStorage.removeItem('authToken')
      console.error('Logout error:', error)
      return { message: 'Logged out successfully' }
    }
  }
}

export const chatAPI = {
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

  getChatHistory: async () => {
    try {
      console.log('Making getChatHistory request...')
      const response = await fetch(`${API_BASE_URL}history/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && { 
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          })
        }
      })
      
      console.log('getChatHistory response status:', response.status)
      const data = await handleResponse(response)
      console.log('getChatHistory data:', data)
      return data
    } catch (error) {
      console.error('Get chat history error:', error)
      throw error
    }
  },

  uploadDocument: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE_URL}upload/`, {
        method: 'POST',
        headers: {
          ...(localStorage.getItem('authToken') && { 
            'Authorization': `Token ${localStorage.getItem('authToken')}`
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

  getDocuments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}documents/`, {
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
      const response = await fetch(`${API_BASE_URL}documents/${documentId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && { 
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          })
        }
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

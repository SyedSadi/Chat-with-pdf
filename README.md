# QNA - Chat with PDF

A full-stack web application built with Django and React that enables users to upload documents (PDF, DOCX, TXT) and interact with them through AI-powered Q&A. The application uses LangChain and Google Gemini for intelligent document processing and question answering.

## 🚀 Features

- **User Authentication**: Secure registration and login system with token-based auth
- **Document Processing**: Upload and parse PDF, DOCX, and TXT files
- **AI-Powered Q&A**: Chat interface using Google Gemini LLM
- **Vector Search**: FAISS integration for semantic document search
- **Chat History**: Persistent conversation history per user
- **Modern UI**: Responsive React frontend with clean design
- **Real-time Chat**: Interactive chat interface with typing indicators

## 🛠 Technology Stack

**Backend:**

- Django 5.2.5 + Django REST Framework
- LangChain for document processing and AI workflows
- Google Gemini AI for natural language processing
- FAISS for vector similarity search
- PostgreSQL for data persistence
- Token-based authentication

**Frontend:**

- React 19 with modern hooks
- Vite for fast development and building
- Custom CSS with design system approach
- Responsive design for mobile/desktop

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have these installed:

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd Chat-with-pdf/ai_chat
   ```

2. **Create and activate virtual environment**

   ```bash
   python -m venv myenv
   source myenv/bin/activate  # On macOS/Linux
   # OR
   myenv\Scripts\activate     # On Windows
   ```

3. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

5. **Environment Configuration**

   Create a `.env` file in the `ai_chat` directory:

   ```env
   # Django Settings
   DJANGO_SECRET_KEY=your-secret-key-here
   DEBUG=True

   # Database Configuration
   POSTGRES_DB=qna_db
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_db_password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432

   # AI Configuration
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

6. **Database Setup**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser  # Optional: create admin user
   ```

7. **Start Django server**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd ../frontend
   ```

2. **Install Node.js dependencies**

   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at: `http://localhost:5173`

## 🔌 API Reference

| Endpoint             | Method | Description                   |
| -------------------- | ------ | ----------------------------- |
| `/api/qa/register/`  | POST   | User registration             |
| `/api/qa/login/`     | POST   | User authentication           |
| `/api/qa/upload/`    | POST   | Document upload               |
| `/api/qa/qa/`        | POST   | Ask questions about documents |
| `/api/qa/history/`   | GET    | Retrieve chat history         |
| `/api/qa/documents/` | GET    | List user's documents         |

## 🛡️ Security Features

- **Authentication**: Token-based authentication with Django REST framework
- **File Validation**: Strict file type and size validation (10MB limit)
- **User Isolation**: All documents and chats are user-specific
- **CORS Protection**: Configured for frontend-backend communication
- **SQL Injection Prevention**: Django ORM provides built-in protection
- **Input Sanitization**: All user inputs are validated and sanitized

## 📁 Project Structure

```
Chat-with-pdf/
├── ai_chat/                 # Django Backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── ai_chat/            # Main Django app
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   └── qa/                 # QA functionality app
│       ├── models.py
│       ├── views.py
│       ├── serializers.py
│       └── ...
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
└── README.md
```

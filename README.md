# QNA - Chat with PDF

A modern web application that allows users to upload PDF, DOCX, and TXT documents and ask questions about their content using AI-powered question answering.

## Features

- 🔐 User authentication (register/login)
- 📄 Document upload and management for each user (PDF, DOCX, TXT)
- 🤖 AI-powered question answering using Google Gemini
- 💬 Chat interface with message history
- 🎨 Modern, clean UI design
- 🔍 Vector search using FAISS for accurate document retrieval

## Tech Stack

### Backend

- Django with Django REST Framework
- LangChain for document processing and AI integration
- Google Gemini AI for question answering
- FAISS for vector search
- PostgreSQL for data persistence
- Token-based authentication

### Frontend

- React with Vite
- Modern CSS with custom design system
- Responsive design for all devices

## Setup Instructions

### Prerequisites

- Python 3.13.7
- Node.js 18+
- PostgreSQL
- Google Gemini API key

### Backend Setup

1. **Clone and navigate to the project**

   ```bash
   cd Chat-with-pdf/ai_chat
   ```

2. **Create virtual environment**

   ```bash
   python -m venv myenv
   source myenv/bin/activate  # mac
   myenv\Scripts\activate    # On Windows:
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

## Environment Variables

Create a `.env` file in the `ai_chat` directory with:

```env
# Django Configuration
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

5.**Database setup**

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # Optional
```

6.**Run backend server**

```bash
python manage.py runserver
```

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd ../frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run development server**

   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## API Endpoints

- `POST /api/qa/register/` - User registration
- `POST /api/qa/login/` - User login
- `POST /api/qa/upload/` - Document upload
- `POST /api/qa/qa/` - Ask questions
- `GET /api/qa/history/` - Chat history
- `GET /api/qa/documents/` - User documents

## Security Features

- Token-based authentication
- File type and size validation
- User-specific data isolation
- CORS protection
- SQL injection protection via Django ORM

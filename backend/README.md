# Let It Out Backend

A Python Flask backend for the "Let It Out" application - a catch-all for thoughts and todos.

## Features

- User authentication (register, login)
- Thought management (create, read, update, delete)
- Todo management with optional due dates (create, read, update, delete)
- **AI-powered content classification** using Google's Gemini 2.0 Flash model
- Single input field that automatically determines if content is a thought or a todo
- RESTful API design
- JWT-based authentication
- PostgreSQL database (configurable, with SQLite fallback)

## Setup

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Run the setup script: `python setup.py`
5. Set up environment variables in the `.env` file:
   - **Important**: Add your Google Gemini API key to `API_KEY`
6. Initialize the database: `python init_db.py`
7. Run the application: `python run.py`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current authenticated user

### Unified Content (AI-Classified)

- `POST /api/content` - Create new content (automatically classified as thought or todo)
- `GET /api/content` - Get all content (both thoughts and todos) for the authenticated user

### Thoughts

- `GET /api/thoughts` - Get all thoughts for the authenticated user
- `POST /api/thoughts` - Create a new thought directly
- `GET /api/thoughts/<id>` - Get a specific thought
- `PUT /api/thoughts/<id>` - Update a specific thought
- `DELETE /api/thoughts/<id>` - Delete a specific thought

### Todos

- `GET /api/todos` - Get all todos for the authenticated user
- `POST /api/todos` - Create a new todo directly
- `GET /api/todos/<id>` - Get a specific todo
- `PUT /api/todos/<id>` - Update a specific todo
- `DELETE /api/todos/<id>` - Delete a specific todo

## Database Schema

### Users
- id: UUID (primary key)
- name: String
- email: String (unique)
- password_hash: String
- created_at: DateTime
- updated_at: DateTime

### Thoughts
- id: UUID (primary key)
- user_id: UUID (foreign key to users.id)
- content: Text
- created_at: DateTime
- updated_at: DateTime

### Todos
- id: UUID (primary key)
- user_id: UUID (foreign key to users.id)
- title: String
- description: Text (optional)
- completed: Boolean
- due_date: DateTime (optional)
- created_at: DateTime
- updated_at: DateTime

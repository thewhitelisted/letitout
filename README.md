# Let It Out

Let It Out is a modern web application for capturing, organizing, and reflecting on your thoughts and todos. Designed for simplicity and privacy, it helps you quickly jot down ideas, manage daily tasks, and track your personal growth—all in a beautiful, distraction-free interface.

## Features

- 🧠 **Thought & Todo Capture:** Instantly record thoughts or todos with a single input box—AI classifies your entry automatically.
- 🤖 **AI-Powered Classification:** Smart backend uses AI to determine if your input is a thought or a todo, so you can just type and go.
- 📅 **Daily View:** See all your thoughts and todos for today in one place.
- 📋 **Organized History:** Browse your full history of thoughts and todos, filter by type, and review your progress.
- ✅ **Todo Completion:** Mark todos as complete/incomplete and track your completion rate.
- 🔒 **Authentication:** Secure login and registration to keep your data private.
- 📊 **Personal Stats:** View stats like total thoughts, todos, completed tasks, and completion rate.
- 🌐 **Responsive Design:** Works seamlessly on desktop and mobile devices.
- 🕒 **Timezone-Aware:** All dates and times are shown in your local timezone.

## Usage Flow

1. **Sign Up / Log In:** Create an account or log in to your personal journal.
2. **Let It Out:** Type anything—thoughts, todos, ideas—and submit. The AI will sort them for you.
3. **View & Manage:** See your recent activity, filter by day or type, and manage your todos.
4. **Profile & Stats:** Visit your profile to view stats and change your password.

## Tech Stack

### Frontend
- **Next.js 14** (React framework)
- **TypeScript**
- **Tailwind CSS** for styling
- **Framer Motion** for animations

### Backend
- **Python** (Flask web framework)
- **SQLite** for data storage
- **Custom AI Classifier** for content type detection

## Local Development

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+

### Setup

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```

The frontend will run on [http://localhost:3000](http://localhost:3000) and the backend on [http://localhost:5000](http://localhost:5000).

## Folder Structure

```
frontend/    # Next.js app (UI)
backend/     # Flask API and AI classifier
```

## License

MIT

---

*Let It Out – your private, AI-powered thought and todo journal.*

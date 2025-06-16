'use client';

import { useState, FormEvent, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import PageTransition from "./components/PageTransition";
import { api, ContentItem, Thought, Todo } from "../lib/api";
import { formatDate, formatDateOnly } from "../lib/utils";

export default function Home() {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all content
  const fetchContent = useCallback(async () => {
    try {
      console.log("Fetching content with auth token:", localStorage.getItem('token'));
      const data = await api.content.getAll();
      console.log("Content fetched successfully:", data);
      setContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  }, []);

  // Check if user is authenticated and fetch content
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isTokenPresent = !!token;
    
    setIsAuthenticated(isTokenPresent);
    
    // If authenticated, fetch content
    if (isTokenPresent) {
      fetchContent();
    }
    
    // Add event listener for manual refresh with Ctrl+R key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        console.log("Manual refresh triggered");
        if (isTokenPresent) {
          fetchContent();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fetchContent]);
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (isAuthenticated) {
        // Send to the backend for AI processing
        const newContent = await api.content.create(text);
        
        // Refresh all content to ensure it's up to date with server
        fetchContent();
      } else {
        // If not authenticated, just show a demo message
        alert("Sign in to save your thoughts and todos!");
      }
      
      // Reset the form
      setText("");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('Error submitting content:', error);
      alert('Failed to save your content. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render todo or thought item
  const renderContentItem = (item: ContentItem) => {
    if (item.type === 'thought') {
      const thought = item.data as Thought;
      return (
        <div key={thought.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm">
          <p className="text-black">{thought.content}</p>
          <p className="text-xs text-gray-500 mt-2">
            {formatDate(thought.created_at)}
          </p>
        </div>
      );
    } else if (item.type === 'todo') {
      const todo = item.data as Todo;
      return (
        <div key={todo.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-black">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={todo.completed}
              onChange={() => {}} // This would be handled in a real implementation
            />
            <h3 className="font-bold text-black">{todo.title}</h3>
          </div>
          {todo.description && (
            <p className="text-gray-700 mt-2">{todo.description}</p>
          )}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatDate(todo.created_at)}</span>
            {todo.due_date && (
              <span>Due: {formatDateOnly(todo.due_date)}</span>
            )}
          </div>
        </div>
      );
    } else {
      // Unknown content type
      return (
        <div key={Math.random()} className="bg-red-50 p-4 rounded-lg mb-4 shadow-sm">
          <p className="text-red-500">Unknown content type</p>
        </div>
      );
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen p-8 bg-white">
      {/* Header with navigation */}
      <header className="flex justify-between items-center w-full">
        <div className="font-large text-black font-bold">got thoughts?</div>
        <nav className="flex gap-2">
          <button className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
            my day
          </button>
          <button className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
            my thoughts
          </button>
          {isAuthenticated && (
            <button 
              onClick={fetchContent}
              className="bg-gray-800 text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow"
            >
              refresh
            </button>
          )}
          <Link href="/login" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
            {isAuthenticated ? 'profile' : 'login'}
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow -mt-16 py-16 w-full max-w-3xl mx-auto">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-black mb-8">just let it out:</h1>
          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="text-black w-full p-4 border rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="What's on your mind? Type a thought or todo..."
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 rounded-md mt-4 shadow-md hover:shadow-lg transition-shadow font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </form>
          
          {/* Display content if authenticated */}
          {isAuthenticated && content.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-black mb-4">Your content:</h2>
              <div>
                {content.map(item => renderContentItem(item))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </PageTransition>
  );
}

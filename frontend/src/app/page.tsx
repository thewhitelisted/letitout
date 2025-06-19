'use client';

import { useState, FormEvent, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import PageTransition from "./components/PageTransition";
import Notification from "./components/Notification";
import Spinner from "./components/Spinner";
import ConfirmationModal from "./components/ConfirmationModal";
import BaseHabitItem from "./components/BaseHabitItem";
import { useConfirmation } from "./components/useConfirmation";
import { api, ContentItem, Thought, Todo, Habit } from "../lib/api";
import { formatDate, formatDueDateTime } from "../lib/utils";

export default function Home() {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [userName, setUserName] = useState("");
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error" | "info"
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Confirmation modal state
  const { 
    showConfirmation, 
    confirmation, 
    handleConfirm, 
    handleCancel 
  } = useConfirmation();
  // Fetch all content
  const fetchContent = useCallback(async () => {
    try {
      const data = await api.content.getAll();
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
    
    // If authenticated, fetch content and user data
    if (isTokenPresent) {
      fetchContent();
      
      // Fetch user data to get the name
      const fetchUserData = async () => {
        try {
          const userData = await api.auth.getUser();
          // Get first name by splitting at first space
          const firstName = userData.name.split(' ')[0];
          setUserName(firstName);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      
      fetchUserData();
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
        
        // Show success notification
        const contentType = newContent.type === 'thought' ? 'Thought' : 'Todo';
        showNotification(`${contentType} created successfully!`);
        
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
      showNotification('Failed to save your content. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to show notifications
  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    console.log("Showing notification:", { message, type });
    setNotification({
      isVisible: true,
      message,
      type
    });
  };

  // Function to hide notification
  const hideNotification = () => {
    console.log("Hiding notification");
    setNotification(prev => ({ ...prev, isVisible: false }));
  };  // Delete habit
  const deleteHabit = async (habit: Habit) => {
    showConfirmation(
      async () => {
        try {
          await api.habits.delete(habit.id, true); // Delete all future instances
          
          // Update local state
          setContent(prevContent => 
            prevContent.filter(contentItem => 
              !(contentItem.type === 'habit' && (contentItem.data as Habit).id === habit.id)
            )
          );
          
          showNotification('Habit deleted successfully');
        } catch (error) {
          console.error('Error deleting habit:', error);
          showNotification('Failed to delete habit', 'error');
          throw error; // Re-throw to keep modal open
        }
      },
      {
        title: 'Delete Habit',
        message: 'Are you sure you want to delete this habit and all its future instances? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );
  };// Render todo or thought item
  const renderContentItem = (item: ContentItem) => {
    if (item.type === 'thought') {
      const thought = item.data as Thought;      // Function to delete thought
      const handleDeleteThought = async () => {
        showConfirmation(
          async () => {
            try {
              await api.thoughts.delete(thought.id);
              
              // Update local state
              setContent(prevContent => 
                prevContent.filter(contentItem => 
                  !(contentItem.type === 'thought' && (contentItem.data as Thought).id === thought.id)
                )
              );
              
              // Show notification
              showNotification('Thought deleted successfully');
            } catch (error) {
              console.error('Error deleting thought:', error);
              showNotification('Failed to delete thought', 'error');
              throw error; // Re-throw to keep modal open
            }
          },
          {
            title: 'Delete Thought',
            message: 'Are you sure you want to delete this thought? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
          }
        );
      };
      
      return (
        <div key={thought.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm relative">
          <p className="text-black">{thought.content}</p>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 mt-2">
              {formatDate(thought.created_at)}
            </p>            <button 
              onClick={handleDeleteThought}
              className="text-gray-400 hover:text-black transition-colors flex items-center justify-center min-w-[20px]"
              aria-label="Delete thought"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      );
    } else if (item.type === 'todo') {
      const todo = item.data as Todo;
        // Function to toggle todo completion
      const toggleTodoCompletion = async () => {
        try {
          setLoadingItems(prev => ({ ...prev, [`todo-toggle-${todo.id}`]: true }));
          const updatedTodo = await api.todos.update(todo.id, {
            completed: !todo.completed
          });
          
          // Update local state
          setContent(prevContent => 
            prevContent.map(contentItem => 
              contentItem.type === 'todo' && (contentItem.data as Todo).id === todo.id
                ? { ...contentItem, data: updatedTodo }
                : contentItem
            )
          );
          
          // Show notification
          showNotification(`Todo marked as ${updatedTodo.completed ? 'completed' : 'incomplete'}`);
        } catch (error) {
          console.error('Error updating todo:', error);
          showNotification('Failed to update todo status', 'error');
        } finally {
          setLoadingItems(prev => ({ ...prev, [`todo-toggle-${todo.id}`]: false }));
        }
      };      // Function to delete todo
      const handleDeleteTodo = async () => {
        showConfirmation(
          async () => {
            try {
              await api.todos.delete(todo.id);
              
              // Update local state
              setContent(prevContent => 
                prevContent.filter(contentItem => 
                  !(contentItem.type === 'todo' && (contentItem.data as Todo).id === todo.id)
                )
              );
              
              // Show notification
              showNotification('Todo deleted successfully');
            } catch (error) {
              console.error('Error deleting todo:', error);
              showNotification('Failed to delete todo', 'error');
              throw error; // Re-throw to keep modal open
            }
          },
          {
            title: 'Delete Todo',
            message: 'Are you sure you want to delete this todo? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
          }
        );
      };
      
      return (        <div key={todo.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-black">
          <div className="flex items-center">
            <div className="mr-2 flex items-center justify-center w-5 h-5">
              {loadingItems[`todo-toggle-${todo.id}`] ? (
                <Spinner size="sm" className="text-black" />
              ) : (
                <input
                  type="checkbox"
                  className="w-5 h-5 cursor-pointer"
                  checked={todo.completed}
                  onChange={toggleTodoCompletion}
                  disabled={loadingItems[`todo-toggle-${todo.id}`]}
                />
              )}
            </div>
            <h3 className={`font-bold text-black ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.title}
            </h3>
          </div>
          {todo.description && (
            <p className={`text-gray-700 mt-2 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.description}
            </p>
          )}
          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
            <div className="flex">
              <span>{formatDate(todo.created_at)}</span>
              {todo.due_date && (
                <span className="ml-4">Due: {formatDueDateTime(todo.due_date)}</span>
              )}
            </div>            <button 
              onClick={handleDeleteTodo}
              className="text-gray-400 hover:text-black transition-colors flex items-center justify-center min-w-[20px]"
              aria-label="Delete todo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>        </div>
      );    } else if (item.type === 'habit') {
      const habit = item.data as Habit;
        return (        <BaseHabitItem
          key={habit.id}
          habit={habit}
          onDelete={deleteHabit}
        />
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
    <>
      <PageTransition>
        <div className="flex flex-col min-h-screen p-8 bg-white">
          {/* Header with navigation */}
          <header className="flex justify-between items-center w-full">
            <div className="font-large text-black font-bold">
              {isAuthenticated && userName ? `${userName}'s journal` : "your personal journal"}
            </div>            <nav className="flex gap-2">
              <Link href="/" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow border-2 border-white">
                home
              </Link>
              <Link href="/day" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                my day
              </Link>
              <Link href="/thoughts" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                my thoughts
              </Link>
              <Link href="/timeline" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                timeline
              </Link>
              <Link href={isAuthenticated ? "/profile" : "/login"} className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                {isAuthenticated ? 'profile' : 'login'}
              </Link>
            </nav>
          </header>

          {/* Main content */}
          <main className="flex flex-col items-center justify-center flex-grow py-16 w-full max-w-3xl mx-auto">
            <div className="w-full">
              <h1 className="text-4xl font-bold text-black mb-8">just let it out:</h1>
              <form onSubmit={handleSubmit}>
                <textarea
                  ref={textareaRef}
                  className="text-black w-full p-4 border rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="what's on your mind?"
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />                <button
                  type="submit"
                  className="bg-black text-white px-6 py-3 rounded-md mt-4 shadow-md hover:shadow-lg transition-shadow font-medium flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Spinner size="sm" />}
                  {isSubmitting ? 'saving...' : 'save'}
                </button>
              </form>
              
              {/* Display content if authenticated */}
              {isAuthenticated && content.length > 0 && (
                <div className="mt-16">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-black">recent activity:</h2>
                    <Link href="/thoughts" className="text-sm text-black underline hover:text-gray-600">
                      View all
                    </Link>
                  </div>
                  <div>
                    {content.slice(0, 5).map(item => renderContentItem(item))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </PageTransition>
        {/* Notification component - now outside the main container */}
      <Notification 
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
        {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={confirmation.isLoading}
      />
    </>
  );
}

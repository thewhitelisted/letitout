'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageTransition from "../components/PageTransition";
import Notification from "../components/Notification";
import Spinner from "../components/Spinner";
import { api, ContentItem, Thought, Todo } from "../../lib/api";
import { formatDate, formatDueDateTime } from "../../lib/utils";

export default function ThoughtsPage() {  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [userName, setUserName] = useState("");
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error" | "info"
  });
  const [filter, setFilter] = useState<'all' | 'thought' | 'todo'>('all');
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  // Fetch all content
  const fetchContent = useCallback(async () => {
    try {
      console.log("Fetching content with auth token:", localStorage.getItem('token'));
      const data = await api.content.getAll();
      console.log("Content fetched successfully:", data);
      setContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
      showNotification('Failed to load your content. Please try again.', 'error');
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
        // Fetch user data to get the name
      const fetchUserData = async () => {
        try {
          const userData = await api.auth.getUser();
          // split name if needed
          const firstName = userData.name.split(' ')[0];
          setUserName(firstName);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      
      fetchUserData();
    } else {
      // Redirect to login if not authenticated
      window.location.href = "/login";
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
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };
  
  // Function to filter content
  const getFilteredContent = () => {
    if (filter === 'all') return content;
    return content.filter(item => item.type === filter);
  };
    // Render todo or thought item
  const renderContentItem = (item: ContentItem) => {
    if (item.type === 'thought') {
      const thought = item.data as Thought;
        // Function to delete thought
      const handleDeleteThought = async () => {
        if (confirm('Are you sure you want to delete this thought?')) {
          try {
            setLoadingItems(prev => ({ ...prev, [`thought-${thought.id}`]: true }));
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
          } finally {
            setLoadingItems(prev => ({ ...prev, [`thought-${thought.id}`]: false }));
          }
        }
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
              disabled={loadingItems[`thought-${thought.id}`]}
            >
              {loadingItems[`thought-${thought.id}`] ? (
                <Spinner size="sm" className="text-gray-400" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      );    } else if (item.type === 'todo') {
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
      };
        // Function to delete todo
      const handleDeleteTodo = async () => {
        if (confirm('Are you sure you want to delete this todo?')) {
          try {
            setLoadingItems(prev => ({ ...prev, [`todo-${todo.id}`]: true }));
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
          } finally {
            setLoadingItems(prev => ({ ...prev, [`todo-${todo.id}`]: false }));
          }
        }
      };
        return (
        <div key={todo.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-black">          <div className="flex items-center">
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
              disabled={loadingItems[`todo-${todo.id}`]}
            >
              {loadingItems[`todo-${todo.id}`] ? (
                <Spinner size="sm" className="text-gray-400" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
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
    <>
      <PageTransition>
        <div className="flex flex-col min-h-screen p-8 bg-white">          {/* Header with navigation */}          
          <header className="flex justify-between items-center w-full">            
            <div className="font-large text-black font-bold">
              {isAuthenticated && userName ? `${userName}'s journal` : "your personal journal"}
            </div>            <nav className="flex gap-2">
              <Link href="/" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                home
              </Link>
              <Link href="/day" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                my day
              </Link>
              <Link href="/thoughts" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow border-2 border-white">
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
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-black">my thoughts & todos:</h1>
                {/* Filtering controls */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md shadow-md transition-shadow ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
                  >
                    all
                  </button>
                  <button 
                    onClick={() => setFilter('thought')}
                    className={`px-4 py-2 rounded-md shadow-md transition-shadow ${filter === 'thought' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
                  >
                    thoughts
                  </button>
                  <button 
                    onClick={() => setFilter('todo')}
                    className={`px-4 py-2 rounded-md shadow-md transition-shadow ${filter === 'todo' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}
                  >
                    todos
                  </button>
                </div>
              </div>
              
              {/* Display content */}
              {isAuthenticated && (
                <div>
                  {getFilteredContent().length > 0 ? (
                    <div>
                      {getFilteredContent().map(item => renderContentItem(item))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">
                        {filter === 'all' 
                          ? "you don't have any thoughts or todos yet." 
                          : filter === 'thought' 
                            ? "you don't have any thoughts yet."
                            : "you don't have any todos yet."
                        }
                      </p>
                      <Link 
                        href="/" 
                        className="inline-block mt-4 bg-black text-white px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-shadow"
                      >
                        create some now
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </PageTransition>
      
      {/* Notification component */}
      <Notification 
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </>
  );
}

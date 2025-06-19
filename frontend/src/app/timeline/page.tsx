'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageTransition from "../components/PageTransition";
import Notification from "../components/Notification";
import Spinner from "../components/Spinner";
import { api, ContentItem, Thought, Todo } from "../../lib/api";
import { formatDate, formatDueDateTime } from "../../lib/utils";
import { getLocalDateString, utcToLocalDateString } from "../../lib/date-utils";

interface DayData {
  date: string;
  displayDate: string;
  todos: Todo[];
  thoughts: Thought[];
}

export default function TimelinePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [daysToShow, setDaysToShow] = useState(7); // Start with 7 days (one week)
  const [timelineData, setTimelineData] = useState<DayData[]>([]);
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error" | "info"
  });

  // Generate array of dates starting from today
  const generateDateRange = useCallback((numDays: number) => {
    const dates: DayData[] = [];
    const today = new Date();
    
    for (let i = 0; i < numDays; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      const dateString = getLocalDateString(currentDate);
      const displayDate = currentDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      dates.push({
        date: dateString,
        displayDate: displayDate,
        todos: [],
        thoughts: []
      });
    }
    
    return dates;
  }, []);

  // Fetch all content from API
  const fetchContent = useCallback(async () => {
    try {
      console.log("Fetching content for timeline");
      const data = await api.content.getAll();
      setAllContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
      showNotification('Failed to load your content. Please try again.', 'error');
    }
  }, []);

  // Organize content by date
  const organizeContentByDate = useCallback(() => {
    const dateRange = generateDateRange(daysToShow);
    
    // Organize content into the date buckets
    allContent.forEach(item => {
      if (item.type === 'todo') {
        const todo = item.data as Todo;
        // For todos, use due_date if available, otherwise use created_at
        const relevantDate = todo.due_date || todo.created_at;
        if (relevantDate) {
          const todoLocalDate = utcToLocalDateString(relevantDate);
          const dayIndex = dateRange.findIndex(day => day.date === todoLocalDate);
          if (dayIndex >= 0) {
            dateRange[dayIndex].todos.push(todo);
          }
        }
      } else if (item.type === 'thought') {
        const thought = item.data as Thought;
        if (thought.created_at) {
          const thoughtLocalDate = utcToLocalDateString(thought.created_at);
          const dayIndex = dateRange.findIndex(day => day.date === thoughtLocalDate);
          if (dayIndex >= 0) {
            dateRange[dayIndex].thoughts.push(thought);
          }
        }
      }
    });

    // Sort todos and thoughts within each day
    dateRange.forEach(day => {
      // Sort todos by due time, then by creation time
      day.todos.sort((a, b) => {
        const aTime = a.due_date || a.created_at;
        const bTime = b.due_date || b.created_at;
        if (!aTime) return 1;
        if (!bTime) return -1;
        return aTime.localeCompare(bTime);
      });

      // Sort thoughts by creation time (newest first)
      day.thoughts.sort((a, b) => {
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return b.created_at.localeCompare(a.created_at);
      });
    });

    setTimelineData(dateRange);
  }, [allContent, daysToShow, generateDateRange]);
  // Check authentication and fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isTokenPresent = !!token;
    setIsAuthenticated(isTokenPresent);

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
    } else {
      window.location.href = "/login";
    }
  }, [fetchContent]);
  // Reorganize data when content or daysToShow changes
  useEffect(() => {
    organizeContentByDate();
  }, [allContent, daysToShow, organizeContentByDate]);

  // Helper function to show notifications
  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({
      isVisible: true,
      message,
      type
    });
  };

  // Function to hide notification
  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };
  // Load more days
  const loadMoreDays = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDaysToShow(prev => prev + 7);
      setIsLoadingMore(false);
    }, 500); // Small delay for UX
  };

  // Todo completion toggle
  const toggleTodoCompletion = async (todo: Todo) => {
    try {
      setLoadingItems(prev => ({ ...prev, [`todo-toggle-${todo.id}`]: true }));
      const updatedTodo = await api.todos.update(todo.id, {
        completed: !todo.completed
      });
      
      // Update in allContent, which will trigger reorganization
      setAllContent(prevContent => 
        prevContent.map(contentItem => 
          contentItem.type === 'todo' && (contentItem.data as Todo).id === todo.id
            ? { ...contentItem, data: updatedTodo }
            : contentItem
        )
      );
      
      showNotification(`Todo marked as ${updatedTodo.completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error('Error updating todo:', error);
      showNotification('Failed to update todo status', 'error');
    } finally {
      setLoadingItems(prev => ({ ...prev, [`todo-toggle-${todo.id}`]: false }));
    }
  };

  // Delete todo
  const deleteTodo = async (todo: Todo) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      try {
        setLoadingItems(prev => ({ ...prev, [`todo-${todo.id}`]: true }));
        await api.todos.delete(todo.id);
        
        setAllContent(prevContent => 
          prevContent.filter(contentItem => 
            !(contentItem.type === 'todo' && (contentItem.data as Todo).id === todo.id)
          )
        );
        
        showNotification('Todo deleted successfully');
      } catch (error) {
        console.error('Error deleting todo:', error);
        showNotification('Failed to delete todo', 'error');
      } finally {
        setLoadingItems(prev => ({ ...prev, [`todo-${todo.id}`]: false }));
      }
    }
  };

  // Delete thought
  const deleteThought = async (thought: Thought) => {
    if (confirm('Are you sure you want to delete this thought?')) {
      try {
        setLoadingItems(prev => ({ ...prev, [`thought-${thought.id}`]: true }));
        await api.thoughts.delete(thought.id);
        
        setAllContent(prevContent => 
          prevContent.filter(contentItem => 
            !(contentItem.type === 'thought' && (contentItem.data as Thought).id === thought.id)
          )
        );
        
        showNotification('Thought deleted successfully');
      } catch (error) {
        console.error('Error deleting thought:', error);
        showNotification('Failed to delete thought', 'error');
      } finally {
        setLoadingItems(prev => ({ ...prev, [`thought-${thought.id}`]: false }));
      }
    }
  };
  // Render a todo item
  const renderTodoItem = (todo: Todo) => (
    <div key={todo.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-black">
      <div className="flex items-center">
        <div className="mr-2 flex items-center justify-center w-4 h-4">
          {loadingItems[`todo-toggle-${todo.id}`] ? (
            <Spinner size="sm" className="text-gray-600" />
          ) : (
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer text-gray-600"
              checked={todo.completed}
              onChange={() => toggleTodoCompletion(todo)}
              disabled={loadingItems[`todo-toggle-${todo.id}`]}
            />
          )}
        </div>
        <h4 className={`font-medium text-black flex-grow ${todo.completed ? 'line-through text-gray-500' : ''}`}>
          {todo.title}
        </h4>
        <button 
          onClick={() => deleteTodo(todo)}
          className="text-gray-400 hover:text-black transition-colors flex items-center justify-center min-w-[20px] ml-2"
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
      {todo.description && (
        <p className={`text-gray-700 mt-2 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
          {todo.description}
        </p>
      )}
      {todo.due_date && (
        <p className="text-xs text-gray-500 mt-2">
          Due: {formatDueDateTime(todo.due_date)}
        </p>
      )}
    </div>
  );
  // Render a thought item
  const renderThoughtItem = (thought: Thought) => (
    <div key={thought.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-black flex-grow pr-2">{thought.content}</p>
        <button 
          onClick={() => deleteThought(thought)}
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
      <p className="text-xs text-gray-500 mt-2">
        {formatDate(thought.created_at)}
      </p>
    </div>
  );
  return (
    <>
      <PageTransition>
        <div className="flex flex-col min-h-screen p-8 bg-white">
          {/* Header with navigation */}          <header className="flex justify-between items-center w-full">
            <div className="font-large text-black font-bold">
              {isAuthenticated && userName ? `${userName}'s journal` : "your personal journal"}
            </div>
            <nav className="flex gap-2">
              <Link href="/" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                home
              </Link>
              <Link href="/day" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                my day
              </Link>
              <Link href="/thoughts" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
                my thoughts
              </Link>
              <Link href="/timeline" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow border-2 border-white">
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
              <h1 className="text-4xl font-bold text-black mb-8">timeline:</h1>
              
              <div className="space-y-8">
            {timelineData.map((day, index) => {
              const isToday = day.date === getLocalDateString();
              const hasContent = day.todos.length > 0 || day.thoughts.length > 0;
              
              return (
                <div key={day.date} className="relative">
                  {/* Timeline line */}
                  {index < timelineData.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 bg-gray-300 h-full"></div>
                  )}
                  
                  {/* Date circle */}
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm z-10 ${
                      isToday ? 'bg-black' : 'bg-gray-400'
                    }`}>
                      {new Date(day.date + 'T00:00:00').getDate()}
                    </div>
                      <div className="ml-6 flex-grow">
                      {/* Date header */}
                      <h2 className={`text-xl font-bold mb-4 mt-2 ${isToday ? 'text-black' : 'text-gray-700'}`}>
                        {day.displayDate}
                        {isToday && <span className="text-sm font-normal text-gray-600 ml-2">(Today)</span>}
                      </h2>
                      
                      {/* Content */}
                      {hasContent ? (
                        <div className="space-y-4">
                          {/* Todos */}
                          {day.todos.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                Todos ({day.todos.length})
                              </h3>
                              <div className="space-y-2">
                                {day.todos.map(todo => renderTodoItem(todo))}
                              </div>
                            </div>
                          )}
                          
                          {/* Thoughts */}
                          {day.thoughts.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                Thoughts ({day.thoughts.length})
                              </h3>
                              <div className="space-y-2">
                                {day.thoughts.map(thought => renderThoughtItem(thought))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic py-4">
                          No items for this day
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Load more button */}
          <div className="mt-12 text-center">
            <button
              onClick={loadMoreDays}
              disabled={isLoadingMore}
              className="bg-black text-white px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-shadow font-medium flex items-center gap-2 mx-auto"            >
              {isLoadingMore && <Spinner size="sm" />}
              {isLoadingMore ? 'loading...' : 'load more'}
            </button>
          </div>
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

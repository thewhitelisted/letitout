'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageTransition from "../components/PageTransition";
import Notification from "../components/Notification";
import Spinner from "../components/Spinner";
import ConfirmationModal from "../components/ConfirmationModal";
import HabitItem from "../components/HabitItem";
import { useConfirmation } from "../components/useConfirmation";
import { api, Thought, Todo, HabitInstance } from "../../lib/api";
import { formatDate, formatDueDateTime } from "../../lib/utils"
import { getLocalDateString, utcToLocalDateString } from "../../lib/date-utils";

export default function MyDayPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error" | "info"
  });
    // Track today's todos, thoughts, and habits separately
  const [todaysTodos, setTodaysTodos] = useState<Todo[]>([]);
  const [todaysThoughts, setTodaysThoughts] = useState<Thought[]>([]);
  const [todaysHabits, setTodaysHabits] = useState<HabitInstance[]>([]);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  // Confirmation modal hook
  const { confirmation, showConfirmation, handleConfirm, handleCancel } = useConfirmation();// Get today's date in ISO format (YYYY-MM-DD)
  const getTodayDateString = () => {
    // Use our date utility function to get today's date in local timezone
    const result = getLocalDateString();
    console.log(`Today's date for comparison: ${result}`);
    return result;
  };
    // Fetch all content
  const fetchContent = useCallback(async () => {
    try {
      const data = await api.content.getAll();
      
      // Get today's date for filtering
      const todayStr = getTodayDateString();
      console.log("Today's date for filtering:", todayStr);
        // Filter todos due today, thoughts created today, and habits due today
      const todosForToday: Todo[] = [];
      const thoughtsForToday: Thought[] = [];
      const habitsForToday: HabitInstance[] = [];
        // Process each content item (only thoughts and todos now)
      data.forEach(item => {
        if (item.type === 'todo') {
          const todo = item.data as Todo;
          // Check if due date is today - using our date utility functions
          if (todo.due_date) {
            // Convert UTC timestamp to local date for comparison
            const todoLocalDate = utcToLocalDateString(todo.due_date);
            
            console.log(`Todo due_date raw value: ${todo.due_date}`);
            console.log(`Converted local date: ${todoLocalDate}`);
            console.log(`Comparing with today's date: ${todayStr}`);
            
            if (todoLocalDate === todayStr) {
              console.log(`✅ Todo matched for today: ${todo.title}`);
              todosForToday.push(todo);
            }
          }
        } else if (item.type === 'thought') {
          const thought = item.data as Thought;
          // Check if created today using our date utility
          if (thought.created_at) {
            // Convert UTC timestamp to local date for comparison
            const thoughtLocalDate = utcToLocalDateString(thought.created_at);
            
            console.log(`Thought created_at raw value: ${thought.created_at}`);
            console.log(`Converted local date: ${thoughtLocalDate}`);
            console.log(`Comparing with today's date: ${todayStr}`);
            
            if (thoughtLocalDate === todayStr) {
              thoughtsForToday.push(thought);
            }
          }
        }
      });

      // Fetch today's habit instances separately
      try {
        const habitInstances = await api.habits.getInstances(todayStr, todayStr);
        habitsForToday.push(...habitInstances);
        console.log(`Found ${habitInstances.length} habit instances due today`);
      } catch (error) {
        console.error('Error fetching habit instances:', error);
      }
        // Sort todos by due time (ascending)
      todosForToday.sort((a, b) => {
        if (!a.due_date) return 1; // No due date goes last
        if (!b.due_date) return -1; // No due date goes last
        return a.due_date.localeCompare(b.due_date); // Sort by due date string
      });
      
      // Sort thoughts by creation time (newest first)
      thoughtsForToday.sort((a, b) => {
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return b.created_at.localeCompare(a.created_at);
      });
      
      // Sort habits by due time, then by creation time
      habitsForToday.sort((a, b) => {
        // If both have habits with due times, sort by due time
        if (a.habit?.due_time && b.habit?.due_time) {
          return a.habit.due_time.localeCompare(b.habit.due_time);
        }
        // If only one has due time, prioritize it
        if (a.habit?.due_time) return -1;
        if (b.habit?.due_time) return 1;
        // Otherwise sort by creation time
        return a.created_at.localeCompare(b.created_at);
      });
        setTodaysTodos(todosForToday);
      setTodaysThoughts(thoughtsForToday);
      setTodaysHabits(habitsForToday);
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
          const userData = await api.auth.getUser()
          // split name to get first name only
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
  
  // Format a nice date heading (e.g., "Monday, June 16")
  const formatTodayHeading = () => {
    const today = new Date();
    return today.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };  // Render a todo item
  const renderTodoItem = (todo: Todo) => {    // Function to toggle todo completion
    const toggleTodoCompletion = async () => {
      try {
        setLoadingItems(prev => ({ ...prev, [`todo-toggle-${todo.id}`]: true }));
        const updatedTodo = await api.todos.update(todo.id, {
          completed: !todo.completed
        });
        
        // Update local state
        setTodaysTodos(prevTodos => 
          prevTodos.map(t => 
            t.id === todo.id ? updatedTodo : t
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
    };    // Function to delete todo
    const handleDeleteTodo = async () => {
      showConfirmation(
        async () => {
          try {
            await api.todos.delete(todo.id);
            
            // Update local state
            setTodaysTodos(prevTodos => 
              prevTodos.filter(t => t.id !== todo.id)
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
          cancelText: 'Cancel'
        }
      );
    };
    
    return (
      <div key={todo.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-black">        <div className="flex items-center">
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
          </div>          <button 
            onClick={handleDeleteTodo}
            className="text-gray-400 hover:text-black transition-colors flex items-center justify-center min-w-[20px]"
            aria-label="Delete todo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  };
  // Render a thought item
  const renderThoughtItem = (thought: Thought) => {
    // Function to delete thought
    const handleDeleteThought = async () => {
      showConfirmation(
        async () => {
          try {
            await api.thoughts.delete(thought.id);
            
            // Update local state
            setTodaysThoughts(prevThoughts => 
              prevThoughts.filter(t => t.id !== thought.id)
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
          cancelText: 'Cancel'
        }
      );
    };
    
    return (
      <div key={thought.id} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm relative">
        <p className="text-black">{thought.content}</p>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 mt-2">
            {formatDate(thought.created_at)}
          </p>
          <button 
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
  };

  // Toggle habit completion
  const toggleHabitCompletion = async (habitInstance: HabitInstance) => {
    try {
      setLoadingItems(prev => ({ ...prev, [`habit-toggle-${habitInstance.id}`]: true }));
      
      const updatedInstance = await api.habits.updateInstance(habitInstance.id, {
        completed: !habitInstance.completed
      });
      
      // Update local state
      setTodaysHabits(prevHabits => 
        prevHabits.map(h => 
          h.id === habitInstance.id ? updatedInstance : h
        )
      );
      
      showNotification(`Habit marked as ${updatedInstance.completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error('Error updating habit instance:', error);
      showNotification('Failed to update habit status', 'error');
    } finally {
      setLoadingItems(prev => ({ ...prev, [`habit-toggle-${habitInstance.id}`]: false }));
    }
  };
  // Delete habit instance
  const deleteHabitInstance = async (habitInstance: HabitInstance) => {
    showConfirmation(
      async () => {
        try {
          await api.habits.deleteInstance(habitInstance.id, false);
          
          // Update local state
          setTodaysHabits(prevHabits => 
            prevHabits.filter(h => h.id !== habitInstance.id)
          );
          
          showNotification('Habit instance deleted successfully');
        } catch (error) {
          console.error('Error deleting habit instance:', error);
          showNotification('Failed to delete habit instance', 'error');
          throw error; // Re-throw to keep modal open
        }
      },
      {
        title: 'Delete Habit Instance',
        message: 'Are you sure you want to delete this habit instance? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      }
    );
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
              <Link href="/day" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow border-2 border-white">
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
              <h1 className="text-4xl font-bold text-black mb-8">
                {formatTodayHeading()}
              </h1>
              
              {/* Today's todos section */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-black mb-4">todo today:</h2>
                {todaysTodos.length > 0 ? (
                  <div>
                    {todaysTodos.map(todo => renderTodoItem(todo))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">no todos scheduled for today.</p>
                    <Link 
                      href="/" 
                      className="inline-block mt-4 bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow text-sm"
                    >
                      create a todo
                    </Link>
                  </div>
                )}              </section>
              
              {/* Today's habits section */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-black mb-4">habits due today:</h2>
                {todaysHabits.length > 0 ? (
                  <div>
                    {todaysHabits.map(habitInstance => (
                      <HabitItem
                        key={habitInstance.id}
                        habitInstance={habitInstance}
                        loadingItems={loadingItems}
                        onToggleCompletion={toggleHabitCompletion}
                        onDelete={deleteHabitInstance}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">no habits scheduled for today.</p>
                    <Link 
                      href="/" 
                      className="inline-block mt-4 bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow text-sm"
                    >
                      create a habit
                    </Link>
                  </div>
                )}
              </section>
              
              {/* Today's thoughts section */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">today&apos;s thoughts:</h2>
                {todaysThoughts.length > 0 ? (
                  <div>
                    {todaysThoughts.map(thought => renderThoughtItem(thought))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">no thoughts recorded today.</p>
                    <Link 
                      href="/" 
                      className="inline-block mt-4 bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow text-sm"
                    >
                      add a thought
                    </Link>
                  </div>
                )}
              </section>
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
      
      {/* Confirmation Modal */}      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        variant={confirmation.variant}
        isLoading={confirmation.isLoading}
      />
    </>
  );
}



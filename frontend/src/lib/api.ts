/**
 * API client for interacting with the backend
 */

// The base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Thought {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequency_data: any | null;
  start_date: string;
  end_date: string | null;
  due_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitInstance {
  id: string;
  habit_id: string;
  user_id: string;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  skipped: boolean;
  created_at: string;
  updated_at: string;
  habit: Habit | null;
}

export interface ContentItem {
  type: 'thought' | 'todo' | 'habit';
  data: Thought | Todo | Habit;
}

// Helper for making authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Get token from local storage
  const token = localStorage.getItem('token');
  
  // Set up headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  // Handle 401 Unauthorized (token expired or invalid)
  if (response.status === 401) {
    console.log('Token expired or invalid, redirecting to login');
    // Clear token
    localStorage.removeItem('token');
    
    // Only redirect if we're in a browser context
    if (typeof window !== 'undefined') {
      // Delay the redirect slightly to allow any pending operations to complete
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    throw new Error('Unauthorized - Please log in again');
  }
  
  // Parse the response
  const data = await response.json();
  
  // Handle API errors
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
};

// Auth API
export const api = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      return fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    
    register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
      return fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
    },
      getUser: async (): Promise<User> => {
      return fetchWithAuth('/auth/me');
    },
    
    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
      return fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
    },
      getUserStats: async (): Promise<{
      thoughts_count: number;
      todos_count: number;
      completed_todos_count: number;
      completion_rate: number;
      habits_count: number;
      habit_instances_total: number;
      habit_instances_completed: number;
      habit_completion_rate: number;
    }> => {
      return fetchWithAuth('/auth/stats');
    },
  },
  
  // Content endpoints (AI-classified thoughts/todos)
  content: {
    create: async (text: string): Promise<ContentItem> => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return fetchWithAuth('/content', {
        method: 'POST',
        body: JSON.stringify({ text, timezone }), // Add timezone to the request body
      });
    },
    
    getAll: async (): Promise<ContentItem[]> => {
      return fetchWithAuth('/content');
    },
  },
  
  // Thoughts endpoints
  thoughts: {
    getAll: async (): Promise<Thought[]> => {
      return fetchWithAuth('/thoughts');
    },
    
    getById: async (id: string): Promise<Thought> => {
      return fetchWithAuth(`/thoughts/${id}`);
    },
    
    create: async (content: string): Promise<Thought> => {
      return fetchWithAuth('/thoughts', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    
    update: async (id: string, content: string): Promise<Thought> => {
      return fetchWithAuth(`/thoughts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
    },
    
    delete: async (id: string): Promise<void> => {
      return fetchWithAuth(`/thoughts/${id}`, {
        method: 'DELETE',
      });    },
  },
  
  // Habits endpoints
  habits: {
    getAll: async (is_active?: boolean): Promise<Habit[]> => {
      const query = is_active !== undefined ? `?is_active=${is_active}` : '';
      return fetchWithAuth(`/habits${query}`);
    },
    
    getById: async (id: string): Promise<Habit> => {
      return fetchWithAuth(`/habits/${id}`);
    },
    
    create: async (title: string, description?: string, frequency?: string, start_date?: string): Promise<Habit> => {
      return fetchWithAuth('/habits', {
        method: 'POST',
        body: JSON.stringify({ title, description, frequency, start_date }),
      });
    },
    
    update: async (id: string, data: Partial<Habit>): Promise<Habit> => {
      return fetchWithAuth(`/habits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    delete: async (id: string, deleteAllFuture: boolean = false): Promise<void> => {
      return fetchWithAuth(`/habits/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ delete_all_future: deleteAllFuture }),
      });
    },
    
    // Habit instances
    getInstances: async (start_date?: string, end_date?: string, completed?: boolean): Promise<HabitInstance[]> => {
      const params = new URLSearchParams();
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (completed !== undefined) params.append('completed', completed.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return fetchWithAuth(`/habits/instances${query}`);
    },
    
    updateInstance: async (id: string, data: Partial<HabitInstance>): Promise<HabitInstance> => {
      return fetchWithAuth(`/habits/instances/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    deleteInstance: async (id: string, deleteAllFuture: boolean = false): Promise<void> => {
      return fetchWithAuth(`/habits/instances/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ delete_all_future: deleteAllFuture }),
      });
    },
  },
  
  // Todos endpoints
  todos: {
    getAll: async (completed?: boolean): Promise<Todo[]> => {
      const query = completed !== undefined ? `?completed=${completed}` : '';
      return fetchWithAuth(`/todos${query}`);
    },
    
    getById: async (id: string): Promise<Todo> => {
      return fetchWithAuth(`/todos/${id}`);
    },
    
    create: async (title: string, description?: string, due_date?: string): Promise<Todo> => {
      return fetchWithAuth('/todos', {
        method: 'POST',
        body: JSON.stringify({ title, description, due_date }),
      });
    },
    
    update: async (id: string, data: Partial<Todo>): Promise<Todo> => {
      return fetchWithAuth(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    delete: async (id: string): Promise<void> => {
      return fetchWithAuth(`/todos/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

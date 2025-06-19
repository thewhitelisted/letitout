'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageTransition from "../components/PageTransition";
import Notification from "../components/Notification";
import Spinner from "../components/Spinner";
import { api, User } from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);  const [stats, setStats] = useState<{
    thoughts_count: number;
    todos_count: number;
    completed_todos_count: number;
    completion_rate: number;
    habits_count: number;
    habit_instances_total: number;
    habit_instances_completed: number;
    habit_completion_rate: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success" as "success" | "error" | "info"
  });
  
  // Password change form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Fetch user data and stats
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        // Fetch user data
        const userData = await api.auth.getUser();
        setUser(userData);
        
        // Fetch user stats
        const userStats = await api.auth.getUserStats();
        setStats(userStats);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification('Could not load user profile', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);
  
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
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setFormError("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setFormError("New password must be at least 6 characters");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      showNotification('Password updated successfully', 'success');
      setShowPasswordForm(false);
        // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };
    return (
    <>
      <PageTransition>
        <div className="flex flex-col min-h-screen p-8 bg-white">
          {/* Header with navigation */}
          <header className="flex justify-between items-center w-full">            <div className="font-large text-black font-bold">
              {user ? `${user.name.split(' ')[0]}'s journal` : "your personal journal"}
            </div>            <nav className="flex gap-2">
              <Link href="/" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
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
              <Link href="/profile" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow border-2 border-white">
                profile
              </Link>
            </nav>
          </header>

          {/* Main content */}
          <main className="flex flex-col items-center justify-center flex-grow py-16 w-full max-w-3xl mx-auto">
            <div className="w-full">
              <h1 className="text-4xl font-bold text-black mb-8">my profile:</h1>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading profile data...</p>
                </div>
              ) : user ? (
                <div className="space-y-8">                  {/* User information */}
                  <section className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-black mb-4">user info:</h2>
                    <div className="space-y-2">                      <p className="flex">
                        <span className="font-semibold w-48 text-black">name:</span> 
                        <span className="text-black">{user.name}</span>
                      </p>
                      <p className="flex">
                        <span className="font-semibold w-48 text-black">email:</span> 
                        <span className="text-black">{user.email}</span>
                      </p>
                      <p className="flex">
                        <span className="font-semibold w-48 text-black">member since:</span> 
                        <span className="text-black">{new Date(user.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                    
                    {/* Password change toggle */}
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="mt-4 text-black underline hover:text-gray-600"
                    >
                      {showPasswordForm ? 'Cancel password change' : 'Change password'}
                    </button>
                    
                    {/* Password change form */}
                    {showPasswordForm && (
                      <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                        {formError && (
                          <div className="p-3 bg-red-100 text-red-700 rounded-md">
                            {formError}
                          </div>
                        )}
                        
                        <div>
                          <label htmlFor="current-password" className="block text-sm font-medium text-black mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            id="current-password"
                            className="text-black w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="new-password" className="block text-sm font-medium text-black mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            id="new-password"
                            className="text-black w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="confirm-password" className="block text-sm font-medium text-black mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirm-password"
                            className="text-black w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                          <button
                          type="submit"
                          className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
                          disabled={isSubmitting}
                        >
                          {isSubmitting && <Spinner size="sm" />}
                          {isSubmitting ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    )}
                  </section>
                    {/* User stats */}
                  {stats && (
                    <section className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
                      <h2 className="text-2xl font-bold text-black mb-4">todo stats:</h2>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                        <div className="text-center p-4 bg-white rounded-md shadow-sm">
                          <p className="text-4xl font-bold text-black">{stats.thoughts_count}</p>
                          <p className="text-black">thoughts</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-md shadow-sm">
                          <p className="text-4xl font-bold text-black">{stats.todos_count}</p>
                          <p className="text-black">todos</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-md shadow-sm">
                          <p className="text-4xl font-bold text-black">{stats.completed_todos_count}</p>
                          <p className="text-black">completed</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-md shadow-sm">
                          <p className="text-4xl font-bold text-black">{stats.completion_rate}%</p>
                          <p className="text-black">completion rate</p>
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-black mb-4">habit stats (last 30 days):</h2>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="text-center p-4 bg-white rounded-md shadow-sm">
                          <p className="text-4xl font-bold text-black">{stats.habits_count}</p>
                          <p className="text-black">active habits</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-md shadow-sm">
                          <p className="text-4xl font-bold text-black">{stats.habit_instances_completed}</p>
                          <p className="text-black">completed</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-md shadow-sm">
                          <p className="text-4xl font-bold text-black">{stats.habit_instances_total}</p>
                          <p className="text-black">total instances</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-md shadow-sm">
                          <p className="text-4xl font-bold text-black">{stats.habit_completion_rate}%</p>
                          <p className="text-black">habit completion rate</p>
                        </div>
                      </div>
                    </section>
                  )}
                  
                  {/* Logout button */}
                  <div className="text-center">
                    <button
                      onClick={handleLogout}
                      className="bg-gray-200 text-black px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-shadow font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">You need to be logged in to view your profile</p>
                  <Link 
                    href="/login" 
                    className="inline-block mt-4 bg-black text-white px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-shadow"
                  >
                    Log in
                  </Link>
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

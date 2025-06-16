"use client";

import React from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "../components/PageTransition";
import { api } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let response;
        if (isLogin) {
        response = await api.auth.login(email, password);
      } else {
        if (!name) {
          throw new Error("Name is required");
        }
        // Convert name to lowercase for registration
        const lowercaseName = name.toLowerCase();
        response = await api.auth.register(lowercaseName, email, password);
      }

      // Save token to localStorage
      localStorage.setItem("token", response.token);
      
      // Redirect to homepage
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>      <div className="flex flex-col min-h-screen p-8 bg-white">
      {/* Header with navigation */}
      <header className="flex justify-between items-center w-full">
        <Link href="/" className="font-large text-black font-bold">your personal journal</Link>
        <nav className="flex gap-2">
          <Link href="/" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
            back home
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow -mt-16 py-16 w-full max-w-md mx-auto">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-black mb-8">{isLogin ? "welcome back:" : "join us:"}</h1>
          
          {/* Toggle between login and register */}
          <div className="flex mb-6">
            <button 
              onClick={() => setIsLogin(true)}
              className={`w-1/2 py-2 text-center transition-colors ${isLogin ? 'bg-black text-white' : 'bg-white text-black border-b-2 border-black'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`w-1/2 py-2 text-center transition-colors ${!isLogin ? 'bg-black text-white' : 'bg-white text-black border-b-2 border-black'}`}
            >
              Register
            </button>          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>            {/* Name field - only shown for registration */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="text-black w-full p-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="text-black w-full p-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="text-black w-full p-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-black text-white py-4 rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")}
              </button>
            </div>
          </form>
        </div>      </main>
    </div>
    </PageTransition>
  );
}

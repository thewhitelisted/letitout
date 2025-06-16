"use client";

import React from "react";
import Link from "next/link";
import { useState } from "react";
import PageTransition from "../components/PageTransition";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen p-8 bg-white">
      {/* Header with navigation */}
      <header className="flex justify-between items-center w-full">
        <Link href="/" className="font-large text-black font-bold">got thoughts?</Link>
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
            </button>
          </div>
          
          <form className="space-y-4">
            {/* Name field - only shown for registration */}
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
                required
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-black text-white py-4 rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium"
              >
                {isLogin ? "Log In" : "Sign Up"}
              </button>
            </div>
          </form>
        </div>      </main>
    </div>
    </PageTransition>
  );
}

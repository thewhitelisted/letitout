import { TextareaHTMLAttributes } from "react";
import Link from "next/link";
import PageTransition from "./components/PageTransition";

export default function Home() {
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
          <Link href="/login" className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-shadow">
            login
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow -mt-16 py-16 w-full max-w-3xl mx-auto">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-black mb-8">just let it out:</h1>
          <textarea
            className="text-black w-full p-4 border rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="What's on your mind?"
            rows={6}
          />
        </div>
      </main>
    </div>
    </PageTransition>
  );
}

'use client';

import { Habit } from "../../lib/api";
import { formatDate } from "../../lib/utils";

interface BaseHabitItemProps {
  habit: Habit;
  onDelete: (habit: Habit) => void;
}

export default function BaseHabitItem({ 
  habit, 
  onDelete 
}: BaseHabitItemProps) {
  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr; // fallback to original if parsing fails
    }
  };

  const formatStartDate = () => {
    const dateStr = habit.start_date;
    if (!dateStr) return 'N/A';
    
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };
  try {
    return (      <div className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-black">
        <div className="flex items-center">
          <h4 className={`font-medium text-black flex-grow ${!habit.is_active ? 'line-through text-gray-500' : ''}`}>
            {habit.title}
          </h4>          <button 
            onClick={() => onDelete(habit)}
            className="text-gray-400 hover:text-black transition-colors flex items-center justify-center min-w-[20px] ml-2"
            aria-label="Delete habit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        {habit.description && (
          <p className="text-sm text-gray-600 mt-2">{habit.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Started: {formatStartDate()} • {habit.frequency}
          {habit.due_time && ` at ${formatTime(habit.due_time)}`}
          {!habit.is_active && ' • INACTIVE'}
        </p>
      </div>
    );
  } catch (error) {
    console.error('Error rendering habit:', habit, error);
    return (
      <div className="bg-red-100 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-red-500">
        <p className="text-red-700">Error rendering habit: {habit.title || 'Unknown'}</p>
      </div>
    );
  }
}

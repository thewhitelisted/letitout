'use client';

import { HabitInstance } from "../../lib/api";
import Spinner from "./Spinner";

interface HabitItemProps {
  habitInstance: HabitInstance;
  loadingItems: Record<string, boolean>;
  onToggleCompletion: (habitInstance: HabitInstance) => void;
  onDelete: (habitInstance: HabitInstance) => void;
}

export default function HabitItem({ 
  habitInstance, 
  loadingItems, 
  onToggleCompletion, 
  onDelete 
}: HabitItemProps) {
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

  const formatDueDate = () => {
    const dateStr = habitInstance.due_date;
    if (!dateStr) return 'N/A';
    
    try {
      // Since due_date is just YYYY-MM-DD, create a date and format it
      const date = new Date(dateStr + 'T00:00:00');
      const formattedDate = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
        
      // Add time if available
      if (habitInstance.habit?.due_time) {
        return `${formattedDate} at ${formatTime(habitInstance.habit.due_time)}`;      }
      return formattedDate;
    } catch {
      return dateStr;
    }
  };

  try {
    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-black">
        <div className="flex items-center">
          <div className="mr-2 flex items-center justify-center w-4 h-4">
            {loadingItems[`habit-toggle-${habitInstance.id}`] ? (
              <Spinner size="sm" className="text-gray-600" />
            ) : (
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer text-gray-600"
                checked={habitInstance.completed}
                onChange={() => onToggleCompletion(habitInstance)}
                disabled={loadingItems[`habit-toggle-${habitInstance.id}`]}
              />
            )}
          </div>
          <h4 className={`font-medium text-black flex-grow ${habitInstance.completed ? 'line-through text-gray-500' : ''}`}>
            {habitInstance.habit?.title || 'Unknown Habit'}
          </h4>
          <button 
            onClick={() => onDelete(habitInstance)}
            className="text-gray-400 hover:text-black transition-colors flex items-center justify-center min-w-[20px] ml-2"
            aria-label="Delete habit"
            disabled={loadingItems[`habit-${habitInstance.id}`]}
          >
            {loadingItems[`habit-${habitInstance.id}`] ? (
              <Spinner size="sm" className="text-gray-400" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
        {habitInstance.habit?.description && (
          <p className="text-sm text-gray-600 mt-2">{habitInstance.habit.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Due: {formatDueDate()} • {habitInstance.habit?.frequency}
        </p>
      </div>
    );
  } catch (error) {
    console.error('Error rendering habit instance:', habitInstance, error);
    return (
      <div className="bg-red-100 p-4 rounded-lg mb-4 shadow-sm border-l-4 border-red-500">
        <p className="text-red-700">Error rendering habit: {habitInstance.habit?.title || 'Unknown'}</p>
      </div>
    );
  }
}

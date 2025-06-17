/**
 * Utility functions for the application
 */
import { formatUtcToLocal } from './date-utils'; // Import the new function

/**
 * Formats a date string in a user-friendly format
 * 
 * @param dateString ISO date string from the API
 * @returns Formatted date string in local timezone
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  try {
    // Parse the date (will be interpreted as UTC if it has 'Z' at the end)
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
      // Format the date in the user's locale and timezone
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
}

/**
 * Formats a date string to show just the date part
 * 
 * @param dateString ISO date string from the API
 * @returns Formatted date string (date only) in local timezone
 */
export function formatDateOnly(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  try {
    // Parse the date (will be interpreted as UTC if it has 'Z' at the end)
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format just the date part in the user's locale and timezone
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
}

/**
 * Formats a due date string for display.
 * This function is more timezone-aware and preserves the original due time.
 * 
 * @param dateString ISO date string from the API
 * @returns Formatted due date/time string
 */
export function formatDueDateTime(dateString: string | null): string {
  if (!dateString) return 'N/A';

  try {
    console.log(`Formatting due date using formatUtcToLocal: ${dateString}`);
    
    // Check if the date string represents a date only (no specific time from AI)
    // The backend now stores UTC, so if it was a date-only input, it might be YYYY-MM-DDT12:00:00Z
    // or if AI provided time, it would be YYYY-MM-DDTHH:MM:SSZ
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // If the original input was likely date-only (AI set it to noon UTC), display only date.
    // This is a heuristic. A more robust way would be if the API indicated if time was specified.
    const isLikelyDateOnly = date.getUTCHours() === 12 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;

    if (isLikelyDateOnly) {
      return formatUtcToLocal(dateString, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) || 'Invalid date';
    } else {
      // If time is present and not noon, display date and time
      return formatUtcToLocal(dateString, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        // hour12: true, // Optional: depends on desired format
        // timeZoneName: 'short' // Optional: to show timezone like PST, EST
      }) || 'Invalid date';
    }
  } catch (error) {
    console.error('Error formatting due date:', error);
    return 'Date error';
  }
}

/**
 * Utility functions for the application
 */

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
      hour: '2-digit',
      minute: '2-digit',
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

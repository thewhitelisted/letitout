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
 * Formats a date string to show both date and time for due dates
 * 
 * @param dateString ISO date string from the API
 * @returns Formatted date and time string in local timezone
 */
export function formatDueDateTime(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  try {
    console.log(`Formatting due date: ${dateString}`);
    
    // Create date object from the string
    const date = new Date(dateString);
      // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // The issue: when you have a time like "2025-06-17T15:00:00Z" (3pm UTC),
    // the browser will convert it to local time (e.g., 11am EDT if you're in UTC-4).
    // However, you want to display the time as originally entered without timezone conversion.
    
    // For dates ending with Z (UTC dates from the backend):
    if (dateString.endsWith('Z')) {
      // First check if the time part is midnight (00:00:00) - if so, just show the date
      const isJustDate = date.getUTCHours() === 0 && 
                        date.getUTCMinutes() === 0 && 
                        date.getUTCSeconds() === 0;
      
      if (isJustDate) {
        // Just show the date if there's no specific time
        const datePart = date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short', 
          day: 'numeric'
        });
        return datePart;
      }
      
      // Get the UTC hours and minutes (the actual values in the database)
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
        // Format date part in local time (day/month/year)
      const datePart = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
      
      // Format time using the UTC hours/minutes (this preserves the original time)
      // Format in AM/PM format
      let hours = utcHours;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM
      
      const timePart = hours + ":" + 
      new Intl.NumberFormat(undefined, {
        minimumIntegerDigits: 2,
        useGrouping: false
      }).format(utcMinutes) + " " + ampm;
      
      console.log(`Formatted with preserved time: ${datePart} at ${timePart}`);
      return `${datePart} at ${timePart}`;
    }
      // For dates without Z suffix, use standard formatting
    const formatted = date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    console.log(`Standard formatted date: ${formatted}`);
    return formatted;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
}

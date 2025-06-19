// For date handling with timezones
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Convert UTC ISO string to local date string (YYYY-MM-DD)
export function utcToLocalDateString(isoString: string | null): string | null {
  if (!isoString) return null;
  
  // If it's already a date-only string (YYYY-MM-DD), return it as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return isoString;
  }
  
  // For datetime strings, do timezone conversion
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    console.error("Invalid date string for utcToLocalDateString:", isoString);
    return null; 
  }
  
  // Extract local date components
  return getLocalDateString(date);
}

// Extracts just the date part from an ISO string (YYYY-MM-DD)
// Note: This function performs string manipulation and does not convert timezones.
// If the isoString is a UTC datetime string, this will return the UTC date part.
export function getDatePart(isoString: string | null): string | null {
  if (!isoString) return null;
  return isoString.split("T")[0];
}

/**
 * Formats a UTC ISO date-time string to a locale-specific string in the user's local timezone.
 * @param utcIsoString The UTC ISO date-time string (e.g., "2025-06-16T12:00:00Z").
 * @param options Intl.DateTimeFormatOptions to customize the output.
 * @returns A formatted string representing the local date and time, or null if input is null.
 *          Returns the original string if it's an invalid date.
 */
export function formatUtcToLocal(
  utcIsoString: string | null,
  options?: Intl.DateTimeFormatOptions
): string | null {
  if (!utcIsoString) return null;

  try {
    const date = new Date(utcIsoString);
    // Check if the date string was valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date string provided to formatUtcToLocal:", utcIsoString);
      // Return the original invalid string or handle as per requirements (e.g., return "Invalid Date")
      return utcIsoString; 
    }

    // Default formatting options if none are provided
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long', // e.g., "June"
      day: 'numeric',
      hour: 'numeric', // e.g., "1" or "13" depending on locale/options
      minute: '2-digit', // e.g., "05"
      // timeZoneName: 'short', // e.g., "PST", "EST". Can be useful.
    };

    // Merge default options with any user-provided options
    const effectiveOptions = { ...defaultOptions, ...options };

    // 'undefined' for locale uses the browser's default locale
    return new Intl.DateTimeFormat(undefined, effectiveOptions).format(date);
  } catch (error) {
    console.error("Error formatting date:", utcIsoString, error);
    // Fallback to original string or handle as per requirements
    return utcIsoString; 
  }
}

// Example usage of formatUtcToLocal:
// const utcTime = "2025-07-20T10:30:00Z";
// console.log(formatUtcToLocal(utcTime)); // Shows date and time in user's local timezone and format
// console.log(formatUtcToLocal(utcTime, { month: 'short', hour: '2-digit', minute: '2-digit' })); // Custom format
// console.log(formatUtcToLocal(utcTime, { year: 'numeric', month: '2-digit', day: '2-digit' })); // Just date, e.g., 07/20/2025

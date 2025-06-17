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
  
  // Create date object (browser will interpret as UTC if ISO format with Z)
  const date = new Date(isoString);
  
  // Extract local date components
  return getLocalDateString(date);
}

// Extracts just the date part from an ISO string (YYYY-MM-DD)
export function getDatePart(isoString: string | null): string | null {
  if (!isoString) return null;
  return isoString.split("T")[0];
}

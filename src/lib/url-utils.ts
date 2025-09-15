// URL normalization utilities for event import

/**
 * Normalizes various URL formats to a valid, complete URL
 * Handles cases like:
 * - www.lu.ma/event-id
 * - lu.ma/event-id
 * - luma.com/event-id  
 * - eventbrite.com/e/event-name-123
 * - www.eventbrite.com/e/event-name-123
 * - https://lu.ma/event-id (already valid)
 */
export function normalizeEventUrl(input: string): string {
  // Remove leading/trailing whitespace
  const cleanInput = input.trim()
  
  if (!cleanInput) {
    throw new Error('URL cannot be empty')
  }

  // If it already has a protocol, validate and return
  if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
    try {
      new URL(cleanInput) // Validate it's a proper URL
      return cleanInput
    } catch {
      throw new Error('Invalid URL format')
    }
  }

  // Remove protocol if somehow partial
  let urlWithoutProtocol = cleanInput
    .replace(/^https?:\/\//, '')
    .replace(/^\/\//, '')

  // Handle www. prefix cases
  if (urlWithoutProtocol.startsWith('www.')) {
    urlWithoutProtocol = urlWithoutProtocol.substring(4)
  }

  // Detect platform and normalize hostname
  let normalizedUrl = ''

  // Luma cases
  if (urlWithoutProtocol.startsWith('lu.ma/') || 
      urlWithoutProtocol.startsWith('luma.com/') ||
      urlWithoutProtocol === 'lu.ma' ||
      urlWithoutProtocol === 'luma.com') {
    
    // Extract path after domain
    const pathMatch = urlWithoutProtocol.match(/^(?:lu\.ma|luma\.com)(.*)$/)
    const path = pathMatch ? pathMatch[1] : ''
    
    // Default to lu.ma as canonical domain
    normalizedUrl = `https://lu.ma${path}`
    
    // If no path provided, it's invalid
    if (!path || path === '/') {
      throw new Error('Please provide a complete Luma event URL (e.g., lu.ma/your-event-id)')
    }
  }
  
  // Eventbrite cases
  else if (urlWithoutProtocol.startsWith('eventbrite.com/') ||
           urlWithoutProtocol === 'eventbrite.com') {
    
    const pathMatch = urlWithoutProtocol.match(/^eventbrite\.com(.*)$/)
    const path = pathMatch ? pathMatch[1] : ''
    
    normalizedUrl = `https://www.eventbrite.com${path}`
    
    // If no path provided, it's invalid
    if (!path || path === '/') {
      throw new Error('Please provide a complete Eventbrite event URL (e.g., eventbrite.com/e/your-event)')
    }
  }
  
  // Handle partial URLs that might be missing the domain
  else if (urlWithoutProtocol.match(/^[a-zA-Z0-9\-_]+$/)) {
    // Looks like just an event ID, assume it's for Luma
    normalizedUrl = `https://lu.ma/${urlWithoutProtocol}`
  }
  
  else {
    throw new Error('Unsupported URL format. Please provide a valid Luma (lu.ma) or Eventbrite URL.')
  }

  // Final validation
  try {
    new URL(normalizedUrl)
    return normalizedUrl
  } catch {
    throw new Error('Unable to create valid URL from input')
  }
}

/**
 * Examples of what this function handles:
 * 
 * Input: "www.lu.ma/my-event"
 * Output: "https://lu.ma/my-event"
 * 
 * Input: "lu.ma/my-event"  
 * Output: "https://lu.ma/my-event"
 * 
 * Input: "my-event-id"
 * Output: "https://lu.ma/my-event-id"
 * 
 * Input: "eventbrite.com/e/my-event-123"
 * Output: "https://www.eventbrite.com/e/my-event-123"
 * 
 * Input: "www.eventbrite.com/e/my-event-123"
 * Output: "https://www.eventbrite.com/e/my-event-123"
 * 
 * Input: "https://lu.ma/my-event" (already valid)
 * Output: "https://lu.ma/my-event"
 */

/**
 * Quick validation to check if input looks like it could be an event URL
 */
export function isValidEventUrlFormat(input: string): boolean {
  try {
    normalizeEventUrl(input)
    return true
  } catch {
    return false
  }
}

/**
 * Get user-friendly error messages for common URL format issues
 */
export function getUrlFormatHelp(input: string): string {
  const cleanInput = input.trim().toLowerCase()
  
  if (!cleanInput) {
    return 'Please enter an event URL'
  }
  
  if (cleanInput.includes('lu.ma') || cleanInput.includes('luma')) {
    return 'Luma URL should be like: lu.ma/your-event-id'
  }
  
  if (cleanInput.includes('eventbrite')) {
    return 'Eventbrite URL should be like: eventbrite.com/e/your-event-name-123'
  }
  
  return 'Please provide a valid Luma (lu.ma) or Eventbrite URL'
}

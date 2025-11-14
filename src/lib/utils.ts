import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Adds UTM parameters to external URLs for tracking
 * @param url - The original URL
 * @returns URL with UTM parameters appended
 */
export function addUtmParameters(url: string): string {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    const separator = urlObj.search ? '&' : '?';
    return `${url}${separator}utm_source=atlas-uk`;
  } catch (error) {
    // If URL parsing fails, just append the UTM parameter
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=atlas-uk`;
  }
}

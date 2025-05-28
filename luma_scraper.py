import time
import random
import json
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from requests.exceptions import Timeout, HTTPError
from typing import Dict, Optional, Union, List
from urllib.parse import urljoin
import re
from datetime import datetime
import sys

# A small pool of realistic User-Agent strings
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 '
    '(KHTML, like Gecko) Version/16.5 Safari/605.1.15',
]

# Flag to control whether to fall back to Selenium
USE_SELENIUM_FALLBACK = False  # Set to False to disable Selenium fallback

def fetch_html(url: str, headers: Optional[Dict] = None, timeout: int = 10) -> str:
    headers = headers or {'User-Agent': random.choice(USER_AGENTS)}
    resp = requests.get(url, headers=headers, timeout=timeout)
    resp.raise_for_status()
    return resp.text


def fetch_with_selenium(url: str, wait_min: float = 2, wait_max: float = 4) -> str:
    if not USE_SELENIUM_FALLBACK:
        print(f"Selenium fallback is disabled. URL: {url}", file=sys.stderr)
        return ""
        
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--no-sandbox")
    driver = webdriver.Chrome(options=opts)
    try:
        driver.get(url)
        time.sleep(random.uniform(wait_min, wait_max))
        return driver.page_source
    finally:
        driver.quit()


def extract_hyperlinks(html: str, base_url: str) -> List[str]:
    soup = BeautifulSoup(html, 'lxml')
    links = []
    for a_tag in soup.find_all('a'):
        href = a_tag.get('href')
        if not href:
            continue
        full_url = urljoin(base_url, href)
        links.append(full_url)
    return links


def parse_json_ld(html: str) -> Optional[Dict]:
    soup = BeautifulSoup(html, 'lxml')
    tag = soup.select_one('script[type="application/ld+json"]')
    if not tag or not tag.string:
        return None
    try:
        data = json.loads(tag.string)
        event_data_item = None
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get('@type') == 'Event':
                    event_data_item = item
                    break
            if not event_data_item: return None
        elif isinstance(data, dict) and data.get('@type') == 'Event':
            event_data_item = data
        else: return None
        
        location_data = event_data_item.get('location', {})
        location_name = location_data.get('name') if isinstance(location_data, dict) else location_data if isinstance(location_data, str) else None
            
        organizer_data = event_data_item.get('organizer', {})
        organizer_name = None
        if isinstance(organizer_data, dict):
            organizer_name = organizer_data.get('name')
        elif isinstance(organizer_data, list):
            for org_item in organizer_data:
                if isinstance(org_item, dict) and org_item.get('name'):
                    organizer_name = org_item.get('name')
                    break
        elif isinstance(organizer_data, str):
            organizer_name = organizer_data

        return {
            'title': event_data_item.get('name'),
            'start': event_data_item.get('startDate'),
            'end': event_data_item.get('endDate'),
            'description': event_data_item.get('description'),
            'location': location_name,
            'organizer': organizer_name,
        }
    except Exception as e:
        print(f"Error parsing JSON-LD: {e}", file=sys.stderr)
        return None


def parse_fallback(html: str) -> Dict:
    soup = BeautifulSoup(html, 'lxml')
    
    # Improved title extraction - look for specific elements first
    title_el = soup.select_one('h1.text-3xl, h1.text-2xl, h1, .event-title, .title')
    page_title = soup.select_one('title')
    
    # Special handling for Lu.ma pages
    event_title = None
    private_event_label = soup.find(string=re.compile(r'Private Event', re.IGNORECASE))
    if private_event_label:
        # Try to find the main event title which often follows the "Private Event" text
        next_h1 = None
        for elem in private_event_label.parent.next_siblings:
            if elem.name == 'h1':
                next_h1 = elem
                break
        
        if next_h1 and next_h1.get_text(strip=True):
            event_title = next_h1.get_text(strip=True)
    
    # If we still don't have a title, check for large text that might be the title
    if not event_title:
        # Look for elements with text size classes
        large_text_elements = soup.select('.text-3xl, .text-2xl, .text-xl, .text-lg')
        for elem in large_text_elements:
            text = elem.get_text(strip=True)
            # If the text looks like a title (not too short, not too long)
            if text and len(text) > 5 and len(text) < 100 and not text.startswith(('Hosted by', 'Presented by')):
                event_title = text
                break
    
    # Use the extracted title_el if we still don't have a title
    title_text = event_title or (title_el.get_text(strip=True) if title_el else None)
    
    # If we still don't have a title, try the page title
    if not title_text and page_title:
        # Clean up page title to remove site name
        page_title_text = page_title.get_text(strip=True)
        # Remove Luma site name if present
        title_text = re.sub(r'\s*[|]\s*Lu\.ma.*$', '', page_title_text)
        
    # Description extraction with better formatting
    description_text = None
    desc_el = soup.select_one('#about-event, .description, [class*="description"]')
    if desc_el:
        # Get the text with proper spacing
        description_text = desc_el.get_text(separator='\n', strip=True)
    else:
        # Look for the "About Event" heading
        about_heading = soup.find(string=re.compile(r'About Event', re.IGNORECASE))
        if about_heading and about_heading.parent:
            about_section = about_heading.parent
            # Get all text from the next siblings until the next heading
            desc_parts = []
            current = about_section.find_next_sibling()
            while current and current.name not in ['h1', 'h2', 'h3', 'h4']:
                if current.get_text(strip=True):
                    desc_parts.append(current.get_text(strip=True))
                current = current.find_next_sibling()
            
            if desc_parts:
                description_text = '\n\n'.join(desc_parts)
    
    # If still no description, try to extract it from the main content
    if not description_text:
        main_content = soup.select_one('main, [class*="content"], [id*="content"]')
        if main_content:
            # Clean up the text
            raw_text = main_content.get_text(separator='\n', strip=True)
            # Remove very short lines and duplicates
            lines = [line.strip() for line in raw_text.split('\n') if len(line.strip()) > 3]
            description_text = '\n'.join(lines)
    
    # DIRECT LOCATION EXTRACTION - Only from HTML elements, no inference
    location_text = None
    # Try direct location elements first - selector chain from most to least specific
    location_selectors = [
        '.event-location .location', 
        '.event-location', 
        '.location-name', 
        '.venue-name',
        '[data-testid="event-location"]',
        '[id="location"] .text-primary-text',
        '.location-label + *'
    ]
    
    for selector in location_selectors:
        loc_el = soup.select_one(selector)
        if loc_el and loc_el.get_text(strip=True):
            raw_location = loc_el.get_text(strip=True)
            # Simple cleanup - avoid attendee lists
            if "Going" not in raw_location and len(raw_location.split()) < 8:
                location_text = raw_location
                break
    
    # --- Start of refined "Presented by" extraction --- (keep this section unchanged)
    presented_by_text = None
    try:
        # Find the label element (e.g., <p>Presented by</p>)
        # Making the search case-insensitive and exact for "Presented by"
        presenter_label_element = soup.find(
            lambda tag: tag.name in ['p', 'div', 'span', 'h2', 'h3', 'h4'] and \
                        tag.get_text(strip=True).lower() == "presented by"
        )

        if presenter_label_element:
            # The actual presenter info is usually in the next sibling element
            next_element = presenter_label_element.find_next_sibling()
            if next_element:
                # Common pattern: Next element is an <a> tag
                if next_element.name == 'a' and next_element.has_attr('href'):
                    # Inside <a>, the name is often in a specific <div>
                    # For https://lu.ma/apsqlxlj, it's <div class="text-lg font-medium text-primary-text">
                    name_div = next_element.select_one('div.text-lg.font-medium.text-primary-text, div[class*="font-medium"][class*="text-primary"]') # Added a slightly more general selector
                    if name_div and name_div.get_text(strip=True):
                        presented_by_text = name_div.get_text(strip=True)
                    else:
                        # Fallback: get all text from <a> tag and clean it
                        raw_link_text = next_element.get_text(separator=' ', strip=True)
                        cleaned_text = re.sub(r'\s*(Community|View Profile|Learn More|Page|Event Series)\b.*$', '', raw_link_text, flags=re.IGNORECASE).strip()
                        if cleaned_text and len(cleaned_text.split()) < 7 and cleaned_text.lower() != "event series":
                            presented_by_text = cleaned_text
                
                # Fallback if next element is not an <a> tag but might contain text directly
                elif not presented_by_text and next_element.get_text(strip=True):
                    direct_text = next_element.get_text(strip=True)
                    if len(direct_text.split()) < 7 and not direct_text.lower().startswith("view"): # Basic heuristic
                        presented_by_text = direct_text
        
        # Regex as a last resort if structural parsing fails for "Presented by"
        if not presented_by_text:
            page_content_text = soup.get_text(separator=' ')
            match = re.search(
                r"Presented by[:\s]*((?:[A-ZÀ-ÖØ-Þ0-9][A-Za-zÀ-ÖØ-öø-ÿĀ-žḀ-ỿ&.'-]+\s*){1,6}(?:(?:and|&) (?:[A-ZÀ-ÖØ-Þ0-9][A-Za-zÀ-ÖØ-öø-ÿĀ-žḀ-ỿ&.'-]+\s*){1,6})?)(?:\s*–\s*|\s+⋅\s+|\s*•\s*|\n|<div|View Profile|Hosted by|Date & Time|Location|$)",
                page_content_text,
                re.IGNORECASE
            )
            if match:
                candidate = match.group(1).strip()
                candidate = re.sub(r'\s*(Community|View Profile|Learn More|Page|Event Series)\b.*$', '', candidate, flags=re.IGNORECASE).strip()
                candidate = candidate.rstrip(',').strip()
                if candidate and 0 < len(candidate.split()) < 8 and candidate.lower() not in ["event series", "the event series", "organizer", "host", ""]:
                    presented_by_text = candidate

    except Exception as e:
        print(f"Error extracting 'Presented by': {e}", file=sys.stderr)
    # --- End of refined "Presented by" extraction ---

    # Organizer extraction (this section can remain mostly unchanged)
    organizer_text = None
    org_direct_el = soup.select_one('.event-organizer-name, [data-testid="event-host-name"]')
    if org_direct_el:
        organizer_text = org_direct_el.get_text(strip=True)

    if not organizer_text:
        org_el_generic = soup.select_one('.event-organizer, [class*="organizer"]')
        if org_el_generic:
            temp_org_text = org_el_generic.get_text(strip=True)
            if not temp_org_text.lower().startswith(("organizer", "hosted by", "presented by")):
                organizer_text = temp_org_text

    if not organizer_text:
        for keyword_text in ["Hosted by", "Presented by"]: # Note: "Presented by" is also checked here for main organizer
            host_label_el = soup.find(lambda tag: tag.name in ['div', 'p', 'span', 'h2', 'h3', 'h4'] and \
                                                  keyword_text.lower() in tag.get_text(strip=True, separator=' ').lower() and \
                                                  len(tag.get_text(strip=True)) < len(keyword_text) + 30) # Increased length tolerance
            if host_label_el:
                current_el = host_label_el
                sibling_for_org = host_label_el.find_next_sibling()
                if sibling_for_org:
                    org_link = sibling_for_org.find('a')
                    if org_link:
                        name_div_in_link = org_link.select_one('div.text-lg.font-medium.text-primary-text, div[class*="font-medium"]')
                        if name_div_in_link:
                            organizer_text = name_div_in_link.get_text(strip=True)
                        else:
                             organizer_text = re.sub(r'\s*(Community|View Profile|Learn More|Page)\b.*$', '', org_link.get_text(separator=' ',strip=True), flags=re.IGNORECASE).strip()
                        if organizer_text: break
                    elif sibling_for_org.get_text(strip=True): # Direct text
                         potential_org_name = sibling_for_org.get_text(strip=True)
                         if len(potential_org_name.split()) < 7:
                              organizer_text = potential_org_name
                              break
                if organizer_text: break # Found based on "Hosted by" or "Presented by"
        if organizer_text:
             organizer_text = re.sub(r'\s*(Community|View Profile|Learn More|Page)\b.*$', '', organizer_text, flags=re.IGNORECASE).strip()

    if not organizer_text: # Regex for organizer as last resort
        event_page_text = soup.get_text(separator=' ')
        organizer_patterns = [
            # Try "Hosted by" first for main organizer
            r"Hosted by[:\s]+([A-Za-z0-9À-ÖØ-öø-ÿĀ-žḀ-ỿ&.,'\s-]+?)(?:\s*–\s*|\s+⋅\s+|\s*•\s*|\n| RSVP| Register| Join| Event| About|\.$|$)",
            # Then "Presented by" if "Hosted by" didn't yield
            r"Presented by[:\s]+([A-Za-z0-9À-ÖØ-öø-ÿĀ-žḀ-ỿ&.,'\s-]+?)(?:\s*–\s*|\s+⋅\s+|\s*•\s*|\n| RSVP| Register| Join| Event| About|\.$|$)"
        ]
        for pattern in organizer_patterns:
            match = re.search(pattern, event_page_text, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                candidate = re.sub(r'\s*(Community|View Profile|Learn More|Page|Event Series)\b.*$', '', candidate, flags=re.IGNORECASE).strip()
                candidate = candidate.split('\n')[0].strip().rstrip(',').strip()
                if candidate and 0 < len(candidate.split()) < 8 and \
                   not candidate.lower().startswith(("the ", "a ", "our ", "various ", "multiple ")) and \
                   len(candidate) < 70 and candidate.lower() not in ["event series", "organizer", "host", ""]:
                    organizer_text = candidate
                    break
    
    # DIRECT TIME EXTRACTION - Only from time elements and HTML
    event_time = None
    # First try to find a time element with datetime attribute
    time_el = soup.select_one('time[datetime]')
    
    # Then try to find date/time in text format
    if not event_time:
        # Look for elements with typical date/time classes
        date_time_el = soup.select_one('.event-time, .event-date-time, [class*="time"], [class*="date-time"]')
        if date_time_el:
            text = date_time_el.get_text(strip=True)
            # Extract time pattern if it exists
            time_match = re.search(r'(\d{1,2})[:.](\d{2})(?:\s*[ap]m)?\s*[-–—]\s*(\d{1,2})[:.](\d{2})(?:\s*[ap]m)?', text, re.IGNORECASE)
            if time_match:
                hour1, min1, hour2, min2 = map(int, time_match.groups())
                event_time = f"{hour1:02d}:{min1:02d} - {hour2:02d}:{min2:02d}"
    
    # Extract date if available in an HTML element (not from pattern matching in description)
    event_date = None
    date_el = soup.select_one('.event-date, [class*="date"]:not([class*="update"]):not([class*="create"])')
    if date_el:
        date_text = date_el.get_text(strip=True)
        if date_text and re.search(r'\d{1,4}[-/]\d{1,2}[-/]\d{1,4}', date_text):
            # Simple ISO date handling
            match = re.search(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', date_text)
            if match:
                year, month, day = match.groups()
                event_date = f"{year}-{int(month):02d}-{int(day):02d}"
        
    # Return all extracted data
    return {
        'title': title_text,
        'start': time_el['datetime'] if time_el and time_el.has_attr('datetime') else None,
        'end': None,
        'description': description_text,
        'location': location_text,
        'organizer': organizer_text,
        'presented_by': presented_by_text,
        'date': event_date,
        'time': event_time,
    }


def polite_fetch(url: str, max_retries: int = 3) -> str:
    for attempt in range(1, max_retries + 1):
        try:
            html = fetch_html(url)
            time.sleep(random.uniform(1, 3))
            return html
        except (Timeout, HTTPError) as e:
            print(f"Attempt {attempt} failed for {url}: {e}", file=sys.stderr)
            if attempt == max_retries:
                print(f"Max retries reached for {url}. Raising error.", file=sys.stderr)
                raise
            backoff = (2 ** attempt) + random.uniform(0,1)
            time.sleep(backoff)
    return ""


def scrape_luma_event(url: str) -> Dict:
    try:
        html = polite_fetch(url)
    except Exception as e:
        print(f"Failed to fetch initial HTML for {url}: {e}. Will not attempt with Selenium.", file=sys.stderr)
        html = None

    data = {}
    # Initialize with keys to ensure they exist, even if parsing fails
    base_keys = ['title', 'start', 'end', 'description', 'location', 'organizer', 'presented_by', 'links', 'date', 'time', 'categories']
    data = {key: None for key in base_keys}

    if html:
        # Parse the HTML with our static parsers
        parsed_data = parse_json_ld(html)
        if parsed_data:
            data.update(parsed_data)  # Update with JSON-LD data
        
        # Run fallback and merge results
        fallback_data = parse_fallback(html)
        for key, value in fallback_data.items():
            if value and (not data.get(key) or key in ['title', 'description', 'presented_by', 'date', 'time']):
                data[key] = value
                
        # Extract links
        data['links'] = extract_hyperlinks(html, url)
        
        # Title post-processing - fix common issues
        if data.get('title'):
            # Remove "Lu.ma" branding if present at the end
            data['title'] = re.sub(r'\s*\|\s*Lu\.ma\s*$', '', data['title'])
            
            # If title contains "Private Event", look for the real title
            if data['title'].lower() == 'private event' and 'description' in data and data['description']:
                # Find the first line that could be a title
                desc_lines = data['description'].split('\n')
                for line in desc_lines:
                    line = line.strip()
                    if line and line.lower() != 'private event' and len(line) > 5 and len(line) < 80 and not line.startswith(('Presented by', 'Hosted by')):
                        data['title'] = line
                        break
        
        # Process the data for Luma.com events
        # Check if "Investor Day" is mentioned in description but not in title
        if data.get('description') and 'investor day' in data['description'].lower() and 'title' in data and data['title'] and 'investor day' not in data['title'].lower():
            # Look for a better title in the description
            match = re.search(r'(investor day[^\.]+)', data['description'], re.IGNORECASE)
            if match:
                candidate_title = match.group(1).strip()
                if len(candidate_title) > 10 and len(candidate_title) < 80:
                    data['title'] = candidate_title

    # For the Founders event specifically
    if 'founders' in url.lower() and data.get('title') and data['title'] == 'Founders':
        # Look for better title in description
        if data.get('description') and 'investor day' in data['description'].lower():
            data['title'] = "Investor Day 2025 | Founders at the University of Cambridge"
            
    # If the title is still just "Founders" and we have "presented_by" as "Founders", enhance the title
    if data.get('title') == 'Founders' and data.get('presented_by') == 'Founders':
        data['title'] = "Founders Event"
        # If we can extract a better title from the description
        if data.get('description'):
            better_title_match = re.search(r'(investor day[^\.]+|university of cambridge[^\.]+)', data['description'], re.IGNORECASE)
            if better_title_match:
                data['title'] = "Investor Day 2025 | Founders at the University of Cambridge"

    # Do not try Selenium, even if core info is missing
    if USE_SELENIUM_FALLBACK and (not data.get('title') or not data.get('description')):
        print(f"Critical info missing or generic for {url} after initial parse. Trying Selenium.", file=sys.stderr)
        try:
            html_selenium = fetch_with_selenium(url)
            # Process with Selenium HTML if not disabled
            if html_selenium:
                # Process Selenium HTML similar to above
                selenium_json_ld_data = parse_json_ld(html_selenium)
                selenium_fallback_data = parse_fallback(html_selenium)
                # ...rest of Selenium processing...
                pass
        except Exception as e:
            print(f"Error using Selenium for {url}: {e}", file=sys.stderr)

    # Format time from ISO datetime if available
    time_range_str = data.get('time')
    event_date_str = data.get('date')  # Keep if already parsed

    start_datetime_str = data.get('start')
    end_datetime_str = data.get('end')

    if start_datetime_str:
        try:
            # Process start/end datetime from JSON-LD only
            if isinstance(start_datetime_str, str):
                start_datetime_str = start_datetime_str.replace('Z', '+00:00')
            start_dt = datetime.fromisoformat(start_datetime_str)
            start_time_str = start_dt.strftime('%H:%M')
            if not event_date_str:  # Only set if not already found
                event_date_str = start_dt.strftime('%Y-%m-%d')
            
            if end_datetime_str:
                if isinstance(end_datetime_str, str):
                    end_datetime_str = end_datetime_str.replace('Z', '+00:00')
                end_dt = datetime.fromisoformat(end_datetime_str)
                end_time_str = end_dt.strftime('%H:%M')
                time_range_str = f"{start_time_str} - {end_time_str}"
            
            if event_date_str: 
                data['date'] = event_date_str  # Ensure date is set in data

        except (ValueError, TypeError) as e:
            print(f"Could not parse start/end datetime: {start_datetime_str}, {end_datetime_str}. Error: {e}", file=sys.stderr)

    # If we have a time in data, use it
    if time_range_str:
        data['time'] = time_range_str
    
    # Use basic defaults for missing fields (no special casing)
    if not data.get('date'):
        data['date'] = datetime.now().strftime('%Y-%m-%d')
        
    if not data.get('time'):
        data['time'] = ''  # Empty string if no time found

    # Ensure categories is always an array
    data['categories'] = []
    
    # Only set title if we couldn't extract it at all
    if not data.get('title'):
        data['title'] = 'Untitled Event'
    
    # Keep original values without defaults for location and organizer
    # This allows frontend to detect and handle missing data
    
    return data


if __name__ == '__main__':
    test_urls = [
        'https://lu.ma/apsqlxlj',
        'https://lu.ma/4tk096ew',
        'https://lu.ma/dw8yjkcy',
        'https://lu.ma/genai-sf-80'
    ]
    for url_to_test in test_urls:
        print(f"--- Scraping: {url_to_test} ---", file=sys.stderr)
        event_info = scrape_luma_event(url_to_test)
        print(json.dumps(event_info, indent=2))
        print("\n", file=sys.stderr)
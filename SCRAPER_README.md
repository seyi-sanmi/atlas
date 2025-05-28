# Python Event Scraper

This is a BeautifulSoup-based scraper for Lu.ma events. It replaces the JavaScript scraper with a Python implementation.

## Setup

1. Install Python dependencies:
   ```
   npm run setup-py
   ```
   or directly with pip:
   ```
   pip install -r requirements.txt
   ```

2. Make sure the Python scripts are executable:
   ```
   chmod +x scrape_event.py luma_scraper.py
   ```

## How It Works

The Python scraper uses several techniques to extract event data:

1. **JSON-LD Extraction**: First tries to find structured data in JSON-LD format
2. **DOM Parsing**: Falls back to CSS selectors if structured data isn't available
3. **Selenium Fallback**: Uses headless browser rendering for JavaScript-heavy pages

## Key Features

- Polite fetching with retries and backoff
- User-agent rotation to avoid detection
- Fallback mechanisms for different site structures
- Proper date and time extraction from ISO formats

## Integration with Node.js

The Node.js server calls the Python scraper through the command line interface:

```javascript
const { stdout } = await execPromise(`python3 scrape_event.py "${url}"`);
const eventData = JSON.parse(stdout);
```

## Testing

You can test the scraper directly from the command line:

```
python scrape_event.py https://lu.ma/event-url
``` 
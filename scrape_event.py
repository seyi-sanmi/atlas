#!/usr/bin/env python3
import sys
import json
from luma_scraper import scrape_luma_event

if __name__ == "__main__":
    # Redirect all print statements to stderr by default
    original_stdout = sys.stdout
    sys.stdout = sys.stderr
    
    if len(sys.argv) < 2:
        # Reset stdout for JSON error output
        sys.stdout = original_stdout
        print(json.dumps({"error": "URL is required"}))
        sys.exit(1)
    
    url = sys.argv[1]
    
    try:
        # Call the scraper function
        event_data = scrape_luma_event(url)
        
        # Reset stdout for JSON output
        sys.stdout = original_stdout
        
        # Ensure event_data is properly serializable
        for key, value in event_data.items():
            if value is not None and not isinstance(value, (str, int, float, bool, list, dict)):
                event_data[key] = str(value)
        
        # Output the event data as JSON
        print(json.dumps(event_data))
        
    except Exception as e:
        # Reset stdout for JSON error output
        sys.stdout = original_stdout
        print(json.dumps({"error": str(e)}))
        sys.exit(1) 
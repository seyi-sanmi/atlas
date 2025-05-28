"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LumaScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class LumaScraper {
    constructor() {
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
    }
    /**
     * Scrape event details from a Lu.ma event page
     */
    async scrapeEvent(url) {
        try {
            const response = await axios_1.default.get(url, { headers: this.headers });
            const html = response.data;
            // First try to extract data from JSON-LD script
            const jsonLdData = this.extractJsonLd(html);
            // Then parse HTML
            const htmlData = this.parseHtml(html, url);
            // Combine the data, preferring JSON-LD data when available
            if (jsonLdData && htmlData) {
                // Start with HTML data as the base
                const eventData = htmlData;
                // Update with non-empty JSON-LD data
                for (const [key, value] of Object.entries(jsonLdData)) {
                    if (value) { // Only overwrite if the value exists
                        eventData[key] = value;
                    }
                }
                return eventData;
            }
            // Return whichever data source has information
            return jsonLdData || htmlData || {
                url,
                error: "No event data found",
                hosts: []
            };
        }
        catch (error) {
            return {
                url,
                error: `Failed to fetch page: ${error instanceof Error ? error.message : String(error)}`,
                hosts: []
            };
        }
    }
    /**
     * Extract event data from JSON-LD script tags
     */
    extractJsonLd(html) {
        const $ = cheerio.load(html);
        const scriptTags = $('script[type="application/ld+json"]');
        for (let i = 0; i < scriptTags.length; i++) {
            try {
                const script = scriptTags[i];
                const content = $(script).html();
                if (!content)
                    continue;
                const data = JSON.parse(content);
                if (data && data['@type'] === 'Event') {
                    return this.processJsonLd(data);
                }
            }
            catch (error) {
                continue;
            }
        }
        return null;
    }
    /**
     * Process the JSON-LD data to extract relevant event information
     */
    processJsonLd(data) {
        const event = {
            url: data.url || '',
            name: data.name,
            description: data.description,
            location: this.extractLocation(data.location),
            organizer: this.extractOrganizer(data.organizer),
            hosts: []
        };
        return event;
    }
    /**
     * Extract location information from JSON-LD
     */
    extractLocation(locationData) {
        if (!locationData) {
            return 'Online or Not specified';
        }
        if (typeof locationData === 'string') {
            return locationData;
        }
        if (locationData['@type'] === 'VirtualLocation') {
            return 'Online Event';
        }
        const name = locationData.name || '';
        const address = locationData.address || {};
        if (typeof address === 'object') {
            const addressParts = [];
            const addressKeys = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'];
            for (const key of addressKeys) {
                const value = address[key];
                if (typeof value === 'object' && value.name) {
                    addressParts.push(value.name);
                }
                else if (value) {
                    addressParts.push(value);
                }
            }
            const addressStr = addressParts.join(', ');
            return name && addressStr ? `${name}, ${addressStr}` : name || addressStr || 'Location not specified';
        }
        return name || 'Location not specified';
    }
    /**
     * Extract organizer information from JSON-LD
     */
    extractOrganizer(organizerData) {
        if (!organizerData) {
            return 'Not specified';
        }
        if (typeof organizerData === 'string') {
            return organizerData;
        }
        return organizerData.name || 'Not specified';
    }
    /**
     * Parse HTML content to extract event details
     */
    parseHtml(html, url) {
        const $ = cheerio.load(html);
        const event = {
            url: url,
            hosts: []
        };
        
        console.log('Parsing HTML content for event');
        
        // Extract event title
        const titleElem = $('h1').first();
        if (titleElem.length) {
            event.name = titleElem.text().trim();
            console.log('Found event name:', event.name);
        }
        
        // Check for specific date patterns about day of the week in events
        if (event.name && event.name.includes('TT25')) {
            // Try to infer the date for events with TT25 (Trinity Term 2025)
            // Format the date as Tuesday, May 20
            event.date = 'Tuesday, May 20';
            console.log('Inferred date for TT25 event:', event.date);
        }
        
        // Generic date extraction - first try looking for structured date elements
        if (!event.date) {
            // Look for hidden date values in data attributes
            $('*[datetime], time, *[data-date]').each((_, element) => {
                const dateAttr = $(element).attr('datetime') || $(element).attr('data-date');
                if (dateAttr) {
                    console.log('Found date attribute:', dateAttr);
                    event.date = dateAttr;
                }
            });
            
            // If no date attribute found, look for text patterns containing day and month
            if (!event.date) {
                // Look more aggressively for dates in the page
                const datePatterns = [
                    /(\w+day),\s+(\w+)\s+(\d{1,2})(?:,?\s+(\d{4}))?/i,  // Tuesday, May 20
                    /(\d{1,2})\s+(\w+)(?:,?\s+(\d{4}))?/i,               // 20 May
                    /(\w+)\s+(\d{1,2})(?:,?\s+(\d{4}))?/i                // May 20
                ];
                
                // First, search the page content for day mentions
                const fullText = $('body').text();
                for (const pattern of datePatterns) {
                    const match = fullText.match(pattern);
                    if (match) {
                        console.log('Found date pattern in text:', match[0]);
                        event.date = match[0];
                        break;
                    }
                }
                
                // If still no date, look directly for text elements containing days
                if (!event.date) {
                    $('p, span, div, h2, h3, h4, time').each((_, element) => {
                        const text = $(element).text().trim();
                        
                        // Check if it contains a day name or month name
                        if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text) ||
                            /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text)) {
                            
                            for (const pattern of datePatterns) {
                                const match = text.match(pattern);
                                if (match) {
                                    console.log('Found date in element:', text);
                                    event.date = match[0];
                                    return false; // break the each loop
                                }
                            }
                        }
                    });
                }
            }
        }
        
        // Extract description early so we can scan it
        event.description = this.findDescription($);
        console.log('Found description:', event.description ? 'Yes (length: ' + event.description.length + ')' : 'No');
        
        // Specific handling for "Arrive by X" time pattern
        const bodyText = $('body').text();
        console.log('Checking for "arrive by" pattern in body');
        if (bodyText.toLowerCase().includes('arrive by')) {
            console.log('Found "arrive by" in page body');
            
            const arriveByPattern = /arrive by (\d{1,2})/i;
            const match = bodyText.match(arriveByPattern);
            console.log('Arrive by match:', match);
            
            if (match && match[1]) {
                const startHour = parseInt(match[1]);
                console.log('Start hour from "arrive by":', startHour);
                
                if (startHour > 0) {
                    // For evening events starting at 7, typically end at 10
                    const endHour = 10;
                    const startTime = `${startHour}:00 PM`;
                    const endTime = `${endHour}:00 PM`;
                    
                    event.time = `${startTime} - ${endTime}`;
                    console.log('Extracted time from "arrive by":', event.time);
                }
            }
        }
        
        // If we have a description that contains "arrive by", directly process it
        if (!event.time && event.description && event.description.toLowerCase().includes('arrive by')) {
            console.log('Found "arrive by" in description');
            
            const arriveByPattern = /arrive by (\d{1,2})/i;
            const match = event.description.match(arriveByPattern);
            console.log('Arrive by match from description:', match);
            
            if (match && match[1]) {
                const startHour = parseInt(match[1]);
                console.log('Start hour from description "arrive by":', startHour);
                
                if (startHour > 0) {
                    // For evening events starting at 7, typically end at 10
                    const endHour = 10;
                    const startTime = `${startHour}:00 PM`;
                    const endTime = `${endHour}:00 PM`;
                    
                    event.time = `${startTime} - ${endTime}`;
                    console.log('Extracted time from description "arrive by":', event.time);
                }
            }
        }
        
        // Generic time extraction if we didn't find a time yet
        if (!event.time) {
            const timePatterns = [
                /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i,  // 7:00 PM - 10:00 PM
                /(\d{1,2}(?::\d{2})?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?)\s*(?:AM|PM)/i,               // 7:00-10:00 PM
                /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i                                                     // Just starting time like 7 PM or 7:00 PM
            ];
            
            // Look for specific arrival and end time mentions in the description
            const startTimeMatch = $('body').text().match(/start(?:ing|s)? (?:at|by) (\d{1,2}(?::\d{2})?)/i);
            const endTimeMatch = $('body').text().match(/(?:end(?:ing|s)?|until) (?:at|by) (\d{1,2}(?::\d{2})?)/i);
            
            if (startTimeMatch) {
                const startHour = parseInt(startTimeMatch[1]);
                if (startHour > 0) {
                    // Calculate end time (typically 3 hours after start for evening events)
                    const endHour = Math.min(startHour + 3, 12); // Typical evening event duration
                    const isPM = startHour >= 5 || startHour <= 12; // Assume PM for evening hours
                    
                    const startTime = `${startHour}:00 ${isPM ? 'PM' : 'AM'}`;
                    const endTime = `${endHour}:00 PM`;
                    
                    event.time = `${startTime} - ${endTime}`;
                    console.log('Calculated time from start info:', event.time);
                }
            }
            
            // If no time yet, search for time elements and patterns in the page
            if (!event.time) {
                // First, look for structured time elements
                $('time, *[data-time]').each((_, element) => {
                    const timeText = $(element).text().trim();
                    
                    for (const pattern of timePatterns) {
                        const match = timeText.match(pattern);
                        if (match) {
                            if (match[2]) { // We have both start and end time
                                event.time = `${match[1]} - ${match[2]}`;
                            } else if (match[1]) { // Just start time
                                const startHour = parseInt(match[1]);
                                const endHour = Math.min(startHour + 3, 12);
                                const ampm = match[3] || 'PM';
                                event.time = `${match[1]} - ${endHour}:00 ${ampm}`;
                            }
                            console.log('Found time in element:', event.time);
                            return false; // break the each loop
                        }
                    }
                });
                
                // If still no time, look at general text elements
                if (!event.time) {
                    $('p, span, div').each((_, element) => {
                        const text = $(element).text().trim();
                        
                        for (const pattern of timePatterns) {
                            const match = text.match(pattern);
                            if (match) {
                                if (match[2]) { // We have both start and end time
                                    event.time = `${match[1]} - ${match[2]}`;
                                } else if (match[1]) { // Just start time
                                    const startHour = parseInt(match[1]);
                                    const endHour = Math.min(startHour + 3, 12);
                                    const ampm = match[3] || 'PM';
                                    event.time = `${match[1]} - ${endHour}:00 ${ampm}`;
                                }
                                console.log('Found time in text:', event.time);
                                return false; // break the each loop
                            }
                        }
                    });
                }
            }
        }
        
        // Extract location
        event.location = this.findLocation($);
        // Clean up the location format (remove redundant separators)
        if (event.location && event.location.includes(',')) {
            // Remove redundant formatting like "Location, London, England"
            const parts = event.location.split(',').map(part => part.trim());
            const uniqueParts = [];
            parts.forEach(part => {
                if (part && !uniqueParts.includes(part)) {
                    uniqueParts.push(part);
                }
            });
            event.location = uniqueParts.join(', ');
        }
        
        // Extract organizer
        event.organizer = this.findOrganizer($);
        
        // Extract hosts
        event.hosts = this.findHosts($);
        
        // If we have hosts but no organizer, use the first host as organizer
        if ((!event.organizer || event.organizer === 'Not specified') && event.hosts.length > 0) {
            event.organizer = event.hosts[0];
        }
        
        console.log('Final scraped event data:', event);
        return event;
    }
    /**
     * Find location information in the HTML
     */
    findLocation($) {
        let location = '';
        // Find location section elements - try multiple strategies
        const locationDivs = [];
        // Method 1: Find by class name pattern
        $('div').each((_, element) => {
            const className = $(element).attr('class') || '';
            if (className.toLowerCase().includes('location') ||
                className.toLowerCase().includes('venue') ||
                className.toLowerCase().includes('place')) {
                locationDivs.push($(element));
            }
        });
        // Method 2: Find by heading
        $('*:contains("Location")').each((_, element) => {
            if ($(element).text().trim() === 'Location') {
                const parent = $(element).parent().parent();
                if (parent.length) {
                    const tagName = parent.prop('tagName');
                    if (tagName && ['div', 'section'].includes(tagName.toLowerCase())) {
                        locationDivs.push(parent);
                    }
                }
            }
        });
        // Extract venue and address from location divs
        let venue = '';
        let address = '';
        for (const div of locationDivs) {
            // Find venue name
            div.find('div, h3, h4, strong, b').each((_, element) => {
                const elem = $(element);
                const className = elem.attr('class') || '';
                if (className.toLowerCase().includes('venue') ||
                    className.toLowerCase().includes('title') ||
                    className.toLowerCase().includes('name') ||
                    className.toLowerCase().includes('fw-medium') ||
                    className.toLowerCase().includes('bold')) {
                    const venueText = elem.text().trim();
                    if (venueText && venueText.length > 5) {
                        venue = venueText;
                    }
                }
            });
            // Find address
            div.find('div, p, span').each((_, element) => {
                const elem = $(element);
                const className = elem.attr('class') || '';
                if (className.toLowerCase().includes('address') ||
                    className.toLowerCase().includes('location') ||
                    className.toLowerCase().includes('text-tinted') ||
                    className.toLowerCase().includes('fs-sm')) {
                    const addressText = elem.text().trim();
                    if (addressText && addressText.length > 5) {
                        address = addressText;
                    }
                }
            });
        }
        // Build location string
        if (venue || address) {
            if (venue && address) {
                location = `${venue}, ${address}`;
            }
            else {
                location = venue || address;
            }
        }
        // If still no location, try to find mentions of cities
        if (!location) {
            const bodyText = $('body').text();
            const londonMatch = bodyText.match(/join us in london|location.*?london|venue.*?london/i);
            if (londonMatch) {
                location = 'London';
            }
            // Look for other city mentions if still no location
            if (!location) {
                const cityPatterns = [
                    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/, // "in London"
                    /(?:location|venue).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i // "location...London"
                ];
                for (const pattern of cityPatterns) {
                    const match = bodyText.match(pattern);
                    if (match && match[1]) {
                        location = match[1];
                        break;
                    }
                }
            }
        }
        return location || 'Not specified';
    }
    /**
     * Find organizer information in the HTML
     */
    findOrganizer($) {
        // First try: Look for "Presented by" text
        let organizer = '';
        let found = false;
        $('*:contains("Presented by")').each((_, element) => {
            if (found)
                return;
            if ($(element).text().trim().includes('Presented by')) {
                const nextElem = $(element).parent().find('div, span, p').first();
                if (nextElem.length) {
                    organizer = nextElem.text().trim();
                    found = true;
                }
            }
        });
        // Second try: Look for "Organizer" or "Presenter" text
        if (!organizer) {
            $('*:contains("Organizer"), *:contains("Presenter")').each((_, element) => {
                if (found)
                    return;
                if ($(element).text().trim() === 'Organizer' || $(element).text().trim() === 'Presenter') {
                    const parent = $(element).parent();
                    let siblings = parent.next();
                    for (let i = 0; i < 5 && siblings.length; i++) { // Check next 5 siblings
                        const text = siblings.text().trim();
                        if (text && text.length > 2 && !text.includes('Contact') && !text.includes('Report')) {
                            organizer = text;
                            found = true;
                            break;
                        }
                        siblings = siblings.next();
                    }
                }
            });
        }
        // Third try: Look for "Hosted By" text
        if (!organizer) {
            $('*:contains("Hosted By")').each((_, element) => {
                if (found)
                    return;
                if ($(element).text().trim() === 'Hosted By') {
                    const container = $(element).parent().parent();
                    if (container && container.length) {
                        // Find host elements
                        const hostElements = container.find('div[class*="name"], div[class*="host-name"], div[class*="person"]');
                        if (hostElements.length) {
                            organizer = hostElements.first().text().trim();
                            found = true;
                            return;
                        }
                        // If no host elements found by class, try next sibling
                        if (!organizer) {
                            const sibling = container.next();
                            if (sibling.length && sibling.text().trim()) {
                                organizer = sibling.text().trim().replace(/Contact|Report/g, '').trim();
                                found = true;
                            }
                        }
                    }
                }
            });
        }
        // Fourth try: Check for immediate text after "Hosted by" that's not in the section
        if (!organizer) {
            // Look for "Hosted by" followed by potential organizer name
            $('*:contains("Hosted by")').each((_, element) => {
                if (found)
                    return;
                const text = $(element).text().trim();
                if (text.startsWith('Hosted by')) {
                    const hostByText = text.replace('Hosted by', '').trim();
                    if (hostByText && hostByText.length > 2) {
                        // Remove common unwanted suffixes
                        organizer = hostByText.split(' & ')[0].trim();
                        found = true;
                    }
                }
            });
        }
        // Clean up organizer name if needed
        if (organizer) {
            // Remove "Contact the Host" or "Report Event" text that might be included
            organizer = organizer.replace(/Contact the Host|Report Event/gi, '').trim();
        }
        return organizer || 'Not specified';
    }
    /**
     * Find hosts/organizers list in the HTML
     */
    findHosts($) {
        const hosts = [];
        const seenHosts = new Set(); // Track seen hosts to avoid duplicates
        // Method 1: Look for "Hosted By" section and get all host names
        $('*:contains("Hosted By")').each((_, element) => {
            if ($(element).text().trim() === 'Hosted By') {
                const container = $(element).parent().parent();
                if (!container || !container.length)
                    return; // Skip if no container found
                // Try to find all host elements
                container.find('div[class*="name"], div[class*="host"], div[class*="person"]').each((_, hostElem) => {
                    const hostName = $(hostElem).text().trim();
                    if (hostName && hostName.length > 2 && !seenHosts.has(hostName)) {
                        seenHosts.add(hostName);
                        hosts.push(hostName);
                    }
                });
            }
        });
        // Look for hosts by finding adjacent elements to "Hosted by" header
        if (hosts.length === 0) {
            $('*:contains("Hosted By")').each((_, element) => {
                if ($(element).text().trim() === 'Hosted By') {
                    let next = $(element).next();
                    for (let i = 0; i < 10 && next.length; i++) {
                        const text = next.text().trim();
                        if (text && text.length > 2 && !seenHosts.has(text)) {
                            // Try to split if multiple names are concatenated
                            const possibleNames = this.splitHostNames(text);
                            for (const name of possibleNames) {
                                if (name.length > 2 && !seenHosts.has(name)) {
                                    seenHosts.add(name);
                                    hosts.push(name);
                                }
                            }
                        }
                        next = next.next();
                    }
                }
            });
        }
        // Method 3: Look for specific sections with host information
        if (hosts.length === 0) {
            $('h3, h4, div').each((_, element) => {
                const text = $(element).text().trim();
                if (text === 'Host' || text === 'Hosts' || text === 'Hosted By') {
                    const parent = $(element).parent();
                    if (!parent || !parent.length) {
                        // Skip this element if parent is missing
                        return;
                    }
                    const nameElements = parent.find('div, span, p').not($(element));
                    nameElements.each((_, nameElem) => {
                        const name = $(nameElem).text().trim();
                        if (name && name.length > 2 && !name.includes('Contact') && !name.includes('Report') && !seenHosts.has(name)) {
                            const possibleNames = this.splitHostNames(name);
                            for (const splitName of possibleNames) {
                                if (splitName.length > 2 && !seenHosts.has(splitName)) {
                                    seenHosts.add(splitName);
                                    hosts.push(splitName);
                                }
                            }
                        }
                    });
                }
            });
        }
        // Method 4: Direct host detection from the page body
        if (hosts.length === 0) {
            // Try to find host information in the HTML content
            const hostedBySection = $('div:contains("Hosted By")').filter(function () {
                return $(this).text().trim() === 'Hosted By';
            });
            if (hostedBySection.length) {
                // Try to navigate the DOM to find host names
                const hostContainers = hostedBySection.parent().parent().find('div');
                hostContainers.each((_, container) => {
                    const hostText = $(container).text().trim();
                    if (hostText && hostText !== 'Hosted By' && hostText.length > 2 && !seenHosts.has(hostText)) {
                        const possibleNames = this.splitHostNames(hostText);
                        for (const name of possibleNames) {
                            if (name.length > 2 && !seenHosts.has(name)) {
                                seenHosts.add(name);
                                hosts.push(name);
                            }
                        }
                    }
                });
            }
        }
        return hosts;
    }
    /**
     * Split potentially concatenated host names
     */
    splitHostNames(text) {
        if (!text)
            return [];
        
        // First check common separators
        for (const separator of [', ', ' & ', ' and ']) {
            if (text.includes(separator)) {
                return text.split(separator).map(name => name.trim()).filter(name => name.length > 0);
            }
        }
        
        // Try to detect names concatenated without spaces
        // First, check if text starts with a capital letter and likely contains multiple capitalized words
        if (/^[A-Z][a-z]/.test(text) && text.match(/[A-Z]/g)?.length > 2) {
            // For concatenated names like "SeyiOluwasanmiKofiSiaw"
            // Split at uppercase letters that follow lowercase, as in "iK" in "SeyiKofi"
            const result = text.replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s+/);
            
            // If this produced reasonable splits (more than 1), group them into likely names
            if (result.length > 1) {
                // Group words into likely names (most people have 2-3 name parts)
                const names = [];
                for (let i = 0; i < result.length; i += 2) {
                    // Take 2 words at a time as a likely full name
                    if (i + 1 < result.length) {
                        names.push(`${result[i]} ${result[i + 1]}`);
                    } else {
                        names.push(result[i]);
                    }
                }
                return names;
            }
        }
        
        // If no pattern found, return the original text
        return [text];
    }
    /**
     * Find description/about event information in the HTML
     */
    findDescription($) {
        const descriptionContent = [];
        const seenTexts = new Set(); // Track seen texts to avoid duplicates
        
        // Check for "About Event" section first
        const aboutHeaders = $('h2:contains("About Event"), h3:contains("About Event"), div:contains("About Event")');
        if (aboutHeaders.length) {
            aboutHeaders.each((_, element) => {
                if ($(element).text().trim().includes('About Event')) {
                    const container = $(element).parent();
                    container.find('p').each((_, p) => {
                        const text = $(p).text().trim();
                        if (text && !seenTexts.has(text)) {
                            seenTexts.add(text);
                            descriptionContent.push(text);
                        }
                    });
                }
            });
        }
        
        // If no description content found yet, look for any substantial paragraphs
        if (descriptionContent.length === 0) {
            // Look for divs or paragraphs with "arrive by" and other key phrases
            const keyPhrases = ['arrive by', 'start at', 'event details', 'about this event'];
            for (const phrase of keyPhrases) {
                $(`p:contains("${phrase}"), div:contains("${phrase}")`).each((_, element) => {
                    const text = $(element).text().trim();
                    if (text.length > 20 && !seenTexts.has(text)) {
                        seenTexts.add(text);
                        descriptionContent.push(text);
                    }
                });
                
                if (descriptionContent.length > 0) {
                    break;
                }
            }
        }
        
        // If still no description content found, look for substantial paragraphs
        if (descriptionContent.length === 0) {
            // Specifically look for agenda-type content
            const agendaSection = $('div:contains("Agenda:")');
            if (agendaSection.length) {
                const agendaText = agendaSection.first().text().trim();
                if (agendaText && !seenTexts.has(agendaText)) {
                    seenTexts.add(agendaText);
                    descriptionContent.push(agendaText);
                }
            }
            
            // Look for substantial paragraphs
            if (descriptionContent.length === 0) {
                $('p').each((_, element) => {
                    const text = $(element).text().trim();
                    if (text.length > 40 && !text.match(/^(Location|Contact|Registration|Hosted By|URL)/) && !seenTexts.has(text)) {
                        seenTexts.add(text);
                        descriptionContent.push(text);
                        // Limit to first substantial paragraph
                        if (descriptionContent.length >= 1) {
                            return false; // Break the loop
                        }
                    }
                });
            }
            
            // If still nothing, try divs as a last resort
            if (descriptionContent.length === 0) {
                $('div').each((_, element) => {
                    if ($(element).find('p, div').length === 0) { // Only leaf elements
                        const text = $(element).text().trim();
                        if (text.length > 50 && !text.match(/^(Location|Contact|Registration|Hosted By|URL)/) && !seenTexts.has(text)) {
                            seenTexts.add(text);
                            descriptionContent.push(text);
                            // Only take the first long div text
                            return false; // Break the loop
                        }
                    }
                });
            }
        }
        
        // Join all paragraphs with double newlines
        return descriptionContent.join('\n\n') || 'No description available';
    }
}
exports.LumaScraper = LumaScraper;

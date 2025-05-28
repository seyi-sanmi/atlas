import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In a real app, this would point to an actual backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          // Mock API response for development
          proxy.on('error', (err, _req, res) => {
            console.log('Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy error' }));
          });
          
          // Handle the event scraping API endpoint
          proxy.on('proxyReq', (proxyReq, req, res, options) => {
            // Only handle our specific API endpoint
            if (req.url === '/api/scrape-event') {
              // Read the request body
              let body = '';
              req.on('data', (chunk) => {
                body += chunk.toString();
              });
              
              req.on('end', () => {
                try {
                  // Mock response for the scrape-event endpoint
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  
                  // Parse the request body to get the URL
                  const { url } = JSON.parse(body);
                  
                  // In a real app, this would call LumaScraper
                  // For now, return mock data
                  res.end(JSON.stringify({
                    url,
                    name: 'Mock Event from ' + url,
                    description: 'This is a mocked event response. In a real implementation, this would use the LumaScraper to extract data from the URL.',
                    location: 'San Francisco, CA',
                    organizer: 'Mock Organization'
                  }));
                } catch (error) {
                  console.error('Error handling mock API:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
                
                // Prevent the proxy from forwarding the request
                proxyReq.destroy();
              });
            }
          });
        }
      }
    }
  }
})

# Movie Data Manager Chrome Extension

A Chrome extension that helps extract movie data from various websites and send it to a server.

## Features

- **Server Configuration**: Choose between Local (localhost:8120) and Production (ealon-movie.vercel.app) servers
- **Automatic Data Extraction**: Automatically extracts movie data from RARBG pages
- **Manual Data Submission**: Submit data from Douban and Yinfans pages via popup UI
- **Persistent Settings**: Server selection is saved and persists across browser sessions

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The extension icon should appear in your Chrome toolbar

## Usage

### Server Configuration

1. Click the extension icon to open the popup
2. Use the radio buttons to select your preferred server:
   - **Local**: Uses `http://localhost:8120`
   - **Production**: Uses `https://ealon-movie.vercel.app`
3. Your selection is automatically saved

### RARBG Pages

- **Automatic**: Data is automatically extracted and sent to `${SERVER_BASE_URL}/api/movie`
- **No user interaction required**

### Douban Pages

1. Navigate to a Douban movie page (e.g., `movie.douban.com/subject/...`)
2. Click the extension icon
3. Enter the movie URL in the "Movie URL" field
4. Click "Submit to updateDouban"
5. Data will be extracted and sent to `${SERVER_BASE_URL}/api/updateDouban`

### Yinfans Pages

1. Navigate to a Yinfans movie page (e.g., `yinfans.me/movie/...`)
2. Click the extension icon
3. Enter the movie URL in the "Movie URL" field
4. Click "Submit to addLinks"
5. Data will be extracted and sent to `${SERVER_BASE_URL}/api/addLinks`

## Development

### Building

```bash
cd chrome-extension
yarn build
```

### Watching for Changes

```bash
cd chrome-extension
yarn watch
```

### File Structure

- `popup.html` - Extension popup UI
- `popup.js` - Popup logic and Chrome API interactions
- `src/content.ts` - Content script for data extraction
- `dist/content.js` - Compiled content script
- `manifest.json` - Extension manifest

## Permissions

- `storage`: For saving server selection preference
- `activeTab`: For accessing the current tab's content

## API Endpoints

- `POST /api/movie` - RARBG movie data (automatic)
- `POST /api/updateDouban` - Douban movie data (manual)
- `POST /api/addLinks` - Yinfans movie data (manual)

## Notes

- The extension automatically detects the page type and shows relevant UI sections
- Server selection is persisted using Chrome's storage API
- All API calls use the currently selected server URL
- Error handling and loading states are implemented for better UX

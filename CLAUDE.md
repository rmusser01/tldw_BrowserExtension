# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-browser extension for TLDW (Too Long; Didn't Watch) Server that provides AI chat integration with various LLM models. The extension supports Chrome (V2/V3), Firefox, and Edge browsers.

## Recent Updates (2024)

### Fixed Issues
1. **Firefox Compatibility**: Added browser-specific settings with addon ID to fix storage API errors
2. **CORS Errors**: Simplified API headers to prevent unnecessary preflight requests
3. **Settings Page**: Fixed Save/Cancel button functionality with proper error handling
4. **Build Process**: Improved error handling and validation in build script
5. **API Client**: Fixed undefined variable references (this.retryConfig, this.cacheConfig)

## Essential Commands

### Build Commands
```bash
# Build all browser versions
npm run build

# Build specific versions
npm run build:chrome-v3  # Chrome 88+ (Manifest V3)
npm run build:chrome-v2  # Chrome 87 and older (Manifest V2)
npm run build:firefox    # Firefox

# Direct build script
node build.js
```

### Testing Commands
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
```

### Development Workflow
1. Edit source files in `/Browser-Extension/` directory
2. Run appropriate build command for target browser
3. Load unpacked extension from `/Browser-Extension/dist/[browser]/` for testing
4. Run tests to ensure changes don't break existing functionality

## Architecture Overview

### Key Components

1. **Popup Interface** (`html/popup.html`, `js/popup.js`)
   - Main user interface for chat interactions
   - Model selection and conversation management
   - Character/prompt template selection

2. **Content Script** (`js/content.js`)
   - Handles text selection and context menu integration
   - Communicates with background script via messaging

3. **Background Script** (`js/background.js` for V3, `js/background-v2.js` for V2)
   - Manages API communication
   - Handles context menu events
   - Maintains extension state

4. **API Client** (`js/utils/api.js`)
   - Centralized API communication layer
   - Token-based authentication (uses `Token: Bearer <token>` header)
   - Endpoints: `/api/v1/chat/`, `/api/v1/prompts/`, `/api/v1/characters/`, `/api/v1/media/`
   - Simplified headers to avoid CORS preflight issues

5. **Configuration** (`js/utils/config.js`)
   - Manages user settings and API configuration
   - Encrypted storage for API tokens

6. **Options Page** (`html/options.html`, `js/options.js`)
   - Settings management interface
   - Connection testing functionality
   - Import/export settings capability

### Browser Compatibility Strategy

The extension uses different manifest versions:
- **Manifest V3**: Chrome 88+ (uses service workers)
- **Manifest V2**: Firefox and older Chrome (uses background pages)

The build script (`build.js`) generates browser-specific versions by:
1. Copying appropriate manifest file
2. Including correct background script
3. Adjusting permissions and API declarations

### Testing Architecture

Tests are organized in `/Browser-Extension/tests/`:
- **Unit tests**: Component-level testing with mocked Chrome APIs
- **Integration tests**: Full workflow testing including API interactions
- **Security tests**: XSS prevention and content security validation

Key test utilities:
- `jest-chrome` for Chrome API mocking
- `jest-fetch-mock` for HTTP request mocking
- Custom test helpers in `tests/setup.js`

## Important Technical Considerations

1. **API Communication**: 
   - All API calls go through the centralized client in `js/utils/api.js`
   - Uses `Token: Bearer <token>` header format for authentication
   - Simplified headers to avoid CORS preflight requests
   - Default base URL: http://localhost:8000

2. **Cross-Browser Compatibility**: 
   - Always use `browser` namespace (polyfilled) instead of `chrome`
   - Firefox requires explicit addon ID in manifest for storage API

3. **Storage**: 
   - Use browser.storage.sync for settings (cross-device sync)
   - Use browser.storage.local for cache and temporary data
   - API tokens stored in sync storage

4. **Content Security**: 
   - Extension enforces strict CSP
   - No inline scripts or eval() usage
   - All scripts loaded from extension package

5. **Message Passing**: 
   - Content scripts communicate with background scripts via browser messaging API
   - Always validate message origins
   - Handle cases where background script might not be ready

6. **Build Process**: 
   - Build script validates required files before building
   - Handles errors gracefully and reports failed builds
   - Creates zip files for distribution

## Running Single Tests

To run a specific test file:
```bash
npm test -- tests/unit/popup.test.js
npm test -- tests/integration/api.test.js
```

To run tests matching a pattern:
```bash
npm test -- --testNamePattern="should handle chat messages"
```

## Key Files to Understand

- `/Browser-Extension/js/utils/api.js`: API client implementation (simplified headers, retry logic)
- `/Browser-Extension/js/popup.js`: Main UI logic for chat interface
- `/Browser-Extension/js/options.js`: Settings page functionality
- `/Browser-Extension/build.js`: Build process with error handling
- `/Browser-Extension/manifest.json`: Chrome V3 manifest
- `/Browser-Extension/manifest-v2.json`: Firefox/Chrome V2 manifest (includes addon ID)
- `/Browser-Extension/tests/setup.js`: Test configuration and mocks
- `/Browser-Extension/Browser-Plugin-Design.md`: Detailed technical design document

## Common Issues and Solutions

1. **Firefox Storage API Error**: "The storage API will not work with a temporary addon ID"
   - Solution: manifest-v2.json includes `browser_specific_settings` with addon ID

2. **CORS Preflight Errors**: Network errors when making API requests
   - Solution: Simplified API headers to only include essential headers
   - Removed: X-Requested-With, User-Agent, Cache-Control, Access-Control-* headers

3. **Settings Not Saving**: Save/Cancel buttons not working
   - Solution: Added proper error handling and fallback mechanisms
   - window.close() wrapped in try-catch with fallbacks

4. **Build Failures**: Missing manifest files
   - Solution: Created manifest.json and manifest-v2.json with proper configurations
   - Build script validates files exist before building
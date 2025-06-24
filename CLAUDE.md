# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-browser extension for TLDW (Too Long; Didn't Watch) Server that provides AI chat integration with various LLM models. The extension supports Chrome (V2/V3), Firefox, and Edge browsers.

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
   - Bearer token authentication
   - Endpoints: `/api/v1/chat/`, `/api/v1/prompts/`, `/api/v1/characters/`, `/api/v1/media/`

5. **Configuration** (`js/utils/config.js`)
   - Manages user settings and API configuration
   - Encrypted storage for API tokens

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

1. **API Communication**: All API calls go through the centralized client in `js/utils/api.js`. The base URL is configurable (default: http://localhost:8000).

2. **Cross-Browser Compatibility**: Always use `browser` namespace (polyfilled) instead of `chrome` for cross-browser support.

3. **Storage**: Use browser.storage.local for persistent data. API tokens are stored encrypted.

4. **Content Security**: The extension enforces strict CSP. No inline scripts or eval() usage.

5. **Message Passing**: Content scripts communicate with background scripts via browser messaging API. Always validate message origins.

6. **Build Process**: The build script copies files and adjusts manifests. No transpilation or bundling is performed.

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

- `/Browser-Extension/js/utils/api.js`: API client implementation
- `/Browser-Extension/js/popup.js`: Main UI logic
- `/Browser-Extension/build.js`: Build process for all browser versions
- `/Browser-Extension/tests/setup.js`: Test configuration and mocks
- `/Browser-Extension/Browser-Plugin-Design.md`: Detailed technical design document
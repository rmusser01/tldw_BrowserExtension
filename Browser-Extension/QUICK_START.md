# TLDW Browser Extension - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager
- Chrome, Firefox, or Edge browser for testing

### Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```
   This will install all development dependencies including Jest for testing and ESLint for code quality.

2. **Build the Extension**
   ```bash
   npm run build
   ```
   This creates browser-specific builds in the `dist/` directory:
   - `dist/chrome-v3/` - Chrome 88+ (Manifest V3)
   - `dist/chrome-v2/` - Chrome 87 and older (Manifest V2)
   - `dist/firefox/` - Firefox

3. **Configure API Connection**
   - Default server URL: `http://localhost:8000`
   - The extension expects a TLDW server running locally
   - API token can be configured in the extension options

## 🛡️ Recent Security Improvements

### ✅ Fixed Issues
1. **API Authentication** - Changed from non-standard `Token` header to standard `Authorization: Bearer` format
2. **Content Security Policy** - Added strict CSP to prevent XSS attacks
3. **Notifications Permission** - Added missing permission for notification features
4. **Input Sanitization** - Created sanitizer utility to prevent XSS vulnerabilities
5. **Development Setup** - Added `.gitignore` and `.eslintrc.js` for better development experience

### 🔧 Configuration Files Added
- `.gitignore` - Prevents committing build artifacts and dependencies
- `.eslintrc.js` - Enforces code quality and security best practices
- `js/utils/sanitizer.js` - Provides XSS protection utilities

## 📝 Development Workflow

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode for development
npm run test:coverage   # Generate coverage report
```

### Code Quality
```bash
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting issues
```

### Loading the Extension

#### Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/chrome-v3/` directory

#### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `dist/firefox/manifest.json`

## 🚨 Important Security Notes

1. **API Token Storage**: The extension stores API tokens in browser's sync storage. Ensure your TLDW server uses HTTPS in production.

2. **Content Security Policy**: The extension enforces strict CSP. No inline scripts or eval() are allowed.

3. **Input Sanitization**: Always use the sanitizer utility when displaying user-generated content:
   ```javascript
   // Use for text content
   sanitizer.setTextContent(element, userInput);
   
   // Use for HTML content (be careful!)
   sanitizer.setInnerHTML(element, htmlContent, 'minimal');
   ```

4. **CORS**: The extension requires proper CORS headers from the TLDW server for API communication.

## 🐛 Known Issues & TODOs

### High Priority
- [ ] Add proper HTTPS support (currently defaults to HTTP)
- [ ] Implement comprehensive error handling for network failures
- [ ] Add loading states for all async operations

### Medium Priority
- [ ] Add user feedback for all actions (toasts/notifications)
- [ ] Implement request caching to reduce API calls
- [ ] Add keyboard shortcuts documentation

### Future Enhancements
- [ ] Dark mode support
- [ ] Batch operations UI
- [ ] Export/import settings
- [ ] Multi-language support

## 📚 Resources

- [Extension Documentation](README.md)
- [Technical Design](Browser-Plugin-Design.md)
- [Loading Instructions](load-extension.md)
- [TLDW Server API Documentation](https://github.com/tldw/server)

## 🤝 Contributing

1. Always run tests before committing: `npm test`
2. Follow ESLint rules: `npm run lint`
3. Test in multiple browsers before submitting PRs
4. Update tests when adding new features

---

For more detailed information, see the main [README.md](README.md) file.
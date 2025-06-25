/**
 * Security utility for sanitizing user inputs to prevent XSS attacks
 */

class DOMSanitizer {
  constructor() {
    // Define allowed HTML tags for different contexts
    this.allowedTags = {
      minimal: ['b', 'i', 'em', 'strong', 'code', 'br'],
      standard: ['b', 'i', 'em', 'strong', 'code', 'br', 'p', 'div', 'span', 'a', 'ul', 'ol', 'li'],
      none: []
    };
    
    // Define allowed attributes for specific tags
    this.allowedAttributes = {
      a: ['href', 'title', 'target'],
      span: ['class'],
      div: ['class']
    };
    
    // Patterns for dangerous content
    this.dangerousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /<object[^>]*>[\s\S]*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
      /data:text\/html/gi,
      /vbscript:/gi
    ];
  }
  
  /**
   * Sanitize text by escaping HTML entities
   * @param {string} text - The text to sanitize
   * @returns {string} - Sanitized text safe for innerHTML
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return '';
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Sanitize HTML content by removing dangerous elements and attributes
   * @param {string} html - The HTML to sanitize
   * @param {string} level - Security level: 'none', 'minimal', 'standard'
   * @returns {string} - Sanitized HTML
   */
  sanitizeHtml(html, level = 'minimal') {
    if (typeof html !== 'string') {
      return '';
    }
    
    // First, check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(html)) {
        console.warn('Dangerous content detected and removed:', pattern);
        html = html.replace(pattern, '');
      }
    }
    
    // If no HTML is allowed, escape everything
    if (level === 'none') {
      return this.escapeHtml(html);
    }
    
    // Parse HTML in a sandboxed way
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Get allowed tags for this security level
    const allowedTags = this.allowedTags[level] || this.allowedTags.minimal;
    
    // Walk through all elements and remove disallowed ones
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    
    const nodesToRemove = [];
    let node;
    
    while (node = walker.nextNode()) {
      // Check if tag is allowed
      if (!allowedTags.includes(node.tagName.toLowerCase())) {
        nodesToRemove.push(node);
        continue;
      }
      
      // Remove disallowed attributes
      const allowedAttrs = this.allowedAttributes[node.tagName.toLowerCase()] || [];
      const attrs = Array.from(node.attributes);
      
      attrs.forEach(attr => {
        if (!allowedAttrs.includes(attr.name)) {
          node.removeAttribute(attr.name);
        } else {
          // Additional validation for specific attributes
          if (attr.name === 'href' || attr.name === 'src') {
            if (!this.isValidUrl(attr.value)) {
              node.removeAttribute(attr.name);
            }
          }
        }
      });
    }
    
    // Remove disallowed nodes
    nodesToRemove.forEach(node => {
      if (node.parentNode) {
        // Keep the text content but remove the tag
        const text = document.createTextNode(node.textContent);
        node.parentNode.replaceChild(text, node);
      }
    });
    
    return doc.body.innerHTML;
  }
  
  /**
   * Validate URL to prevent javascript: and data: URLs
   * @param {string} url - The URL to validate
   * @returns {boolean} - True if URL is safe
   */
  isValidUrl(url) {
    if (!url) return false;
    
    const trimmedUrl = url.trim().toLowerCase();
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    for (const protocol of dangerousProtocols) {
      if (trimmedUrl.startsWith(protocol)) {
        return false;
      }
    }
    
    // Allow relative URLs and common protocols
    const allowedProtocols = ['http://', 'https://', 'mailto:', '#', '/'];
    const hasAllowedProtocol = allowedProtocols.some(protocol => 
      trimmedUrl.startsWith(protocol) || !trimmedUrl.includes(':')
    );
    
    return hasAllowedProtocol;
  }
  
  /**
   * Sanitize user input for display in text contexts
   * @param {string} input - User input to sanitize
   * @returns {string} - Sanitized input
   */
  sanitizeText(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove any control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Limit length to prevent DoS
    const maxLength = 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...';
    }
    
    return this.escapeHtml(sanitized);
  }
  
  /**
   * Sanitize JSON data to ensure it's safe
   * @param {*} data - Data to sanitize
   * @returns {*} - Sanitized data
   */
  sanitizeJson(data) {
    if (typeof data === 'string') {
      return this.sanitizeText(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeJson(item));
    }
    
    if (data !== null && typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        // Sanitize the key as well
        const sanitizedKey = this.sanitizeText(key);
        sanitized[sanitizedKey] = this.sanitizeJson(value);
      }
      return sanitized;
    }
    
    // Return primitives as-is (numbers, booleans, null)
    return data;
  }
  
  /**
   * Create a safe text node that can be appended to DOM
   * @param {string} text - Text to create node from
   * @returns {Text} - Safe text node
   */
  createSafeTextNode(text) {
    return document.createTextNode(this.sanitizeText(text));
  }
  
  /**
   * Safely set innerHTML with sanitization
   * @param {HTMLElement} element - Element to set innerHTML on
   * @param {string} html - HTML content
   * @param {string} level - Security level
   */
  setInnerHTML(element, html, level = 'minimal') {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('Invalid element provided');
    }
    
    element.innerHTML = this.sanitizeHtml(html, level);
  }
  
  /**
   * Safely set textContent
   * @param {HTMLElement} element - Element to set textContent on
   * @param {string} text - Text content
   */
  setTextContent(element, text) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('Invalid element provided');
    }
    
    element.textContent = this.sanitizeText(text);
  }
}

// Create singleton instance
const sanitizer = new DOMSanitizer();

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOMSanitizer, sanitizer };
} else if (typeof window !== 'undefined') {
  window.sanitizer = sanitizer;
  window.DOMSanitizer = DOMSanitizer;
}
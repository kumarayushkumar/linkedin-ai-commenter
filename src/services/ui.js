// UI utility service for DOM manipulation
class UIService {
  /**
   * Wait for an element to appear in the DOM
   * @param {string} selector - CSS selector for the element
   * @param {HTMLElement} parent - Parent element to search within (defaults to document)
   * @param {number} timeoutMs - Maximum time to wait in milliseconds
   * @returns {Promise<HTMLElement>} - The found element
   */
  waitForElement(selector, parent = document, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const element = parent.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found after ${timeoutMs}ms`));
      }, timeoutMs);

      const observer = new MutationObserver(() => {
        const element = parent.querySelector(selector);
        if (element) {
          clearTimeout(timeout);
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(parent === document ? document.body : parent, {
        childList: true,
        subtree: true
      });
    });
  }
  
  /**
   * Create a button with specified properties
   * @param {string} text - Button text content
   * @param {string} styles - CSS styles as a string
   * @param {Function} clickHandler - Click event handler
   * @param {Object} options - Additional options (classes, attributes)
   * @returns {HTMLButtonElement} - The created button
   */
  createButton(text, styles, clickHandler, options = {}) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = styles;
    
    // Add classes if provided
    if (options.classes) {
      if (Array.isArray(options.classes)) {
        options.classes.forEach(cls => button.classList.add(cls));
      } else {
        button.classList.add(options.classes);
      }
    }
    
    // Add attributes if provided
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        button.setAttribute(key, value);
      });
    }
    
    // Add ARIA attributes for accessibility
    if (options.ariaLabel) {
      button.setAttribute('aria-label', options.ariaLabel);
    }
    
    if (clickHandler) {
      button.addEventListener('click', clickHandler);
    }
    
    return button;
  }
  
  /**
   * Create a loading spinner element
   * @param {string} size - Size in pixels (default: '20px')
   * @param {string} color - Color of the spinner (default: '#0a66c2')
   * @returns {HTMLDivElement} - The spinner element
   */
  createLoadingSpinner(size = '20px', color = '#0a66c2') {
    const spinner = document.createElement('div');
    spinner.classList.add('lai-spinner');
    spinner.style.cssText = `
      width: ${size};
      height: ${size};
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-top-color: ${color};
      border-radius: 50%;
      animation: lai-spin 1s linear infinite;
    `;
    
    // Add the animation if it doesn't exist
    if (!document.getElementById('lai-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'lai-spinner-style';
      style.textContent = `
        @keyframes lai-spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    return spinner;
  }
  
  /**
   * Show notification message
   * @param {string} message - Message to display
   * @param {string} type - Notification type: 'info', 'success', 'error', 'warning'
   * @param {number} duration - How long to show the notification in ms
   * @returns {HTMLDivElement} - The notification element
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('lai-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'lai-notification';
      notification.setAttribute('role', 'alert'); // ARIA role for accessibility
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        transition: opacity 0.3s ease-in-out;
        display: flex;
        align-items: center;
        min-width: 200px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      `;
      document.body.appendChild(notification);
    }
    
    // Set notification styles based on type
    const colors = {
      info: { bg: '#0a66c2', color: 'white', icon: 'ℹ️' },
      success: { bg: '#0a8544', color: 'white', icon: '✅' },
      error: { bg: '#d93025', color: 'white', icon: '❌' },
      warning: { bg: '#f29900', color: 'black', icon: '⚠️' }
    };
    
    const style = colors[type] || colors.info;
    notification.style.backgroundColor = style.bg;
    notification.style.color = style.color;
    
    // Set message and show notification
    notification.innerHTML = `<span style="margin-right: 8px;">${style.icon}</span> ${message}`;
    notification.style.opacity = '1';
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      margin-left: auto;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
    `;
    closeBtn.onclick = () => { notification.style.opacity = '0'; };
    notification.appendChild(closeBtn);
    
    // Auto-hide after duration
    const timer = setTimeout(() => {
      notification.style.opacity = '0';
    }, duration);
    
    // Clear timer if user closes manually
    closeBtn.addEventListener('click', () => clearTimeout(timer));
    
    return notification;
  }
  
  /**
   * Insert text into a contenteditable element
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text to insert
   */
  insertTextIntoElement(element, text) {
    element.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    document.execCommand('insertText', false, text);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Export as singleton
const uiService = new UIService();
export default uiService;

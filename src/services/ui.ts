// UI utility service for DOM manipulation
import { ButtonOptions } from '../types';

export class UIService {
  /**
   * Wait for an element to appear in the DOM
   * @param selector - CSS selector for the element
   * @param parent - Parent element to search within (defaults to document)
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @returns The found element
   */
  waitForElement(
    selector: string,
    parent: ParentNode = document,
    timeoutMs: number = 5000
  ): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const element = parent.querySelector(selector);
      if (element) {
        resolve(element as HTMLElement);
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
          resolve(element as HTMLElement);
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
   * @param text - Button text content
   * @param styles - CSS styles as a string
   * @param clickHandler - Click event handler
   * @param options - Additional options (classes, attributes)
   * @returns The created button
   */
  createButton(
    text: string,
    styles: string,
    clickHandler: (event: MouseEvent) => void,
    options: ButtonOptions = {}
  ): HTMLButtonElement {
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
   * @param size - Size in pixels (default: '20px')
   * @param color - Color of the spinner (default: '#0a66c2')
   * @returns The spinner element
   */
  createLoadingSpinner(size: string = '20px', color: string = '#0a66c2'): HTMLDivElement {
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
   * @param message - Message to display
   * @param type - Notification type: 'info', 'success', 'error', 'warning'
   * @param duration - How long to show the notification in ms
   * @returns The notification element
   */
  showNotification(
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info',
    duration: number = 3000
  ): HTMLDivElement {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('lai-notification') as HTMLDivElement;
    
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
   * @param element - Target element
   * @param text - Text to insert
   */
  insertTextIntoElement(element: HTMLElement, text: string): void {
    element.focus();
    document.execCommand('selectAll', false);
    document.execCommand('delete', false);
    document.execCommand('insertText', false, text);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  /**
   * Create a loading indicator
   * @param text - Text to display
   * @returns The loading indicator element
   */
  createLoadingIndicator(text: string = 'Loading...'): HTMLDivElement {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('lai-loading');
    loadingIndicator.innerHTML = `<span style="margin-right: 5px;">${text}</span>`;
    loadingIndicator.appendChild(document.createElement('div')).classList.add('lai-spinner');
    loadingIndicator.style.cssText = 'display: flex; align-items: center; margin: 5px 0; font-style: italic; color: #666;';
    return loadingIndicator;
  }
}

// Export as singleton
const uiService = new UIService();
export default uiService;

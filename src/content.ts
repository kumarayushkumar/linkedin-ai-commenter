// LinkedIn Auto Commenter - Content Script
import StorageService, { STORAGE_KEYS } from './services/storage';
import uiService from './services/ui';
import { LINKEDIN_SELECTORS } from './utils/constants';
import { createObserver, extractPostText } from './utils/helpers';

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

(function() {
  // Initialize the extension
  function initLinkedInAutoCommenter() {
    // Track URL changes to reinitialize on navigation
    let lastUrl = location.href;
    createObserver(document, () => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setupCommentListeners();
      }
    }, { subtree: true, childList: true }, 200);
    
    // Initial setup
    setupCommentListeners();
    
    // Setup listeners for comment buttons
    function setupCommentListeners() {
      // Create observer for dynamically loaded comment buttons
      createObserver(document.body, () => {
        const commentButtons = document.querySelectorAll(LINKEDIN_SELECTORS.COMMENT_BUTTON);
        attachEventListeners(commentButtons);
      });
      
      // Initial scan for comment buttons
      const initialButtons = document.querySelectorAll(LINKEDIN_SELECTORS.COMMENT_BUTTON);
      attachEventListeners(initialButtons);
    }
    
    // Attach event listeners to comment buttons
    function attachEventListeners(buttons: NodeListOf<Element>) {
      buttons.forEach(button => {
        // Prevent duplicate listeners
        if ((button as HTMLElement).dataset.autoCommentAttached) return;
        (button as HTMLElement).dataset.autoCommentAttached = 'true';
        
        button.addEventListener('click', (event: Event) => {
          handleCommentClick.call(button as HTMLElement, event as MouseEvent);
        });
      });
    }
    
    // Handle comment button click
    async function handleCommentClick(this: HTMLElement, event: MouseEvent) {
      try {
        // Check if extension is active
        let isActive = true;
        try {
          const result = await StorageService.get(STORAGE_KEYS.EXTENSION_ACTIVE);
          isActive = result[STORAGE_KEYS.EXTENSION_ACTIVE] !== false;
        } catch (storageError: any) {
          if (storageError.message && 
              (storageError.message.includes('Extension context invalidated') || 
               storageError.message.includes('Storage get error'))) {
            uiService.showNotification('Extension was updated or reloaded. Please refresh the page.', 'warning');
            return;
          }
        }
        
        if (!isActive) return;
        
        // Find post element and extract text
        const postElement = this.closest(LINKEDIN_SELECTORS.POST_CONTAINER);
        const postText = extractPostText(postElement as HTMLElement);
        
        // Save post text for side panel
        try {
          await StorageService.set({ [STORAGE_KEYS.LAST_POST_TEXT]: postText });
          
          // Show notification that variants are ready in side panel
          uiService.showNotification('Post saved! Check side panel for comment variants.', 'info');
          
          // Optionally open the side panel automatically
          chrome.runtime.sendMessage({ action: "openSidePanel" }, (response) => {
            if (chrome.runtime.lastError) {
              const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
              console.error('Failed to open side panel:', errorMessage);
              // Show a more user-friendly message for connection errors
              const userMessage = errorMessage.includes('establish connection') 
                ? 'Extension needs to be reloaded. Please refresh the page or restart Chrome.'
                : errorMessage;
              uiService.showNotification('Failed to open side panel: ' + userMessage, 'error');
            }
          });
        } catch (saveError: any) {
          console.error('Failed to save post text:', saveError);
          uiService.showNotification('Error saving post text. Try again.', 'error');
        }
        
      } catch (error: any) {
        console.error('Comment handling error:', error);
        uiService.showNotification('Error handling comment button click', 'error');
      }
    }
  }
  
  // Add CSS styles for the extension
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .lai-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top-color: #0a66c2;
        border-radius: 50%;
        animation: lai-spin 1s linear infinite;
      }
      
      @keyframes lai-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // After loading dependencies, check if extension context is valid
  async function initialize() {
    addStyles();
    try {
      
      // Check storage accessibility
      const storageAccessible = await StorageService.isAccessible();
      if (!storageAccessible) {
        console.warn('Extension context invalidated. Page refresh required.');
        return; // Stop initialization
      }
      
      // Now that dependencies are loaded and storage is accessible, initialize the extension
      initLinkedInAutoCommenter();
    } catch (error) {
      console.error('Failed to initialize extension:', error);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();

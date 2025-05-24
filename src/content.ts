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
        
        try {
          await StorageService.set({ [STORAGE_KEYS.LAST_POST_TEXT]: postText });
          
          uiService.showNotification('Check side panel for comments', 'info');
          
          chrome.runtime.sendMessage({ action: "openSidePanel" }, (response) => {
            if (chrome.runtime.lastError) {
              const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
              // Show a more user-friendly message for connection errors
              const userMessage = errorMessage.includes('establish connection') 
                ? 'Extension needs to be reloaded. Please refresh the page or restart Chrome.'
                : errorMessage;
              uiService.showNotification('Failed to open side panel: ' + userMessage, 'error');
            }
          });
        } catch (saveError: any) {
          uiService.showNotification('Error saving post text. Try again.', 'error');
        }
        
      } catch (error: any) {
        uiService.showNotification('Error handling comment button click', 'error');
      }
    }
  }
  
  async function initialize() {
    try {
      const storageAccessible = await StorageService.isAccessible();
      if (!storageAccessible) {
        uiService.showNotification('Storage is not accessible. Please check permissions.', 'error');
        return;
      }
      
      // Now that dependencies are loaded and storage is accessible, initialize the extension
      initLinkedInAutoCommenter();
    } catch (error) {
      uiService.showNotification('Failed to initialize extension. Please refresh the page.', 'error');
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fillCommentBox" && message.comment) {
      const activeCommentBox = document.querySelector('[contenteditable="true"][role="textbox"]');
      
      if (activeCommentBox) {
        activeCommentBox.textContent = message.comment;
        
        const event = new Event('input', { bubbles: true });
        activeCommentBox.dispatchEvent(event);
        
        (activeCommentBox as HTMLElement).focus();
      }
      
      sendResponse({ success: true });
    }
  });
})();

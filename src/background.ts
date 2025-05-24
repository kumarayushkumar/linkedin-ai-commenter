// LinkedIn Auto Commenter - Background Script
// Handles extension initialization and side panel management

import StorageService, { STORAGE_KEYS } from './services/storage';
import { PROMP_TEMPLATE } from './utils/constants';
import { isApiAvailable } from './utils/helpers';

/**
 * Open the side panel for a tab
 * @param tabId - The ID of the tab
 */
function openSidePanel(tabId: number): void {
  // Check if side panel API is available
  if (isApiAvailable('sidePanel.setOptions')) {
    // First set the options for the side panel
    chrome.sidePanel.setOptions({
      tabId: tabId,
      path: "sidepanel.html",
      enabled: true
    });
    
    // Then open the side panel if that API is available
    if (isApiAvailable('sidePanel.open')) {
      // @ts-ignore - Chrome types are not up to date
      chrome.sidePanel.open({ tabId: tabId });
    }
  } else {
    notifyUser('Side panel not available', 
      'Side panel is not supported in this Chrome version. Please use Ctrl+Shift+Y to open it or update Chrome.');
  }
}

/**
 * Show a notification to the user
 * @param title - Notification title
 * @param message - Notification message
 */
function notifyUser(title: string, message: string): void {
  console.warn(message);
  
  // Check if notifications API is available
  if (isApiAvailable('notifications.create')) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title || 'LinkedIn Auto Commenter',
      message: message
    });
  }
}

// Initialize storage with default values
async function initializeStorage(): Promise<void> {
  try {
    // Check if Chrome storage API is available
    if (!isApiAvailable('storage.sync')) {
      console.error('Chrome storage API is not available');
      return;
    }

    // Initialize with default values
    await StorageService.set({
      [STORAGE_KEYS.EXTENSION_ACTIVE]: true,
      [STORAGE_KEYS.PROMP_TEMPLATE]: PROMP_TEMPLATE
    });
    
    console.log('Storage initialized with default values');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

interface Message {
  action: string;
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Auto Commenter extension installed');
  initializeStorage(); // Initialize storage on first install
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  try {
    if (message.action === "openSidePanel" && sender.tab?.id) {
      openSidePanel(sender.tab.id);
      sendResponse({ success: true });
    } else if (message.action === "getDefaultPrompt") {
      // Send the default prompt from constants
      sendResponse({ 
        defaultPrompt: PROMP_TEMPLATE 
      });
    }
  } catch (error: any) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
  return true; // Keep the messaging channel open for async responses
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    openSidePanel(tab.id);
  }
});

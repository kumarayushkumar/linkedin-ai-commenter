// LinkedIn Auto Commenter - Background Script
// Handles extension initialization and side panel management

import StorageService, { STORAGE_KEYS } from './services/storage.js';
import { PROMP_TEMPLATE } from './utils/constants.js';
import { isApiAvailable } from './utils/helpers.js';

/**
 * Open the side panel for a tab
 * @param {number} tabId - The ID of the tab
 */
function openSidePanel(tabId) {
  // Check if side panel API is available
  if (isApiAvailable('sidePanel.setOptions')) {
    // First set the options for the side panel
    chrome.sidePanel.setOptions({
      tabId: tabId,
      path: "src/sidepanel/sidepanel.html",
      enabled: true
    });
    
    // Then open the side panel if that API is available
    if (isApiAvailable('sidePanel.open')) {
      chrome.sidePanel.open({ tabId: tabId });
    }
  } else {
    notifyUser('Side panel not available', 
      'Side panel is not supported in this Chrome version. Please use Ctrl+Shift+Y to open it or update Chrome.');
  }
}

/**
 * Show a notification to the user
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function notifyUser(title, message) {
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
async function initializeStorage() {
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

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Auto Commenter extension installed');
  initializeStorage(); // Initialize storage on first install
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSidePanel") {
    openSidePanel(sender.tab.id);
  } else if (message.action === "getDefaultPrompt") {
    // Send the default prompt from constants
    sendResponse({ 
      defaultPrompt: PROMP_TEMPLATE 
    });
  }
  return true; // Keep the messaging channel open for async responses
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  openSidePanel(tab.id);
});
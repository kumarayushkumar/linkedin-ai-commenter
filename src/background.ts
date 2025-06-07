// Background service worker for LinkedIn Auto Commenter

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSidePanel") {
    // Open the side panel
    if (chrome.sidePanel) {
      chrome.sidePanel.open({ windowId: sender.tab?.windowId });
      sendResponse({ success: true });
    } else {
      sendResponse({ 
        success: false, 
        error: "Side panel API not available" 
      });
    }
    return true; // Keep the message channel open for async response
  }
});
/**
 * Storage events system for listening to changes in Plasmo storage
 */

import { STORAGE_KEYS, storage } from "../services/storage"

/**
 * Trigger a manual check of LAST_POST_TEXT changes
 */
export function setupLastPostTextWatcher() {
  const watchCallbacks = {
    [STORAGE_KEYS.LAST_POST_TEXT]: (change: chrome.storage.StorageChange) => {
      if (change.newValue !== undefined) {
        const event = new CustomEvent("storage-change", {
          detail: {
            key: STORAGE_KEYS.LAST_POST_TEXT,
            newValue: change.newValue,
            oldValue: change.oldValue,
            // Add timestamp to force refresh even with same content
            timestamp: Date.now()
          }
        })
        document.dispatchEvent(event)
      }
    }
  }
  
  storage.watch(watchCallbacks)
}

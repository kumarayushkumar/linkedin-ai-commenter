/**
 * Storage events system for listening to changes in Plasmo storage
 */
import { STORAGE_KEYS, storage } from "../services/storage"

/**
 * Trigger a manual check of LAST_POST_TEXT changes
 */
export function setupLastPostTextWatcher() {
  // Create a callback for the last post text key
  const watchCallbacks = {
    [STORAGE_KEYS.LAST_POST_TEXT]: (change: chrome.storage.StorageChange) => {
      // The storage change event includes the old and new values
      if (change.newValue && change.newValue !== change.oldValue) {
        const event = new CustomEvent("storage-change", {
          detail: {
            key: STORAGE_KEYS.LAST_POST_TEXT,
            newValue: change.newValue,
            oldValue: change.oldValue
          }
        })
        document.dispatchEvent(event)
      }
    }
  }
  
  storage.watch(watchCallbacks)
}

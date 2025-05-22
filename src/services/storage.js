/**
 * Storage handler for Chrome storage
 */
class StorageHandler {
  /**
   * Get data from Chrome storage
   * @param {string|Array<string>} keys - Keys to retrieve
   * @returns {Promise<object>} - Storage data
   */
  static async get(keys) {
    return new Promise(resolve => {
      chrome.storage.sync.get(keys, result => resolve(result));
    });
  }
  
  /**
   * Save data to Chrome storage
   * @param {object} data - Data to save
   * @returns {Promise<void>}
   */
  static async set(data) {
    return new Promise(resolve => {
      chrome.storage.sync.set(data, resolve);
    });
  }
}

export default StorageHandler;

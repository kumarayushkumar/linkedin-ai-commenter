/**
 * Extract post text from LinkedIn post
 * @param postElement - The post container element
 * @returns Extracted post text
 */
export function extractPostText(postElement: HTMLElement | null): string {
  if (!postElement) return '';
  
  const postContent = postElement.querySelector(
    '.feed-shared-update-v2__description, ' + 
    '.update-components-text, ' + 
    '[data-test-feed-shared-text]'
  );
  
  let postText = postContent ? postContent.textContent?.trim() || '' : '';
  
  // Remove "...more" or "See more" if present
  postText = postText.replace(/(\u2026more|\.{3}more|See more)/gi, '').replace(/^\s+|\s+$/g, '');
  
  return postText;
}

/**
 * Debounce function to limit function calls
 * @param func - The function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Throttle function to limit execution frequency
 * @param func - The function to throttle
 * @param limit - Minimum milliseconds between executions
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * Check if Chrome API is available
 * @param apiPath - Dot-notation path to the API
 * @returns Whether the API is available
 */
export function isApiAvailable(apiPath: string): boolean {
  return apiPath.split('.').reduce((obj: any, path: string) => {
    return (obj && obj[path]) ? obj[path] : undefined;
  }, chrome) !== undefined;
}

/**
 * Get unique element from selector with retry
 * @param selector - CSS selector
 * @param parent - Parent element to search within
 * @param retryCount - Number of retries
 * @param retryDelay - Milliseconds between retries
 * @returns Found element
 */
export async function getUniqueElement(
  selector: string,
  parent: ParentNode = document,
  retryCount: number = 3,
  retryDelay: number = 500
): Promise<Element> {
  for (let i = 0; i < retryCount; i++) {
    const element = parent.querySelector(selector);
    if (element) return element;
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  throw new Error(`Element ${selector} not found after ${retryCount} retries`);
}

/**
 * Format error message for user display
 * @param error - The error object
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: Error): string {
  if (error.message.includes('API key')) {
    return 'API key not configured. Please update in extension settings.';
  }
  
  if (error.message.includes('quota') || error.message.includes('rate limit')) {
    return 'API rate limit exceeded. Please try again later.';
  }
  
  if (error.message.includes('network') || error.message.includes('connection')) {
    return 'Network error. Please check your internet connection.';
  }
  
  return `Error: ${error.message}`;
}

/**
 * Create a mutation observer with debounced callback
 * @param target - Element to observe
 * @param callback - Callback function
 * @param options - Observer options
 * @param debounceTime - Debounce time in ms
 * @returns The created observer
 */
export function createObserver(
  target: Node,
  callback: MutationCallback,
  options: MutationObserverInit = { subtree: true, childList: true },
  debounceTime: number = 100
): MutationObserver {
  const observer = new MutationObserver(debounce(callback, debounceTime));
  observer.observe(target, options);
  return observer;
}

// UI utility service for DOM manipulation
class UIService {
  /**
   * Wait for an element to appear in the DOM
   * @param selector - CSS selector for the element
   * @param parent - Parent element to search within (defaults to document)
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @returns The found element
   */
  async waitForElement(
    selector: string,
    parent: ParentNode = document,
    timeoutMs: number = 5000
  ): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const element = parent.querySelector(selector);
        if (element) {
          clearInterval(interval);
          resolve(element as HTMLElement);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        reject(new Error(`Element not found: ${selector}`));
      }, timeoutMs);
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
    clickHandler: () => void,
    options: { classes?: string[]; attributes?: Record<string, string>; ariaLabel?: string } = {}
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.cssText = styles;

    if (options.classes) {
      button.classList.add(...options.classes);
    }

    if (options.attributes) {
      Object.entries(options.attributes as Record<string, string>).forEach(([key, value]: [string, string]) => {
        button.setAttribute(key, value);
      });
    }

    if (options.ariaLabel) {
      button.setAttribute("aria-label", options.ariaLabel);
    }

    if (clickHandler) {
      button.addEventListener("click", clickHandler);
    }

    return button;
  }

  /**
   * Create a loading spinner element
   * @param size - Size in pixels (default: '20px')
   * @param color - Color of the spinner (default: '#0a66c2')
   * @returns The spinner element
   */
  createLoadingSpinner(size: string = "20px", color: string = "#0a66c2"): HTMLDivElement {
    const spinner = document.createElement("div");
    spinner.classList.add("lai-spinner");
    spinner.style.cssText = `
      width: ${size};
      height: ${size};
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-top-color: ${color};
      border-radius: 50%;
      animation: lai-spin 1s linear infinite;
    `;

    return spinner;
  }

  /**
   * Show notification message
   * @param message - Message to display
   * @param type - Notification type: 'info', 'success', 'error', 'warning'
   * @param duration - How long to show the notification in ms
   */
  showNotification(
    message: string,
    type: "info" | "success" | "error" | "warning" = "info",
    duration: number = 3000
  ): void {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background-color: ${type === "info" ? "#0a66c2" : type === "success" ? "#0a8544" : type === "error" ? "#d93025" : "#f29900"};
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, duration);
  }
}

const uiService = new UIService();
export default uiService;

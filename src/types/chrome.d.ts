declare namespace chrome.sidePanel {
  export function setOptions(options: {
    tabId?: number;
    path?: string;
    enabled?: boolean;
  }): void;
  
  export function open(options: {
    tabId?: number;
    windowId?: number;
  }): void;
}

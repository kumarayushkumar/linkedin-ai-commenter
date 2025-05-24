export interface AISettings {
  MODEL: string;
  TEMPERATURE: number;
  N: number;
}

export interface LinkedInSelectors {
  COMMENT_BUTTON: string;
  COMMENT_BOX: string;
  COMMENT_INPUT: string;
  POST_CONTAINER: string;
  POST_CONTENT: string;
}

export interface SidePanelElements {
  settingsTab: HTMLElement;
  responseTab: HTMLElement;
  settingsContent: HTMLElement;
  responseContent: HTMLElement;
  promptInput: HTMLTextAreaElement;
  status: HTMLElement;
  activeToggle: HTMLInputElement;
  gptResponses: HTMLElement;
  responseStatus: HTMLElement;
}

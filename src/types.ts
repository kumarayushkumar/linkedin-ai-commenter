// Common types used across the extension

import { OpenAIService } from './services/openai';
import StorageService from './services/storage';

export interface AISettings {
  MODEL: string;
  TEMPERATURE: number;
}

export interface LinkedInSelectors {
  COMMENT_BUTTON: string;
  COMMENT_BOX: string;
  COMMENT_INPUT: string;
  POST_CONTAINER: string;
  POST_CONTENT: string;
}

export interface ButtonOptions {
  classes?: string | string[];
  attributes?: Record<string, string>;
  ariaLabel?: string;
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
  saveBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
}

export interface SidePanelDependencies {
  openAIService: OpenAIService;
  storageService: typeof StorageService;
  chrome: typeof chrome;
}

export interface SidePanelState {
  lastUrl: string;
  timers: { [key: string]: number };
}

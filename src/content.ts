// LinkedIn Auto Commenter - Content Script
(async function() {
  let openAIService: any, storageService: any, uiService: any, constants: any, helpers: any, STORAGE_KEYS: any;

  async function loadDependencies(): Promise<void> {
    const baseURL = chrome.runtime.getURL('src/');

    const [openAIModule, storageModule, uiModule, constantsModule, helpersModule] = 
      await Promise.all([
        import(baseURL + 'services/openai'),
        import(baseURL + 'services/storage'),
        import(baseURL + 'services/ui'),
        import(baseURL + 'utils/constants'),
        import(baseURL + 'utils/helpers')
      ]);

    openAIService = openAIModule.default;
    storageService = storageModule.default;
    STORAGE_KEYS = storageModule.STORAGE_KEYS;
    uiService = uiModule.default;
    constants = constantsModule;
    helpers = helpersModule;

    const SELECTORS = constants.LINKEDIN_SELECTORS;
    const AI_SETTINGS = constants.AI_SETTINGS;

    initLinkedInAutoCommenter(SELECTORS, AI_SETTINGS, helpers);
  }

  function initLinkedInAutoCommenter(SELECTORS: any, AI_SETTINGS: any, helpers: any): void {
    const { createObserver, extractPostText } = helpers;

    let lastUrl = location.href;
    createObserver(document, () => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setupCommentListeners();
      }
    }, { subtree: true, childList: true }, 200);

    setupCommentListeners();

    function setupCommentListeners(): void {
      createObserver(document.body, () => {
        const buttons = document.querySelectorAll(SELECTORS.COMMENT_BUTTON);
        attachEventListeners(buttons);
      });

      const initialButtons = document.querySelectorAll(SELECTORS.COMMENT_BUTTON);
      attachEventListeners(initialButtons);
    }

    function attachEventListeners(buttons: NodeListOf<Element>): void {
      buttons.forEach(button => {
        button.addEventListener('click', handleCommentClick);
      });
    }

    async function handleCommentClick(event: Event): Promise<void> {
      try {
        const button = event.target as HTMLElement;
        const postElement = button.closest(SELECTORS.POST_CONTAINER);
        const postText = extractPostText(postElement);

        const prompt = await storageService.get(STORAGE_KEYS.CUSTOM_PROMPT);
        const comment = await openAIService.generateComment(postText, prompt);

        const commentBox = postElement?.querySelector(SELECTORS.COMMENT_BOX) as HTMLElement;
        uiService.insertTextIntoElement(commentBox, comment);
      } catch (error) {
        console.error('Error handling comment click:', error);
      }
    }
  }

  function addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .lai-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top-color: #0a66c2;
        border-radius: 50%;
        animation: lai-spin 1s linear infinite;
      }

      @keyframes lai-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  async function initialize(): Promise<void> {
    addStyles();
    try {
      await loadDependencies();
      const storageAccessible = await storageService.isAccessible();
      if (!storageAccessible) {
        console.error('Storage is not accessible');
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();

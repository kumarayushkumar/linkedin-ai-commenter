function autoComment() {
  const COMMENT_TEXT = "nice post";
  // Updated selectors based on LinkedIn's HTML structure
  const COMMENT_BUTTON_SELECTOR = 'button[aria-label="Comment"].artdeco-button--tertiary';
  const COMMENT_BOX_SELECTOR = '.comments-comment-box-comment__text-editor';
  const COMMENT_INPUT_SELECTOR = '[data-test-ql-editor-contenteditable="true"]';

  // Create MutationObserver to handle dynamically loaded content
  const observer = new MutationObserver((mutations) => {
    const commentButtons = document.querySelectorAll(COMMENT_BUTTON_SELECTOR);
    attachEventListeners(commentButtons);
  });

  // Configure and start the observer
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  function attachEventListeners(buttons) {
    buttons.forEach(button => {
      // Prevent multiple event listeners
      if (button.dataset.autoCommentAttached) return;
      button.dataset.autoCommentAttached = 'true';

      button.addEventListener("click", handleCommentClick);
    });
  }

  async function handleCommentClick() {
    try {
      await waitForElement(COMMENT_BOX_SELECTOR);
      const commentBox = document.querySelector(COMMENT_BOX_SELECTOR);
      // Try to find editorContainer, fallback to commentBox itself
      const editorContainer = commentBox.querySelector('.editor-container') || commentBox;
      let commentInput = editorContainer.querySelector(COMMENT_INPUT_SELECTOR);
      if (!commentInput) {
        // Fallback: try to find the input anywhere in the commentBox
        commentInput = commentBox.querySelector(COMMENT_INPUT_SELECTOR);
      }
      if (!commentInput) {
        console.warn('Retrying to find comment input...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        commentInput = editorContainer.querySelector(COMMENT_INPUT_SELECTOR) || commentBox.querySelector(COMMENT_INPUT_SELECTOR);
        if (!commentInput) {
          throw new Error('Comment input not found after retry');
        }
      }

      // Focus the input
      commentInput.focus();

      // Select all and delete (clear field)
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);

      // Insert text using execCommand for better compatibility with Quill
      document.execCommand('insertText', false, COMMENT_TEXT);

      // Dispatch input event for Quill editor
      commentInput.dispatchEvent(new Event('input', { bubbles: true }));
      commentInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'n' }));

    } catch (error) {
      console.error('Auto comment failed:', error);
    }
  }

  function waitForElement(selector) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found after 5 seconds`));
      }, 5000);

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearTimeout(timeout);
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  // Initial scan for comment buttons
  const initialButtons = document.querySelectorAll(COMMENT_BUTTON_SELECTOR);
  attachEventListeners(initialButtons);
}

// Initialize when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoComment);
} else {
  autoComment();
}

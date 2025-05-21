function autoComment() {
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

      button.addEventListener("click", function(event) {
        handleCommentClick.call(this, event);
      });
    });
  }

  async function handleCommentClick(event) {
    try {
      // 1. Find the closest post container from the clicked button
      const postElement = this.closest('.feed-shared-update-v2, .scaffold-finite-scroll__content');
      let postText = '';
      if (postElement) {
        const postContent = postElement.querySelector('.feed-shared-update-v2__description, .update-components-text, [data-test-feed-shared-text]');
        postText = postContent ? postContent.innerText.trim() : '';
        // Remove "...more" or "See more" if present
        postText = postText.replace(/(\u2026more|\.{3}more|See more)/gi, '').replace(/^\s+|\s+$/g, '');
      }
      console.log('Extracted LinkedIn post:', postText);

      // 2. Wait for the comment box that is inside this post
      await waitForElement(COMMENT_BOX_SELECTOR);
      const commentBox = document.querySelector(`${COMMENT_BOX_SELECTOR}:not([style*="display: none"])`);
      const editorContainer = commentBox?.querySelector('.editor-container') || commentBox;
      let commentInput = editorContainer?.querySelector(COMMENT_INPUT_SELECTOR) || commentBox?.querySelector(COMMENT_INPUT_SELECTOR);

      if (!commentInput) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        commentInput = editorContainer?.querySelector(COMMENT_INPUT_SELECTOR) || commentBox?.querySelector(COMMENT_INPUT_SELECTOR);
        if (!commentInput) throw new Error('Comment input not found after retry');
      }

      // 2. Get user prompt from storage
      const customPrompt = await new Promise(resolve => {
        chrome.storage.sync.get(['customPrompt'], result => resolve(result.customPrompt || 'Write a relevant comment for this post:'));
      });

      // 3. Call ChatGPT API
      const apiKey = OPENAI_API_KEY;
      const prompt = `${postText}\n \n --- \n ${customPrompt}`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Use 'gpt-4o' for the latest OpenAI model
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 60,
          temperature: 0.7,
        }),
      });
  
      const data = await response.json();
      const gptComment = data.choices?.[0]?.message?.content?.trim() || 'Great post!';

      // 4. Insert the generated comment
      commentInput.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      document.execCommand('insertText', false, gptComment);
      commentInput.dispatchEvent(new Event('input', { bubbles: true }));

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

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    autoComment();
  }
}).observe(document, {subtree: true, childList: true});

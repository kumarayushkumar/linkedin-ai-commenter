document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');

    const promptInput = document.getElementById('customPrompt');
    const saveBtn = document.getElementById('savePrompt');
    const status = document.getElementById('status');

    // Load saved prompt
    chrome.storage.sync.get(['customPrompt'], function(result) {
        if (result.customPrompt) {
            promptInput.value = result.customPrompt;
            if (status) {
                status.textContent = 'Prompt loaded!';
                setTimeout(() => status.textContent = 'Extension is ready!', 1500);
            }
        }
    });

    saveBtn.addEventListener('click', function() {
        chrome.storage.sync.set({ customPrompt: promptInput.value }, function() {
            status.textContent = 'Prompt saved!';
            setTimeout(() => status.textContent = 'Extension is ready!', 1500);
        });
    });
});
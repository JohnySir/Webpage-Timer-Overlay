let timerInterval;
let totalSeconds = 0;
let isPaused = false;
let userDefinedDuration = 0;

// Function to send messages to the active tab's content script
function sendMessageToContentScript(action, data) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, (response) => {
                if (chrome.runtime.lastError) {
                    // This can happen if the content script isn't injected yet.
                    // It's often safe to ignore, but we log it for debugging.
                    console.log(`Could not send message: ${chrome.runtime.lastError.message}`);
                }
            });
        }
    });
}

// Function to start the timer countdown
function startTimer() {
    clearInterval(timerInterval); // Clear any existing timer
    isPaused = false;

    timerInterval = setInterval(() => {
        if (!isPaused && totalSeconds > 0) {
            totalSeconds--;
            sendMessageToContentScript('updateTime', { time: totalSeconds });
        } else if (totalSeconds <= 0) {
            clearInterval(timerInterval);
             // Optional: Notify user timer is done
            sendMessageToContentScript('timerEnd');
        }
    }, 1000);
}

// Listen for messages from the popup or other scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'start':
            const { settings } = request;
            userDefinedDuration = (settings.minutes * 60) + settings.seconds;
            totalSeconds = userDefinedDuration;
            
            // Save settings to storage
            chrome.storage.sync.set({ timerSettings: settings, timerState: { totalSeconds, isPaused: false } });
            
            // Send settings to content script to update/create the overlay
            sendMessageToContentScript('updateSettings', { settings });
            sendMessageToContentScript('updateTime', { time: totalSeconds });
            
            startTimer();
            sendResponse({ status: 'Timer started' });
            break;

        case 'pause':
            isPaused = !isPaused;
            chrome.storage.sync.set({ timerState: { totalSeconds, isPaused } });
            sendResponse({ status: isPaused ? 'Timer paused' : 'Timer resumed' });
            break;

        case 'reset':
            totalSeconds = userDefinedDuration;
            isPaused = false;
            chrome.storage.sync.set({ timerState: { totalSeconds, isPaused } });
            sendMessageToContentScript('updateTime', { time: totalSeconds });
            startTimer();
            sendResponse({ status: 'Timer reset' });
            break;

        case 'stop':
            clearInterval(timerInterval);
            totalSeconds = 0;
            isPaused = false;
            // Clear state from storage
            chrome.storage.sync.remove(['timerState']);
            sendMessageToContentScript('stop');
            sendResponse({ status: 'Timer stopped' });
            break;
        
        case 'savePosition':
            chrome.storage.sync.get(['timerSettings'], (result) => {
                const newSettings = result.timerSettings || {};
                newSettings.position = request.position;
                chrome.storage.sync.set({ timerSettings: newSettings });
            });
            sendResponse({ status: 'Position saved' });
            break;
    }
    return true; // Indicates that the response is sent asynchronously
});

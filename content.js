let timerOverlay = null;
let offsetX, offsetY, isDragging = false;

// Function to format time from seconds to MM:SS
function formatTime(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Function to create or update the timer overlay
function createOrUpdateOverlay(settings) {
    if (!timerOverlay) {
        timerOverlay = document.createElement('div');
        timerOverlay.id = 'custom-timer-overlay';
        document.body.appendChild(timerOverlay);

        // --- Drag and Drop Logic ---
        timerOverlay.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - timerOverlay.getBoundingClientRect().left;
            offsetY = e.clientY - timerOverlay.getBoundingClientRect().top;
            timerOverlay.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            // Constrain to viewport
            const vw = document.documentElement.clientWidth;
            const vh = document.documentElement.clientHeight;
            const rect = timerOverlay.getBoundingClientRect();

            newX = Math.max(0, Math.min(newX, vw - rect.width));
            newY = Math.max(0, Math.min(newY, vh - rect.height));

            timerOverlay.style.left = `${newX}px`;
            timerOverlay.style.top = `${newY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                timerOverlay.style.cursor = 'grab';
                // Save the final position
                chrome.runtime.sendMessage({
                    action: 'savePosition',
                    position: { top: timerOverlay.style.top, left: timerOverlay.style.left }
                });
            }
        });
    }

    // Apply styles from settings
    timerOverlay.style.position = 'fixed';
    timerOverlay.style.zIndex = '999999';
    timerOverlay.style.width = `${settings.scale}px`;
    timerOverlay.style.height = 'auto';
    timerOverlay.style.backgroundColor = settings.bgColor;
    timerOverlay.style.color = settings.textColor;
    timerOverlay.style.opacity = settings.opacity;
    timerOverlay.style.borderRadius = `${settings.borderRadius}px`;
    timerOverlay.style.display = 'flex';
    timerOverlay.style.justifyContent = 'center';
    timerOverlay.style.alignItems = 'center';
    timerOverlay.style.fontSize = `${Math.floor(settings.scale / 4)}px`;
    timerOverlay.style.padding = `${Math.floor(settings.scale / 10)}px`;
    timerOverlay.style.fontFamily = 'monospace';
    timerOverlay.style.fontWeight = 'bold';
    timerOverlay.style.cursor = 'grab';
    timerOverlay.style.userSelect = 'none';
    timerOverlay.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    timerOverlay.style.transition = 'opacity 0.3s, background-color 0.3s, color 0.3s';
    
    // Apply saved position
    if (settings.position) {
        timerOverlay.style.top = settings.position.top || '20px';
        timerOverlay.style.left = settings.position.left || '20px';
    } else {
        timerOverlay.style.top = '20px';
        timerOverlay.style.left = '20px';
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'updateSettings':
            createOrUpdateOverlay(request.settings);
            break;
        case 'updateTime':
            if (timerOverlay) {
                timerOverlay.textContent = formatTime(request.time);
            }
            break;
        case 'timerEnd':
             if (timerOverlay) {
                timerOverlay.style.backgroundColor = '#4CAF50'; // Green flash
                setTimeout(() => {
                    if(timerOverlay) timerOverlay.style.backgroundColor = ''; // Revert
                }, 1000);
            }
            break;
        case 'stop':
            if (timerOverlay) {
                timerOverlay.remove();
                timerOverlay = null;
            }
            break;
    }
    sendResponse({ status: 'Received' });
});

// On page load, check if a timer was running and restore it
chrome.storage.sync.get(['timerSettings', 'timerState'], (result) => {
    if (result.timerSettings && result.timerState && result.timerState.totalSeconds > 0) {
        createOrUpdateOverlay(result.timerSettings);
        timerOverlay.textContent = formatTime(result.timerState.totalSeconds);
    }
});

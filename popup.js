// Function to send messages to the background script
function sendMessage(action, data) {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        } else {
            console.log(response);
        }
    });
}

// Function to update slider value displays
function updateSliderValue(sliderId, displayId, unit = '') {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    display.textContent = slider.value + unit;
    slider.addEventListener('input', (event) => {
        display.textContent = event.target.value + unit;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const scaleInput = document.getElementById('scale');
    const opacityInput = document.getElementById('opacity');
    const borderRadiusInput = document.getElementById('borderRadius');
    const textColorInput = document.getElementById('textColor');
    const bgColorInput = document.getElementById('bgColor');

    // Initialize slider value displays
    updateSliderValue('scale', 'scaleValue', 'px');
    updateSliderValue('opacity', 'opacityValue');
    updateSliderValue('borderRadius', 'borderRadiusValue', 'px');

    // Load saved settings from chrome.storage.sync
    chrome.storage.sync.get(['timerSettings'], (result) => {
        if (result.timerSettings) {
            const settings = result.timerSettings;
            minutesInput.value = settings.minutes || 25;
            secondsInput.value = settings.seconds || 0;
            scaleInput.value = settings.scale || 100;
            opacityInput.value = settings.opacity || 0.8;
            borderRadiusInput.value = settings.borderRadius || 10;
            textColorInput.value = settings.textColor || '#FFFFFF';
            bgColorInput.value = settings.bgColor || '#000000';

            // Update displays after loading
            document.getElementById('scaleValue').textContent = scaleInput.value + 'px';
            document.getElementById('opacityValue').textContent = opacityInput.value;
            document.getElementById('borderRadiusValue').textContent = borderRadiusInput.value + 'px';
        }
    });

    // --- Event Listeners for Buttons ---

    // Apply & Start Button
    document.getElementById('apply').addEventListener('click', () => {
        const settings = {
            minutes: parseInt(minutesInput.value, 10),
            seconds: parseInt(secondsInput.value, 10),
            scale: scaleInput.value,
            opacity: opacityInput.value,
            borderRadius: borderRadiusInput.value,
            textColor: textColorInput.value,
            bgColor: bgColorInput.value
        };
        sendMessage('start', { settings });
    });

    // Pause/Resume Button
    document.getElementById('pause').addEventListener('click', () => {
        sendMessage('pause');
    });

    // Reset Button
    document.getElementById('reset').addEventListener('click', () => {
        sendMessage('reset');
    });

    // Stop & Hide Button
    document.getElementById('stop').addEventListener('click', () => {
        sendMessage('stop');
    });
});

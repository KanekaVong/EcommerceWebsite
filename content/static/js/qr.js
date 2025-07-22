document.addEventListener('DOMContentLoaded', function() {
    const qrSelector = document.getElementById('qr-selector');
    const qrDisplay = document.getElementById('qr-display');
    const displayText = document.getElementById('display-text');
    const displayImage = document.getElementById('display-image');

    function updateQrCodeDisplay() {
        const selectedOption = qrSelector.options[qrSelector.selectedIndex];

        // If the selected option is not a real one (like the default "Select..."),
        // hide the QR display area and do nothing else.
        if (!selectedOption || !selectedOption.value) {
            qrDisplay.classList.add('hidden');
            return;
        }

        // Get the data from the selected option
        const imageUrl = selectedOption.value;
        const name = selectedOption.getAttribute('data-name');

        // Update the content in the right column
        displayText.textContent = `Scan for: ${name}`;
        displayImage.src = imageUrl;
        displayImage.alt = `QR Code for ${name}`;

        // Show the right column's content
        qrDisplay.classList.remove('hidden');
    }

    // Add an event listener that runs the update function whenever the dropdown value changes.
    if (qrSelector) {
        qrSelector.addEventListener('change', updateQrCodeDisplay);
    }
});
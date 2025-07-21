document.addEventListener('DOMContentLoaded', function() {
    // Get all the necessary HTML elements
    const qrSelector = document.getElementById('qr-selector');
    const qrDisplay = document.getElementById('qr-display');
    const paymentStatusOverlay = document.getElementById('payment-status-overlay');
    const processingIndicator = document.getElementById('processing-indicator');
    const successIndicator = document.getElementById('success-indicator');

    /**
     * This function is called when the user selects a QR code from the dropdown.
     */
    function handleQrSelection() {
        // Display the selected QR code image
        const selectedOption = qrSelector.options[qrSelector.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;

        const imageUrl = selectedOption.value;
        const name = selectedOption.getAttribute('data-name');
        
        document.getElementById('display-image').src = imageUrl;
        document.getElementById('display-text').textContent = `Scan for: ${name}`;
        qrDisplay.classList.remove('hidden');

        // Disable the dropdown to prevent changes during processing
        qrSelector.disabled = true;

        // Start the 10-second payment simulation
        simulatePaymentProcessing();
    }

    /**
     * Simulates a 10-second payment processing delay.
     */
    function simulatePaymentProcessing() {
        // Show the "Processing..." overlay
        paymentStatusOverlay.classList.remove('hidden');
        processingIndicator.classList.remove('hidden');
        successIndicator.classList.add('hidden');

        // Wait for 10 seconds (10000 milliseconds)
        setTimeout(() => {
            // After 10 seconds, attempt to place the order on the server
            placeOrder();
        }, 10000);
    }

    /**
     * Sends a request to the backend to finalize the order.
     */
    async function placeOrder() {
        try {
            // This API call is the same one used by the credit card payment page
            const response = await fetch('/api/order/place/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to place order.');
            }

            // If the order is successful, show the success animation
            showSuccessAndRedirect();

        } catch (error) {
            console.error('Order placement failed:', error);
            // In a real app, you would show an error message to the user here
            alert('There was an error placing your order. Please try again.');
            paymentStatusOverlay.classList.add('hidden');
            qrSelector.disabled = false;
        }
    }

    /**
     * Shows the success message and redirects the user.
     */
    function showSuccessAndRedirect() {
        // Switch from the spinner to the success checkmark
        processingIndicator.classList.add('hidden');
        successIndicator.classList.remove('hidden');

        // Wait 3 seconds to show the success message, then redirect
        setTimeout(() => {
            window.location.href = '/'; // Redirect to the homepage
        }, 3000);
    }

    /**
     * Helper function to get a cookie value by name (for CSRF token).
     */
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Attach the event listener to the dropdown menu.
    if (qrSelector) {
        qrSelector.addEventListener('change', handleQrSelection);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Get all the necessary elements from the page
    const paymentForm = document.getElementById('payment-form');
    const summaryContainer = document.getElementById('payment-summary-items');
    const totalElement = document.getElementById('payment-total');
    const messageElement = document.getElementById('payment-message');
    const payButton = paymentForm.querySelector('button[type="submit"]');

    /**
     * Fetches the current cart from the API and displays it as an order summary.
     */
    async function fetchAndDisplaySummary() {
        try {
            const response = await fetch('/api/cart/');
            if (!response.ok) {
                throw new Error('Failed to load order summary.');
            }
            const cart = await response.json();

            // Clear the loading message
            summaryContainer.innerHTML = '';
            let totalAmount = 0;

            if (!cart.items || cart.items.length === 0) {
                summaryContainer.innerHTML = '<p>Your cart is empty.</p>';
                payButton.disabled = true; // Disable payment if cart is empty
                return;
            }

            cart.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('summary-item');
                const itemTotal = (item.product_price || 0) * (item.quantity || 0);
                totalAmount += itemTotal;

                itemElement.innerHTML = `
                    <span class="item-name">${item.product_name} (x${item.quantity})</span>
                    <span class="item-price">$${itemTotal.toFixed(2)}</span>
                `;
                summaryContainer.appendChild(itemElement);
            });

            totalElement.textContent = `$${totalAmount.toFixed(2)}`;

        } catch (error) {
            console.error('Error fetching cart summary:', error);
            summaryContainer.innerHTML = '<p>Could not load summary.</p>';
            payButton.disabled = true;
        }
    }

    /**
     * Handles the payment form submission.
     * @param {Event} event - The form submission event.
     */
    async function handlePayment(event) {
        event.preventDefault(); // Prevent the form from submitting the traditional way

        payButton.textContent = 'Processing...';
        payButton.disabled = true;
        messageElement.classList.add('hidden');

        try {
            // This URL points to the PlaceOrderAPIView
            const response = await fetch('/api/order/place/', {
                method: 'POST',
                headers: {
                    // Django's CSRF token needs to be included in headers for POST requests
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                },
                // You can pass payment details here if your backend needs them
                // For now, we just trigger the order placement
                body: JSON.stringify({}) 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to place order.');
            }

            const order = await response.json();
            
            // Show success message and redirect
            messageElement.textContent = `Order #${order.id} placed successfully! Redirecting...`;
            messageElement.className = 'payment-message success';
            
            // Redirect to the homepage or an order confirmation page after a short delay
            setTimeout(() => {
                window.location.href = '/'; // Redirect to home
            }, 3000);

        } catch (error) {
            console.error('Payment failed:', error);
            messageElement.textContent = error.message;
            messageElement.className = 'payment-message error';
            payButton.textContent = 'Pay Now';
            payButton.disabled = false;
        }
    }

    /**
     * Helper function to get a cookie value by name (for CSRF token).
     * @param {string} name - The name of the cookie.
     * @returns {string} - The value of the cookie.
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

    // Attach the event listener to the form
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }

    // Load the order summary when the page loads
    fetchAndDisplaySummary();
});

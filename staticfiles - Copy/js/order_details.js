// static/js/order_details.js

document.addEventListener('DOMContentLoaded', function() {
    const orderDetailsContainer = document.getElementById('orderDetailsContainer');
    const orderIdDisplay = document.getElementById('orderIdDisplay');

    // ORDER_ID is passed from the Django template context
    if (typeof ORDER_ID === 'undefined' || !ORDER_ID) {
        console.error("Order ID is not defined in the template context.");
        orderDetailsContainer.innerHTML = `<p class="error-message">Order ID not found. Cannot display details.</p>`;
        return;
    }

    /**
     * Fetches the specific order details from the API and renders them.
     * @param {number} orderId - The ID of the order to fetch.
     */
    async function fetchAndDisplayOrderDetails(orderId) {
        orderDetailsContainer.innerHTML = `<p class="loading-message">Loading order details...</p>`; // Show loading message

        try {
            // Fetch the order details using the new API endpoint
            const response = await fetch(`/api/orders/${orderId}/`);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to load order details. Status: ${response.status}. Response: ${errorText}`);
            }
            const order = await response.json();
            console.log("Fetched order details:", order); // For debugging

            renderOrderDetails(order);

        } catch (error) {
            console.error('Error fetching order details:', error);
            orderDetailsContainer.innerHTML = `<p class="error-message">Could not load order details. Please try again later.</p>`;
        }
    }

    /**
     * Renders the fetched order details into the container.
     * @param {Object} order - The order object from the API.
     */
    function renderOrderDetails(order) {
        orderDetailsContainer.innerHTML = ''; // Clear loading message

        if (!order) {
            orderDetailsContainer.innerHTML = `<p class="no-details-message">Order details not found.</p>`;
            return;
        }

        // Update the order ID in the header
        orderIdDisplay.textContent = `#${order.id}`;

        const orderDate = new Date(order.created_at);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                itemsHtml += `
                    <div class="order-detail-item-card">
                        <div class="item-image-wrapper">
                            <img src="${item.product_image || 'https://placehold.co/50x50/E8E8E8/4A4A4A?text=No+Image'}" alt="${item.product_name}" class="item-image">
                        </div>
                        <div class="item-info">
                            <span class="item-name">${item.product_name}</span>
                            <span class="item-quantity">Qty: ${item.quantity}</span>
                            <span class="item-price">Price: $${parseFloat(item.price_at_order).toFixed(2)}</span>
                        </div>
                        <div class="item-subtotal">
                            Subtotal: $${(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}
                        </div>
                    </div>
                `;
            });
        } else {
            itemsHtml = `<p class="no-items-message">No items found for this order.</p>`;
        }

        orderDetailsContainer.innerHTML = `
            <div class="order-details-card">
                <div class="order-header-details">
                    <div class="order-meta">
                        <p><strong>Order ID:</strong> #${order.id}</p>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Status:</strong> <span class="order-status ${order.status}">${order.status_display}</span></p>
                        <p><strong>Customer:</strong> ${order.user_username || 'Anonymous'}</p>
                    </div>
                    <div class="order-total-display">
                        Total: <span>$${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="order-items-list">
                    <h3>Items in this Order:</h3>
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    // Initiate fetching and displaying order details when the page loads
    fetchAndDisplayOrderDetails(ORDER_ID);
});
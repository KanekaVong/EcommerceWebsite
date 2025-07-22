document.addEventListener('DOMContentLoaded', function() {
    const historyContainer = document.getElementById('sale-history-container');

    /**
     * Fetches the user's sale history from the API and renders it.
     */
    async function fetchAndDisplayHistory() {
        if (!historyContainer) {
            console.error("Sale history container element not found on this page.");
            return;
        }

        try {
            // This URL points to the SaleLogListAPIView
            const response = await fetch('/api/sales/');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to load order history. Status: ${response.status}. Response: ${errorText}`);
            }
            const orders = await response.json();
            console.log("Fetched sales data from API:", orders); // For debugging
            renderHistory(orders);

        } catch (error) {
            console.error('Error fetching sale history:', error);
            historyContainer.innerHTML = `<p class="no-history-message">Could not load your order history. Please try again later.</p>`;
        }
    }

    /**
     * Renders the sale history data into the container.
     * @param {Array} orders - An array of order objects from the API.
     */
    function renderHistory(orders) {
        historyContainer.innerHTML = ''; // Clear the loading message

        if (!orders || orders.length === 0) {
            console.log("API returned no past orders."); // For debugging
            historyContainer.innerHTML = `<p class="no-history-message">You have no past orders.</p>`;
            return;
        }

        // Group items by order ID
        const ordersGrouped = orders.reduce((acc, sale) => {
            const orderId = sale.order;
            // Skip any sale logs that aren't properly associated with an order
            if (orderId === null || typeof orderId === 'undefined') {
                console.warn("Found a sale log without an order ID:", sale);
                return acc;
            }

            if (!acc[orderId]) {
                acc[orderId] = {
                    items: [],
                    total_amount: 0,
                    status: 'completed', // Assuming all logged sales are from completed orders
                    sale_date: sale.sale_date
                };
            }
            acc[orderId].items.push(sale);
            acc[orderId].total_amount += parseFloat(sale.sale_price) * sale.quantity;
            return acc;
        }, {});

        console.log("Grouped orders for rendering:", ordersGrouped); // For debugging

        // Check if any orders were actually grouped
        if (Object.keys(ordersGrouped).length === 0) {
            historyContainer.innerHTML = `<p class="no-history-message">You have no past orders to display.</p>`;
            return;
        }

        for (const orderId in ordersGrouped) {
            const order = ordersGrouped[orderId];
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card');
            
            const saleDate = new Date(order.sale_date);
            const formattedDate = saleDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            let itemsHtml = '';
            order.items.forEach(item => {
                itemsHtml += `
                    <div class="order-item">
                        <span class="item-name">${item.product_name}</span>
                        <span class="item-details">Qty: ${item.quantity} @ $${parseFloat(item.sale_price).toFixed(2)}</span>
                    </div>
                `;
            });

            orderCard.innerHTML = `
                <div class="order-header">
                    <h3>Order #${orderId}</h3>
                    <span class="order-date">${formattedDate}</span>
                </div>
                <div class="order-body">
                    ${itemsHtml}
                </div>
                <div class="order-footer">
                    <span class="order-status ${order.status}">${order.status}</span>
                    <span class="order-total">Total: $${order.total_amount.toFixed(2)}</span>
                </div>
            `;
            historyContainer.appendChild(orderCard);
        }
    }

    // Initial fetch and display
    fetchAndDisplayHistory();
});

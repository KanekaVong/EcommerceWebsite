// static/js/sale_history.js

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
            const sales = await response.json(); // Renamed to 'sales' as it's SaleLog data
            console.log("Fetched sales data from API:", sales); // For debugging
            renderHistory(sales);

        } catch (error) {
            console.error('Error fetching sale history:', error);
            historyContainer.innerHTML = `<p class="no-history-message">Could not load your order history. Please try again later.</p>`;
        }
    }

    /**
     * Renders the sale history data into the container.
     * @param {Array} sales - An array of sale log objects from the API.
     */
    function renderHistory(sales) {
        historyContainer.innerHTML = ''; // Clear the loading message

        if (!sales || sales.length === 0) {
            console.log("API returned no past orders."); // For debugging
            historyContainer.innerHTML = `<p class="no-history-message">You have no past orders.</p>`;
            return;
        }

        // Group sales by order ID to represent individual orders
        const ordersGrouped = sales.reduce((acc, sale) => {
            const orderId = sale.order_id; // Use order_id from SaleLogSerializer
            // Skip any sale logs that aren't properly associated with an order
            if (orderId === null || typeof orderId === 'undefined') {
                console.warn("Found a sale log without an order ID:", sale);
                return acc;
            }

            if (!acc[orderId]) {
                acc[orderId] = {
                    id: orderId, // Store the actual order ID
                    items: [],
                    total_amount: 0,
                    status: 'completed', // SaleLog doesn't directly provide order status, assuming completed for simplicity or fetch from Order model
                    sale_date: sale.sale_date // Use the date of the first item in the order for display
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

        // Sort orders by date, newest first
        const sortedOrderIds = Object.keys(ordersGrouped).sort((a, b) => {
            return new Date(ordersGrouped[b].sale_date) - new Date(ordersGrouped[a].sale_date);
        });

        sortedOrderIds.forEach(orderId => {
            const order = ordersGrouped[orderId];
            // --- START CHANGE HERE ---
            // Create an <a> tag instead of a <div> for the order card
            const orderLink = document.createElement('a');
            orderLink.classList.add('order-card'); // Apply your existing CSS class to the link
            orderLink.href = `/order/${order.id}/details/`; // Set the direct link to the order details page
            
            // Optional: Add styles to make it behave visually like a div
            orderLink.style.textDecoration = 'none'; // Remove default underline for links
            orderLink.style.color = 'inherit';       // Inherit text color
            orderLink.style.display = 'block';       // Make it a block-level element to fill the card area
            orderLink.style.cursor = 'pointer';      // Show pointer on hover

            const saleDate = new Date(order.sale_date);
            const formattedDate = saleDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            let itemsHtml = '';
            // Display only a few items or a summary here, full details are on order_details page
            const displayItems = order.items.slice(0, 2); // Show first 2 items
            displayItems.forEach(item => {
                itemsHtml += `
                    <div class="order-item">
                        <span class="item-name">${item.product_name}</span>
                        <span class="item-details">Qty: ${item.quantity} @ $${parseFloat(item.sale_price).toFixed(2)}</span>
                    </div>
                `;
            });
            if (order.items.length > 2) {
                itemsHtml += `<div class="order-item-more">...and ${order.items.length - 2} more items</div>`;
            }

            // Set the innerHTML for the <a> tag
            orderLink.innerHTML = `
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
            
            historyContainer.appendChild(orderLink); // Append the new <a> element
            // --- END CHANGE HERE ---
        });
    }

    // Initial fetch and display
    fetchAndDisplayHistory();
});
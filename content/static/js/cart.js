document.addEventListener('DOMContentLoaded', function() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    const totalItemsElement = document.getElementById('total-items');
    const checkoutButtons = document.querySelectorAll('.cart-actions .btn-primary, .cart-actions .btn-outline');

    /**
     * Fetches cart data from the backend API and calls the render function.
     */
    async function fetchAndDisplayCart() {
        if (!cartItemsContainer) return;

        try {
            // This URL points to the CartDetailAPIView you created in views.py
            const response = await fetch('/api/cart/'); 
            
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            
            const cartData = await response.json();
            renderCart(cartData);

        } catch (error) {
            console.error('Failed to fetch cart:', error);
            cartItemsContainer.innerHTML = `<p class="empty-cart-message">Could not load your cart. Please try again later.</p>`;
        }
    }

    /**
     * Renders the cart items and summary based on data from the API.
     * @param {object} cart - The cart object from the backend.
     */
    function renderCart(cart) {
        // Clear the "Loading..." message
        cartItemsContainer.innerHTML = '';

        if (!cart.items || cart.items.length === 0) {
            cartItemsContainer.innerHTML = `<p class="empty-cart-message">Your cart is empty.</p>`;
            // Hide checkout buttons if the cart is empty
            checkoutButtons.forEach(btn => btn.style.display = 'none');
            totalItemsElement.textContent = 0;
            cartTotalElement.textContent = '$0.00';
            return;
        }

        let totalAmount = 0;
        let totalItems = 0;

        cart.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');

            const itemTotal = (item.product_price || 0) * (item.quantity || 0);
            totalAmount += itemTotal;
            totalItems += item.quantity;

            // Construct the URL for the product detail page using the product ID
            const productDetailUrl = `/product/${item.product}/`;
            
            // --- FIX: Replace backslashes with forward slashes for the image path ---
            const correctedImagePath = item.product_image ? item.product_image.replace(/\\/g, '/') : '';
            const imageUrl = correctedImagePath ? `/static${correctedImagePath}` : 'https://placehold.co/100x100/E8E8E8/4A4A4A?text=No+Image';

            // Dynamically create the HTML for each cart item with links
            itemElement.innerHTML = `
                <a href="${productDetailUrl}" class="cart-item-image-link">
                    <div class="cart-item-image">
                        <img src="${imageUrl}" alt="${item.product_name}">
                    </div>
                </a>
                <div class="cart-item-info">
                    <h3><a href="${productDetailUrl}">${item.product_name}</a></h3>
                    <p class="item-price">$${parseFloat(item.product_price || 0).toFixed(2)}</p>
                </div>
                <div class="cart-item-controls">
                    <p class="item-quantity">Qty: ${item.quantity}</p>
                    <p class="item-total-price"><strong>$${itemTotal.toFixed(2)}</strong></p>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Update the summary section
        if(cartTotalElement) cartTotalElement.textContent = `$${totalAmount.toFixed(2)}`;
        if(totalItemsElement) totalItemsElement.textContent = totalItems;
        // Ensure checkout buttons are visible
        checkoutButtons.forEach(btn => btn.style.display = 'inline-block');
    }

    // Run the function to fetch and display the cart when the page loads.
    fetchAndDisplayCart();
});

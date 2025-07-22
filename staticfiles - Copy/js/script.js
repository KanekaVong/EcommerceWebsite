const EcommStore = {
    init() {
        this.bindEvents();
        this.initSlideshow();
        this.updateAllCartDisplays();
    },

    // --- Cart API Functions ---

    async addToCart(productId) {
        console.log(`Adding product ${productId} to cart.`);
        try {
            const response = await fetch('/api/cart/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken'),
                },
                body: JSON.stringify({ product_id: productId, quantity: 1 })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const cartData = await response.json();
            console.log("Cart updated:", cartData);
            this.updateAllCartDisplays();
        } catch (error) {
            console.error("Error adding to cart:", error.message);
        }
    },

    async removeFromCart(productId) {
        console.log(`Removing product ${productId} from cart.`);
        try {
            const response = await fetch('/api/cart/update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken'),
                },
                body: JSON.stringify({ product_id: productId })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const cartData = await response.json();
            console.log("Cart updated after removal:", cartData);
            this.updateAllCartDisplays();
        } catch (error) {
            console.error("Error removing from cart:", error.message);
        }
    },

    // --- Cart UI Sync ---

    async updateAllCartDisplays() {
        try {
            const response = await fetch('/api/cart/');
            if (!response.ok) throw new Error("Failed to fetch cart.");

            const cart = await response.json();

            const cartCountEl = document.getElementById('cart-count');
            let totalItems = 0;
            const quantityMap = {};

            if (cart && cart.items) {
                cart.items.forEach(item => {
                    totalItems += item.quantity;
                    quantityMap[item.product] = item.quantity;
                });
            }

            if (cartCountEl) {
                cartCountEl.textContent = totalItems;
            }

            document.querySelectorAll('.product-cart-quantity').forEach(span => {
                const id = span.dataset.productId;
                span.textContent = quantityMap[id] || 0;
            });
        } catch (err) {
            console.warn("Cart sync failed:", err.message);
        }
    },

    // --- Events ---

    bindEvents() {
        document.addEventListener('click', (event) => {
            const target = event.target;

            if (target.closest('.js-add-to-cart')) {
                const card = target.closest('.product-card');
                if (card) {
                    this.addToCart(card.dataset.id);
                }
            }

            if (target.closest('.js-remove-from-cart')) {
                const card = target.closest('.product-card');
                if (card) {
                    this.removeFromCart(card.dataset.id);
                }
            }
        });
    },

    // --- Slideshow Functionality ---

    initSlideshow() {
        const slides = document.querySelectorAll('.hero-slideshow .slide');
        if (!slides.length) return;

        let currentIndex = 0;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        }

        setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            showSlide(currentIndex);
        }, 5000); // Change every 5 seconds
    },

    // --- Utility ---

    getCookie(name) {
        if (!document.cookie) return null;

        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
        return null;
    }
};

// Initialize after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    EcommStore.init();
});

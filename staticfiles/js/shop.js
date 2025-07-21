document.addEventListener('DOMContentLoaded', function() {
    // --- STATE MANAGEMENT ---
    let allProducts = []; // This will store the master list of products from the API
    const filters = {
        categories: [],
        maxPrice: 100,
        sortBy: 'default'
    };

    // --- ELEMENT SELECTORS ---
    const productList = document.getElementById('product-list');
    const categoryList = document.getElementById('category-filter-list');
    const priceSlider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');
    const sortBySelect = document.getElementById('sort-by');

    /**
     * Fetches both products and categories from the API concurrently when the page loads.
     */
    async function fetchInitialData() {
        try {
            // Use Promise.all to fetch both endpoints at the same time for speed
            const [productsResponse, categoriesResponse] = await Promise.all([
                fetch('/api/products/'),
                fetch('/api/categories/')
            ]);

            if (!productsResponse.ok || !categoriesResponse.ok) {
                throw new Error('Failed to fetch data from the server.');
            }

            allProducts = await productsResponse.json();
            const categories = await categoriesResponse.json();

            renderCategories(categories); // Build the category filter
            applyFiltersAndSort(); // Display the initial list of products

        } catch (error) {
            console.error("Error fetching initial data:", error);
            productList.innerHTML = '<p class="no-results">Could not load products.</p>';
            categoryList.innerHTML = '<li>Could not load categories.</li>';
        }
    }

    /**
     * Renders the category filter list dynamically based on data from the API.
     * @param {Array} categories - The array of category objects.
     */
    function renderCategories(categories) {
        categoryList.innerHTML = ''; // Clear the "Loading..." message
        categories.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `
                <label>
                    <input type="checkbox" class="category-checkbox" data-category="${category.name}">
                    ${category.name}
                </label>
            `;
            categoryList.appendChild(li);
        });
        // We must add event listeners *after* the checkboxes have been created
        document.querySelectorAll('.category-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleCategoryChange);
        });
    }

    /**
     * This is the main function that filters and sorts the products based on user selections.
     */
    function applyFiltersAndSort() {
        let filteredProducts = [...allProducts];

        // 1. Apply category filter
        if (filters.categories.length > 0) {
            filteredProducts = filteredProducts.filter(product => 
                filters.categories.includes(product.category_name)
            );
        }

        // 2. Apply price filter
        filteredProducts = filteredProducts.filter(product => 
            parseFloat(product.price) <= filters.maxPrice
        );

        // 3. Apply sorting
        const sortValue = filters.sortBy;
        filteredProducts.sort((a, b) => {
            const priceA = parseFloat(a.price);
            const priceB = parseFloat(b.price);
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            if (sortValue === 'price-asc') return priceA - priceB;
            if (sortValue === 'price-desc') return priceB - priceA;
            if (sortValue === 'name-asc') return nameA.localeCompare(nameB);
            if (sortValue === 'name-desc') return nameB.localeCompare(nameA);
            return 0; // Default (no sort)
        });

        renderProducts(filteredProducts);
    }

    /**
     * Renders the product cards in the grid.
     * @param {Array} products - The array of products to display.
     */
    function renderProducts(products) {
        productList.innerHTML = ''; // Clear previous products

        if (products.length === 0) {
            productList.innerHTML = '<p class="no-results">No products match your criteria.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = product.id;
            card.dataset.name = product.name;
            card.dataset.price = product.price;
            
            const imageUrl = product.image ? `/static${product.image.replace(/\\/g, '/')}` : 'https://placehold.co/400x400/E8E8E8/4A4A4A?text=No+Image';

            card.innerHTML = `
                <a href="/product/${product.id}/">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${product.name}">
                    </div>
                </a>
                <div class="product-info">
                    <a href="/product/${product.id}/"><h3>${product.name}</h3></a>
                    <p class="price">$${parseFloat(product.price).toFixed(2)}</p>
                    <div class="product-buttons">
                        <button class="btn btn-primary js-add-to-cart">Add to Cart</button>
                        <button class="btn btn-secondary js-remove-from-cart">Remove</button>
                    </div>
                    <span class="product-cart-quantity" data-product-id="${product.id}">0</span>
                </div>
            `;
            productList.appendChild(card);
        });
        
        // After rendering products, update the cart quantity display
        if (window.EcommStore && typeof window.EcommStore.updateAllCartDisplays === 'function') {
            window.EcommStore.updateAllCartDisplays();
        }
    }

    // --- EVENT HANDLER FUNCTIONS ---
    function handleCategoryChange() {
        filters.categories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
            .map(checkbox => checkbox.dataset.category);
        applyFiltersAndSort();
    }

    function handlePriceChange() {
        filters.maxPrice = parseFloat(priceSlider.value);
        priceValue.textContent = `$${filters.maxPrice.toFixed(2)}`;
        applyFiltersAndSort();
    }

    function handleSortChange() {
        filters.sortBy = sortBySelect.value;
        applyFiltersAndSort();
    }

    // --- INITIALIZATION ---
    priceSlider.addEventListener('input', handlePriceChange);
    sortBySelect.addEventListener('change', handleSortChange);
    priceValue.textContent = `$${parseFloat(priceSlider.value).toFixed(2)}`;
    
    // Start the process by fetching all necessary data
    fetchInitialData();
});

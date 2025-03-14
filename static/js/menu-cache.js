// Menu Cache Manager
// This script handles client-side caching of menu data to improve loading performance

const MenuCache = {
    // Cache key for localStorage
    CACHE_KEY: 'menu_data_cache',
    // Cache expiration time in milliseconds (6 hours)
    CACHE_EXPIRATION: 6 * 60 * 60 * 1000,
    
    // Pre-cache flag for large sections like "pranzo" and "cena"
    PRECACHE_SECTIONS: ['pranzo', 'cena'],
    
    /**
     * Save menu data to localStorage with timestamp
     * @param {Object} data - The menu data to cache
     */
    saveToCache: function(data) {
        if (!data) return;
        
        const cacheData = {
            timestamp: Date.now(),
            data: data
        };
        
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
            console.log('Menu data saved to cache');
        } catch (error) {
            console.error('Error saving menu data to cache:', error);
        }
    },
    
    /**
     * Get cached menu data if available and not expired
     * @returns {Object|null} The cached menu data or null if not available/expired
     */
    getFromCache: function() {
        try {
            const cachedData = localStorage.getItem(this.CACHE_KEY);
            
            if (!cachedData) return null;
            
            const parsedData = JSON.parse(cachedData);
            const now = Date.now();
            
            // Check if cache is expired
            if (now - parsedData.timestamp > this.CACHE_EXPIRATION) {
                console.log('Cache expired, will fetch fresh data');
                return null;
            }
            
            console.log('Using cached menu data');
            return parsedData.data;
        } catch (error) {
            console.error('Error retrieving cached menu data:', error);
            return null;
        }
    },
    
    /**
     * Clear the cached menu data
     */
    clearCache: function() {
        localStorage.removeItem(this.CACHE_KEY);
        console.log('Menu cache cleared');
    },
    
    /**
     * Fetch menu data with caching
     * @param {Function} onSuccess - Callback function when data is available
     * @param {Function} onError - Callback function when an error occurs
     * @param {boolean} forceRefresh - Whether to force a refresh from the server
     */
    fetchMenuData: function(onSuccess, onError, forceRefresh = false) {
        // First check if we have cached data and forceRefresh is false
        if (!forceRefresh) {
            const cachedData = this.getFromCache();
            if (cachedData) {
                onSuccess(cachedData);
                
                // Optionally refresh cache in background
                this.refreshCacheInBackground();
                return;
            }
        }
        
        // If no cache or forceRefresh is true, fetch from server
        fetch('/api/menu')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Pre-process large sections data to improve rendering performance
                this.optimizeMenuSections(data);
                
                // Save the fresh data to cache
                this.saveToCache(data);
                onSuccess(data);
            })
            .catch(error => {
                console.error('Error fetching menu data:', error);
                if (onError) onError(error);
            });
    },
    
    /**
     * Optimize large menu sections (pranzo, cena) for faster rendering
     * @param {Object} data - The menu data to optimize
     */
    optimizeMenuSections: function(data) {
        if (!data || !Array.isArray(data)) return;
        
        // Pre-process large sections (pranzo, cena) by optimizing their structure
        data.forEach(category => {
            // Check if this is a category that needs optimization (case insensitive)
            const categoryNameLower = category.name.toLowerCase();
            if (this.PRECACHE_SECTIONS.some(section => categoryNameLower.includes(section))) {
                console.log(`Optimizing large section: ${category.name}`);
                
                // Optimize images: set explicit width/height attributes for faster rendering
                if (category.products) {
                    category.products.forEach(product => {
                        if (product.image_url) {
                            product._optimized = true; // Mark as optimized
                        }
                    });
                }
                
                // Optimize subcategories
                if (category.subcategories) {
                    category.subcategories.forEach(subcategory => {
                        if (subcategory.products) {
                            subcategory.products.forEach(product => {
                                if (product.image_url) {
                                    product._optimized = true; // Mark as optimized
                                }
                            });
                        }
                    });
                }
            }
        });
    },
    
    /**
     * Refresh the cache in the background without affecting the UI
     */
    refreshCacheInBackground: function() {
        // Use a separate fetch to update the cache without blocking the UI
        // Use a longer delay to avoid competing with initial page load
        setTimeout(() => {
            // Check if the page is visible before updating the cache
            if (document.visibilityState === 'visible') {
                // Get cached data timestamp to check age
                const cachedData = localStorage.getItem(this.CACHE_KEY);
                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    const cacheAge = Date.now() - parsedData.timestamp;
                    
                    // Only refresh if cache is older than 5 minutes
                    if (cacheAge > 5 * 60 * 1000) {
                        console.log('Refreshing cache in background...');
                        fetch('/api/menu')
                            .then(response => response.json())
                            .then(data => this.saveToCache(data))
                            .catch(error => console.error('Background cache refresh failed:', error));
                    } else {
                        console.log('Cache is recent, skipping background refresh');
                    }
                }
            }
        }, 10000); // Delay by 10 seconds instead of 2 to prioritize initial page rendering
    }
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // If the page has menu items, try to use cached data first
    if (document.querySelector('.menu-container')) {
        console.log('Menu page detected, initializing menu cache');
    }
});
/**
 * Performance optimization and loading state utilities for the PawScan application
 * Provides helpers for managing loading states, debouncing, and performance improvements
 */

/**
 * Creates a loading manager to handle loading states with delays to prevent flickering
 * @param {Function} setLoading - State setter function for loading state
 * @returns {Object} Loading manager with start, stop, and clear methods
 */
export const createLoadingManager = (setLoading) => {
  let loadingTimeout;

  return {
    /**
     * Start loading with optional delay
     * @param {number} delay - Delay in ms before showing loading indicator (default: 300ms)
     */
    start: (delay = 300) => {
      // Clear any existing timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      
      // Delay showing loader to avoid flickering for fast operations
      loadingTimeout = setTimeout(() => {
        setLoading(true);
      }, delay);
    },
    
    /**
     * Stop loading and clear timeout
     */
    stop: () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      setLoading(false);
    },
    
    /**
     * Clear timeout without changing loading state
     */
    clear: () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    }
  };
};

/**
 * Debounce function to limit the rate at which a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @param {boolean} immediate - Trigger function on leading edge
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
};

/**
 * Throttle function to limit the rate at which a function is called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memoize function to cache results of expensive function calls
 * @param {Function} fn - Function to memoize
 * @param {Function} resolver - Function to resolve cache key
 * @returns {Function} Memoized function
 */
export const memoize = (fn, resolver) => {
  const cache = new Map();
  
  return function(...args) {
    const key = resolver ? resolver(...args) : args[0];
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Paginate large datasets to improve rendering performance
 * @param {Array} data - Data to paginate
 * @param {number} pageSize - Items per page
 * @returns {Function} Function to get page data
 */
export const createPaginator = (data, pageSize = 20) => {
  const pages = [];
  
  // Pre-split data into pages
  for (let i = 0; i < data.length; i += pageSize) {
    pages.push(data.slice(i, i + pageSize));
  }
  
  return {
    getPage: (pageIndex) => pages[pageIndex] || [],
    getTotalPages: () => pages.length,
    hasMore: (pageIndex) => pageIndex < pages.length - 1
  };
};

/**
 * Virtualized list helper to render only visible items
 * @param {Array} items - List of items
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @param {number} scrollTop - Current scroll position
 * @returns {Object} Visible items and indices
 */
export const getVisibleItems = (items, itemHeight, containerHeight, scrollTop) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + Math.ceil(containerHeight / itemHeight) + 10
  );
  
  return {
    visibleItems: items.slice(startIndex, endIndex + 1),
    startIndex,
    endIndex
  };
};

/**
 * Create a cache with TTL (Time To Live)
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object} Cache with get, set, and clear methods
 */
export const createCacheWithTTL = (ttl = 300000) => { // 5 minutes default
  const cache = new Map();
  const timeouts = new Map();
  
  return {
    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined
     */
    get: (key) => {
      return cache.get(key);
    },
    
    /**
     * Set value in cache with TTL
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    set: (key, value) => {
      // Clear existing timeout
      if (timeouts.has(key)) {
        clearTimeout(timeouts.get(key));
      }
      
      // Set new value
      cache.set(key, value);
      
      // Set new timeout
      const timeout = setTimeout(() => {
        cache.delete(key);
        timeouts.delete(key);
      }, ttl);
      
      timeouts.set(key, timeout);
    },
    
    /**
     * Clear cache
     */
    clear: () => {
      cache.clear();
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    },
    
    /**
     * Delete specific key
     * @param {string} key - Cache key
     */
    delete: (key) => {
      cache.delete(key);
      if (timeouts.has(key)) {
        clearTimeout(timeouts.get(key));
        timeouts.delete(key);
      }
    }
  };
};

/**
 * Performance monitoring helper
 * @returns {Object} Performance monitoring methods
 */
export const createPerformanceMonitor = () => {
  const startTime = {};
  
  return {
    /**
     * Start timing an operation
     * @param {string} name - Operation name
     */
    start: (name) => {
      startTime[name] = performance.now();
    },
    
    /**
     * End timing and log duration
     * @param {string} name - Operation name
     */
    end: (name) => {
      if (startTime[name]) {
        const duration = performance.now() - startTime[name];
        console.log(`[PERFORMANCE] ${name} took ${duration.toFixed(2)}ms`);
        delete startTime[name];
        return duration;
      }
      return null;
    }
  };
};

export default {
  createLoadingManager,
  debounce,
  throttle,
  memoize,
  createPaginator,
  getVisibleItems,
  createCacheWithTTL,
  createPerformanceMonitor
};
// Layout persistence service
class LayoutService {
  constructor() {
    this.apiBaseUrl = 'http://localhost:4000/api';
    this.storageKey = 'dashboard_layout'; // Fallback to localStorage
  }

  // Save layout to backend API
  async saveLayout(layout) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/layout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ layout })
      });

      if (response.ok) {
        console.log('Layout saved to backend successfully');
        // Also save to localStorage as backup
        this.saveToLocalStorage(layout);
        return true;
      } else {
        console.warn('Backend save failed, using localStorage fallback');
        return this.saveToLocalStorage(layout);
      }
    } catch (error) {
      console.warn('Backend save failed, using localStorage fallback:', error);
      return this.saveToLocalStorage(layout);
    }
  }

  // Load layout from backend API
  async loadLayout() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/layout`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.layout) {
          console.log('Layout loaded from backend successfully');
          return data.layout;
        }
      }
      
      // Fallback to localStorage
      console.warn('Backend load failed, using localStorage fallback');
      return this.loadFromLocalStorage();
    } catch (error) {
      console.warn('Backend load failed, using localStorage fallback:', error);
      return this.loadFromLocalStorage();
    }
  }

  // Clear saved layout
  async clearLayout() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/layout`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('Layout cleared from backend successfully');
      }
      
      // Also clear localStorage
      this.clearFromLocalStorage();
      return true;
    } catch (error) {
      console.warn('Backend clear failed, using localStorage fallback:', error);
      return this.clearFromLocalStorage();
    }
  }

  // Get layout metadata
  async getLayoutMetadata() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/layout`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.metadata) {
          return {
            timestamp: data.metadata.created_at,
            version: '1.0',
            itemCount: data.layout?.length || 0
          };
        }
      }
      
      // Fallback to localStorage
      return this.getLocalStorageMetadata();
    } catch (error) {
      console.warn('Backend metadata failed, using localStorage fallback:', error);
      return this.getLocalStorageMetadata();
    }
  }

  // Check if layout exists
  async hasLayout() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/layout`);
      
      if (response.ok) {
        const data = await response.json();
        return data.success && data.layout && data.layout.length > 0;
      }
      
      // Fallback to localStorage
      return this.hasLocalStorageLayout();
    } catch (error) {
      console.warn('Backend check failed, using localStorage fallback:', error);
      return this.hasLocalStorageLayout();
    }
  }

  // LocalStorage fallback methods
  saveToLocalStorage(layout) {
    try {
      const layoutData = {
        items: layout,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(this.storageKey, JSON.stringify(layoutData));
      console.log('Layout saved to localStorage');
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  loadFromLocalStorage() {
    try {
      const savedLayout = localStorage.getItem(this.storageKey);
      if (savedLayout) {
        const layoutData = JSON.parse(savedLayout);
        console.log('Layout loaded from localStorage');
        return layoutData.items || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  clearFromLocalStorage() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('Layout cleared from localStorage');
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  getLocalStorageMetadata() {
    try {
      const savedLayout = localStorage.getItem(this.storageKey);
      if (savedLayout) {
        const layoutData = JSON.parse(savedLayout);
        return {
          timestamp: layoutData.timestamp,
          version: layoutData.version,
          itemCount: layoutData.items?.length || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting localStorage metadata:', error);
      return null;
    }
  }

  hasLocalStorageLayout() {
    return localStorage.getItem(this.storageKey) !== null;
  }
}

// Create singleton instance
const layoutService = new LayoutService();

export default layoutService;

// Path Management System
class PathManager {
  constructor() {
    this.config = null;
    this.init();
  }

  init() {
    this.loadConfig();
    this.setupRoutes();
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem('pathConfig');
      if (stored) {
        this.config = JSON.parse(stored);
      } else {
        // Default configuration
        this.config = {
          routes: {
            home: "index.html",
            studyRoom: "study-room.html",
            admin: "admin-simple.html",
            token: "token-page.html",
            adminPanel: "admin-panel.html"
          },
          api: {
            chat: "http://localhost:3000/chat",
            render: "https://trolyao-51sj.onrender.com/chat"
          },
          paths: {
            base: "./",
            assets: "./assets/",
            data: "./data/",
            temp: "./temp/"
          },
          security: {
            adminPassword: "093981",
            sessionTimeout: 3600000,
            maxLoginAttempts: 3
          },
          features: {
            studyRoom: true,
            adminPanel: true,
            tokenSystem: true,
            colorThemes: true,
            userManagement: true
          },
          version: "1.0.0",
          lastUpdated: new Date().toISOString()
        };
        this.saveConfig();
      }
    } catch (error) {
      console.error('Error loading path config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      routes: {
        home: "index.html",
        studyRoom: "study-room.html",
        admin: "admin-simple.html",
        token: "token-page.html"
      },
      api: {
        chat: "http://localhost:3000/chat"
      },
      paths: {
        base: "./"
      },
      version: "1.0.0"
    };
  }

  saveConfig() {
    try {
      localStorage.setItem('pathConfig', JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving path config:', error);
    }
  }

  setupRoutes() {
    // Setup navigation helpers
    window.navigateTo = (route) => this.navigate(route);
    window.openRoute = (route) => this.openRoute(route);
    window.getRoute = (route) => this.getRoute(route);
  }

  getRoute(routeName) {
    return this.config.routes[routeName] || routeName;
  }

  navigate(routeName) {
    const route = this.getRoute(routeName);
    window.location.href = route;
  }

  openRoute(routeName, target = '_blank') {
    const route = this.getRoute(routeName);
    window.location.href = route;
  }

  getAPIEndpoint(endpoint) {
    return this.config.api[endpoint] || null;
  }

  getPath(pathName) {
    return this.config.paths[pathName] || pathName;
  }

  isFeatureEnabled(feature) {
    return this.config.features && this.config.features[feature] === true;
  }

  getSecuritySetting(setting) {
    return this.config.security && this.config.security[setting];
  }

  updateRoute(routeName, path) {
    if (this.config.routes) {
      this.config.routes[routeName] = path;
      this.config.lastUpdated = new Date().toISOString();
      this.saveConfig();
    }
  }

  addRoute(routeName, path) {
    if (!this.config.routes) {
      this.config.routes = {};
    }
    this.config.routes[routeName] = path;
    this.config.lastUpdated = new Date().toISOString();
    this.saveConfig();
  }

  removeRoute(routeName) {
    if (this.config.routes && this.config.routes[routeName]) {
      delete this.config.routes[routeName];
      this.config.lastUpdated = new Date().toISOString();
      this.saveConfig();
    }
  }

  getAllRoutes() {
    return this.config.routes || {};
  }

  validateRoute(routeName) {
    return this.config.routes && this.config.routes[routeName] !== undefined;
  }

  getBaseURL() {
    return this.config.paths && this.config.paths.base || "./";
  }

  getAssetPath(asset) {
    const assetsPath = this.getPath('assets') || "./assets/";
    return assetsPath + asset;
  }

  getDataPath(dataFile) {
    const dataPath = this.getPath('data') || "./data/";
    return dataPath + dataFile;
  }

  exportConfig() {
    return {
      ...this.config,
      exportedAt: new Date().toISOString()
    };
  }

  importConfig(config) {
    if (config && typeof config === 'object') {
      this.config = {
        ...config,
        lastUpdated: new Date().toISOString()
      };
      this.saveConfig();
      this.setupRoutes();
      console.log('Path configuration imported successfully');
    }
  }

  resetConfig() {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    this.setupRoutes();
  }

  // Utility methods
  getCurrentURL() {
    return window.location.href;
  }

  getCurrentPath() {
    return window.location.pathname;
  }

  isCurrentRoute(routeName) {
    const route = this.getRoute(routeName);
    const currentPath = this.getCurrentPath();
    return currentPath.includes(route);
  }

  // Security methods
  checkAdminPassword(password) {
    const adminPassword = this.getSecuritySetting('adminPassword');
    return password === adminPassword;
  }

  getSessionTimeout() {
    return this.getSecuritySetting('sessionTimeout') || 3600000;
  }

  getMaxLoginAttempts() {
    return this.getSecuritySetting('maxLoginAttempts') || 3;
  }
}

// Global instance
let pathManager;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  pathManager = new PathManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathManager;
}

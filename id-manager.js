// User ID Management System
class IDManager {
  constructor() {
    this.idFile = 'user-id.json';
    this.init();
  }

  init() {
    this.loadIDFile();
    this.setupEventListeners();
  }

  loadIDFile() {
    try {
      const stored = localStorage.getItem('userIDData');
      if (stored) {
        this.userData = JSON.parse(stored);
      } else {
        this.userData = {
          users: {},
          lastUpdated: new Date().toISOString(),
          version: "1.0",
          description: "User ID management system for chatbot application"
        };
        this.saveIDFile();
      }
    } catch (error) {
      console.error('Error loading user ID data:', error);
      this.userData = { users: {}, lastUpdated: new Date().toISOString() };
    }
  }

  saveIDFile() {
    try {
      localStorage.setItem('userIDData', JSON.stringify(this.userData, null, 2));
    } catch (error) {
      console.error('Error saving user ID data:', error);
    }
  }

  generateUserID(username) {
    // Generate unique ID based on username and timestamp
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ID_${username}_${timestamp}_${random}`;
  }

  assignUserID(username) {
    if (!this.userData.users[username]) {
      this.userData.users[username] = {
        id: this.generateUserID(username),
        username: username,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        status: 'active'
      };
      this.userData.lastUpdated = new Date().toISOString();
      this.saveIDFile();
      console.log(`Assigned ID to user: ${username}`);
    }
    return this.userData.users[username];
  }

  getUserID(username) {
    if (this.userData.users[username]) {
      // Update last active time
      this.userData.users[username].lastActive = new Date().toISOString();
      this.saveIDFile();
      return this.userData.users[username];
    }
    return null;
  }

  getAllUsers() {
    return Object.keys(this.userData.users).map(username => ({
      ...this.userData.users[username],
      username
    }));
  }

  updateUserStatus(username, status) {
    if (this.userData.users[username]) {
      this.userData.users[username].status = status;
      this.userData.users[username].lastActive = new Date().toISOString();
      this.saveIDFile();
    }
  }

  deleteUser(username) {
    if (this.userData.users[username]) {
      delete this.userData.users[username];
      this.userData.lastUpdated = new Date().toISOString();
      this.saveIDFile();
      console.log(`Deleted user: ${username}`);
    }
  }

  getActiveUsers() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    return this.getAllUsers().filter(user => 
      new Date(user.lastActive) > fiveMinutesAgo
    );
  }

  setupEventListeners() {
    // Auto-cleanup inactive users
    setInterval(() => {
      this.cleanupInactiveUsers();
    }, 60000); // Check every minute
  }

  cleanupInactiveUsers() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    let cleaned = 0;
    
    Object.keys(this.userData.users).forEach(username => {
      const user = this.userData.users[username];
      if (new Date(user.lastActive) < oneHourAgo && user.status !== 'banned') {
        delete this.userData.users[username];
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      this.userData.lastUpdated = new Date().toISOString();
      this.saveIDFile();
      console.log(`Cleaned up ${cleaned} inactive users`);
    }
  }

  exportData() {
    return {
      ...this.userData,
      exportedAt: new Date().toISOString()
    };
  }

  importData(data) {
    if (data && data.users) {
      this.userData = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      this.saveIDFile();
      console.log('Imported user ID data successfully');
    }
  }
}

// Global instance
let idManager;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  idManager = new IDManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IDManager;
}

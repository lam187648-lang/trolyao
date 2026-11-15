// Device Manager - Tạo ID duy nhất cho mỗi thiết bị
class DeviceManager {
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  // Tạo device ID từ browser fingerprint + random
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
      // Tạo fingerprint từ thông tin browser
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.platform,
        Math.random().toString(36).substring(2, 15)
      ].join('|');
      
      // Hash fingerprint thành ID ngắn
      deviceId = this.hashString(fingerprint).substring(0, 16);
      localStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  // Simple hash function
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Lấy key có prefix device ID
  getDeviceKey(key) {
    return `${this.deviceId}_${key}`;
  }

  // Lưu dữ liệu theo thiết bị
  setDeviceItem(key, value) {
    const deviceKey = this.getDeviceKey(key);
    localStorage.setItem(deviceKey, value);
  }

  // Đọc dữ liệu theo thiết bị
  getDeviceItem(key) {
    const deviceKey = this.getDeviceKey(key);
    return localStorage.getItem(deviceKey);
  }

  // Lưu object theo thiết bị
  setDeviceObject(key, obj) {
    this.setDeviceItem(key, JSON.stringify(obj));
  }

  // Đọc object theo thiết bị
  getDeviceObject(key, defaultValue = null) {
    const data = this.getDeviceItem(key);
    if (!data) return defaultValue;
    try {
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  // Xóa dữ liệu thiết bị
  clearDeviceData() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.deviceId + '_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Lấy thông tin thiết bị
  getDeviceInfo() {
    return {
      deviceId: this.deviceId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  }
}

// Singleton instance
const deviceManager = new DeviceManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DeviceManager, deviceManager };
}

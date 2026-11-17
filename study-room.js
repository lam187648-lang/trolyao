// Study Room Management System with Realtime Synchronization & Distinct Themes
class StudyRoom {
  constructor() {
    this.users = new Map(); // username -> user data
    this.studyTimer = null;
    this.totalStudyTime = 0;
    this.sessionStartTime = null;
    this.maxUsers = 50;
    this.gridSlots = [];
    this.socket = null;
    this.channel = null;
    
    this.init();
  }

  init() {
    // Check authentication first
    if (!this.checkAuthentication()) {
      this.redirectToLogin();
      return;
    }
    
    this.loadFromLocalStorage();
    this.setupEventListeners();
    this.initBroadcastChannel();
    this.initSocket();
    this.renderGrid();
    this.startHeartbeat();
    this.updateStats();
    
    // Auto-join current authenticated user
    if (this.currentUser) {
      this.joinStudyRoom(this.currentUser);
    }
  }

  getCurrentUser() {
    return localStorage.getItem('currentUser');
  }

  checkAuthentication() {
    const currentUser = this.getCurrentUser();
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    return Boolean(currentUser && users[currentUser]);
  }

  redirectToLogin() {
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%); font-family: Inter, sans-serif;">
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
          <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
          <h2 style="color: #1e40af; margin-bottom: 16px;">Yêu Cầu Đăng Nhập</h2>
          <p style="color: #64748b; margin-bottom: 24px;">Bạn cần đăng nhập tài khoản để tham gia phòng học trực tuyến!</p>
          <button onclick="window.location.href='login.html'" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    `;
  }

  getThemeStyle(themeId) {
    const themes = {
      "1": { bg: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "#3b82f6", text: "#1e40af" },
      "2": { bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "#10b981", text: "#065f46" },
      "3": { bg: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "#8b5cf6", text: "#5b21b6" },
      "4": { bg: "linear-gradient(135deg, #fdf2f8, #fce7f3)", border: "#ec4899", text: "#9d174d" },
      "5": { bg: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "#f59e0b", text: "#92400e" },
      "6": { bg: "linear-gradient(135deg, #fff7ed, #ffedd5)", border: "#f97316", text: "#9a3412" },
      "7": { bg: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "#ef4444", text: "#991b1b" },
      "8": { bg: "linear-gradient(135deg, #f9fafb, #f3f4f6)", border: "#6b7280", text: "#374151" },
      "9": { bg: "linear-gradient(135deg, #f0fdfa, #ccfbf1)", border: "#14b8a6", text: "#115e59" },
      "10": { bg: "linear-gradient(135deg, #eef2ff, #e0e7ff)", border: "#6366f1", text: "#3730a3" },
      "11": { bg: "linear-gradient(135deg, #faf5ff, #f3e8ff)", border: "#a855f7", text: "#6b21a8" },
      "12": { bg: "linear-gradient(135deg, #fdf4ff, #fae8ff)", border: "#f472b6", text: "#86198f" },
      "13": { bg: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "#92400e", text: "#78350f" },
      "14": { bg: "linear-gradient(135deg, #1e3a8a, #172554)", border: "#60a5fa", text: "#ffffff" },
      "15": { bg: "linear-gradient(135deg, #1f2937, #111827)", border: "#9ca3af", text: "#ffffff" },
      "16": { bg: "linear-gradient(135deg, #f8fafc, #e2e8f0)", border: "#94a3b8", text: "#334155" },
      "17": { bg: "linear-gradient(135deg, #fef9c3, #fde047)", border: "#eab308", text: "#854d0e" },
      "18": { bg: "linear-gradient(135deg, #f1f5f9, #cbd5e1)", border: "#94a3b8", text: "#334155" },
      "19": { bg: "linear-gradient(135deg, #ffedd5, #fdba74)", border: "#ea580c", text: "#7c2d12" },
      "20": { bg: "linear-gradient(135deg, #ffe4e6, #fef08a, #ccfbf1)", border: "#f43f5e", text: "#881337" },
      "25": { bg: "linear-gradient(135deg, #fae8ff, #cffafe)", border: "#d946ef", text: "#701a75" },
      "26": { bg: "linear-gradient(90deg, #fecdd3, #fed7aa, #fef08a, #bbf7d0, #bfdbfe, #e9d5ff)", border: "#ef4444", text: "#1f2937" },
      "27": { bg: "radial-gradient(ellipse at center, #312e81, #0f172a)", border: "#818cf8", text: "#ffffff" },
      "28": { bg: "linear-gradient(135deg, #064e3b, #831843)", border: "#34d399", text: "#ffffff" },
      "29": { bg: "linear-gradient(180deg, #7c2d12, #b45309)", border: "#fb923c", text: "#ffffff" },
      "30": { bg: "linear-gradient(135deg, #18181b, #831843)", border: "#facc15", text: "#ffffff" },
      "31": { bg: "linear-gradient(135deg, #cffafe, #e0f2fe, #ffffff)", border: "#06b6d4", text: "#164e63" },
      "32": { bg: "linear-gradient(145deg, #f3e8ff, #c084fc, #581c87)", border: "#a855f7", text: "#ffffff" },
      "33": { bg: "linear-gradient(180deg, #fef08a, #fb923c, #ef4444)", border: "#ea580c", text: "#ffffff" },
      "34": { bg: "linear-gradient(135deg, #e0f2fe, #38bdf8, #0284c7)", border: "#0ea5e9", text: "#ffffff" },
      "35": { bg: "linear-gradient(180deg, #0284c7, #0369a1, #0c4a6e)", border: "#38bdf8", text: "#ffffff" },
      "36": { bg: "linear-gradient(180deg, #fef08a, #ea580c, #7f1d1d)", border: "#f97316", text: "#ffffff" },
      "37": { bg: "linear-gradient(135deg, #fdf2f8, #f472b6, #db2777)", border: "#ec4899", text: "#831843" },
      "38": { bg: "linear-gradient(145deg, #dcfce7, #4ade80, #15803d)", border: "#22c55e", text: "#ffffff" },
      "39": { bg: "radial-gradient(ellipse at center, #1e1b4b, #0f172a)", border: "#fbbf24", text: "#ffffff" },
      "40": { bg: "linear-gradient(180deg, #1e1b4b, #020617)", border: "#6366f1", text: "#ffffff" },
      "41": { bg: "linear-gradient(145deg, #fef9c3, #eab308, #713f12)", border: "#d97706", text: "#ffffff" },
      "42": { bg: "conic-gradient(from 0deg, #f43f5e, #fbbf24, #22c55e, #38bdf8, #f43f5e)", border: "#a855f7", text: "#ffffff" }
    };
    return themes[String(themeId)] || themes["1"];
  }

  loadFromLocalStorage() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const userData = users[currentUser] || {};
      const chosenTheme = userData.selectedColorTheme || localStorage.getItem('selectedColorTheme') || '1';

      this.currentUser = {
        id: 'user_' + currentUser,
        name: currentUser,
        avatar: userData.avatar || this.generateAvatar(currentUser),
        selectedColorTheme: String(chosenTheme),
        joinTime: Date.now(),
        lastSeen: Date.now(),
        studyTime: 0,
        status: 'studying'
      };
    }
    
    const savedUsers = localStorage.getItem('studyRoomUsers');
    if (savedUsers) {
      try {
        const usersData = JSON.parse(savedUsers);
        if (Array.isArray(usersData)) {
          const now = Date.now();
          usersData.forEach(u => {
            if (u && u.name && now - (u.lastSeen || 0) < 5 * 60 * 1000) {
              this.users.set(u.name, u);
            }
          });
        }
      } catch (e) {
        console.error('Error loading studyRoomUsers:', e);
      }
    }
    
    const savedStudyTime = localStorage.getItem('totalStudyTime');
    if (savedStudyTime) {
      this.totalStudyTime = parseInt(savedStudyTime, 10) || 0;
    }
  }

  saveToLocalStorage() {
    if (this.currentUser) {
      localStorage.setItem('studyRoomUser', JSON.stringify(this.currentUser));
    }
    const usersArray = Array.from(this.users.values());
    localStorage.setItem('studyRoomUsers', JSON.stringify(usersArray));
    localStorage.setItem('totalStudyTime', this.totalStudyTime.toString());
  }

  initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('study_room_channel');
        this.channel.onmessage = (event) => {
          const data = event.data;
          if (data && data.type === 'users_sync' && Array.isArray(data.users)) {
            data.users.forEach(u => {
              if (u && u.name) {
                this.users.set(u.name, u);
              }
            });
            this.renderGrid();
          } else if (data && data.type === 'user_left' && data.username) {
            this.users.delete(data.username);
            this.renderGrid();
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
  }

  initSocket() {
    if (typeof io === 'undefined') {
      console.warn('Socket.IO client not loaded, falling back to local channel.');
      return;
    }

    try {
      const serverUrl = window.AuthApi?.serverUrl || 'http://localhost:4000';
      this.socket = io(serverUrl, {
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to Study Room socket server:', this.socket.id);
        if (this.currentUser) {
          this.socket.emit('join', {
            username: this.currentUser.name,
            avatar: this.currentUser.avatar,
            selectedColorTheme: this.currentUser.selectedColorTheme,
            studyTime: this.currentUser.studyTime
          });
        }
      });

      const handleRemoteUsers = (serverUsers) => {
        if (!Array.isArray(serverUsers)) return;
        const now = Date.now();
        // Update user map
        this.users.clear();
        serverUsers.forEach(u => {
          if (!u || !u.username) return;
          this.users.set(u.username, {
            id: u.id || ('user_' + u.username),
            name: u.username,
            avatar: u.avatar || this.generateAvatar(u.username),
            selectedColorTheme: String(u.selectedColorTheme || '1'),
            joinTime: u.joinTime || now,
            lastSeen: now,
            studyTime: Number(u.studyTime) || 0,
            status: 'studying'
          });
        });
        // Make sure current user is always present
        if (this.currentUser) {
          this.users.set(this.currentUser.name, this.currentUser);
        }
        this.renderGrid();
        this.saveToLocalStorage();
      };

      this.socket.on('users', handleRemoteUsers);
      this.socket.on('study-room:users', handleRemoteUsers);

      this.socket.on('user:kicked', (data) => {
        if (data?.username === this.currentUser?.name) {
          this.showMessage('Bạn đã bị quản trị viên thu hồi phiên đăng nhập!', 'error');
          setTimeout(() => {
            window.location.href = 'kick.html?kicked=1';
          }, 600);
        }
      });

      this.socket.on('user:banned', (data) => {
        if (data?.username === this.currentUser?.name) {
          this.showMessage('Tài khoản của bạn đã bị khóa bởi quản trị viên!', 'error');
          setTimeout(() => {
            window.location.href = 'kick.html?banned=1';
          }, 600);
        }
      });
    } catch (e) {
      console.warn('Socket initialization failed:', e);
    }
  }

  broadcastPresence() {
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'users_sync',
          users: Array.from(this.users.values())
        });
      } catch (e) {}
    }
  }

  setupEventListeners() {
    this.displayUserInfo();

    const joinBtn = document.getElementById('join-room-btn');
    if (joinBtn) {
      joinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleJoin();
      });
    }

    // Avatar preview and upload
    const avatarInput = document.getElementById('avatar-input');
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    if (uploadAvatarBtn && avatarInput) {
      uploadAvatarBtn.addEventListener('click', () => avatarInput.click());
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          this.showMessage('Ảnh quá lớn (tối đa 2MB)!', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          const previewImg = document.getElementById('preview-img');
          const placeholder = document.querySelector('.avatar-placeholder');
          if (previewImg) {
            previewImg.src = dataUrl;
            previewImg.style.display = 'block';
          }
          if (placeholder) placeholder.style.display = 'none';

          if (this.currentUser) {
            this.currentUser.avatar = dataUrl;
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[this.currentUser.name]) {
              users[this.currentUser.name].avatar = dataUrl;
              localStorage.setItem('users', JSON.stringify(users));
            }
            if (this.socket && this.socket.connected) {
              this.socket.emit('study-room:update-profile', {
                avatar: dataUrl,
                selectedColorTheme: this.currentUser.selectedColorTheme
              });
            }
            this.users.set(this.currentUser.name, this.currentUser);
            this.broadcastPresence();
            this.renderGrid();
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Leave button in grid slot
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('leave-btn')) {
        this.leaveStudyRoom();
      }
    });
  }

  displayUserInfo() {
    if (!this.currentUser) return;
    const nameInput = document.getElementById('user-name-input');
    if (nameInput) {
      nameInput.value = this.currentUser.name;
    }
    const previewImg = document.getElementById('preview-img');
    const placeholder = document.querySelector('.avatar-placeholder');
    if (previewImg && this.currentUser.avatar) {
      previewImg.src = this.currentUser.avatar;
      previewImg.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }
  }

  handleJoin() {
    if (!this.currentUser) {
      this.showMessage('Bạn cần đăng nhập để tham gia phòng học!', 'error');
      this.redirectToLogin();
      return;
    }

    if (this.users.size >= this.maxUsers) {
      this.showMessage('Phòng học đã đầy! Vui lòng quay lại sau.', 'error');
      return;
    }

    this.currentUser.joinTime = Date.now();
    this.currentUser.lastSeen = Date.now();
    this.currentUser.status = 'studying';

    this.joinStudyRoom(this.currentUser);
  }

  joinStudyRoom(userData) {
    this.users.set(userData.name, userData);
    this.sessionStartTime = Date.now();
    this.startStudyTimer();
    
    // Hide join section when user is in room
    const joinSection = document.getElementById('join-section');
    if (joinSection) joinSection.style.display = 'none';
    
    if (this.socket && this.socket.connected) {
      this.socket.emit('join', {
        username: userData.name,
        avatar: userData.avatar,
        selectedColorTheme: userData.selectedColorTheme,
        studyTime: userData.studyTime
      });
    }
    
    this.broadcastPresence();
    this.renderGrid();
    this.saveToLocalStorage();
  }

  leaveStudyRoom() {
    if (!this.currentUser) return;
    
    if (this.sessionStartTime) {
      const sessionTime = Date.now() - this.sessionStartTime;
      this.currentUser.studyTime += sessionTime;
      this.totalStudyTime += Math.floor(sessionTime / 60000);
    }
    
    this.users.delete(this.currentUser.name);
    this.stopStudyTimer();
    
    const joinSection = document.getElementById('join-section');
    if (joinSection) joinSection.style.display = 'flex';
    
    if (this.socket && this.socket.connected) {
      this.socket.emit('study-room:leave');
    }
    
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'user_left', username: this.currentUser.name });
      } catch (e) {}
    }
    
    this.renderGrid();
    this.saveToLocalStorage();
    this.showMessage('Bạn đã rời khỏi phòng học!', 'info');
  }

  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  generateAvatar(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const color = colors[name.charCodeAt(0) % colors.length];
    const initial = name.charAt(0).toUpperCase();
    
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 80, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, 40, 40);
    
    return canvas.toDataURL();
  }

  renderGrid() {
    const grid = document.getElementById('study-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.gridSlots = [];
    
    const usersArray = Array.from(this.users.values());
    
    for (let i = 0; i < this.maxUsers; i++) {
      const slot = document.createElement('div');
      slot.className = 'grid-slot';
      
      const user = usersArray[i];
      if (user) {
        slot.classList.add('occupied');
        const themeStyle = this.getThemeStyle(user.selectedColorTheme || '1');
        slot.style.background = themeStyle.bg;
        slot.style.borderColor = themeStyle.border;
        slot.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.08)';

        const avatarSrc = user.avatar || this.generateAvatar(user.name);
        const elapsed = user.studyTime + (Date.now() - (user.joinTime || Date.now()));
        const isCurrent = Boolean(this.currentUser && user.name === this.currentUser.name);

        slot.innerHTML = `
          <img src="${this.escapeHtml(avatarSrc)}" alt="${this.escapeHtml(user.name)}" class="slot-avatar" style="border-color: ${themeStyle.border};">
          <div class="slot-name" style="color: ${themeStyle.text}; font-weight: 700;">${this.escapeHtml(user.name)}</div>
          <div class="slot-timer" style="color: ${themeStyle.text}; opacity: 0.9;">${this.formatTime(elapsed)}</div>
          <div class="slot-status"></div>
          ${isCurrent ? '<button class="leave-btn" title="Rời phòng học" aria-label="Rời phòng học" style="position: absolute; top: 6px; left: 6px; background: rgba(239,68,68,0.9); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; line-height: 1;">×</button>' : ''}
        `;
      } else {
        slot.classList.add('empty');
        slot.innerHTML = `
          <div class="empty-slot-icon">+</div>
          <div class="empty-slot-text">Trống</div>
        `;
      }
      
      grid.appendChild(slot);
      this.gridSlots.push(slot);
    }
    
    this.updateUserCount();
  }

  updateUserCount() {
    const currentUsersSpan = document.getElementById('current-users');
    const activeUsersSpan = document.getElementById('active-users');
    const count = this.users.size;
    if (currentUsersSpan) currentUsersSpan.textContent = count;
    if (activeUsersSpan) activeUsersSpan.textContent = count;
  }

  startStudyTimer() {
    this.stopStudyTimer();
    this.studyTimer = setInterval(() => {
      if (this.currentUser && this.sessionStartTime) {
        const elapsed = Date.now() - this.sessionStartTime;
        const timerElem = document.getElementById('study-timer');
        if (timerElem) timerElem.textContent = this.formatTime(elapsed);
        
        this.currentUser.studyTime = elapsed;
        this.users.set(this.currentUser.name, this.currentUser);
        this.updateGridTimers();
      }
    }, 1000);
  }

  stopStudyTimer() {
    if (this.studyTimer) {
      clearInterval(this.studyTimer);
      this.studyTimer = null;
    }
  }

  updateGridTimers() {
    const occupiedSlots = document.querySelectorAll('.grid-slot.occupied');
    const usersArray = Array.from(this.users.values());
    occupiedSlots.forEach((slot, index) => {
      const user = usersArray[index];
      if (user) {
        const timerElem = slot.querySelector('.slot-timer');
        if (timerElem) {
          const elapsed = user.studyTime + (Date.now() - (user.joinTime || Date.now()));
          timerElem.textContent = this.formatTime(elapsed);
        }
      }
    });
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.currentUser) {
        this.currentUser.lastSeen = Date.now();
        this.users.set(this.currentUser.name, this.currentUser);
        this.saveToLocalStorage();
        this.broadcastPresence();
      }
    }, 20000);
  }

  updateStats() {
    setInterval(() => {
      const totalElem = document.getElementById('total-study-time');
      if (totalElem) totalElem.textContent = this.totalStudyTime;
      const streakElem = document.getElementById('study-streak');
      if (streakElem) {
        streakElem.textContent = localStorage.getItem('studyStreak') || '1';
      }
    }, 1000);
  }

  formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    const icons = { error: '❌', success: '✅', info: 'ℹ️', warning: '⚠️' };
    const colors = {
      error: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', border: '#b91c1c' },
      success: { bg: 'linear-gradient(135deg, #34d399, #10b981)', border: '#059669' },
      info: { bg: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: '#3730a3' },
      warning: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '#b45309' }
    };
    const color = colors[type] || colors.info;
    const icon = icons[type] || icons.info;
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 14px 18px;
      background: ${color.bg};
      color: white;
      border: 1.5px solid ${color.border};
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    `;
    toast.innerHTML = `<span>${icon}</span><span style="flex:1;">${this.escapeHtml(message)}</span><span style="opacity:0.7;">×</span>`;
    toast.onclick = () => toast.remove();
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (!currentUser || !users[currentUser]) {
    window.location.href = 'login.html';
    return;
  }
  window.studyRoom = new StudyRoom();
});

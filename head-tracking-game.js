const mathQuestions = [
  { question: "Giải phương trình: 2x + 5 = 15", correct: "x = 5", incorrect: "x = 10" },
  { question: "Tính giá trị của √64", correct: "8", incorrect: "6" },
  { question: "Đạo hàm của f(x) = x² là gì?", correct: "2x", incorrect: "x²" },
  { question: "Tính diện tích hình vuông có cạnh bằng 5cm", correct: "25cm²", incorrect: "20cm²" },
  { question: "Giải phương trình: x² - 9 = 0", correct: "x = ±3", incorrect: "x = 3" },
  { question: "Tính chu vi hình tròn có bán kính 7cm (π ≈ 22/7)", correct: "44cm", incorrect: "42cm" },
  { question: "Tính giá trị của log₁₀(100)", correct: "2", incorrect: "1" },
  { question: "Đạo hàm của f(x) = 3x³ là gì?", correct: "9x²", incorrect: "3x²" },
  { question: "Tính thể tích hình cầu có bán kính 3cm", correct: "36π cm³", incorrect: "27π cm³" },
  { question: "Giải phương trình: 3x - 7 = 14", correct: "x = 7", incorrect: "x = 5" },
  { question: "Tính giá trị của sin(90°)", correct: "1", incorrect: "0" },
  { question: "Tính giá trị của cos(0°)", correct: "1", incorrect: "0" },
  { question: "Đạo hàm của f(x) = sin(x) là gì?", correct: "cos(x)", incorrect: "-cos(x)" },
  { question: "Tính diện tích tam giác vuông có cạnh góc vuông 6cm và 8cm", correct: "24cm²", incorrect: "48cm²" },
  { question: "Giải phương trình: x/2 + 3 = 7", correct: "x = 8", incorrect: "x = 4" },
  { question: "Tính giá trị của 2⁵", correct: "32", incorrect: "16" },
  { question: "Tính giá trị của log₂(8)", correct: "3", incorrect: "4" },
  { question: "Đạo hàm của f(x) = eˣ là gì?", correct: "eˣ", incorrect: "xeˣ⁻¹" },
  { question: "Tính chu vi hình chữ nhật có chiều dài 10cm và chiều rộng 6cm", correct: "32cm", incorrect: "60cm" },
  { question: "Giải phương trình: 5x + 10 = 25", correct: "x = 3", incorrect: "x = 5" }
  
  // THÊM 30 CÂU THÊM MỐI - ĐỀ XUẤT TRUE/FALSE CHO TRÒ CHƠI NHẬN DIỆN ĐỀU
  // Câu hỏi True/Sai dễ hiểu, chính xác, phù hợp với chuyển động nghiêng đầu
,  { question: "Nghiêng đầu sang_LEFT_ nghĩa là đang trả lời TRUE.", correct: "TRUE", incorrect: "FALSE" },
  { question: "Nghiêng đầu sang_RIGHT_ nghĩa là đang trả lời FALSE.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Trái đất quay từ Đông sang Tây_LEFT_ là đúng.", correct: "TRUE", incorrect: "FALSE" },
  { question: "Mặt trời mọc ở Đông_LEFT_ là đúng.", correct: "TRUE", incorrect: "FALSE" },
  { question: "2 + 2 = 5_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Nguyên tố 2 có thể chia hết cho 2_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Hình tròn có 4 cạnh_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Nước đá ấm lên sẽ bay_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Sóng âm thực là sóng điều hòa_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Màu trời lúc nắng sol is white_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Cây xanh fotosynthesize_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Gamma phát xạ có 에너지 cao_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Bacteria là sinh vật đơn bào_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Mặt trời là một ngôi sao_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Kim loại dẫn điện tốt_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Khí không chứa oxy_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Đèn đèn led tiết kiệm điện_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Cơ học nghiên cứu về chuyển động_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Hình học nghiên cứu về hình học_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Nhược học nghiên cứu về phân tử_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Sinh học nghiên cứu về sinh học_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Thái học nghiên cứu về thời gian_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Vĩ học nghiên cứu về Vũ trụ_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Phong thủy nghiên cứu về phong thủy_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Thủy dược nghiên cứu về thuốc_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Kỹ thuật nghiên cứu về kỹ thuật_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: " Nghệ thuật nghiên cứu về nghệ thuật_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" },
  { question: "Âm nhạc nghiên cứu về âm nhạc_FALSE_ là đúng.", correct: "FALSE", incorrect: "TRUE" }
];

let gameState = {
  currentQuestionIndex: 0,
  score: 0,
  correctAnswers: 0,
  questions: [],
  isDetecting: false,
  isPaused: false,
  answerCooldown: false
};

let playerStats = {
  totalGames: 0,
  totalWins: 0,
  totalCorrect: 0,
  totalWrong: 0
};

const LEGACY_STATS_KEY = 'headTrackingGameStats';
const LEGACY_STATS_OWNER_KEY = 'headTrackingGameStatsMigratedTo';

function getPlayerStatsKey() {
  const currentUser = localStorage.getItem('currentUser');
  return currentUser ? `${LEGACY_STATS_KEY}:${currentUser}` : LEGACY_STATS_KEY;
}

function loadPlayerStats() {
  const currentUser = localStorage.getItem('currentUser');
  const key = getPlayerStatsKey();
  let saved = localStorage.getItem(key);
  // One-time migration: the old shared stats go to the first account that opens the game.
  if (!saved && currentUser && !localStorage.getItem(LEGACY_STATS_OWNER_KEY)) {
    const legacy = localStorage.getItem(LEGACY_STATS_KEY);
    if (legacy) {
      localStorage.setItem(key, legacy);
      localStorage.setItem(LEGACY_STATS_OWNER_KEY, currentUser);
      saved = legacy;
    }
  }
  playerStats = { totalGames: 0, totalWins: 0, totalCorrect: 0, totalWrong: 0 };
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        for (const field of Object.keys(playerStats)) {
          const value = Number(parsed[field]);
          if (Number.isFinite(value) && value >= 0) playerStats[field] = value;
        }
      }
    } catch {
      console.warn('Không đọc được thống kê trò chơi đã lưu.');
    }
  }
  updateStatsDisplay();
}

function savePlayerStats() {
  localStorage.setItem(getPlayerStatsKey(), JSON.stringify(playerStats));
  updateStatsDisplay();
}

function updateStatsDisplay() {
  const statsDiv = document.getElementById('player-stats');
  if (statsDiv) {
    statsDiv.innerHTML = `
      <p>📊 <strong>Thống kê của bạn:</strong></p>
      <p>• Số lượt chơi: ${playerStats.totalGames}</p>
      <p>• Số lần thắng: ${playerStats.totalWins}</p>
      <p>• Tổng câu đúng: ${playerStats.totalCorrect}</p>
      <p>• Tổng câu sai: ${playerStats.totalWrong}</p>
    `;
  }
}

const screens = {
  start: document.getElementById('start-screen'),
  loading: document.getElementById('loading-screen'),
  cameraPermission: document.getElementById('camera-permission-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen')
};

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
let faceMesh;
let cameraStream = null;
let frameLoopId = null;
let frameProcessing = false;
let lastFrameTime = 0;
let answerTimerId = null;

const cameraStatus = document.getElementById('camera-status');
const cameraButton = document.getElementById('allow-camera-btn');
const gameCameraStatus = document.getElementById('game-camera-status');
const cameraPreview = document.getElementById('camera-preview');

function init() {
  loadPlayerStats();

  document.getElementById('start-btn').addEventListener('click', startGame);
  cameraButton.addEventListener('click', requestCamera);
  document.getElementById('deny-camera-btn').addEventListener('click', goHome);
  document.getElementById('restart-btn').addEventListener('click', restartGame);
  document.getElementById('home-btn').addEventListener('click', exitToSelection);
  document.getElementById('pause-btn').addEventListener('click', pauseGame);
  document.getElementById('exit-btn').addEventListener('click', exitToSelection);
  document.getElementById('camera-toggle-btn').addEventListener('click', toggleCameraPreview);
  document.getElementById('answer-left').addEventListener('click', () => handleAnswer('left'));
  document.getElementById('answer-right').addEventListener('click', () => handleAnswer('right'));
  document.querySelector('.game-home-link').addEventListener('click', event => {
    event.preventDefault();
    returnToChat();
  });
}

function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[screenName]?.classList.add('active');
}

async function startGame() {
  gameState.isPaused = false;
  gameState.questions = [];
  document.getElementById('game-status').textContent = '';
  showScreen('loading');

  try {
    document.getElementById('loading-status').textContent = 'Đang tải mô hình Face Mesh...';
    if (!faceMesh) await initFaceMesh();
    document.getElementById('loading-status').textContent = 'Đã tải xong. Camera chỉ bật sau khi bạn cho phép.';
    cameraButton.textContent = 'Cho phép truy cập Camera';
    setCameraStatus('Video được xử lý trực tiếp trên thiết bị của bạn.', false);
    showScreen('cameraPermission');
  } catch (error) {
    console.error('Không thể tải mô hình nhận diện:', error);
    document.getElementById('game-status').textContent =
      'Không tải được mô hình nhận diện. Hãy kiểm tra kết nối mạng rồi thử lại.';
    showScreen('start');
  }
}

async function initFaceMesh() {
  if (typeof FaceMesh !== 'function') {
    throw new Error('Thư viện Face Mesh chưa tải được.');
  }

  faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }});

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults(onFaceResults);
}

async function requestCamera() {
  const resuming = gameState.isPaused;
  cameraButton.disabled = true;
  setCameraStatus('Đang yêu cầu quyền truy cập camera…', false);

  try {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (!window.isSecureContext && !isLocalhost) {
      throw new Error('SECURE_CONTEXT_REQUIRED');
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('CAMERA_API_UNAVAILABLE');
    }
    if (!faceMesh) await initFaceMesh();

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { 
        width: 640, 
        height: 480,
        facingMode: 'user'
      },
      audio: false
    });
    video.srcObject = cameraStream;
    await video.play();

    overlay.width = video.videoWidth || 640;
    overlay.height = video.videoHeight || 480;
    showScreen('game');
    setCameraStatus('Camera đang hoạt động. Video được xử lý trên thiết bị.', false);
    if (resuming) {
      gameState.isPaused = false;
      lastHeadDirection = 'center';
      headDirectionHoldTime = Date.now();
    } else {
      startQuiz();
    }
    gameState.isDetecting = true;
    startFrameLoop();
  } catch (error) {
    console.error('Không thể khởi động camera:', error);
    stopCamera();
    setCameraStatus(getCameraErrorMessage(error), true);
    cameraButton.textContent = gameState.isPaused ? 'Thử kết nối lại để tiếp tục' : 'Thử lại camera';
    showScreen('cameraPermission');
  } finally {
    cameraButton.disabled = false;
  }
}

function getCameraErrorMessage(error) {
  if (error?.message === 'SECURE_CONTEXT_REQUIRED') {
    return 'Camera cần kết nối HTTPS. Hãy mở website bằng địa chỉ bảo mật https://.';
  }
  if (error?.message === 'CAMERA_API_UNAVAILABLE') {
    return 'Trình duyệt không hỗ trợ camera hoặc trang chưa được mở qua HTTPS.';
  }
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
    return 'Bạn chưa cấp quyền camera. Hãy cho phép camera trong cài đặt trình duyệt rồi thử lại.';
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'Không tìm thấy camera trên thiết bị này.';
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return 'Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.';
  }
  return 'Không thể mở camera. Hãy kiểm tra quyền truy cập và thử lại.';
}

function setCameraStatus(message, isError) {
  cameraStatus.textContent = message;
  cameraStatus.classList.toggle('error', isError);
  if (gameCameraStatus) {
    gameCameraStatus.textContent = message;
    gameCameraStatus.classList.toggle('error', isError);
    gameCameraStatus.classList.toggle('ready', !isError && message.includes('đang hoạt động'));
  }
}

function toggleCameraPreview() {
  const expanded = cameraPreview.classList.toggle('expanded');
  const button = document.getElementById('camera-toggle-btn');
  button.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-label', expanded ? 'Thu nhỏ hình camera' : 'Mở rộng hình camera');
  button.textContent = expanded ? '⤡' : '⤢';
}

function startFrameLoop() {
  const processFrame = async (timestamp) => {
    if (!gameState.isDetecting || !cameraStream?.active) return;

    if (!frameProcessing && timestamp - lastFrameTime >= 1000 / 30 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      frameProcessing = true;
      lastFrameTime = timestamp;
      try {
        await faceMesh.send({ image: video });
      } catch (error) {
        console.error('Lỗi xử lý khung hình camera:', error);
        if (gameState.isDetecting) {
          stopCamera();
          gameState.isPaused = true;
          setCameraStatus('Lỗi xử lý hình ảnh. Kết nối lại camera để tiếp tục trò chơi.', true);
          cameraButton.textContent = 'Thử kết nối lại để tiếp tục';
          showScreen('cameraPermission');
        }
      } finally {
        frameProcessing = false;
      }
    }

    if (gameState.isDetecting) {
      frameLoopId = requestAnimationFrame(processFrame);
    }
  };

  frameLoopId = requestAnimationFrame(processFrame);
}

function stopCamera() {
  gameState.isDetecting = false;
  if (frameLoopId !== null) cancelAnimationFrame(frameLoopId);
  frameLoopId = null;
  if (answerTimerId !== null) clearTimeout(answerTimerId);
  answerTimerId = null;
  gameState.answerCooldown = false;

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  video.pause();
  video.srcObject = null;
  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

let lastHeadDirection = 'center';
let headDirectionHoldTime = 0;
const HEAD_HOLD_THRESHOLD = 500; // Giảm từ 800ms xuống 500ms để phản hồi nhanh hơn
const HEAD_OFFSET_THRESHOLD = 0.01; // Tăng độ nhạy - thay từ 0.02

function onFaceResults(results) {
  if (!gameState.isDetecting) return;
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    
    // Calculate head direction using nose and eyes
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[262];
    
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const headOffset = eyeCenterX - nose.x;
    
    let currentDirection = 'center';
    if (headOffset < -0.02) currentDirection = 'left';
    else if (headOffset > 0.02) currentDirection = 'right';
    
    updateHeadIndicator(currentDirection);
    
    if (currentDirection !== lastHeadDirection) {
      lastHeadDirection = currentDirection;
      headDirectionHoldTime = Date.now();
    } else {
      if (Date.now() - headDirectionHoldTime > HEAD_HOLD_THRESHOLD) {
        if (currentDirection !== 'center' && !gameState.answerCooldown) {
          handleAnswer(currentDirection);
        }
      }
    }
    
    // Draw face tracking squares
    drawFaceSquares(landmarks);
  }
}

function drawFaceSquares(landmarks) {
  const nose = landmarks[1];
  const noseX = nose.x * overlay.width;
  const noseY = nose.y * overlay.height;
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  ctx.strokeRect(noseX - 12, noseY - 12, 24, 24);
  ctx.beginPath();
  ctx.arc(noseX, noseY, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#6366f1';
  ctx.fill();
}

function updateHeadIndicator(direction) {
  const leftOption = document.getElementById('answer-left');
  const rightOption = document.getElementById('answer-right');
  
  leftOption.classList.remove('active');
  rightOption.classList.remove('active');
  
  if (direction === 'left') leftOption.classList.add('active');
  else if (direction === 'right') rightOption.classList.add('active');
}

function startQuiz() {
  gameState.questions = shuffleArray([...mathQuestions]).slice(0, 10);
  gameState.currentQuestionIndex = 0;
  gameState.score = 0;
  gameState.correctAnswers = 0;
  gameState.isPaused = false;
  lastHeadDirection = 'center';
  headDirectionHoldTime = Date.now();

  playerStats.totalGames++;
  savePlayerStats();
  
  document.getElementById('total-questions').textContent = gameState.questions.length;
  loadQuestion();
}

function loadQuestion() {
  const question = gameState.questions[gameState.currentQuestionIndex];
  lastHeadDirection = 'center';
  headDirectionHoldTime = Date.now();
  
  document.getElementById('current-question').textContent = gameState.currentQuestionIndex + 1;
  document.getElementById('question-text').textContent = question.question;
  
  const isCorrectOnRight = Math.random() > 0.5;
  
  if (isCorrectOnRight) {
    document.getElementById('answer-left-text').textContent = question.incorrect;
    document.getElementById('answer-right-text').textContent = question.correct;
    gameState.currentQuestion = { correctDirection: 'right', incorrectDirection: 'left' };
  } else {
    document.getElementById('answer-left-text').textContent = question.correct;
    document.getElementById('answer-right-text').textContent = question.incorrect;
    gameState.currentQuestion = { correctDirection: 'left', incorrectDirection: 'right' };
  }
  
  document.getElementById('score').textContent = gameState.score;
}

function handleAnswer(direction) {
  if (gameState.answerCooldown) return;
  
  gameState.answerCooldown = true;
  
  if (direction === gameState.currentQuestion.correctDirection) {
    gameState.score += 10;
    gameState.correctAnswers++;
  }
  
  answerTimerId = setTimeout(() => {
    answerTimerId = null;
    gameState.answerCooldown = false;
    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex < gameState.questions.length) {
      loadQuestion();
    } else {
      endGame();
    }
  }, 800);
}

function endGame() {
  gameState.isPaused = false;
  stopCamera();
  
  const totalQuestions = gameState.questions.length;
  const percentage = Math.round((gameState.correctAnswers / totalQuestions) * 100);
  
  document.getElementById('final-score').textContent = gameState.score;
  document.getElementById('correct-count').textContent = gameState.correctAnswers;
  document.getElementById('total-count').textContent = totalQuestions;
  document.getElementById('percentage').textContent = percentage + '%';
  
  // Save player stats
  playerStats.totalCorrect += gameState.correctAnswers;
  playerStats.totalWrong += (totalQuestions - gameState.correctAnswers);
  
  // Count as win if percentage >= 70%
  if (percentage >= 70) {
    playerStats.totalWins++;
  }
  
  savePlayerStats();
  
  showScreen('result');
}

function restartGame() {
  stopCamera();
  startGame();
}

function pauseGame() {
  if (!gameState.isDetecting) return;
  gameState.isPaused = true;
  stopCamera();
  setCameraStatus('Trò chơi đã tạm dừng và camera đã được tắt. Cho phép camera để tiếp tục.', false);
  cameraButton.textContent = 'Tiếp tục trò chơi';
  showScreen('cameraPermission');
}

function goHome() {
  stopCamera();
  gameState.isPaused = false;
  cameraButton.textContent = 'Cho phép truy cập Camera';
  showScreen('start');
}

function exitToSelection() {
  stopCamera();
  releaseFaceMesh();
  window.location.href = 'games.html';
}

function returnToChat() {
  stopCamera();
  releaseFaceMesh();
  window.location.href = 'index.html';
}

function releaseFaceMesh() {
  if (typeof faceMesh?.close === 'function') {
    try {
      const closing = faceMesh.close();
      if (closing && typeof closing.catch === 'function') {
        closing.catch(error => console.error('Không thể giải phóng Face Mesh:', error));
      }
    } catch (error) {
      console.error('Không thể giải phóng Face Mesh:', error);
    }
  }
  faceMesh = null;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('pagehide', () => {
  stopCamera();
  releaseFaceMesh();
});

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
];

let gameState = {
  currentQuestionIndex: 0,
  score: 0,
  correctAnswers: 0,
  questions: [],
  isDetecting: false,
  answerCooldown: false
};

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
let camera;

function init() {
  console.log('Initializing game...');
  console.log('FaceMesh available:', typeof FaceMesh !== 'undefined');
  console.log('Camera available:', typeof Camera !== 'undefined');
  
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('allow-camera-btn').addEventListener('click', requestCamera);
  document.getElementById('deny-camera-btn').addEventListener('click', goHome);
  document.getElementById('restart-btn').addEventListener('click', restartGame);
  document.getElementById('home-btn').addEventListener('click', goHome);
  
  console.log('Event listeners added');
}

function showScreen(screenName) {
  console.log('showScreen called with:', screenName);
  console.log('Screens:', screens);
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[screenName].classList.add('active');
  console.log('Screen switched to:', screenName);
}

async function startGame() {
  console.log('startGame called');
  showScreen('loading');
  console.log('Loading screen shown');
  
  try {
    document.getElementById('loading-status').textContent = 'Đang tải mô hình Face Mesh...';
    console.log('Initializing FaceMesh...');
    await initFaceMesh();
    console.log('FaceMesh initialized');
    document.getElementById('loading-status').textContent = 'Đã tải xong!';
    console.log('Showing camera permission screen');
    showScreen('cameraPermission');
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi khi khởi tạo. Vui lòng tải lại trang.');
    showScreen('start');
  }
}

async function initFaceMesh() {
  console.log('Creating FaceMesh...');
  faceMesh = new FaceMesh({locateFile: (file) => {
    console.log('Loading file:', file);
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }});
  
  console.log('Setting FaceMesh options...');
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  console.log('Setting onResults callback...');
  faceMesh.onResults(onFaceResults);
  console.log('FaceMesh setup complete');
}

async function requestCamera() {
  console.log('requestCamera called');
  try {
    console.log('Requesting camera permission...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: 640, 
        height: 480,
        facingMode: 'user'
      } 
    });
    console.log('Camera permission granted');
    video.srcObject = stream;
    
    console.log('Creating Camera object...');
    camera = new Camera(video, {
      onFrame: async () => {
        await faceMesh.send({image: video});
      },
      width: 640,
      height: 480
    });
    
    console.log('Starting camera...');
    await camera.start();
    console.log('Camera started');
    
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    
    console.log('Showing game screen');
    showScreen('game');
    startQuiz();
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Không thể truy cập camera. Vui lòng kiểm tra quyền.');
    showScreen('start');
  }
}

let lastHeadDirection = 'center';
let headDirectionHoldTime = 0;
const HEAD_HOLD_THRESHOLD = 800;

function onFaceResults(results) {
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
  const squareSize = 8;
  
  ctx.fillStyle = '#00ff00';
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1;
  
  landmarks.forEach(point => {
    const x = point.x * overlay.width;
    const y = point.y * overlay.height;
    ctx.fillRect(x - squareSize/2, y - squareSize/2, squareSize, squareSize);
  });
  
  // Draw larger square on nose
  const nose = landmarks[1];
  const noseX = nose.x * overlay.width;
  const noseY = nose.y * overlay.height;
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(noseX - 12, noseY - 12, 24, 24);
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
  
  document.getElementById('total-questions').textContent = gameState.questions.length;
  loadQuestion();
}

function loadQuestion() {
  const question = gameState.questions[gameState.currentQuestionIndex];
  
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
  
  setTimeout(() => {
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
  gameState.isDetecting = false;
  
  if (camera) {
    camera.stop();
  }
  
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  
  const totalQuestions = gameState.questions.length;
  const percentage = Math.round((gameState.correctAnswers / totalQuestions) * 100);
  
  document.getElementById('final-score').textContent = gameState.score;
  document.getElementById('correct-count').textContent = gameState.correctAnswers;
  document.getElementById('total-count').textContent = totalQuestions;
  document.getElementById('percentage').textContent = percentage + '%';
  
  showScreen('result');
}

function restartGame() {
  startGame();
}

function goHome() {
  gameState.isDetecting = false;
  
  if (camera) {
    camera.stop();
  }
  
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  
  showScreen('start');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

document.addEventListener('DOMContentLoaded', init);

const media = [
  { src: 'selahx1.webp' },
  { src: 'DanLevi.webp' },
  { src: '1.WEBP' },
  { src: '2.WEBP' },
  { src: '3.WEBP' },
  { src: '4.WEBP' }
];

const mediaContainer = document.getElementById('mediaContainer');
const loader = document.getElementById('loader');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3');
backgroundMusic.loop = true;

let isPlaying = false;

// 自动播放音乐
window.addEventListener('load', () => {
  backgroundMusic.play().catch(() => {
    console.log("⚠️ 用户未互动，自动播放被阻止");
  });
});

// 播放按钮控制
musicButton.addEventListener('click', () => {
  if (navigator.vibrate) navigator.vibrate(100);
  if (isPlaying) {
    backgroundMusic.pause();
    musicButton.textContent = '🎵 PLAY';
  } else {
    backgroundMusic.play();
    musicButton.textContent = '⏸️ PLAYING';
  }
  isPlaying = !isPlaying;
});

// 图片加载
function initializeMedia() {
  loader.style.display = 'block';
  media.forEach((item, index) => {
    const img = new Image();
    img.src = item.src;
    img.alt = `Image ${index + 1}`;
    img.addEventListener('click', () => openLightbox(index));
    img.onload = () => {
      loader.style.display = 'none';
      mediaContainer.appendChild(img);
    };
  });
}

// 图片放大功能
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  lightbox.classList.remove('hidden');
  updateLightbox();
}

function updateLightbox() {
  const current = media[currentIndex];
  lightboxImg.src = current.src;
  lightboxCaption.textContent = `${currentIndex + 1} / ${media.length}`;
}

document.getElementById('closeBtn').addEventListener('click', () => {
  lightbox.classList.add('hidden');
});

document.getElementById('prevBtn').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + media.length) % media.length;
  updateLightbox();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % media.length;
  updateLightbox();
});

// 初始化
initializeMedia();

const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.6;

const media = [
  { src: 'selahx1.webp' },
  { src: 'DanLevi.webp' },
  { src: '1.WEBP' },
  { src: '2.WEBP' },
  { src: '3.WEBP' },
  { src: '4.WEBP' }
];

function initializeMedia() {
  const loader = mediaContainer.querySelector('.loader');
  media.forEach((item, index) => {
    const img = new Image();
    img.src = item.src;
    img.alt = item.src;
    img.addEventListener('click', () => openLightbox(index));
    img.onload = () => {
      if (loader) loader.style.display = 'none';
    };
    mediaContainer.appendChild(img);
  });
}

let isPlaying = false;
musicButton.addEventListener('click', () => {
  navigator.vibrate?.(100);
  if (isPlaying) {
    backgroundMusic.pause();
    musicButton.innerHTML = '🎵 PLAY';
  } else {
    backgroundMusic.play();
    musicButton.innerHTML = '⏸️ PLAYING';
  }
  isPlaying = !isPlaying;
});

backgroundMusic.addEventListener('ended', () => {
  isPlaying = false;
  musicButton.innerHTML = '🎵 PLAY';
});

window.addEventListener('DOMContentLoaded', () => {
  initializeMedia();
  // 自动播放已关闭
});

// Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImage');
const imageName = document.getElementById('imageName');
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  updateLightbox();
  lightbox.classList.remove('hidden');
}

function updateLightbox() {
  const imgObj = media[currentIndex];
  lightboxImg.style.opacity = 0;
  setTimeout(() => {
    lightboxImg.src = imgObj.src;
    imageName.textContent = imgObj.src;
    lightboxImg.style.opacity = 1;
  }, 100);
}

document.querySelector('.close-btn').addEventListener('click', () => {
  lightbox.classList.add('hidden');
});

document.querySelector('.prev').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + media.length) % media.length;
  updateLightbox();
});

document.querySelector('.next').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % media.length;
  updateLightbox();
});
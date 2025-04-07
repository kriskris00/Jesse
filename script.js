const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3'); // 确保路径正确

const media = [
  { src: 'selahx1.webp' },
  { src: 'DanLevi.webp' },
  { src: 'J-1.WEBP' },
  { src: 'J-2.WEBP' },
  { src: 'J-3.WEBP' },
  { src: 'J-4.WEBP' },
  { src: 'J-5.WEBP' },
  { src: 'J-6.WEBP' },
  { src: 'J-7.WEBP' },
  { src: 'J-8.WEBP' },
  { src: 'J-9.WEBP' },
  { src: 'J-10.WEBP' },
  { src: 'J-11.WEBP' }
];

// 初始化图片
function initializeMedia() {
  const loader = mediaContainer.querySelector('.loader');
  media.forEach((item) => {
    const img = new Image();
    img.src = item.src;
    img.alt = "Image";
    img.onload = () => {
      img.classList.add('visible');
      if (loader) loader.style.display = 'none';
    };
    img.onerror = () => {
      console.error(`❌ 图片加载失败: ${item.src}`);
      loader.textContent = "⚠️ 图片加载失败";
    };
    mediaContainer.appendChild(img);
  });
}

// 音乐播放控制
let isPlaying = false;
musicButton.addEventListener('click', () => {
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

// 图片点击放大查看
const lightboxOverlay = document.getElementById('lightboxOverlay');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxClose = document.querySelector('.lightbox-close');

mediaContainer.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG') {
    lightboxImage.src = e.target.src;
    lightboxOverlay.style.display = 'flex';
  }
});

lightboxOverlay.addEventListener('click', (e) => {
  if (e.target === lightboxOverlay || e.target === lightboxClose) {
    lightboxOverlay.style.display = 'none';
    lightboxImage.src = '';
  }
});

// 初始化
initializeMedia();

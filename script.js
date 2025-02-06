const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3'); // ✅ 确保音乐文件在根目录

// 🖼️ 你的图片列表（确保每行两张）
const media = [
  { src: 'IMG_8322.jpeg' },
  { src: 'IMG_8329.jpeg' },
  { src: 'IMG_8340.jpeg' },
  { src: 'IMG_8317.jpeg' },
  { src: 'IMG_8318.jpeg' }
];

// 🔄 确保图片加载后正常显示
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
      console.error(`Failed to load image: ${item.src}`);
      loader.textContent = "图片加载失败";
    };
    mediaContainer.appendChild(img);
  });
}

// 🎶 播放/暂停音乐
let isPlaying = false;
musicButton.addEventListener('click', () => {
  if (isPlaying) {
    backgroundMusic.pause();
    musicButton.textContent = '🎵 PLAY';
  } else {
    backgroundMusic.play();
    musicButton.textContent = '⏸️ PLAYING';
  }
  isPlaying = !isPlaying;
});

// 初始化
initializeMedia();
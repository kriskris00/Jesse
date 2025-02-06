const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3'); // ✅ 确保音乐文件在根目录

// 🖼️ 图片列表
const media = [
  { src: 'IMG_8322.jpeg' },
  { src: 'IMG_8329.jpeg' },
  { src: 'IMG_8340.jpeg' },
  { src: 'IMG_8317.jpeg' },
  { src: 'IMG_8318.jpeg' }
];

// 🔄 图片加载优化（确保正确加载）
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

// 🎶 播放/暂停音乐
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

// ✅ 处理音乐播放完成时自动切换按钮状态
backgroundMusic.addEventListener('ended', () => {
  isPlaying = false;
  musicButton.innerHTML = '🎵 PLAY';
});

// ✅ 初始化图片
initializeMedia();
const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3'); // 请替换为实际的音乐链接

// 媒体资源数组，注意：为确保图片“原生 HDR”显示，请提供经过 HDR 后处理的高动态范围图片文件
const media = [
  { src: 'IMG_8322.jpeg', type: 'image' },
  { src: 'IMG_8329.jpeg', type: 'image' },
  { src: 'IMG_8340.jpeg', type: 'image' },
  { src: 'IMG_8317.jpeg', type: 'image' },
  { src: 'IMG_8318.jpeg', type: 'image' }
];
  // 示例视频，确保视频地址与海报地址正确
  *{ src: 'https://example.com/videos/sample-video.mp4', type: 'video', poster: 'https://example.com/videos/video-poster.jpg' }
];*

// 初始化媒体网格，加载图片或视频
function initializeMedia() {
  const loader = mediaContainer.querySelector('.loader');
  media.forEach((item, index) => {
    let element;
    if (item.type === 'video') {
      element = document.createElement('video');
      element.src = item.src;
      element.poster = item.poster || '';
      element.controls = true;
    } else {
      element = new Image();
      element.src = item.src;
      element.alt = `Media ${index + 1}`;
    }
    // 当媒体加载完成后执行渐入动画
    element.onload = () => {
      element.classList.add('visible');
      if (loader) loader.style.display = 'none';
    };
    element.onerror = () => {
      console.error(`Failed to load media: ${item.src}`);
      if (loader) loader.style.display = 'none';
    };
    mediaContainer.appendChild(element);
  });
}

// 背景音乐控制
let isPlaying = false;
musicButton.addEventListener('click', () => {
  if (isPlaying) {
    backgroundMusic.pause();
    musicButton.textContent = '🎵 PLAY';
    musicButton.style.backgroundColor = '#8A6135';
  } else {
    backgroundMusic.play();
    musicButton.textContent = '⏸️ PLAYING';
    musicButton.style.backgroundColor = '#6B4226';
  }
  isPlaying = !isPlaying;
});

backgroundMusic.addEventListener('ended', () => {
  isPlaying = false;
  musicButton.textContent = '🎵 PLAY';
  musicButton.style.backgroundColor = '#8A6135';
});

// 初始化媒体显示
initializeMedia();
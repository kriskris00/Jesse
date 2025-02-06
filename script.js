const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = document.getElementById('backgroundMusic');

// 确保音乐可播放
backgroundMusic.volume = 0.8;

// 媒体资源数组
const media = [
  { src: 'IMG_8322.jpeg', type: 'image' }, 
  { src: 'IMG_8329.jpeg', type: 'image' }, 
  { src: 'IMG_8340.jpeg', type: 'image' },
  { src: 'IMG_8317.jpeg', type: 'image' }, 
  { src: 'IMG_8318.jpeg', type: 'image' }  
];

// 加载媒体
function initializeMedia() {
  const loader = mediaContainer.querySelector('.loader');
  media.forEach((item, index) => {
    let element;
    if (item.type === 'image') {
      element = new Image();
      element.src = item.src;
      element.alt = `Image ${index + 1}`;
      element.loading = "lazy"; // 延迟加载
    }
    element.onload = () => {
      element.classList.add('visible');
      loader.style.display = 'none';
    };
    element.onerror = () => {
      console.error(`无法加载媒体: ${item.src}`);
      loader.style.display = 'none';
    };
    mediaContainer.appendChild(element);
  });
}

// 播放/暂停音乐
let isPlaying = false;
musicButton.addEventListener('click', () => {
  if (isPlaying) {
    backgroundMusic.pause();
    musicButton.textContent = '🎵 PLAY';
  } else {
    backgroundMusic.play().catch(e => console.error("播放失败:", e));
    musicButton.textContent = '⏸️ PLAYING';
  }
  isPlaying = !isPlaying;
});

backgroundMusic.addEventListener('ended', () => {
  isPlaying = false;
  musicButton.textContent = '🎵 PLAY';
});

// 初始化媒体内容
initializeMedia();
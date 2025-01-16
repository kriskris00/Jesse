const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3'); // 替换为您的音乐路径

let currentIndex = 0; // 当前图片索引
let isPlaying = false; // 记录背景音乐是否播放
let startX = 0; // 触摸起始位置
let isDragging = false; // 是否处于拖动状态

// 媒体资源 - 替换为您的图片链接
const media = [
    { src: 'IMG_8322.jpeg' },
    { src: 'IMG_8329.jpeg' },
    { src: 'IMG_8340.jpeg' },
    { src: 'IMG_8317.jpeg' },
    { src: 'IMG_8318.jpeg' }
];

// 初始化媒体容器
function initializeMedia() {
    const loader = mediaContainer.querySelector('.loader');
    media.forEach((item, index) => {
        const img = new Image();
        img.src = item.src;
        img.alt = `Image ${index + 1}`;
        if (index === currentIndex) img.classList.add('visible');
        img.onload = () => loader.style.display = 'none'; // 图片加载完成后隐藏加载动画
        img.onerror = () => console.error(`Failed to load image: ${item.src}`);
        mediaContainer.appendChild(img);
    });
}

// 更新图片
function updateMedia(nextIndex, direction) {
    const images = mediaContainer.querySelectorAll('img');
    const currentImage = images[currentIndex];
    const nextImage = images[nextIndex];

    currentImage.classList.remove('visible');
    currentImage.classList.add(direction === 'left' ? 'exiting-left' : 'exiting-right');
    nextImage.classList.add(direction === 'left' ? 'entering-left' : 'entering-right');

    setTimeout(() => {
        nextImage.classList.remove('entering-left', 'entering-right');
        nextImage.classList.add('visible');
        currentImage.classList.remove('exiting-left', 'exiting-right');
    }, 500);

    currentIndex = nextIndex;
}

// 下一张图片
function goToNext() {
    const nextIndex = (currentIndex + 1) % media.length;
    updateMedia(nextIndex, 'right');
}

// 上一张图片
function goToPrevious() {
    const previousIndex = (currentIndex - 1 + media.length) % media.length;
    updateMedia(previousIndex, 'left');
}

// 触摸事件
function handleTouchStart(event) {
    startX = event.touches[0].clientX;
    isDragging = true;
}

function handleTouchMove(event) {
    if (!isDragging) return;
    const endX = event.touches[0].clientX;
    const deltaX = endX - startX;

    if (deltaX > 100) {
        goToPrevious();
        isDragging = false;
    } else if (deltaX < -100) {
        goToNext();
        isDragging = false;
    }
}

function handleTouchEnd() {
    isDragging = false;
}

// 背景音乐控制
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

// 触摸监听
mediaContainer.addEventListener('touchstart', handleTouchStart);
mediaContainer.addEventListener('touchmove', handleTouchMove);
mediaContainer.addEventListener('touchend', handleTouchEnd);

// 初始化
initializeMedia();
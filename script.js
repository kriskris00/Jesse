const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');

let currentIndex = 0;
let isPlaying = false;
let startX = 0;
let isDragging = false;

// 媒体资源
const media = [
    { src: 'IMG_8322.jpeg' },
    { src: 'IMG_8329.jpeg' },
    { src: 'IMG_8340.jpeg' },
    { src: 'IMG_8317.jpeg' },
    { src: 'IMG_8318.jpeg' }
];

// 背景音乐
const backgroundMusic = new Audio('1.mp3');

// 初始化图片
function initializeMedia() {
    if (media.length === 0) {
        mediaContainer.innerHTML = '<p>No media available</p>';
        return;
    }

    media.forEach((item, index) => {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = `Image ${index + 1}`;
        if (index === currentIndex) img.classList.add('visible');
        mediaContainer.appendChild(img);
    });
}

// 更新图片
function updateMedia(nextIndex, direction) {
    const images = mediaContainer.querySelectorAll('img');
    const currentImage = images[currentIndex];
    const nextImage = images[nextIndex];

    // 动画效果
    currentImage.classList.remove('visible');
    currentImage.classList.add(direction === 'left' ? 'exiting-left' : 'exiting-right');
    nextImage.classList.add(direction === 'left' ? 'entering-left' : 'entering-right');

    // 确保新图片进入
    setTimeout(() => {
        nextImage.classList.remove('entering-left', 'entering-right');
        nextImage.classList.add('visible');
        currentImage.classList.remove('exiting-left', 'exiting-right');
    }, 800);

    // 更新索引
    currentIndex = nextIndex;
}

// 切换到下一张
function goToNext() {
    const nextIndex = (currentIndex + 1) % media.length;
    updateMedia(nextIndex, 'right');
}

// 切换到上一张
function goToPrevious() {
    const previousIndex = (currentIndex - 1 + media.length) % media.length;
    updateMedia(previousIndex, 'left');
}

// 触摸滑动事件处理
function handleTouchStart(event) {
    startX = event.touches[0].clientX;
    isDragging = true;
}

function handleTouchMove(event) {
    if (!isDragging) return;
    const endX = event.touches[0].clientX;
    const deltaX = endX - startX;

    if (deltaX > 50) {
        goToPrevious();
        isDragging = false;
    } else if (deltaX < -50) {
        goToNext();
        isDragging = false;
    }
}

function handleTouchEnd() {
    isDragging = false;
}

// 背景音乐控制逻辑
musicButton.addEventListener('click', () => {
    if (isPlaying) {
        backgroundMusic.pause(); // 暂停音乐
        musicButton.textContent = '🎵 PLAY'; // 按钮恢复到播放状态
        musicButton.style.backgroundColor = '#8A6135'; // 恢复默认深大地色
    } else {
        backgroundMusic.play(); // 播放音乐
        musicButton.textContent = '⏸️ PLAYING'; // 按钮显示正在播放
        musicButton.style.backgroundColor = '#6B4226'; // 播放状态颜色更深
    }
    isPlaying = !isPlaying; // 切换播放状态
});

// 音乐播放结束时，恢复按钮到播放状态
backgroundMusic.addEventListener('ended', () => {
    isPlaying = false;
    musicButton.textContent = '🎵 PLAY';
    musicButton.style.backgroundColor = '#8A6135'; // 恢复按钮颜色
});

// 监听触摸事件
mediaContainer.addEventListener('touchstart', handleTouchStart);
mediaContainer.addEventListener('touchmove', handleTouchMove);
mediaContainer.addEventListener('touchend', handleTouchEnd);

// 初始化
initializeMedia();
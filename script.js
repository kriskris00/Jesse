const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3'); // 替换为您的音乐路径

let currentIndex = 0; // 当前图片索引
let isPlaying = false; // 记录背景音乐是否正在播放
let startX = 0; // 触摸起始位置
let isDragging = false; // 是否处于拖动状态

// 媒体资源 - 替换为您自己的图片链接
const media = [
    { src: 'images/IMG_8322.jpeg' },
    { src: 'images/IMG_8329.jpeg' },
    { src: 'images/IMG_8340.jpeg' },
    { src: 'images/IMG_8317.jpeg' },
    { src: 'images/IMG_8318.jpeg' }
];

// 初始化媒体容器
function initializeMedia() {
    const loader = mediaContainer.querySelector('.loader'); // 获取加载动画
    media.forEach((item, index) => {
        const img = new Image(); // 动态创建图片
        img.src = item.src;
        img.alt = `Image ${index + 1}`;
        img.onload = () => {
            if (index === currentIndex) {
                img.classList.add('visible'); // 显示第一张图片
                loader.style.display = 'none'; // 隐藏加载动画
            }
            mediaContainer.appendChild(img); // 添加图片到容器
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${item.src}`);
        };
    });
}

// 更新媒体（图片切换）
function updateMedia(nextIndex, direction) {
    const images = mediaContainer.querySelectorAll('img');
    const currentImage = images[currentIndex];
    const nextImage = images[nextIndex];

    // 当前图片滑出
    currentImage.classList.remove('visible');
    currentImage.classList.add(direction === 'left' ? 'exiting-left' : 'exiting-right');

    // 新图片滑入
    nextImage.classList.add(direction === 'left' ? 'entering-left' : 'entering-right');
    setTimeout(() => {
        nextImage.classList.remove('entering-left', 'entering-right');
        nextImage.classList.add('visible');
        currentImage.classList.remove('exiting-left', 'exiting-right');
    }, 800);

    currentIndex = nextIndex; // 更新索引
}

// 切换到下一张图片
function goToNext() {
    const nextIndex = (currentIndex + 1) % media.length; // 循环到下一张
    updateMedia(nextIndex, 'right');
}

// 切换到上一张图片
function goToPrevious() {
    const previousIndex = (currentIndex - 1 + media.length) % media.length; // 循环到上一张
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

    if (deltaX > 100) {
        goToPrevious(); // 滑动右切换到上一张
        isDragging = false;
    } else if (deltaX < -100) {
        goToNext(); // 滑动左切换到下一张
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
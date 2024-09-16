
// 获取页面中的元素
const glowingTitle = document.getElementById('glowing-title');
const mediaContainer = document.getElementById('mediaContainer');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const musicButton = document.getElementById('musicButton'); // 背景音乐按钮
let currentIndex = 0;
let isPlaying = false; // 用于检测音乐是否在播放

// 媒体资源
const media = [
    { type: 'image', src: 'J-1.WEBP' },
    { type: 'image', src: 'J-2.WEBP' },
    { type: 'image', src: 'J-3.WEBP' },
    { type: 'image', src: 'J-4.WEBP' },
    { type: 'image', src: 'J-5.WEBP' },
    { type: 'image', src: 'J-6.WEBP' },
    { type: 'image', src: 'J-7.WEBP' },
    { type: 'image', src: 'J-8.WEBP' },
    { type: 'image', src: 'J-9.WEBP' },
    { type: 'image', src: 'J-10.WEBP' },
    { type: 'image', src: 'J-11.WEBP' }
];

// 初始化背景音乐
const backgroundMusic = new Audio('background-music.mp3'); // 替换为你自己的音乐文件

// 切换媒体函数
function changeMedia(index) {
    currentIndex = (currentIndex + index + media.length) % media.length;
    const currentMedia = media[currentIndex];
    if (currentMedia.type === 'image') {
        const img = document.createElement('img');
        img.src = currentMedia.src;
        img.alt = '图片描述';
        img.style.maxWidth = '80%';
        img.style.maxHeight = '80vh';
        img.style.display = 'block';
        img.style.margin = 'auto';

        // 添加图像淡入淡出效果
        img.style.opacity = '0';
        img.style.transform = 'scale(1.2)';
        requestAnimationFrame(() => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        });

        replaceMedia(img);
    }
}

// 更新媒体容器中的内容
function replaceMedia(newMedia) {
    while (mediaContainer.firstChild) {
        mediaContainer.removeChild(mediaContainer.firstChild);
    }
    mediaContainer.appendChild(newMedia);
}

// 切换媒体按钮事件
prevButton.addEventListener('click', () => changeMedia(-1));
nextButton.addEventListener('click', () => changeMedia(1));

// 初始化为第一个媒体
changeMedia(0);

// 背景音乐按钮事件
musicButton.addEventListener('click', () => {
    if (!isPlaying) {
        backgroundMusic.play();
        isPlaying = true;
        musicButton.textContent = '🎵 STOP';
    } else {
        backgroundMusic.pause();
        isPlaying = false;
        musicButton.textContent = '🎵 PLAY';
    }
});
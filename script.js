const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3'); // 替换为您的音乐路径
const timeDisplay = document.getElementById('timeDisplay');
const specialEffect = document.getElementById('specialEffect');

let currentIndex = 0; // 当前图片索引
let isPlaying = false; // 记录背景音乐是否播放
let startX = 0; // 触摸起始位置
let isDragging = false; // 是否处于拖动状态

// 农历节日固定规则
const lunarFestivals = {
    "春节": { lunarMonth: 1, lunarDay: 1, effect: "spring-festival" },
    "元宵节": { lunarMonth: 1, lunarDay: 15, effect: "spring-festival" },
    "端午节": { lunarMonth: 5, lunarDay: 5, effect: "spring-festival" },
    "中秋节": { lunarMonth: 8, lunarDay: 15, effect: "spring-festival" },
    "除夕": { lunarMonth: 12, lunarDay: 30, effect: "spring-festival" }
};

// 固定节日日期
const fixedFestivals = {
    "01-01": { name: "元旦节", effect: "new-year" },
    "02-14": { name: "情人节", effect: "valentine" },
    "06-01": { name: "儿童节", effect: "childrens-day" },
    "06-24": { name: "你的生日 🎂", effect: "birthday" },
    "10-01": { name: "国庆节", effect: "national-day" },
    "12-25": { name: "圣诞节", effect: "christmas" }
};

// 农历转公历规则
const lunarToSolar = (lunarMonth, lunarDay) => {
    // 使用 2025 年数据为示例
    const lunar2025 = {
        "1-1": "02-09",
        "1-15": "02-23",
        "5-5": "06-09",
        "8-15": "09-27",
        "12-30": "02-08"
    };
    return lunar2025[`${lunarMonth}-${lunarDay}`];
};

// 显示节日动态效果
function showSpecialEffect(effectKey) {
    specialEffect.innerHTML = ""; // 清空之前的特效
    specialEffect.style.display = "block";

    const emojis = ["🎉", "🎆", "✨"];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
        confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        specialEffect.appendChild(confetti);
    }

    // 隐藏特效
    setTimeout(() => {
        specialEffect.style.display = "none";
    }, 5000);
}

// 实时更新时间函数
function updateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset() + 480; // 北京时间为 UTC+8
    const beijingTime = new Date(now.getTime() + offset * 60 * 1000);

    const hours = String(beijingTime.getHours()).padStart(2, '0');
    const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
    const seconds = String(beijingTime.getSeconds()).padStart(2, '0');
    const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
    const date = String(beijingTime.getDate()).padStart(2, '0');

    const currentTime = `${hours}:${minutes}:${seconds}`;
    timeDisplay.textContent = `北京时间：${currentTime}`;

    // 检查固定节日
    const today = `${month}-${date}`;
    if (fixedFestivals[today]) {
        const { name, effect } = fixedFestivals[today];
        timeDisplay.textContent += ` 🎉 ${name}快乐！`;
        timeDisplay.className = `time-display festival-effect ${effect}`;
        showSpecialEffect(effect);
    }

    // 检查农历节日
    for (const [name, info] of Object.entries(lunarFestivals)) {
        const solarDate = lunarToSolar(info.lunarMonth, info.lunarDay);
        if (today === solarDate) {
            timeDisplay.textContent += ` 🎉 ${name}快乐！`;
            timeDisplay.className = `time-display festival-effect ${info.effect}`;
            showSpecialEffect(info.effect);
        }
    }
}

// 每秒更新一次时间
setInterval(updateTime, 1000);
updateTime();

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
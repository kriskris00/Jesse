const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3'); // 替换为您的音乐路径
const timeDisplay = document.getElementById('timeDisplay');
const specialEffect = document.getElementById('specialEffect');

let currentIndex = 0; // 当前图片索引
let isPlaying = false; // 记录背景音乐是否播放
let startX = 0; // 触摸起始位置
let isDragging = false; // 是否处于拖动状态

const timeDisplay = document.getElementById('timeDisplay');
const specialEffect = document.getElementById('specialEffect');

// Emoji effects for each festival
const emojiEffects = {
    "new-year": ["🎉", "🎆", "✨"],
    "spring-festival": ["🧨", "🎊", "🧧"],
    "mid-autumn": ["🌕", "🥮", "🏮"],
    "valentine": ["💖", "❤️", "💕"],
    "halloween": ["🎃", "👻", "🕸"],
    "birthday": ["🎂", "🎉", "🎁"],
    "womens-day": ["🌹", "💐", "👩"],
    "christmas": ["🎄", "🎅", "⛄"]
};

// Lunar festivals and their conversion rules to Solar (Gregorian) calendar
const lunarFestivals = {
    "Spring Festival": { lunarMonth: 1, lunarDay: 1, effect: "spring-festival" },
    "Lantern Festival": { lunarMonth: 1, lunarDay: 15, effect: "spring-festival" },
    "Dragon Boat Festival": { lunarMonth: 5, lunarDay: 5, effect: "spring-festival" },
    "Mid-Autumn Festival": { lunarMonth: 8, lunarDay: 15, effect: "mid-autumn" },
    "Chinese New Year's Eve": { lunarMonth: 12, lunarDay: 30, effect: "spring-festival" }
};

// Fixed-date festivals
const fixedFestivals = {
    "01-01": { name: "New Year's Day", effect: "new-year" },
    "02-14": { name: "Valentine's Day", effect: "valentine" },
    "03-08": { name: "Women's Day", effect: "womens-day" },
    "06-01": { name: "Children's Day", effect: "childrens-day" },
    "06-24": { name: "Your Birthday 🎂", effect: "birthday" },
    "10-31": { name: "Halloween", effect: "halloween" },
    "12-25": { name: "Christmas", effect: "christmas" },
    "12-31": { name: "New Year's Eve", effect: "new-year" }
};

// Lunar to Solar (Gregorian) conversion (example for 2025)
const lunarToSolar = (lunarMonth, lunarDay) => {
    const lunar2025 = {
        "1-1": "02-09",
        "1-15": "02-23",
        "5-5": "06-09",
        "8-15": "09-27",
        "12-30": "02-08"
    };
    return lunar2025[`${lunarMonth}-${lunarDay}`];
};

// Show dynamic effects for each festival
function showSpecialEffect(effectKey) {
    specialEffect.innerHTML = ""; // Clear previous effects
    specialEffect.style.display = "block";

    const emojis = emojiEffects[effectKey] || [];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
        confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        specialEffect.appendChild(confetti);
    }

    // Hide the effect after 5 seconds
    setTimeout(() => {
        specialEffect.style.display = "none";
    }, 5000);
}

// Update time and check festivals
function updateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset() + 480; // Beijing time (UTC+8)
    const beijingTime = new Date(now.getTime() + offset * 60 * 1000);

    const year = beijingTime.getFullYear();
    const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
    const date = String(beijingTime.getDate()).padStart(2, '0');
    const hours = String(beijingTime.getHours()).padStart(2, '0');
    const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
    const seconds = String(beijingTime.getSeconds()).padStart(2, '0');

    const currentTime = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    timeDisplay.textContent = `Beijing Time: ${currentTime}`;

    // Check if today's date is a fixed festival
    const today = `${month}-${date}`;
    if (fixedFestivals[today]) {
        const { name, effect } = fixedFestivals[today];
        timeDisplay.textContent += ` 🎉 ${name} is here!`;
        timeDisplay.className = `time-display festival-effect ${effect}`;
        showSpecialEffect(effect);
    }

    // Check if today's date is a lunar festival
    for (const [name, info] of Object.entries(lunarFestivals)) {
        const solarDate = lunarToSolar(info.lunarMonth, info.lunarDay);
        if (today === solarDate) {
            timeDisplay.textContent += ` 🎉 ${name} is here!`;
            timeDisplay.className = `time-display festival-effect ${info.effect}`;
            showSpecialEffect(info.effect);
        }
    }
}

// Update time every second
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
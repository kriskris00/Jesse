// 获取元素
const glowingTitle = document.getElementById('glowing-title');
const mediaContainer = document.getElementById('mediaContainer');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
let currentIndex = 0;
const media = [
    { type: 'image', src: 'J-0.png' },
    { type: 'image', src: 'J-1.PNG' },
    { type: 'image', src: 'J-2.PNG' },
    { type: 'image', src: 'J-3.PNG' },
    { type: 'image', src: 'J-4.png' },
    { type: 'image', src: 'J-5.png' },
    { type: 'image', src: 'J-6.png' },
    { type: 'image', src: 'J-7.png' },
    { type: 'image', src: 'J-8.PNG' },
    { type: 'image', src: 'D-1.JPG' },
    { type: 'image', src: 'D-2.JPG' },
    { type: 'image', src: 'D-3.JPG' },
    { type: 'image', src: 'D-4.JPG' },
    { type: 'image', src: 'D-5.JPG' },
    { type: 'image', src: 'D-6.JPG' },
    { type: 'image', src: 'D-7.JPG' },
    { type: 'image', src: 'D-8.JPG' },
    { type: 'image', src: 'D-9.JPG' },
    { type: 'image', src: 'D-10.JPG' },
    { type: 'image', src: 'D-11.JPG' },
    { type: 'image', src: 'D-12.JPG' },
    { type: 'image', src: 'D-13.JPG' },
    { type: 'image', src: 'D-14.JPG' },
    { type: 'image', src: 'D-15.JPG' },
    { type: 'image', src: 'D-16.JPG' },
    { type: 'image', src: 'D-17.JPG' },
    { type: 'image', src: 'D-18.JPG' },
    { type: 'image', src: 'D-19.JPG' },
    { type: 'image', src: 'D-20.JPG' },
    { type: 'image', src: 'D-21.JPG' },
    { type: 'image', src: 'D-22.JPG' },
    { type: 'image', src: 'D-23.JPG' },
    { type: 'image', src: 'D-24.JPG' },
    { type: 'image', src: 'D-25.JPG' },
    { type: 'image', src: 'D-26.JPG' }
];

// Function to change text color
function changeColor() {
    const randomColor = getRandomColor();
    glowingTitle.style.color = randomColor;
}

// Function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Add click event listener
glowingTitle.addEventListener('click', changeColor);

// 设置发光颜色
glowingTitle.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.5)';

// 切换到下一个媒体
function changeMedia(index) {
    currentIndex = (currentIndex + index + media.length) % media.length;
    const currentMedia = media[currentIndex];
    if (currentMedia.type === 'image') {
        // 显示图片
        const img = document.createElement('img');
        img.src = currentMedia.src;
        img.alt = 'Your Image Description';
        img.style.maxWidth = '80%'; // Adjust image size
        img.style.maxHeight = '80vh'; // Adjust image size
        img.style.display = 'block'; // Ensure image is centered
        img.style.margin = 'auto'; // Ensure image is centered
        replaceMedia(img);
    } else if (currentMedia.type === 'video') {
        // 显示视频
        const video = document.createElement('video');
        video.src = currentMedia.src;
        video.controls = true;
        video.autoplay = true;
        video.style.maxWidth = '80%'; // Adjust video size
        video.style.display = 'block'; // Ensure video is centered
        video.style.margin = 'auto'; // Ensure video is centered
        replaceMedia(video);
    }
}

// 替换当前媒体
function replaceMedia(newMedia) {
    // 移除旧媒体
    while (mediaContainer.firstChild) {
        mediaContainer.removeChild(mediaContainer.firstChild);
    }
    // 添加新媒体
    mediaContainer.appendChild(newMedia);
}

// 监听文档点击事件，判断点击位置来切换媒体
document.addEventListener('click', (event) => {
    const clickedElement = event.target;

    if (clickedElement === prevButton) {
        changeMedia(-1);
    } else if (clickedElement === nextButton) {
        changeMedia(1);
    }
});

// 调整按钮位置
prevButton.style.position = 'absolute';
prevButton.style.left = '10px';
prevButton.style.top = '50%';

nextButton.style.position = 'absolute';
nextButton.style.right = '10px';
nextButton.style.top = '50%';

// 初始加载第一个媒体
changeMedia(0);

// 创建粒子效果画布
function createParticlesCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = '-1';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const particles = [];
    const numParticles = 100;

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 5 + 1,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 2 - 1,
            color: Math.random() < 0.5 ? '#98FB98' : '#FFC0CB' // 使用浅绿色和粉色
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();

            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > canvas.width) {
                particle.vx *= -1;
            }

            if (particle.y < 0 || particle.y > canvas.height) {
                particle.vy *= -1;
            }
        });

        requestAnimationFrame(draw);
    }

    draw();
}

// 初始加载粒子效果
createParticlesCanvas();

const lightModeButton = document.getElementById('lightModeButton');
const darkModeButton = document.getElementById('darkModeButton');
const body = document.body;

lightModeButton.addEventListener('click', () => {
    body.style.backgroundColor = '#fff';
    body.style.color = '#000';
});

darkModeButton.addEventListener('click', () => {
    body.style.backgroundColor = '#000';
    body.style.color = '#fff';
});

// 音乐播放控制
const musicButton = document.getElementById('musicButton');
let isPlaying = false;
const audio = new Audio('path-to-your-audio-file.mp3'); // 替换为实际音乐文件路径

musicButton.addEventListener('click', () => {
    if (isPlaying) {
        audio.pause();
        musicButton.textContent = '🎵 播放背景音乐';
    } else {
        audio.play();
        musicButton.textContent = '⏸ 暂停背景音乐';
    }
    isPlaying = !isPlaying;
});

// 粒子效果加载多张图片
const canvases = document.querySelectorAll('.image-canvas');

canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const src = canvas.getAttribute('data-src');

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        
        let particles = [];

        for (let y = 0; y < img.height; y += 4) {
            for (let x = 0; x < img.width; x += 4) {
                const index = (y * img.width + x) * 4;
                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];
                const a = pixels[index + 3];

                if (a > 128) { // 仅对不透明的像素点生成粒子
                    particles.push({x, y, color: `rgba(${r},${g},${b},${a / 255})`});
                }
            }
        }

        let i = 0;

        function renderParticles() {
            if (i < particles.length) {
                const {x, y, color} = particles[i];
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 4, 4);
                i++;
                requestAnimationFrame(renderParticles);
            }
        }

        renderParticles();
    };

    img.src = src;
});
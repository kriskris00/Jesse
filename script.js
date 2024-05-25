const glowingTitle = document.getElementById('glowing-title');
const mediaContainer = document.getElementById('mediaContainer');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const footerText = document.querySelector('footer p');
let currentIndex = 0;

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
    { type: 'image', src: 'J-11.WEBP' },
    { type: 'image', src: 'D-1.WEBP' },
    { type: 'image', src: 'D-2.WEBP' },
    { type: 'image', src: 'D-3.WEBP' },
    { type: 'image', src: 'D-4.WEBP' },
    { type: 'image', src: 'D-5.WEBP' },
    { type: 'image', src: 'D-6.WEBP' },
    { type: 'image', src: 'D-7.WEBP' },
    { type: 'image', src: 'D-8.WEBP' },
    { type: 'image', src: 'D-9.WEBP' },
    { type: 'image', src: 'D-10.WEBP' },
    { type: 'image', src: 'D-11.WEBP' },
    { type: 'image', src: 'D-12.WEBP' }
];

function changeMedia(index) {
    currentIndex = (currentIndex + index + media.length) % media.length;
    const currentMedia = media[currentIndex];
    if (currentMedia.type === 'image') {
        const img = document.createElement('img');
        img.src = currentMedia.src;
        img.alt = 'Your Image Description';
        img.style.maxWidth = '80%';
        img.style.maxHeight = '80vh';
        img.style.display = 'block';
        img.style.margin = 'auto';

        // 添加图片切换过渡动画
        img.style.opacity = '0';
        img.style.transform = 'scale(1.2)';
        requestAnimationFrame(() => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        });

        replaceMedia(img);
    }
}
// 调整按钮位置
prevButton.style.position = 'absolute';
prevButton.style.left = '10px';
prevButton.style.top = '50%';

nextButton.style.position = 'absolute';
nextButton.style.right = '10px';
nextButton.style.top = '50%';

function replaceMedia(newMedia) {
    while (mediaContainer.firstChild) {
        mediaContainer.removeChild(mediaContainer.firstChild);
    }
    mediaContainer.appendChild(newMedia);
}

prevButton.addEventListener('click', () => changeMedia(-1));
nextButton.addEventListener('click', () => changeMedia(1));
changeMedia(0);

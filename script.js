const glowingTitle = document.getElementById('glowing-title');
const mediaContainer = document.getElementById('mediaContainer');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const footerText = document.querySelector('footer p');
let currentIndex = 0;

const media = [
    { type: 'image', src: 'J-1.png' },
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

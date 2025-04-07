const mediaContainer = document.getElementById('mediaContainer');
const musicButton = document.getElementById('musicButton');
const backgroundMusic = new Audio('1.mp3');

const media = [
  { src: 'selahx1.webp', name: 'REED🌄', date: '2025-01-14' },
  { src: 'DanLevi.webp', name: 'DANLEVI🫶🏻', date: '2025-01-14' },
  { src: '1.WEBP', name: 'FOOTPATH🚶🏼‍♀️‍➡️', date: '2025-04-07' },
  { src: '2.WEBP', name: 'WITHERED TREE🌳', date: '2025-04-07' },
  { src: '3.WEBP', name: 'PEACH BLOSSOM 1🌸', date: '2025-04-07' },
  { src: '4.WEBP', name: 'PEACH BLOSSOM 2🌸', date: '2025-04-07' }
];

const loader = mediaContainer.querySelector('.loader');
let currentIndex = 0;

function initializeMedia() {
  media.forEach((item, index) => {
    const img = new Image();
    img.src = item.src;
    img.alt = item.name;
    img.onload = () => {
      loader.style.display = 'none';
    };
    img.onclick = () => openLightbox(index);
    mediaContainer.appendChild(img);
  });
}

musicButton.addEventListener('click', () => {
  navigator.vibrate?.(100);
  if (backgroundMusic.paused) {
    backgroundMusic.play();
    musicButton.textContent = '⏸️ PLAYING';
  } else {
    backgroundMusic.pause();
    musicButton.textContent = '🎵 PLAY';
  }
});

backgroundMusic.addEventListener('ended', () => {
  musicButton.textContent = '🎵 PLAY';
});

function openLightbox(index, withAnimation = false) {
  currentIndex = index;
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const name = document.getElementById('lightbox-name');
  const date = document.getElementById('lightbox-date');
  const item = media[currentIndex];

  if (withAnimation) {
    img.classList.add('fade-out');
    setTimeout(() => {
      img.src = item.src;
      name.textContent = item.name;
      date.textContent = item.date;
      img.classList.remove('fade-out');
    }, 250);
  } else {
    img.src = item.src;
    name.textContent = item.name;
    date.textContent = item.date;
  }

  lightbox.classList.remove('hidden');
}

function navigateLightbox(direction) {
  if (direction === 'prev') {
    currentIndex = (currentIndex - 1 + media.length) % media.length;
  } else {
    currentIndex = (currentIndex + 1) % media.length;
  }
  openLightbox(currentIndex, true);
}

document.getElementById('closeBtn').addEventListener('click', closeLightbox);
document.getElementById('prevBtn').addEventListener('click', () => navigateLightbox('prev'));
document.getElementById('nextBtn').addEventListener('click', () => navigateLightbox('next'));

initializeMedia();
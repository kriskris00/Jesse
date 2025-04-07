const playBtn = document.getElementById('play-btn');
const audio = document.getElementById('audio');
const images = document.querySelectorAll('.gallery img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeBtn = document.getElementById('close-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');

let currentIndex = 0;

// 自动播放音乐
window.addEventListener('load', () => {
  // 自动播放，防止某些浏览器拦截
  setTimeout(() => {
    audio.play().catch(() => {
      console.log("Auto-play blocked, user must click first");
    });
  }, 100);
});

// 点击播放按钮
playBtn.addEventListener('click', () => {
  audio.play();
});

// 图片点击放大
images.forEach((img, index) => {
  img.addEventListener('click', () => {
    currentIndex = index;
    showImage();
  });
});

function showImage() {
  const img = images[currentIndex];
  lightboxImg.src = img.src;
  lightboxCaption.textContent = img.dataset.info || '';
  lightbox.classList.remove('hidden');
}

// 切换图片
nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % images.length;
  showImage();
});

prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  showImage();
});

// 关闭查看
closeBtn.addEventListener('click', () => {
  lightbox.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lightbox.classList.add('hidden');
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
});

// 页面加载完成后隐藏 loading
window.addEventListener('load', () => {
  document.getElementById('loading-screen').style.display = 'none';
  document.querySelector('.container').style.display = 'flex';
});

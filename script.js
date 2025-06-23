// script.js

document.addEventListener('DOMContentLoaded', function() {
  // Lightbox: 点击图片打开弹窗
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('.lightbox-close');
  document.querySelectorAll('.image-card img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;        // 设置弹窗图片
      lightbox.classList.remove('hidden'); // 显示弹窗
    });
  });
  closeBtn.addEventListener('click', () => {
    lightbox.classList.add('hidden');    // 关闭弹窗
  });
  lightbox.addEventListener('click', function(e) {
    if (e.target === this) {            // 点击遮罩层关闭弹窗
      this.classList.add('hidden');
    }
  });

  // 播放器控制: 模拟加载过程
  const loader = document.getElementById('loader');
  document.querySelector('.play').addEventListener('click', () => {
    loader.classList.remove('hidden');    // 显示加载动画
    setTimeout(() => {
      loader.classList.add('hidden');     // 隐藏加载动画
      // 这里可以添加音频播放逻辑: document.getElementById('audio').play();
    }, 1000);
  });
  document.querySelector('.pause').addEventListener('click', () => {
    loader.classList.add('hidden');       // 停止加载动画
    // 这里可以添加音频暂停逻辑: document.getElementById('audio').pause();
  });
});
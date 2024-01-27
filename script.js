// 获取元素
const glowingTitle = document.getElementById('glowing-title');
const image = document.querySelector('.content img');

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

// 添加CSS样式
glowingTitle.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.5)';
glowingTitle.style.cursor = 'pointer'; /* 添加鼠标指针样式 */

// 添加图片渐显渐出效果
image.style.opacity = 0;

image.addEventListener('load', function() {
    fadeIn(image);
});

function fadeIn(element) {
    let opacity = 0;
    const interval = setInterval(function() {
        if (opacity < 1) {
            opacity += 0.1;
            element.style.opacity = opacity;
        } else {
            clearInterval(interval);
            setTimeout(function() {
                fadeOut(element);
            }, 2000); // 2秒后再执行fadeOut
        }
    }, 200);
}

function fadeOut(element) {
    let opacity = 1;
    const interval = setInterval(function() {
        if (opacity > 0) {
            opacity -= 0.1;
            element.style.opacity = opacity;
        } else {
            clearInterval(interval);
            setTimeout(function() {
                fadeIn(element);
            }, 2000); // 2秒后再执行fadeIn
        }
    }, 200);
}

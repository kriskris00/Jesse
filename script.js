// 获取元素
const glowingTitle = document.getElementById('glowing-title');
const emailImageContainer = document.querySelector('.image-container');

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
glowingTitle.style.cursor = 'pointer';

// 为图片容器添加居中样式
emailImageContainer.style.display = 'flex';
emailImageContainer.style.alignItems = 'center';
emailImageContainer.style.justifyContent = 'center';
emailImageContainer.style.flexDirection = 'column';

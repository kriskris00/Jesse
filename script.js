// Get the elements
const title = document.querySelector('h1');
const paragraph = document.querySelector('p');

// Function to change text color
function changeColor() {
    const randomColor = getRandomColor();
    title.style.color = randomColor;
    paragraph.style.color = randomColor;
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

// Add click event listeners
title.addEventListener('click', changeColor);
paragraph.addEventListener('click', changeColor);

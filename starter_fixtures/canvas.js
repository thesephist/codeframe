const canvas = document.createElement('canvas');
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
canvas.style.cursor = 'pointer';
const ctx = canvas.getContext('2d');

// is the mouse being dragged (clicked down)?
let isDragging = false;

// last positions used to calculated speed
//  and thickness of stroke
let lastPosX = null;
let lastPosY = null;

const onStart = evt => {
    evt.preventDefault();
    if (evt.touches) {
        evt = evt.touches[0];
    }
    isDragging = true;

    // if ctrlKey is pressed, we erase (with white)
    ctx.fillStyle = evt.ctrlKey ? '#fff' : '#000';
    lastPosX = evt.clientX;
    lastPosY = evt.clientY;
}

const onEnd = evt => {
    evt.preventDefault();
    if (evt.touches) {
        evt = evt.touches[0];
    }
    isDragging = false;
    lastPosX = null;
    lastPosY = null;
}

const onMove = evt => {
    evt.preventDefault();
    if (evt.touches) {
        evt = evt.touches[0];
    }
    if (!isDragging) {
        return;
    }

    const xPos = evt.clientX;
    const yPos = evt.clientY;
    const xDif = xPos - lastPosX;
    const yDif = yPos - lastPosY;

    // radius of stroke is calculated based on speed
    let speed = Math.sqrt((xDif * xDif) + (yDif * yDif));
    if (speed > 20) {
        speed = 20;
    }

    ctx.beginPath();
    ctx.arc(xPos, yPos, speed, 0, 2 * Math.PI);
    ctx.fill();

    lastPosX = xPos;
    lastPosY = yPos;
}

canvas.addEventListener('mousedown', onStart);
canvas.addEventListener('touchstart', onStart);

canvas.addEventListener('mouseup', onEnd);
canvas.addEventListener('touchend', onEnd);

canvas.addEventListener('mousemove', onMove);
canvas.addEventListener('touchmove', onMove);

// some browsers pop up the right-click context menu
//  when ctrlKey is pressed with a mouse click. This disables
//  such behavior.
canvas.addEventListener('contextmenu', evt => {
    evt.preventDefault();
    return false;
});

document.body.style.margin = '0';
document.body.appendChild(canvas);

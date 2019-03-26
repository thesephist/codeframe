const display = document.getElementById('nameDisplay');
const inputBox = document.getElementById('nameInput');

inputBox.addEventListener('input', event => {
    display.textContent = event.target.value || '??';
});

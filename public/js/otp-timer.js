// Timer functionality
let timer = 10;
const resendTimer = document.getElementById('resendTimer');
const timerElement = document.getElementById('timer');
const resendLink = document.getElementById('resendLink');

function startTimer() {
    resendTimer.style.display = 'block';
    const timerInterval = setInterval(() => {
        timer--;
        timerElement.textContent = timer;
        if (timer <= 0) {
            clearInterval(timerInterval);
            resendTimer.style.display = 'none';
            resendLink.style.display = 'block';
        }
    }, 1000);
}

startTimer(); // Start the timer initially

// Reset timer and hide "Request again" link when clicked
function resendOTP() {
    timer = 10; // Reset timer
    startTimer(); // Start the timer again
    resendLink.style.display = 'none'; // Hide the "Request again" link
}
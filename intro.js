const video = document.getElementById('intro-video');
const muteButton = document.getElementById('mute-button');
const speedButton = document.getElementById('speed-button');
const controls = document.querySelector('.controls');

video.addEventListener('ended', () => {
    window.location.href = 'home.html';
});

muteButton.addEventListener('click', () => {
    if (video.muted) {
        video.muted = false;
        muteButton.textContent = 'Mute';
    } else {
        video.muted = true;
        muteButton.textContent = 'Unmute';
    }
});

speedButton.addEventListener('click', () => {
    if (video.playbackRate === 1) {
        video.playbackRate = 1.5;
        speedButton.textContent = 'Speed x1';
    } else {
        video.playbackRate = 1;
        speedButton.textContent = 'Speed x1.5';
    }
});

// Hide controls after 5 seconds for a smoother experience
setTimeout(() => {
    controls.classList.add('hidden');
}, 5000);

// Show controls when the video is hovered (optional)
document.querySelector('.video-container').addEventListener('mouseenter', () => {
    controls.classList.remove('hidden');
});
document.querySelector('.video-container').addEventListener('mouseleave', () => {
    controls.classList.add('hidden');
});

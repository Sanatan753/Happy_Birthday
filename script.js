window.addEventListener('scroll', () => {
    // Check if the user has scrolled to the bottom of the page
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        // Reload the page
        location.reload();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Hide the loading screen once everything is loaded
    const loadingScreen = document.getElementById('loading-screen');

    // Simulate loading delay
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        videoContainer.style.display = 'flex';
    }, 3000); // Adjust the delay as needed

    setTimeout(() => {
        controls.classList.add('hidden');
    }, 2000);
});
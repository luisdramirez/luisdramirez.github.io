document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.getAttribute('data-tab');

            // Update Navigation State
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update Content State with Fade
            // First, fade out current active
            const currentActive = document.querySelector('.tab-content.active');
            if (currentActive && currentActive.id === targetTab) return; // Do nothing if same tab

            if (currentActive) {
                currentActive.style.opacity = '0';
                setTimeout(() => {
                    currentActive.classList.remove('active');
                    currentActive.style.display = 'none'; // Ensure it's removed from flow

                    // Activate new tab
                    const newTab = document.getElementById(targetTab);
                    newTab.style.display = 'block';
                    // Trigger reflow
                    void newTab.offsetWidth;
                    newTab.classList.add('active');
                    newTab.style.opacity = '1';
                }, 400); // Wait for transition to finish (half of CSS time for snap)
            } else {
                // Initial load or edge case
                const newTab = document.getElementById(targetTab);
                newTab.classList.add('active');
            }
        });
    });
});

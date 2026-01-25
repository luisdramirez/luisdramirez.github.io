document.addEventListener('DOMContentLoaded', () => {
    // Handle CV Link separately
    const cvLink = document.getElementById('cv-link');
    if (cvLink) {
        cvLink.addEventListener('click', () => {
            window.open('https://drive.google.com/file/d/1qHXQXPom4qjVgArRiF1QsM0I6sQvYkfp/view?usp=sharing', '_blank');
        });
    }

    const navLinks = document.querySelectorAll('.nav-links li[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Noise Transition Elements
    const noiseOverlay = document.getElementById('noise-overlay');
    const turbulence = document.querySelector('#noiseFilter feTurbulence');

    // Function to run the noise sweep animation
    function runNoiseTransition(callback) {
        if (!noiseOverlay || !turbulence) {
            callback();
            return;
        }

        // Show overlay
        noiseOverlay.style.opacity = '1';
        noiseOverlay.style.pointerEvents = 'auto'; // Block clicks during transition

        let startTime = null;
        const duration = 2000; // 2 seconds total
        const startFreq = 0.9;
        const endFreq = 0.01;
        
        // Flag to ensure we only switch tabs once
        let switched = false;

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Interpolate frequency (Exponential decay looks better for SF sweep)
            // freq = start * (end/start)^progress
            const currentFreq = startFreq * Math.pow(endFreq / startFreq, progress);
            
            turbulence.setAttribute('baseFrequency', `${currentFreq} ${currentFreq}`);

            // Switch content halfway through when noise is thickest/distracting
            if (progress > 0.4 && !switched) {
                callback();
                switched = true;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Fade out overlay
                noiseOverlay.style.opacity = '0';
                noiseOverlay.style.pointerEvents = 'none';
            }
        }

        requestAnimationFrame(animate);
    }

    // Standard tab switch logic encapsulated
    function performTabSwitch(targetTab, link) {
         // Update Navigation State
         navLinks.forEach(l => l.classList.remove('active'));
         link.classList.add('active');

         // Update Content State with Fade
         const currentActive = document.querySelector('.tab-content.active');
         
         // If clicking the same tab, do nothing (unless it's projects re-triggering animation? No, standard behavior)
         if (currentActive && currentActive.id === targetTab) return;

         if (currentActive) {
             currentActive.style.opacity = '0';
             setTimeout(() => {
                 currentActive.classList.remove('active');
                 currentActive.style.display = 'none';

                 // Activate new tab
                 const newTab = document.getElementById(targetTab);
                 if (newTab) {
                     newTab.style.display = 'block';
                     // Trigger reflow
                     void newTab.offsetWidth;
                     newTab.classList.add('active');
                     newTab.style.opacity = '1';
                 }
             }, 400); 
         } else {
             const newTab = document.getElementById(targetTab);
             if (newTab) {
                 newTab.classList.add('active');
                 newTab.style.display = 'block';
                 setTimeout(() => newTab.style.opacity = '1', 10);
             }
         }
    }

    // Special logic for Projects switch vs Normal switch
    // The standard switch has a delay (setTimeout 400ms) to wait for fade out.
    // The noise switch handles the visual cover, so we might want to swap INSTANTLY behind the noise.
    
    function instantTabSwitch(targetTab, link) {
        // Update Navigation State
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Hide all tabs
        tabContents.forEach(tab => {
            tab.classList.remove('active');
            tab.style.display = 'none';
            tab.style.opacity = '0';
        });

        // Show new tab immediately (it's hidden by noise overlay)
        const newTab = document.getElementById(targetTab);
        if (newTab) {
            newTab.style.display = 'block';
            newTab.classList.add('active');
            newTab.style.opacity = '1';
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.getAttribute('data-tab');
            
            // If going TO projects, use noise
            if (targetTab === 'projects') {
                runNoiseTransition(() => {
                    instantTabSwitch(targetTab, link);
                });
            } else {
                // Normal transition
                performTabSwitch(targetTab, link);
            }
        });
    });
});

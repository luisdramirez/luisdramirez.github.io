document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const CONFIG = {
        ENABLE_NOISE_ANIMATION: false // Set to true to enable the SF sweep animation
    };

    // Profile picture: fade in when image has loaded (so it fades on refresh instead of popping in)
    const profileImg = document.querySelector('.profile-picture');
    const profileWrapper = document.querySelector('.profile-picture-wrapper');
    if (profileImg && profileWrapper) {
        function showProfilePicture() {
            profileWrapper.classList.add('profile-picture-loaded');
        }
        if (profileImg.complete && profileImg.naturalHeight > 0) {
            requestAnimationFrame(showProfilePicture);
        } else {
            profileImg.addEventListener('load', showProfilePicture);
        }
    }

    // Theme: restore saved preference, then system preference
    const THEME_KEY = 'site-theme';
    const html = document.documentElement;
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
        html.classList.add('dark-mode');
        html.classList.remove('light-mode');
    } else if (saved === 'light') {
        html.classList.add('light-mode');
        html.classList.remove('dark-mode');
    } else {
        html.classList.remove('dark-mode', 'light-mode');
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        function updateIcon() {
            const isDark = html.classList.contains('dark-mode');
            themeToggle.classList.toggle('dark-active', isDark);
            themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }
        updateIcon();
        themeToggle.addEventListener('click', () => {
            const isDark = html.classList.contains('dark-mode');
            if (isDark) {
                html.classList.remove('dark-mode');
                html.classList.add('light-mode');
                localStorage.setItem(THEME_KEY, 'light');
            } else {
                html.classList.add('dark-mode');
                html.classList.remove('light-mode');
                localStorage.setItem(THEME_KEY, 'dark');
            }
            updateIcon();
        });
    }

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

                // Activate new tab (use flex for landing so centering works)
                const newTab = document.getElementById(targetTab);
                if (newTab) {
                    newTab.style.display = targetTab === 'landing' ? 'flex' : 'block';
                    // Trigger reflow
                    void newTab.offsetWidth;
                    newTab.classList.add('active');
                    newTab.style.opacity = '1';
                    // Reset scroll
                    document.querySelector('.content').scrollTop = 0;
                }
            }, 400);
        } else {
            const newTab = document.getElementById(targetTab);
            if (newTab) {
                newTab.classList.add('active');
                newTab.style.display = targetTab === 'landing' ? 'flex' : 'block';
                setTimeout(() => newTab.style.opacity = '1', 10);
                // Reset scroll
                document.querySelector('.content').scrollTop = 0;
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
            newTab.style.display = targetTab === 'landing' ? 'flex' : 'block';
            newTab.classList.add('active');
            newTab.style.opacity = '1';
            // Reset scroll
            document.querySelector('.content').scrollTop = 0;
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.getAttribute('data-tab');

            // Update URL hash without scrolling
            history.pushState(null, null, `#${targetTab}`);

            // If going TO projects, use noise
            if (targetTab === 'projects' && CONFIG.ENABLE_NOISE_ANIMATION) {
                runNoiseTransition(() => {
                    instantTabSwitch(targetTab, link);
                });
            } else {
                // Normal transition
                performTabSwitch(targetTab, link);
            }
        });
    });

    // Check for hash in URL on load
    const hash = window.location.hash.substring(1);
    if (hash) {
        const activeLink = document.querySelector(`.nav-links li[data-tab="${hash}"]`);
        if (activeLink) {
            // Trigger click to reuse logic, but maybe we want to skip animation on initial load?
            // For now, let's just trigger the click so it behaves consistently.
            activeLink.click();
        }
    }

    // Project Expansion Logic
    const projectItems = document.querySelectorAll('.expandable-project-item');
    const projectPortal = document.getElementById('project-portal');

    if (projectItems.length > 0 && projectPortal) {
        let isAnimating = false;

        const closePanel = (wrapper, originalProject) => {
            isAnimating = true;
            wrapper.classList.remove('visible');
            setTimeout(() => {
                wrapper.remove();
                if (originalProject) {
                    originalProject.classList.remove('showing-expanded');
                }
                setTimeout(() => { isAnimating = false; }, 50);
            }, 300);
        };

        projectItems.forEach(projectItem => {
            const imageWrapper = projectItem.querySelector('.project-image');
            if (!imageWrapper) return;

            imageWrapper.addEventListener('mouseenter', () => {
                if (isAnimating || document.querySelector('.project-expanded-wrapper')) {
                    return;
                }

                projectItem.classList.add('showing-expanded');
                const clone = projectItem.cloneNode(true);
                clone.classList.add('expanded');
                clone.classList.remove('showing-expanded');

                // Create close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'close-project-btn';
                closeBtn.innerHTML = '&times;';
                closeBtn.setAttribute('aria-label', 'Close project details');
                clone.appendChild(closeBtn);

                const wrapper = document.createElement('div');
                wrapper.className = 'project-expanded-wrapper';
                const overlay = document.createElement('div');
                overlay.className = 'project-expanded-overlay';
                wrapper.appendChild(overlay);
                wrapper.appendChild(clone);
                projectPortal.appendChild(wrapper);

                // Animate in
                requestAnimationFrame(() => {
                    wrapper.classList.add('visible');
                });

                // Close on button click
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent bubbling
                    closePanel(wrapper, projectItem);
                });

                // Close on overlay click
                overlay.addEventListener('click', () => {
                    closePanel(wrapper, projectItem);
                });
            });
        });
    }

    // Global touch detection
    let hasTouched = false;
    window.addEventListener('touchstart', () => {
        hasTouched = true;
        // Add a class to body for potential CSS adjustments
        document.body.classList.add('is-touch-device');
    }, { capture: true, once: true });

    // Hover Reveal Logic (for Featured Research)
    const revealTriggers = document.querySelectorAll('.hover-reveal-trigger');
    if (revealTriggers.length > 0 && projectPortal) {
        let isAnimating = false;
        let closeTimeout = null;

        const closePanel = (wrapper) => {
            isAnimating = true;
            wrapper.classList.remove('visible');
            setTimeout(() => {
                wrapper.remove();
                setTimeout(() => { isAnimating = false; }, 50);
            }, 300);
        };

        const scheduleClose = (wrapper) => {
            if (closeTimeout) clearTimeout(closeTimeout);
            closeTimeout = setTimeout(() => {
                closePanel(wrapper);
            }, 150);
        };

        const cancelClose = () => {
            if (closeTimeout) clearTimeout(closeTimeout);
        };

        revealTriggers.forEach(trigger => {
            const showPopup = (e) => {
                // Ignore mouseenter if we know this is a touch device
                if (e.type === 'mouseenter' && hasTouched) {
                    return; 
                }

                if (e.type === 'click') {
                    e.preventDefault();
                    e.stopPropagation();
                }

                if (isAnimating || document.querySelector('.project-expanded-wrapper')) {
                    cancelClose();
                    return;
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'project-expanded-wrapper';
                
                const overlay = document.createElement('div');
                overlay.className = 'project-expanded-overlay';
                
                // Allow mouse events to pass through overlay for desktop hover
                // so the trigger remains hovered and doesn't fire mouseleave
                if (e.type === 'mouseenter' && !hasTouched) {
                    overlay.style.pointerEvents = 'none';
                }
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'expandable-project-item expanded';
                // Adjust styles for single image content
                if (window.innerWidth <= 768 || hasTouched) {
                    contentDiv.style.width = '95vw';
                } else {
                    contentDiv.style.width = 'auto';
                }
                contentDiv.style.maxWidth = '95vw'; 
                contentDiv.style.padding = '0';
                contentDiv.style.overflow = 'hidden';
                contentDiv.style.background = 'transparent';
                contentDiv.style.boxShadow = 'none';
                // Ensure centered on mobile
                contentDiv.style.left = '50%';
                contentDiv.style.top = '50%';
                contentDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';

                const img = document.createElement('img');
                img.src = trigger.dataset.revealImage;
                img.alt = 'Featured Research Preview';
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                img.style.borderRadius = '8px';
                img.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
                // Remove max-width constraint on the image itself, let container control it
                // But keep a reasonable cap for desktop
                if (!hasTouched && window.innerWidth > 768) {
                    img.style.maxWidth = '1000px';
                }
                
                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'close-project-btn';
                closeBtn.innerHTML = '&times;';
                closeBtn.style.color = '#fff'; 
                closeBtn.style.background = 'rgba(0,0,0,0.5)';
                closeBtn.style.borderRadius = '50%';
                closeBtn.style.width = '44px'; // Even larger target
                closeBtn.style.height = '44px';
                closeBtn.style.display = 'flex';
                closeBtn.style.alignItems = 'center';
                closeBtn.style.justifyContent = 'center';
                closeBtn.style.fontSize = '28px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.top = '10px';
                closeBtn.style.right = '10px';
                
                contentDiv.appendChild(closeBtn);
                contentDiv.appendChild(img);
                wrapper.appendChild(overlay);
                wrapper.appendChild(contentDiv);
                projectPortal.appendChild(wrapper);

                // Animate in
                requestAnimationFrame(() => {
                    wrapper.classList.add('visible');
                    // CSS handles the scale transform to 1
                });

                // Events
                contentDiv.addEventListener('mouseenter', cancelClose);
                contentDiv.addEventListener('mouseleave', (e) => {
                    if (hasTouched) return;
                    // If moving back to trigger, don't close
                    if (e.relatedTarget === trigger || trigger.contains(e.relatedTarget)) {
                        return;
                    }
                    scheduleClose(wrapper);
                });

                const handleClose = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closePanel(wrapper);
                };

                closeBtn.addEventListener('click', handleClose);
                closeBtn.addEventListener('touchstart', handleClose, {passive: false});
                overlay.addEventListener('click', handleClose);
                overlay.addEventListener('touchstart', handleClose, {passive: false});
            };

            trigger.addEventListener('touchstart', showPopup, {passive: false});
            trigger.addEventListener('mouseenter', showPopup);
            trigger.addEventListener('click', showPopup);

            trigger.addEventListener('mouseleave', (e) => {
                if (hasTouched) return; // Don't close on mouseleave for touch
                
                // If moving into the popup, don't close
                // We can check relatedTarget to see where mouse went
                const wrapper = document.querySelector('.project-expanded-wrapper');
                if (wrapper) {
                    const contentDiv = wrapper.querySelector('.expandable-project-item');
                    if (contentDiv && (e.relatedTarget === contentDiv || contentDiv.contains(e.relatedTarget))) {
                        return;
                    }
                    scheduleClose(wrapper);
                }
            });
        });
    }
});

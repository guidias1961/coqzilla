// Variables - Easy to update
const PUMP_URL = "https://pump.tires";     // pump.tires platform
const CHART_URL = "#";                     // Chart when available
const TELEGRAM_URL = "https://t.me/COQZPLS";                  // Telegram group
const TWITTER_URL = "https://x.com/COQZPLS";                   // Twitter/X profile

// Global state
let coqPowerCount = parseInt(localStorage.getItem('coqPower') || '0');
let roarModeActive = false;
let konamiSequence = [];
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeVariables();
    initializeEventListeners();
    initializeAnimations();
    setupIntersectionObserver();
    updateCoqPowerDisplay();
});

// Populate variables into DOM
function initializeVariables() {
    // URL bindings for pump.tires
    document.querySelectorAll('[data-url="pump"]').forEach(el => {
        el.href = PUMP_URL;
    });
    
    document.querySelectorAll('[data-url="chart"]').forEach(el => {
        el.href = CHART_URL;
    });
    
    document.querySelectorAll('[data-url="telegram"]').forEach(el => {
        el.href = TELEGRAM_URL;
    });
    
    document.querySelectorAll('[data-url="twitter"]').forEach(el => {
        el.href = TWITTER_URL;
    });
}

// Event listeners
function initializeEventListeners() {
    // Button click counter
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn, .nav-cta, .copy-btn')) {
            incrementCoqPower();
        }
    });
    
    // Copy to clipboard - removed since no contract yet
    // Gallery lightbox - removed
    
    // Peck-to-like (chicken emoji clicks)
    document.addEventListener('click', function(e) {
        if (e.target.textContent.includes('🐔') || e.target.textContent.includes('🐓')) {
            createEggShower(e.pageX, e.pageY);
        }
    });
    
    // Gallery lightbox - removed
    
    // Konami code detector
    document.addEventListener('keydown', function(e) {
        konamiSequence.push(e.code);
        if (konamiSequence.length > 10) {
            konamiSequence.shift();
        }
        
        if (konamiSequence.join(',') === konamiCode.join(',')) {
            activateRoarMode();
            konamiSequence = [];
        }
    });
    
    // Roar mode exit
    document.getElementById('exit-roar').addEventListener('click', deactivateRoarMode);
    
    // Easter egg banner close
    document.getElementById('close-easter-egg').addEventListener('click', function() {
        document.getElementById('easter-egg').classList.remove('active');
    });
    
    // Scroll events for stomp effect
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout && !document.body.matches('[style*="prefers-reduced-motion: reduce"]')) {
            scrollTimeout = setTimeout(function() {
                triggerStompEffect();
                scrollTimeout = null;
            }, 500);
        }
    });
    
    // Console easter egg
    setupConsoleEasterEgg();
}

// GSAP Animations (with fallback)
function initializeAnimations() {
    if (typeof gsap !== 'undefined') {
        // Hero image idle animation
        gsap.to('#coq-hero', {
            y: 10,
            rotation: 2,
            duration: 3,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
        });
        
        // Particle system enhancement
        gsap.set('.particles', {
            opacity: 0.6
        });
        
        gsap.to('.particles', {
            rotation: 360,
            duration: 60,
            ease: "none",
            repeat: -1
        });
    } else {
        // Fallback CSS animations are already in place
        console.log('GSAP not loaded, using CSS animations');
    }
}

// Copy to clipboard function
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function showCopyFeedback(btn) {
    const originalText = btn.textContent;
    btn.textContent = '✅';
    btn.style.background = '#00FF7F';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 1500);
}

// COQ Power counter
function incrementCoqPower() {
    coqPowerCount++;
    localStorage.setItem('coqPower', coqPowerCount.toString());
    updateCoqPowerDisplay();
    
    // Animate the counter
    const display = document.getElementById('coq-power-display');
    if (display) {
        display.style.transform = 'scale(1.2)';
        display.style.color = '#00FF7F';
        
        setTimeout(() => {
            display.style.transform = 'scale(1)';
            display.style.color = '';
        }, 200);
    }
}

function updateCoqPowerDisplay() {
    const display = document.getElementById('coq-power-display');
    if (display) {
        display.textContent = coqPowerCount.toLocaleString();
    }
}

// Peck-to-like egg shower
function createEggShower(x, y) {
    const eggCount = 8;
    
    for (let i = 0; i < eggCount; i++) {
        setTimeout(() => {
            createEgg(x + (Math.random() - 0.5) * 100, y);
        }, i * 100);
    }
}

function createEgg(x, y) {
    const egg = document.createElement('div');
    egg.className = 'peck-egg';
    egg.style.left = x + 'px';
    egg.style.top = y + 'px';
    
    document.body.appendChild(egg);
    
    // Remove egg after animation
    setTimeout(() => {
        if (egg.parentNode) {
            egg.parentNode.removeChild(egg);
        }
    }, 2000);
}

// Lightbox functionality - removed for pump.tires version

// Konami Code - Roar Mode
function activateRoarMode() {
    if (roarModeActive) return;
    
    roarModeActive = true;
    document.body.classList.add('roar-mode');
    document.getElementById('roar-indicator').classList.add('active');
    
    // Play roar sound
    playRoarSound();
    
    // Trigger hero roar animation
    const heroImg = document.getElementById('coq-hero');
    if (heroImg) {
        heroImg.classList.add('coq-roar');
        setTimeout(() => {
            heroImg.classList.remove('coq-roar');
        }, 500);
    }
    
    // Auto-deactivate after 10 seconds
    setTimeout(() => {
        if (roarModeActive) {
            deactivateRoarMode();
        }
    }, 10000);
}

function deactivateRoarMode() {
    roarModeActive = false;
    document.body.classList.remove('roar-mode');
    document.getElementById('roar-indicator').classList.remove('active');
}

// WebAudio roar sound generation
function playRoarSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create oscillators for complex roar sound
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        // Configure oscillators
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(80, audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.5);
        
        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(120, audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(60, audioContext.currentTime + 0.5);
        
        // Configure filter for growl effect
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
        
        // Configure gain envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        // Connect audio nodes
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Play the sound
        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        
        // Stop after duration
        oscillator1.stop(audioContext.currentTime + 0.8);
        oscillator2.stop(audioContext.currentTime + 0.8);
        
    } catch (error) {
        console.log('WebAudio not supported, roar mode visual only');
    }
}

// Stomp scroll effect
function triggerStompEffect() {
    const skyline = document.querySelector('.city-skyline');
    if (skyline && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        skyline.classList.add('stomp-dust');
        
        setTimeout(() => {
            skyline.classList.remove('stomp-dust');
        }, 300);
    }
}

// Console easter egg
function setupConsoleEasterEgg() {
    // Override console.log temporarily to detect coq() calls
    const originalLog = console.log;
    
    window.coq = function() {
        const ascii = `
    🐔 COQZILLA ASCII POWER! 🐔
    
         ___
        /   \\
       | COQ |
        \\___/
         | |
      ___| |___
     |         |
     |  ROAAAR! |
     |_________|
        
    You found the secret function!
    COQZILLA sees all... 👁️
        `;
        
        console.log(ascii);
        showEasterEggBanner();
    };
}

function showEasterEggBanner() {
    const banner = document.getElementById('easter-egg');
    banner.classList.add('active');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        banner.classList.remove('active');
    }, 5000);
}

// Intersection Observer for scroll animations
function setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe sections for reveal animations
        document.querySelectorAll('.step-card, .token-card, .roadmap-item, .faq-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navigation background on scroll
window.addEventListener('scroll', function() {
    const nav = document.getElementById('nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(11, 11, 17, 0.98)';
        nav.style.backdropFilter = 'blur(15px)';
    } else {
        nav.style.background = 'rgba(11, 11, 17, 0.95)';
        nav.style.backdropFilter = 'blur(10px)';
    }
});

// Random hero roar trigger
function setupRandomRoars() {
    const heroImg = document.getElementById('coq-hero');
    
    setInterval(() => {
        if (!roarModeActive && Math.random() < 0.3) { // 30% chance every interval
            heroImg.classList.add('coq-roar');
            setTimeout(() => {
                heroImg.classList.remove('coq-roar');
            }, 500);
        }
    }, 15000); // Check every 15 seconds
}

// Initialize random roars after page load
setTimeout(setupRandomRoars, 5000);

// Particle system enhancement
function enhanceParticles() {
    const particles = document.querySelector('.particles');
    if (!particles) return;
    
    // Add more particle layers
    for (let i = 0; i < 3; i++) {
        const layer = particles.cloneNode(true);
        layer.style.animationDelay = `${i * 10}s`;
        layer.style.opacity = `${0.3 - i * 0.1}`;
        particles.parentNode.appendChild(layer);
    }
}

// Call particle enhancement
setTimeout(enhanceParticles, 1000);

// Power level animation on scroll
function animatePowerLevels() {
    const powerBars = document.querySelectorAll('.power-fill');
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.style.width;
                bar.style.width = '0%';
                
                setTimeout(() => {
                    bar.style.width = width;
                }, 500);
            }
        });
    }, { threshold: 0.5 });
    
    powerBars.forEach(bar => observer.observe(bar));
}

// Initialize power level animations
setTimeout(animatePowerLevels, 1000);

// Mobile menu toggle (if needed)
function setupMobileMenu() {
    // Simple responsive behavior
    const navLinks = document.querySelector('.nav-links');
    
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            // Mobile optimizations
            navLinks.style.gap = '0.5rem';
        } else {
            navLinks.style.gap = '';
        }
    });
}

setupMobileMenu();

// Performance optimization: Lazy load images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

setupLazyLoading();

// Error handling for external resources
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'SCRIPT' && e.target.src.includes('gsap')) {
        console.log('GSAP failed to load, using CSS animations only');
    }
}, true);

// Accessibility enhancements
document.addEventListener('keydown', function(e) {
    // Escape key handlers
    if (e.key === 'Escape') {
        if (roarModeActive) {
            deactivateRoarMode();
        }
        if (document.getElementById('easter-egg').classList.contains('active')) {
            document.getElementById('easter-egg').classList.remove('active');
        }
    }
});

// Focus management for lightbox
function manageFocus() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightbox-close');
    
    lightbox.addEventListener('transitionend', function() {
        if (lightbox.classList.contains('active')) {
            closeBtn.focus();
        }
    });
}

manageFocus();

// Preload critical images
function preloadImages() {
    const criticalImages = ['./coqzilla-a.png', './coqzilla-b.png'];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Initialize preloading
preloadImages();

console.log('🐔 COQZILLA pump.tires edition loaded successfully! Try typing coq() in the console...');
console.log('💡 Pro tip: Try the Konami Code for a surprise!');
console.log('🚀 Ready for pump.tires launch with bonding curve mechanics!');

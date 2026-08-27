document.addEventListener('DOMContentLoaded', () => {
    const envelopeWrapper = document.getElementById('envelope-wrapper');
    const envelope = document.getElementById('envelope');
    const scrollContainer = document.getElementById('scroll-container');

    // ===== Envelope interaction =====
    if (envelopeWrapper && envelope) {
        envelopeWrapper.addEventListener('click', () => {
            // Prevent double-clicks
            if (envelope.classList.contains('opened')) return;

            // Step 1: Open the flap + letter rises out
            envelope.classList.add('opened');
            const characterContainer = document.getElementById('envelope-character-container');
            if (characterContainer) characterContainer.classList.add('opened');

            // Step 2: Fade out the envelope
            setTimeout(() => {
                envelopeWrapper.classList.add('fade-out');
            }, 1500);

            // Step 3: Reveal content + enable scrolling
            setTimeout(() => {
                envelopeWrapper.style.display = 'none';
                revealContent();

                // Enable scrolling after envelope is done
                if (scrollContainer) {
                    scrollContainer.classList.add('scrollable');
                }
            }, 2200);
        });
    }

    // ===== Scroll-triggered reveal animations =====
    const scrollRevealItems = document.querySelectorAll('.scroll-reveal');

    if (scrollRevealItems.length > 0 && scrollContainer) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                } else {
                    // Remove when scrolling away so it animates again when returning
                    entry.target.classList.remove('in-view');
                }
            });
        }, {
            root: scrollContainer,
            threshold: 0.3
        });

        scrollRevealItems.forEach(item => observer.observe(item));
    }

    // ===== Hide scroll hint after first scroll =====
    const scrollHint = document.getElementById('scroll-hint');
    if (scrollHint && scrollContainer) {
        scrollContainer.addEventListener('scroll', () => {
            if (scrollContainer.scrollTop > 50) {
                scrollHint.style.opacity = '0';
                scrollHint.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    scrollHint.style.display = 'none';
                }, 500);
            }
        }, { passive: true });
    }
});

/**
 * Reveals all .reveal-item elements in a staggered sequence.
 */
function revealContent() {
    const order = [
        '.outer-background.reveal-item',  // section 1 parchment
        '#header',                         // header
        '.orbit1',
        '.orbit2',
        '.orbit3',
        '.orbit4',
        '.Hm',
        '#scroll-hint'
    ];

    order.forEach((selector, i) => {
        const el = document.querySelector(selector);
        if (el) {
            setTimeout(() => {
                el.classList.add('revealed');
            }, i * 180);
        }
    });
}
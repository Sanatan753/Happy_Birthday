(function () {
    'use strict';

    // =========================================================================
    // IMAGE COLLECTION
    // Add or remove paths here — the gallery adapts to any number of images.
    // =========================================================================
    const IMAGES = [
        'media/images/Gallery_01 (1).jpg',
        'media/images/Gallery_01 (2).jpg',
        'media/images/Gallery_01 (3).jpg',
        'media/images/Gallery_01 (4).jpg',
        'media/images/Gallery_01 (5).jpg',
        'media/images/Gallery_01 (6).jpg',
        'media/images/Gallery_01 (7).jpg',
        'media/images/Gallery_01 (8).jpg',
        'media/images/Gallery_01 (9).jpg',
        'media/images/Gallery_01 (10).jpg',
        'media/images/Gallery_01 (11).jpg',
        'media/images/Gallery_01 (12).jpg',
        'media/images/Gallery_01 (13).jpg',
        'media/images/Gallery_01 (14).jpg',
        'media/images/Gallery_01 (15).jpg',
        'media/images/Gallery_01 (16).jpg',
        'media/images/Gallery_01 (17).jpg',
        'media/images/Gallery_01 (18).jpg',
        'media/images/Gallery_01 (19).jpg',
        'media/images/Gallery_01 (20).jpg',
        'media/images/Gallery_01 (21).jpg',
        'media/images/Gallery_01 (22).jpg',
        'media/images/Gallery_01 (23).jpg',
        'media/images/Gallery_01 (24).jpg',
        'media/images/Gallery_01 (25).jpg',
        'media/images/Gallery_01 (26).jpg',
        'media/images/GFVng_aWMAAiqE-.jpg',
        'media/images/Hatsune.Miku.600.1934363.png',
        'media/images/chase-mallee-hatsune-miku-b-day.png',
        'media/images/klee.jpg',
        'media/images/maxresdefault.jpg',
    ];

    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    const CARD_COUNT = 13;       // Number of simultaneously visible card DOM nodes
    const FRICTION = 0.935;      // Momentum damping per frame (0–1, higher = more glide)
    const DRAG_SENS = 0.009;     // Pointer movement → offset conversion
    const WHEEL_SENS = 0.004;    // Wheel delta → offset conversion

    // =========================================================================
    // STATE
    // =========================================================================
    let offset = 0;              // Continuous scroll position (card-units)
    let velocity = 0;            // Current momentum
    let isDragging = false;
    let lastPX = 0, lastPY = 0;

    // Per-card persistent state
    const dom = [];              // { el: HTMLDivElement, img: HTMLImageElement }
    const slots = [];            // Virtual slot number for each card (integer, grows unbounded)
    const imgIdx = [];           // Current image index for each card

    // Diagonal direction vector (precomputed)
    // The angle of the diagonal rail, measured from the horizontal.
    // Negative = rising to the upper-right.
    const ANGLE_DEG = -24;
    const ANGLE_RAD = ANGLE_DEG * Math.PI / 180;
    const COS_A = Math.cos(ANGLE_RAD);
    const SIN_A = Math.sin(ANGLE_RAD);

    // =========================================================================
    // HELPERS
    // =========================================================================
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    /** Responsive base card width (before scaling). ~35% of viewport. */
    function cardWidth() {
        const vw = window.innerWidth;
        if (vw <= 480) return vw * 0.32;
        if (vw <= 768) return vw * 0.33;
        return vw * 0.35;
    }

    // =========================================================================
    // POSITION CALCULATION
    // Maps a normalised rail position t ∈ [0, 1] to visual properties.
    //   t = 0  →  foreground / lower-left   (large, opaque, high z)
    //   t = 1  →  background / upper-right  (small, faded,  low z)
    // =========================================================================
    function getCardProps(t) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Allow a small margin beyond [0,1] for smooth entry/exit
        const tc = clamp(t, -0.15, 1.15);

        // --- Diagonal endpoints (centered on screen) ---
        const startX = vw * 0.30;
        const startY = vh * 0.88;
        const endX   = vw * 0.88;
        const endY   = vh * 0.10;

        // Non-linear easing: foreground positions are more spread out,
        // background positions are compressed — simulating perspective.
        const e = tc < 0
            ? tc  // linear for overflow region
            : tc * (0.38 + 0.62 * tc);

        const x = lerp(startX, endX, e);
        const y = lerp(startY, endY, e);

        // --- Scale: dramatic decrease with a slight power curve ---
        const st = clamp(tc, 0, 1);
        const scale = lerp(1.35, 0.28, Math.pow(st, 0.82));

        // --- Opacity: fully opaque, only the last card fades out ---
        let opacity = 1.0;
        if (st > 0.88) {
            // Fade out only the very last card as it exits
            opacity = lerp(1.0, 0.0, (st - 0.88) / 0.12);
        }

        // --- Rotation for 3D card feel ---
        const rotateY = -14;                      // constant Y tilt
        const rotateZ = lerp(-2.0, 0.5, st);      // subtle Z variation

        return { x, y, scale, opacity, rotateY, rotateZ };
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    let lightboxOpen = false;
    let dragStartX = 0, dragStartY = 0, dragMoved = false;

    /** Extract a friendly label from a file path */
    function getLabel(src) {
        const name = src.split('/').pop();
        // Remove file extension and clean up
        return name.replace(/\.[^.]+$/, '')
                    .replace(/[_-]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
    }

    function init() {
        const viewport = document.getElementById('gallery-viewport');

        // Lightbox elements
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxClose = document.getElementById('lightbox-close');

        // Preload all images into browser cache
        IMAGES.forEach(src => { const i = new Image(); i.src = src; });

        // Create 13 card DOM elements
        const cw = cardWidth();
        const ch = cw * 2;

        for (let i = 0; i < CARD_COUNT; i++) {
            const el = document.createElement('div');
            el.className = 'gallery-card';
            el.style.width = cw + 'px';
            el.style.height = ch + 'px';

            const img = document.createElement('img');
            img.draggable = false;
            img.alt = '';
            img.src = IMAGES[i % IMAGES.length];
            el.appendChild(img);

            // Hover overlay with image label
            const overlay = document.createElement('div');
            overlay.className = 'card-overlay';
            overlay.textContent = getLabel(IMAGES[i % IMAGES.length]);
            el.appendChild(overlay);

            viewport.appendChild(el);

            dom.push({ el, img, overlay });
            slots.push(i);
            imgIdx.push(i % IMAGES.length);
        }

        // --- Click to enlarge (distinguish from drag) ---
        viewport.addEventListener('pointerdown', (e) => {
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragMoved = false;
        }, true);

        viewport.addEventListener('pointermove', () => {
            dragMoved = true;
        }, true);

        viewport.addEventListener('click', (e) => {
            if (lightboxOpen) return;
            // Only open lightbox if the pointer didn't move much (not a drag)
            const card = e.target.closest('.gallery-card');
            if (!card || dragMoved) return;
            const cardImg = card.querySelector('img');
            if (!cardImg) return;

            lightboxImg.src = cardImg.src;
            lightbox.classList.add('active');
            lightboxOpen = true;
        });

        // --- Close lightbox ---
        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightboxOpen) closeLightbox();
        });

        function closeLightbox() {
            lightbox.classList.remove('active');
            lightboxOpen = false;
        }

        // --- Pointer (mouse + touch unified) ---
        viewport.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);

        // --- Wheel / Trackpad ---
        viewport.addEventListener('wheel', onWheel, { passive: false });

        // --- Prevent native context-menu on long-press ---
        viewport.addEventListener('contextmenu', e => e.preventDefault());

        // --- Handle window resize (update card dimensions) ---
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const cw = cardWidth();
                const ch = cw * 2;
                for (let i = 0; i < CARD_COUNT; i++) {
                    dom[i].el.style.width = cw + 'px';
                    dom[i].el.style.height = ch + 'px';
                }
            }, 100);
        });

        // --- Start render loop ---
        requestAnimationFrame(loop);
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================
    function onDown(e) {
        isDragging = true;
        velocity = 0;
        lastPX = e.clientX;
        lastPY = e.clientY;
        e.preventDefault();
    }

    function onMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - lastPX;
        const dy = e.clientY - lastPY;

        // Project pointer movement onto the diagonal axis direction
        const movement = dx * COS_A + dy * SIN_A;
        const delta = -movement * DRAG_SENS;

        offset += delta;
        velocity = delta;                       // last frame delta = release velocity

        lastPX = e.clientX;
        lastPY = e.clientY;
    }

    function onUp() {
        isDragging = false;
    }

    function onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY * WHEEL_SENS;
        offset += delta;
        velocity = delta * 0.55;                // lighter momentum from wheel
    }

    // =========================================================================
    // ANIMATION LOOP
    // =========================================================================
    function loop() {
        // Apply momentum when not dragging
        if (!isDragging) {
            offset += velocity;
            velocity *= FRICTION;
            if (Math.abs(velocity) < 0.00003) velocity = 0;
        }

        recycle();
        render();
        requestAnimationFrame(loop);
    }

    // =========================================================================
    // CARD RECYCLING — seamless infinite loop
    //
    // Each card maintains a "slot" number.  The visual position of a card is
    //     visualPos = slot − offset
    // and is normalised to [0, CARD_COUNT-1] for rendering.
    //
    // When a card's visual position exits the visible range, it is moved to
    // the opposite end and assigned the next/previous image in sequence.
    // Because the card is off-screen at that moment the swap is invisible.
    // =========================================================================
    function recycle() {
        const n = IMAGES.length;

        for (let i = 0; i < CARD_COUNT; i++) {
            const vp = slots[i] - offset;

            if (vp < -1.3) {
                // Card exited the foreground (lower-left) → send to background
                let maxSlot = -Infinity, maxImg = 0;
                for (let j = 0; j < CARD_COUNT; j++) {
                    if (slots[j] > maxSlot) { maxSlot = slots[j]; maxImg = imgIdx[j]; }
                }
                slots[i] = maxSlot + 1;
                imgIdx[i] = (maxImg + 1) % n;
                dom[i].img.src = IMAGES[imgIdx[i]];
                dom[i].overlay.textContent = getLabel(IMAGES[imgIdx[i]]);
            }
            else if (vp > CARD_COUNT + 0.3) {
                // Card exited the background (upper-right) → send to foreground
                let minSlot = Infinity, minImg = 0;
                for (let j = 0; j < CARD_COUNT; j++) {
                    if (slots[j] < minSlot) { minSlot = slots[j]; minImg = imgIdx[j]; }
                }
                slots[i] = minSlot - 1;
                imgIdx[i] = ((minImg - 1) % n + n) % n;
                dom[i].img.src = IMAGES[imgIdx[i]];
                dom[i].overlay.textContent = getLabel(IMAGES[imgIdx[i]]);
            }
        }
    }

    // =========================================================================
    // RENDER — position all 13 cards using GPU-friendly transforms
    // =========================================================================
    function render() {
        const cw = cardWidth();
        const ch = cw * 2;
        const halfW = cw / 2;
        const halfH = ch / 2;

        for (let i = 0; i < CARD_COUNT; i++) {
            const visualPos = slots[i] - offset;
            const t = visualPos / (CARD_COUNT - 1);       // normalise to ~[0, 1]
            const p = getCardProps(t);

            const el = dom[i].el;

            // translate so the card CENTER sits at (p.x, p.y),
            // then scale + rotate from that center (transform-origin: center).
            el.style.transform =
                'translate3d(' + (p.x - halfW).toFixed(1) + 'px,' +
                                 (p.y - halfH).toFixed(1) + 'px,0) ' +
                'scale(' + p.scale.toFixed(4) + ') ' +
                'rotateY(' + p.rotateY + 'deg) ' +
                'rotateZ(' + p.rotateZ.toFixed(2) + 'deg)';

            el.style.opacity = p.opacity.toFixed(3);

            // z-index: lower visual position (foreground) = higher z-index
            el.style.zIndex = Math.round(CARD_COUNT * 2 - visualPos * 2);
        }
    }

    // =========================================================================
    // BOOT
    // =========================================================================
    document.addEventListener('DOMContentLoaded', init);
})();


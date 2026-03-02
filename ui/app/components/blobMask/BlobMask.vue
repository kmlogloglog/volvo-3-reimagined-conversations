<template>
    <div ref="containerRef" class="blob-mask">
        <canvas ref="maskCanvas"></canvas>
    </div>
</template>

<script setup>
    import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
    import { useIntersectionObserver, useDocumentVisibility } from '@vueuse/core';

    const props = defineProps({
        imageSrc: {
            type: String,
            default: null,
        },
        // Size of the image relative to the container, in percent (0–100).
        // 100 = contain-fit to the full container; 50 = contain-fit within a 50% box.
        imageSize: {
            type: Number,
            default: 100,
            validator: (v) => v > 0 && v <= 100,
        },
    });

    // Animation and shape tuning constants.
    // All values are tweak-friendly — comments describe the visual effect of increasing/decreasing each.
    const config = {
        // Target render rate. Lower = less CPU but choppier motion. Rarely needs changing.
        targetFps: 24,

        // How fast the blob drifts and rotates over time.
        // ↑ faster, more energetic movement  ↓ slower, more meditative drift
        animationSpeed: 0.008,

        // Multiplier on animationSpeed that controls how quickly the blob shape morphs.
        // ↑ shape changes more rapidly  ↓ shape holds its form longer between morphs
        morphSpeed: 0.35,

        // Radius of the blob as a fraction of the shorter canvas dimension (0–1).
        // ↑ larger spotlight covering more of the image  ↓ smaller, tighter reveal
        baseSize: 0.36,

        // Number of vertices around the blob perimeter used to approximate the shape.
        // ↑ smoother silhouette, higher CPU cost  ↓ more polygonal look, cheaper
        angularSegments: 40,

        // How much the noise field displaces each vertex away from a perfect circle.
        // ↑ wilder, more spiky organic shape  ↓ closer to a smooth circle
        morphIntensity: 0.5,

        // Spatial frequency of the noise field that drives the shape.
        // ↑ faster detail changes, more wrinkled surface  ↓ broader, gentler undulations
        noiseScale: 0.5,

        // Speed of the gentle size pulsation (breathing effect).
        // ↑ quicker breathing rhythm  ↓ slower, deeper breaths
        pulseSpeed: 0.7,

        // How much the blob radius swells and shrinks with each pulse (fraction of baseSize).
        // ↑ more visible inhale/exhale  ↓ subtler, nearly static size
        pulseAmount: 0.08,

        // Gaussian blur radius (px) applied to the mask edge before compositing.
        // Controls how soft the transition is between revealed image and transparency.
        // ↑ more feathered, dreamy vignette  ↓ crisper, harder spotlight edge
        edgeBlur: 30,
    };

    // Noise permutation table — deterministic, non-random.
    const permutation = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
        permutation[i] = permutation[i + 256] = (i * 167 + 53) & 255;
    }

    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function lerp(t, a, b) {
        return a + t * (b - a);
    }

    function grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    function noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = fade(x);
        const v = fade(y);
        const w = fade(z);

        const A = permutation[X] + Y;
        const AA = permutation[A] + Z;
        const AB = permutation[A + 1] + Z;
        const B = permutation[X + 1] + Y;
        const BA = permutation[B] + Z;
        const BB = permutation[B + 1] + Z;

        return lerp(w,
                    lerp(v,
                         lerp(u, grad(permutation[AA], x, y, z), grad(permutation[BA], x - 1, y, z)),
                         lerp(u, grad(permutation[AB], x, y - 1, z), grad(permutation[BB], x - 1, y - 1, z))),
                    lerp(v,
                         lerp(u, grad(permutation[AA + 1], x, y, z - 1), grad(permutation[BA + 1], x - 1, y, z - 1)),
                         lerp(u, grad(permutation[AB + 1], x, y - 1, z - 1), grad(permutation[BB + 1], x - 1, y - 1, z - 1))));
    }

    // Precomputed sin/cos tables to avoid per-vertex trig calls.
    const cosTable = new Float32Array(config.angularSegments + 1);
    const sinTable = new Float32Array(config.angularSegments + 1);

    for (let i = 0; i <= config.angularSegments; i++) {
        const angle = (i / config.angularSegments) * Math.PI * 2;
        cosTable[i] = Math.cos(angle);
        sinTable[i] = Math.sin(angle);
    }

    // Returns the noise-displaced radius for a single blob vertex.
    function getMorphedRadius(cosAngle, sinAngle, baseRadius, timeX, timeY) {
        const noiseValue = noise(
            cosAngle * config.noiseScale + noiseOffset + timeX,
            sinAngle * config.noiseScale + noiseOffset + timeY,
            0,
        );
        return baseRadius * (1 + noiseValue * config.morphIntensity);
    }

    // Traces the organic blob outline as a canvas path (does not fill/stroke).
    function traceBlobPath(centerX, centerY, radius, timeX, timeY) {
        ctx.beginPath();

        for (let i = 0; i <= config.angularSegments; i++) {
            const cosAngle = cosTable[i];
            const sinAngle = sinTable[i];

            const morphedRadius = getMorphedRadius(cosAngle, sinAngle, radius, timeX, timeY);
            const x = centerX + cosAngle * morphedRadius;
            const y = centerY + sinAngle * morphedRadius;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();
    }

    // Draws the image contain-fitted to the canvas, then masks it through the
    // animated blob shape. The mask is blurred so edges feather softly.
    function drawMaskedImage() {
        if (!loadedImage) return;

        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        const baseRadius = Math.min(displayWidth, displayHeight) * config.baseSize;
        const pulse = Math.sin(time * config.pulseSpeed) * config.pulseAmount;
        const pulsedRadius = baseRadius * (1 + pulse);

        const loopRadius = 2.0;
        const timeX = Math.cos(morphPhase) * loopRadius;
        const timeY = Math.sin(morphPhase) * loopRadius;

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // --- Step 1: contain-fit image within the imageSize percentage box ---
        // Behaves like <img width="100%" max-width="100%">: scales to fit without
        // overflowing the available area, maintaining aspect ratio.
        const scale = props.imageSize / 100;
        const availW = displayWidth * scale;
        const availH = displayHeight * scale;

        const imgAspect = loadedImage.width / loadedImage.height;
        const availAspect = availW / availH;
        let drawW, drawH;

        if (imgAspect > availAspect) {
            // Image is wider than the box — constrain by width.
            drawW = availW;
            drawH = availW / imgAspect;
        } else {
            // Image is taller than the box — constrain by height.
            drawH = availH;
            drawW = availH * imgAspect;
        }

        const drawX = (displayWidth - drawW) / 2;
        const drawY = (displayHeight - drawH) / 2;

        ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);

        // --- Step 2: mask the image through the blob shape ---
        // We fill the blob path with a blurred opaque shape and composite it
        // as 'destination-in'. This keeps image pixels only where the (blurred)
        // blob is opaque, making everything else transparent.
        // The blur creates the feathered spotlight edge without touching the image.
        traceBlobPath(centerX, centerY, pulsedRadius, timeX, timeY);

        ctx.filter = `blur(${config.edgeBlur}px)`;
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Reset state for the next frame.
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';
    }

    // Canvas context, dimensions, and frame timing.
    const maskCanvas = ref(null);
    const containerRef = ref(null);
    let canvas = null;
    let ctx = null;
    let dpr = 1;
    let displayWidth = 0;
    let displayHeight = 0;
    let time = 0;
    let morphPhase = 0;
    let noiseOffset = 0;
    let animationFrameId = null;
    let lastFrameTime = 0;
    let loadedImage = null;
    let resizeObserver = null;

    const frameInterval = 1000 / config.targetFps;

    // Pause animation when the tab is hidden or the component leaves the viewport.
    const documentVisibility = useDocumentVisibility();
    const isIntersecting = ref(false);
    const prefersReducedMotion = ref(false);

    useIntersectionObserver(
        containerRef,
        ([{ isIntersecting: visible }]) => {
            isIntersecting.value = visible;
        },
        { threshold: 0.1 },
    );

    const shouldAnimate = computed(() => {
        if (prefersReducedMotion.value) return false;
        if (documentVisibility.value === 'hidden') return false;
        if (!isIntersecting.value) return false;
        return true;
    });

    function animate(timestamp) {
        if (!shouldAnimate.value) {
            animationFrameId = null;
            return;
        }

        const elapsed = timestamp - lastFrameTime;

        if (elapsed < frameInterval) {
            animationFrameId = requestAnimationFrame(animate);
            return;
        }

        lastFrameTime = timestamp - (elapsed % frameInterval);

        time += config.animationSpeed;
        morphPhase += config.animationSpeed * config.morphSpeed;

        drawMaskedImage();

        animationFrameId = requestAnimationFrame(animate);
    }

    function updateCanvasSize() {
        if (!canvas) return;

        displayWidth = canvas.offsetWidth;
        displayHeight = canvas.offsetHeight;

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function loadImage(src) {
        loadedImage = null;
        if (!src) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { loadedImage = img; };
        img.src = src;
    }

    function initMask() {
        if (!maskCanvas.value) return;

        canvas = maskCanvas.value;
        ctx = canvas.getContext('2d', { alpha: true });

        updateCanvasSize();

        // ResizeObserver fires after layout but before paint, so the canvas pixel
        // buffer is always updated in the same frame the CSS size changes —
        // preventing the browser from ever rendering a stretched frame.
        resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        resizeObserver.observe(canvas);

        time = 0;
        morphPhase = 0;
        noiseOffset = Math.random() * 1000;
        lastFrameTime = performance.now();

        loadImage(props.imageSrc);
        animate(lastFrameTime);
    }

    function destroyMask() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
    }

    watch(() => props.imageSrc, loadImage);

    watch(shouldAnimate, (val) => {
        if (val && !animationFrameId) {
            lastFrameTime = performance.now();
            animate(lastFrameTime);
        }
    });

    onMounted(() => {
        prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        initMask();
    });

    onUnmounted(() => {
        destroyMask();
    });
</script>

<style lang="scss" scoped>
.blob-mask {
    height: 100%;
    left: 50%;
    max-width: var(--max-width);
    pointer-events: none;
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    width: 100%;
    will-change: transform;
}

.blob-mask canvas {
    width: 100%;
    height: 100%;
}
</style>

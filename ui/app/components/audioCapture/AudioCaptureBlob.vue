<template>
    <div ref="containerRef" class="gradient-blob" :style="blobContainerStyle">
        <div class="gradient-blob-canvas-wrap">
            <canvas ref="gradientCanvas"></canvas>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
    import { useWindowSize, useDebounceFn, useIntersectionObserver, useDocumentVisibility, usePreferredReducedMotion } from '@vueuse/core';

    const props = defineProps({
        gradientStops: {
            type: Array,
            default: () => [
                { position: 0, r: 250, g: 210, b: 200, a: 0.75 },
                { position: 0.35, r: 181, g: 73, b: 3, a: 0.25 },
                { position: 1, r: 89, g: 41, b: 12, a: 0.15 },
            ],
        },
        intensity: {
            type: Number,
            default: 0,
            validator: (v) => v >= 0 && v <= 1,
        },
        bottomAlign: {
            type: Boolean,
            default: false,
        },
        hide: {
            type: Boolean,
            default: false,
        },
    });

    // Animation, shape, and flare tuning constants.
    const config = {
        // Animation
        targetFps: 30,

        // Animation speed
        idleAnimationSpeed: 0.015,
        maxAnimationSpeedBoost: 0.016,

        // Morph speed
        idleMorphSpeed: 0.5,
        maxMorphSpeedBoost: 0.25,

        // Blob shape
        baseSize: 0.2,
        radialRings: 16,
        angularSegments: 40,

        // Idle pulse (fades out as intensity increases)
        pulseSpeed: 0.7,
        idlePulseAmount: 0.15,

        // Noise scale (controls shape smoothness)
        idleNoiseScale: 0.6,
        // Negative value = smoother shape at peak intensity.
        maxNoiseScaleBoost: -0.3,

        // Idle state (floor - never goes below this)
        idleMorphIntensity: 0.8,
        idleSizeMultiplier: 1.0,
        idleFlareIntensity: 0.25,

        // Max boost at intensity = 1 (added to idle)
        maxMorphIntensityBoost: 0.045,
        maxSizeMultiplierBoost: 4,
        maxFlareIntensityBoost: 2.0,

        // Lens flare
        flare: {
            enabled: true,
            size: 0.4,
            offset: { x: -0.25, y: -0.25 },
            color: { r: 255, g: 240, b: 220 },
            rings: 10,
            segments: 28,
            layers: [
                { sizeMultiplier: 1.0, opacity: 0.4 },
                { sizeMultiplier: 0.6, opacity: 0.7 },
                { sizeMultiplier: 0.2, opacity: 1.0 },
            ],
            secondary: {
                enabled: true,
                offsetMultiplier: -0.6,
                sizeMultiplier: 0.5,
                opacityMultiplier: 0.3,
            },
            shimmer: {
                speed: 1.5,
                amount: 0.15,
            },
        },

        // Bottom alignment
        bottomAlignOffsetRem: 5,
        bottomAlignIdleSizeMultiplier: 0.6,
        bottomAlignMaxSizeMultiplierBoost: 1.8,

        // How long the crossfade takes, in seconds.
        fadeDurationSecs: 0.4,

        // Delay before the fade-IN starts, in seconds.
        // The fade-out always starts immediately.
        fadeInDelaySecs: 0.3,
    };

    // Smoothed intensity — plain variable to avoid reactive overhead.
    let smoothedIntensity = 0;

    // Attack/release rates control how fast the blob responds to intensity changes.
    const smoothing = {
        // Higher = faster rise when intensity increases.
        attack: 0.1,
        // Higher = faster decay when intensity decreases.
        release: 0.1,
    };

    // Each blob has its own alpha so fade-out and fade-in can be timed independently.
    // centerAlpha starts at 1, bottomAlpha at 0.
    let centerAlpha = 1;
    let bottomAlpha = 0;
    // Seconds remaining before the incoming blob's fade-in starts.
    let fadeInDelayRemaining = 0;

    // Duration of the gradient color crossfade in seconds.
    const COLOR_FADE_DURATION_SECS = 1.2;

    let currentStops = [...props.gradientStops];
    let nextStops = null;
    // 1 = transition complete, fully on currentStops.
    let colorFadeProgress = 1;

    watch(() => props.gradientStops, (newStops) => {
        // Snapshot mid-fade position in case a second change arrives during transition.
        currentStops = resolvedStops();
        nextStops = [...newStops];
        colorFadeProgress = 0;
    });

    // Interpolates between currentStops and nextStops based on colorFadeProgress.
    function resolvedStops() {
        if (!nextStops || colorFadeProgress >= 1) return currentStops;

        const t = colorFadeProgress;
        const len = Math.max(currentStops.length, nextStops.length);
        const resolved = [];

        for (let i = 0; i < len; i++) {
            const a = currentStops[Math.min(i, currentStops.length - 1)];
            const b = nextStops[Math.min(i, nextStops.length - 1)];
            resolved.push({
                position: a.position + (b.position - a.position) * t,
                r: a.r + (b.r - a.r) * t,
                g: a.g + (b.g - a.g) * t,
                b: a.b + (b.b - a.b) * t,
                a: a.a + (b.a - a.a) * t,
            });
        }

        return resolved;
    }

    // Cached root font size to avoid getComputedStyle calls every frame.
    let cachedRemPx = 16;

    // Reads root font size and updates the cache.
    function updateRemCache() {
        cachedRemPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    }

    // Returns the Y coordinate for the bottom-aligned blob position.
    function getBottomCenterY() {
        return displayHeight - config.bottomAlignOffsetRem * cachedRemPx;
    }

    // Pauses animation when the tab is hidden or the component is off-screen.
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const documentVisibility = useDocumentVisibility();
    const containerRef = ref(null);
    const isIntersecting = ref(false);

    useIntersectionObserver(
        containerRef,
        ([{ isIntersecting: visible }]) => {
            isIntersecting.value = visible;
        },
        { threshold: 0.1 },
    );

    const prefersReducedMotion = usePreferredReducedMotion();

    const shouldAnimate= computed(() => {
        if (prefersReducedMotion.value === 'reduce') return false;
        if (documentVisibility.value === 'hidden') return false;
        if (!isIntersecting.value) return false;
        return true;
    });

    // Perlin noise permutation table — deterministic, non-random.
    const permutation = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
        permutation[i] = permutation[i + 256] = (i * 167 + 53) & 255;
    }

    // Smoothstep curve used internally by Perlin noise.
    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // Linear interpolation between a and b.
    function lerp(t, a, b) {
        return a + t * (b - a);
    }

    // Gradient contribution for a single Perlin lattice point.
    function grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    // 3D Perlin noise, returns a value in roughly [-1, 1].
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

    // Precomputed sin/cos tables shared by blob and flare to avoid per-vertex trig calls.
    const maxSegments = Math.max(config.angularSegments, config.flare.segments);
    const cosTable = new Float32Array(maxSegments + 1);
    const sinTable = new Float32Array(maxSegments + 1);

    for (let i = 0; i <= maxSegments; i++) {
        const angle = (i / maxSegments) * Math.PI * 2;
        cosTable[i] = Math.cos(angle);
        sinTable[i] = Math.sin(angle);
    }

    // Returns the noise-displaced radius for a single vertex.
    function getMorphedRadius(cosAngle, sinAngle, baseRadius, timeX, timeY, noiseOffset, morphIntensity, noiseScale) {
        const noiseValue = noise(
            cosAngle * noiseScale + noiseOffset + timeX,
            sinAngle * noiseScale + noiseOffset + timeY,
            0,
        );
        return baseRadius * (1 + noiseValue * morphIntensity);
    }

    // Samples the gradient stop array and returns an rgba string for the given radius.
    // stops is resolved once per frame in animate() to avoid repeated calls per ring.
    function getGradientColor(normalizedRadius, stops) {
        const clampedPos = Math.max(0, Math.min(1, normalizedRadius));

        let stop1 = stops[0];
        let stop2 = stops[stops.length - 1];

        for (let i = 0; i < stops.length - 1; i++) {
            if (clampedPos >= stops[i].position && clampedPos <= stops[i + 1].position) {
                stop1 = stops[i];
                stop2 = stops[i + 1];
                break;
            }
        }

        const range = stop2.position - stop1.position;
        const factor = range === 0 ? 0 : (clampedPos - stop1.position) / range;

        const r = (stop1.r + (stop2.r - stop1.r) * factor) | 0;
        const g = (stop1.g + (stop2.g - stop1.g) * factor) | 0;
        const b = (stop1.b + (stop2.b - stop1.b) * factor) | 0;
        const a = stop1.a + (stop2.a - stop1.a) * factor;

        return `rgba(${r},${g},${b},${a})`;
    }

    // Returns an rgba color for a flare ring, applying radial falloff and shimmer.
    function getFlareColor(normalizedRadius, layerOpacity, shimmerFactor, flareIntensity) {
        const { color } = config.flare;
        const v = 1 - normalizedRadius;
        // Approximates pow(v, 2.5) without Math.pow.
        const falloff = v * v * Math.sqrt(v);
        const alpha = falloff * layerOpacity * flareIntensity * (1 + shimmerFactor);
        return `rgba(${color.r},${color.g},${color.b},${Math.min(1, alpha)})`;
    }

    // Draws one concentric ring pass for a flare layer with noise-displaced vertices.
    // sizeMultiplier and layerOpacity are scalars to avoid per-frame object spread.
    function drawFlareLayer(
        ctx, centerX, centerY, baseRadius,
        timeX, timeY, noiseOffset,
        sizeMultiplier, layerOpacity, shimmerFactor,
        flareIntensity, morphIntensity, noiseScale,
    ) {
        const { rings, segments } = config.flare;
        const layerRadius = baseRadius * sizeMultiplier;
        const flareMorphIntensity = morphIntensity * 0.7;
        const segmentRatio = maxSegments / segments;

        for (let ring = rings; ring >= 0; ring--) {
            const normalizedRadius = ring / rings;
            const ringRadius = layerRadius * normalizedRadius;
            const color = getFlareColor(normalizedRadius, layerOpacity, shimmerFactor, flareIntensity);

            ctx.beginPath();

            for (let i = 0; i <= segments; i++) {
                const cacheIndex = (i * segmentRatio) | 0;
                const cosAngle = cosTable[cacheIndex];
                const sinAngle = sinTable[cacheIndex];

                const morphedRadius = getMorphedRadius(cosAngle, sinAngle, ringRadius, timeX, timeY, noiseOffset, flareMorphIntensity, noiseScale);
                const x = centerX + cosAngle * morphedRadius;
                const y = centerY + sinAngle * morphedRadius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    // Draws the primary and optional secondary lens flare at the given blob position.
    function drawLensFlare(ctx, blobCenterX, blobCenterY, blobRadius, timeX, timeY, noiseOffset, time, flareIntensity, morphIntensity, noiseScale) {
        if (!config.flare.enabled) return;

        const { offset, size, layers, secondary, shimmer } = config.flare;
        const shimmerFactor = Math.sin(time * shimmer.speed) * shimmer.amount;

        const flareOffsetX = blobRadius * offset.x;
        const flareOffsetY = blobRadius * offset.y;
        const flareCenterX = blobCenterX + flareOffsetX;
        const flareCenterY = blobCenterY + flareOffsetY;
        const flareBaseRadius = blobRadius * size;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (const layer of layers) {
            drawFlareLayer(
                ctx,
                flareCenterX,
                flareCenterY,
                flareBaseRadius,
                timeX,
                timeY,
                noiseOffset,
                layer.sizeMultiplier,
                layer.opacity,
                shimmerFactor,
                flareIntensity,
                morphIntensity,
                noiseScale,
            );
        }

        if (secondary.enabled) {
            const secondaryX = blobCenterX + flareOffsetX * secondary.offsetMultiplier;
            const secondaryY = blobCenterY + flareOffsetY * secondary.offsetMultiplier;
            const secondaryRadius = flareBaseRadius * secondary.sizeMultiplier;

            for (const layer of layers) {
                drawFlareLayer(
                    ctx,
                    secondaryX,
                    secondaryY,
                    secondaryRadius,
                    timeX,
                    timeY,
                    noiseOffset + 50,
                    layer.sizeMultiplier,
                    layer.opacity * secondary.opacityMultiplier,
                    shimmerFactor * 0.5,
                    flareIntensity,
                    morphIntensity,
                    noiseScale,
                );
            }
        }

        ctx.restore();
    }

    // Draws one full blob at the given centerY and alpha, including its lens flare.
    function drawBlob(centerY, alpha, pulsedRadius, timeX, timeY, morphIntensity, noiseScale, flareIntensity, stops) {
        const centerX = displayWidth / 2;
        const segmentRatio = maxSegments / config.angularSegments;

        ctx.save();
        ctx.globalAlpha = alpha;

        for (let ring = config.radialRings; ring >= 0; ring--) {
            const normalizedRadius = ring / config.radialRings;
            const ringRadius = pulsedRadius * normalizedRadius;
            const color = getGradientColor(normalizedRadius, stops);

            ctx.beginPath();

            for (let i = 0; i <= config.angularSegments; i++) {
                const cacheIndex = (i * segmentRatio) | 0;
                const cosAngle = cosTable[cacheIndex];
                const sinAngle = sinTable[cacheIndex];

                const morphedRadius = getMorphedRadius(cosAngle, sinAngle, ringRadius, timeX, timeY, noiseOffset, morphIntensity, noiseScale);
                const x = centerX + cosAngle * morphedRadius;
                const y = centerY + sinAngle * morphedRadius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        drawLensFlare(ctx, centerX, centerY, pulsedRadius, timeX, timeY, noiseOffset, time, flareIntensity, morphIntensity, noiseScale);

        ctx.restore();
    }

    // Canvas context, dimensions, and frame timing state.
    const gradientCanvas = ref(null);
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

    const frameInterval = 1000 / config.targetFps;

    // Reads the canvas layout size and resizes the backing buffer to match DPR.
    // Uses offsetWidth/offsetHeight instead of getBoundingClientRect so that
    // CSS transforms on the container (e.g. scale(0) when hidden) do not
    // cause the canvas to be initialized at 0×0.
    function updateCanvasSize() {
        if (!canvas) return;

        displayWidth = canvas.offsetWidth;
        displayHeight = canvas.offsetHeight;

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        // Refresh cached rem value on every resize.
        updateRemCache();
    }

    // Main render loop — advances time, smooths intensity, crossfades blobs, and draws.
    function animate(timestamp) {
        // Loop exits here; watch(shouldAnimate) restarts it when visible again.
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

        // Asymmetric smoothing: fast attack, slow release.
        const target = props.intensity;
        const factor = target > smoothedIntensity ? smoothing.attack : smoothing.release;
        smoothedIntensity += (target - smoothedIntensity) * factor;

        const elapsedSecs = elapsed / 1000;

        // Advance color crossfade.
        if (nextStops && colorFadeProgress < 1) {
            colorFadeProgress = Math.min(1, colorFadeProgress + elapsedSecs / COLOR_FADE_DURATION_SECS);
            if (colorFadeProgress >= 1) {
                currentStops = [...nextStops];
                nextStops = null;
            }
        }

        // Resolve stops once per frame to avoid repeated calls inside the ring loop.
        const stops = resolvedStops();

        // Outgoing blob fades out immediately; incoming waits fadeInDelaySecs before fading in.
        const fadeStep = elapsedSecs / config.fadeDurationSecs;

        if (props.bottomAlign) {
            // Center fades out immediately
            centerAlpha = Math.max(0, centerAlpha - fadeStep);
            // Bottom fades in after delay
            if (fadeInDelayRemaining > 0) {
                fadeInDelayRemaining = Math.max(0, fadeInDelayRemaining - elapsedSecs);
            } else {
                bottomAlpha = Math.min(1, bottomAlpha + fadeStep);
            }
        } else {
            // Bottom fades out immediately
            bottomAlpha = Math.max(0, bottomAlpha - fadeStep);
            // Center fades in after delay
            if (fadeInDelayRemaining > 0) {
                fadeInDelayRemaining = Math.max(0, fadeInDelayRemaining - elapsedSecs);
            } else {
                centerAlpha = Math.min(1, centerAlpha + fadeStep);
            }
        }

        // Scale animation parameters between idle floor and max boost based on intensity.
        const boost = smoothedIntensity;
        const animationSpeed = config.idleAnimationSpeed + boost * config.maxAnimationSpeedBoost;
        const morphSpeed = config.idleMorphSpeed + boost * config.maxMorphSpeedBoost;
        const morphIntensity = config.idleMorphIntensity + boost * config.maxMorphIntensityBoost;
        const noiseScale = config.idleNoiseScale + boost * config.maxNoiseScaleBoost;
        const sizeMultiplier = config.idleSizeMultiplier + boost * config.maxSizeMultiplierBoost;
        const flareIntensity = config.idleFlareIntensity + boost * config.maxFlareIntensityBoost;

        time += animationSpeed;
        morphPhase += animationSpeed * morphSpeed;

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const baseRadius = Math.min(displayWidth, displayHeight) * config.baseSize * sizeMultiplier;
        const idlePulse = Math.sin(time * config.pulseSpeed) * config.idlePulseAmount * (1 - boost);
        const pulsedRadius = baseRadius * (1 + idlePulse);

        const bottomSizeMultiplier = config.bottomAlignIdleSizeMultiplier + boost * config.bottomAlignMaxSizeMultiplierBoost;
        const bottomBaseRadius = Math.min(displayWidth, displayHeight) * config.baseSize * bottomSizeMultiplier;
        const bottomPulsedRadius = bottomBaseRadius * (1 + idlePulse);

        const loopRadius = 2.0;
        const timeX = Math.cos(morphPhase) * loopRadius;
        const timeY = Math.sin(morphPhase) * loopRadius;

        const centerY = displayHeight / 2;

        if (centerAlpha > 0.01) {
            drawBlob(centerY, centerAlpha, pulsedRadius, timeX, timeY, morphIntensity, noiseScale, flareIntensity, stops);
        }

        if (bottomAlpha > 0.01) {
            drawBlob(getBottomCenterY(), bottomAlpha, bottomPulsedRadius, timeX, timeY, morphIntensity, noiseScale, flareIntensity, stops);
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // Sets up the canvas context and starts the animation loop.
    function initBlob() {
        if (!gradientCanvas.value) return;

        canvas = gradientCanvas.value;
        ctx = canvas.getContext('2d', { alpha: true });

        // Also initializes cachedRemPx.
        updateCanvasSize();

        // Snap to initial alignment without a fade.
        centerAlpha = props.bottomAlign ? 0 : 1;
        bottomAlpha = props.bottomAlign ? 1 : 0;
        fadeInDelayRemaining = 0;

        time = 0;
        morphPhase = 0;
        noiseOffset = Math.random() * 1000;
        lastFrameTime = performance.now();

        animate(lastFrameTime);
    }

    // Cancels any pending animation frame.
    function destroyBlob() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    const debouncedUpdateCanvasSize = useDebounceFn(() => {
        updateCanvasSize();
    }, 150);

    watch([windowWidth, windowHeight], debouncedUpdateCanvasSize);

    watch(() => props.bottomAlign, () => {
        // Reset fade delay so the incoming blob waits before appearing.
        fadeInDelayRemaining = config.fadeInDelaySecs;
    });

    // Drives the show/hide scale+fade animation.
    // Transition is only enabled after mount so an initially-hidden blob snaps to
    // scale(0)/opacity:0 immediately rather than playing the shrink animation.
    const blobVisible = ref(!props.hide);
    const blobTransitionEnabled = ref(false);

    watch(() => props.hide, (val) => {
        blobVisible.value = !val;
    });

    const blobContainerStyle = computed(() => ({
        opacity: blobVisible.value ? 1 : 0,
        transform: `translateZ(0) scale(${blobVisible.value ? 1 : 0})`,
        transition: blobTransitionEnabled.value ? 'opacity 0.4s ease, transform 0.4s ease' : 'none',
    }));

    // Restarts the loop when the component becomes visible; the loop self-exits when hidden.
    watch(shouldAnimate, (val) => {
        if (val && !animationFrameId) {
            lastFrameTime = performance.now();
            animate(lastFrameTime);
        }
    });

    onMounted(() => {
        initBlob();
        // Enable transitions only after the initial paint so an initially-hidden
        // blob starts at scale(0) instantly rather than animating from scale(1).
        requestAnimationFrame(() => {
            blobTransitionEnabled.value = true;
        });
    });

    onUnmounted(() => {
        destroyBlob();
    });
</script>

<style lang="scss" scoped>
$blob-blur: 15px;

@media (max-width: 768px) {
    $blob-blur: 12px;
}

@media (max-width: 480px) {
    $blob-blur: 10px;
}

.gradient-blob {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    filter: blur($blob-blur);
    will-change: filter, transform;
    pointer-events: none;
}

.gradient-blob-canvas-wrap {
    position: absolute;
    width: 100%;
    max-width: var(--max-width);
    height: 100%;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

.gradient-blob canvas {
    width: 100%;
    height: 100%;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
}
</style>

<template>
    <div ref="containerRef" class="gradient-blob">
        <canvas ref="gradientCanvas"></canvas>
    </div>
</template>

<script setup>
    import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
    import { useWindowSize, useDebounceFn, useIntersectionObserver, useDocumentVisibility } from '@vueuse/core';

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
    });

    // ========================================
    // INTERNAL CONFIGURATION
    // ========================================

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
        maxNoiseScaleBoost: -0.3, // Negative = smoother at peak

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
    };

    // ========================================
    // SMOOTHING
    // ========================================

    const smoothedIntensity = ref(0);

    // How fast blob responds to intensity changes (0-1)
    // Lower = slower/organic, Higher = faster/snappy
    const smoothing = {
        attack: 0.1, // Higher = faster rise when intensity increases
        release: 0.1, // Higher = faster decay when intensity decreases
    };

    // ========================================
    // VISIBILITY DETECTION
    // ========================================

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

    const prefersReducedMotion = ref(false);
    onMounted(() => {
        prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    const shouldAnimate = computed(() => {
        if (prefersReducedMotion.value) return false;
        if (documentVisibility.value === 'hidden') return false;
        if (!isIntersecting.value) return false;
        return true;
    });

    // ========================================
    // NOISE FUNCTIONS
    // ========================================

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

    // ========================================
    // PRECOMPUTED ANGLE CACHE
    // ========================================

    const maxSegments = Math.max(config.angularSegments, config.flare.segments);
    const cosTable = new Float32Array(maxSegments + 1);
    const sinTable = new Float32Array(maxSegments + 1);

    for (let i = 0; i <= maxSegments; i++) {
        const angle = (i / maxSegments) * Math.PI * 2;
        cosTable[i] = Math.cos(angle);
        sinTable[i] = Math.sin(angle);
    }

    // ========================================
    // RENDERING FUNCTIONS
    // ========================================

    function getMorphedRadius(cosAngle, sinAngle, baseRadius, timeX, timeY, noiseOffset, morphIntensity, noiseScale) {
        const noiseValue = noise(
            cosAngle * noiseScale + noiseOffset + timeX,
            sinAngle * noiseScale + noiseOffset + timeY,
            0,
        );
        return baseRadius * (1 + noiseValue * morphIntensity);
    }

    function getGradientColor(normalizedRadius) {
        const stops = props.gradientStops;
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

    function getFlareColor(normalizedRadius, layerOpacity, shimmerFactor, flareIntensity) {
        const { color } = config.flare;
        const falloff = Math.pow(1 - normalizedRadius, 2.5);
        const alpha = falloff * layerOpacity * flareIntensity * (1 + shimmerFactor);
        return `rgba(${color.r},${color.g},${color.b},${Math.min(1, alpha)})`;
    }

    function drawFlareLayer(ctx, centerX, centerY, baseRadius, timeX, timeY, noiseOffset, layer, shimmerFactor, flareIntensity, morphIntensity, noiseScale) {
        const { rings, segments } = config.flare;
        const layerRadius = baseRadius * layer.sizeMultiplier;
        const flareMorphIntensity = morphIntensity * 0.7;
        const segmentRatio = maxSegments / segments;

        for (let ring = rings; ring >= 0; ring--) {
            const normalizedRadius = ring / rings;
            const ringRadius = layerRadius * normalizedRadius;
            const color = getFlareColor(normalizedRadius, layer.opacity, shimmerFactor, flareIntensity);

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
                layer,
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
                const modifiedLayer = { ...layer, opacity: layer.opacity * secondary.opacityMultiplier };
                drawFlareLayer(
                    ctx,
                    secondaryX,
                    secondaryY,
                    secondaryRadius,
                    timeX,
                    timeY,
                    noiseOffset + 50,
                    modifiedLayer,
                    shimmerFactor * 0.5,
                    flareIntensity,
                    morphIntensity,
                    noiseScale,
                );
            }
        }

        ctx.restore();
    }

    // ========================================
    // CANVAS STATE
    // ========================================

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

    function updateCanvasSize() {
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        displayWidth = rect.width;
        displayHeight = rect.height;

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function animate(timestamp) {
        if (!shouldAnimate.value) {
            animationFrameId = requestAnimationFrame(animate);
            return;
        }

        const frameInterval = 1000 / config.targetFps;
        const elapsed = timestamp - lastFrameTime;

        if (elapsed < frameInterval) {
            animationFrameId = requestAnimationFrame(animate);
            return;
        }

        lastFrameTime = timestamp - (elapsed % frameInterval);

        // Asymmetric smoothing: fast attack, slow release
        const target = props.intensity;
        const current = smoothedIntensity.value;
        const factor = target > current ? smoothing.attack : smoothing.release;
        smoothedIntensity.value += (target - current) * factor;

        // Idle + boost
        const boost = smoothedIntensity.value;
        const animationSpeed = config.idleAnimationSpeed + boost * config.maxAnimationSpeedBoost;
        const morphSpeed = config.idleMorphSpeed + boost * config.maxMorphSpeedBoost;
        const morphIntensity = config.idleMorphIntensity + boost * config.maxMorphIntensityBoost;
        const noiseScale = config.idleNoiseScale + boost * config.maxNoiseScaleBoost;
        const sizeMultiplier = config.idleSizeMultiplier + boost * config.maxSizeMultiplierBoost;
        const flareIntensity = config.idleFlareIntensity + boost * config.maxFlareIntensityBoost;

        // Time progresses for pulse/shimmer
        time += animationSpeed;

        // Morph phase increments by speed (not multiplied)
        morphPhase += animationSpeed * morphSpeed;

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        const baseRadius = Math.min(displayWidth, displayHeight) * config.baseSize * sizeMultiplier;

        // Pulse fades out as intensity increases - intensity takes over size control
        const idlePulse = Math.sin(time * config.pulseSpeed) * config.idlePulseAmount * (1 - boost);
        const pulsedRadius = baseRadius * (1 + idlePulse);

        const loopRadius = 2.0;
        const timeX = Math.cos(morphPhase) * loopRadius;
        const timeY = Math.sin(morphPhase) * loopRadius;

        const segmentRatio = maxSegments / config.angularSegments;

        // Draw blob
        for (let ring = config.radialRings; ring >= 0; ring--) {
            const normalizedRadius = ring / config.radialRings;
            const ringRadius = pulsedRadius * normalizedRadius;
            const color = getGradientColor(normalizedRadius);

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

        // Draw flare
        drawLensFlare(ctx, centerX, centerY, pulsedRadius, timeX, timeY, noiseOffset, time, flareIntensity, morphIntensity, noiseScale);

        animationFrameId = requestAnimationFrame(animate);
    }

    function initBlob() {
        if (!gradientCanvas.value) return;

        canvas = gradientCanvas.value;
        ctx = canvas.getContext('2d', { alpha: true });

        updateCanvasSize();

        time = 0;
        morphPhase = 0;
        noiseOffset = Math.random() * 1000;
        lastFrameTime = performance.now();

        animate(lastFrameTime);
    }

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

    onMounted(() => {
        initBlob();
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
    will-change: filter;
    transform: translateZ(0);
    pointer-events: none;
}

.gradient-blob canvas {
    width: 100%;
    height: 100%;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
}
</style>

<template>
    <div ref="containerRef" class="gradient-blob" :style="blobContainerStyle">
        <div class="gradient-blob-canvas-wrap">
            <canvas ref="gradientCanvas"></canvas>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
    import type { GradientStop } from '@/types/ui';
    import { useWindowSize, useDebounceFn, useIntersectionObserver, useDocumentVisibility, usePreferredReducedMotion } from '@vueuse/core';

    interface Props {
        gradientStops?: GradientStop[]
        intensity?: number
        bottomAlign?: boolean
        hide?: boolean
        scale?: number
        // 0 = default animation energy, 1 = fully calm (minimal movement)
        calmness?: number
    }

    const props = withDefaults(defineProps<Props>(), {
        gradientStops: undefined,
        intensity: 0,
        bottomAlign: false,
        hide: false,
        scale: 1,
        calmness: 0,
    });

    // Defined outside withDefaults so the reference never changes between
    // renders, preventing the gradient watcher from firing spuriously.
    const DEFAULT_GRADIENT_STOPS: GradientStop[] = [
        { position: 0, r: 250, g: 210, b: 200, a: 0.75 },
        { position: 0.35, r: 181, g: 73, b: 3, a: 0.25 },
        { position: 1, r: 89, g: 41, b: 12, a: 0.15 },
    ];

    const config = {
        // Canvas refresh rate (fps)
        targetFps: 30,

        // Base translation speed when idle
        idleAnimationSpeed: 0.015,
        // Additional speed added at full audio intensity
        maxAnimationSpeedBoost: 0.016,

        // Base shape-change rate when idle
        idleMorphSpeed: 0.5,
        // Additional morph speed at full intensity
        maxMorphSpeedBoost: 0.25,

        // Blob size as fraction of shorter canvas dimension
        baseSize: 0.15,
        // Concentric rings for gradient fill (higher = smoother color bands)
        radialRings: 16,
        // Perimeter polygon segments (higher = smoother silhouette)
        angularSegments: 40,

        // Idle pulse (fades out as intensity increases)
        pulseSpeed: 0.7,
        idlePulseAmount: 0.125,

        // Perlin noise frequency for shape distortion
        idleNoiseScale: 0.6,
        // Negative = smoother shape at peak intensity
        maxNoiseScaleBoost: -0.3,

        // Idle floor — never goes below this
        idleMorphIntensity: 0.8,
        idleSizeMultiplier: 1.0,
        idleFlareIntensity: 0.25,

        // Max boost at intensity = 1 (added to idle)
        maxMorphIntensityBoost: 0.045,
        maxSizeMultiplierBoost: 4,
        maxFlareIntensityBoost: 2.0,

        // Lens flare effect on blob surface
        flare: {
            enabled: true,
            // Flare diameter relative to blob radius
            size: 0.4,
            // Center offset (negative = top-left bias)
            offset: { x: -0.25, y: -0.25 },
            color: { r: 255, g: 240, b: 220 },
            // Concentric flare rings
            rings: 10,
            // Angular segments per ring
            segments: 28,
            // Concentric layers with opacity gradient (outer → inner)
            layers: [
                { sizeMultiplier: 1.0, opacity: 0.4 },
                { sizeMultiplier: 0.6, opacity: 0.7 },
                { sizeMultiplier: 0.2, opacity: 1.0 },
            ],
            // Secondary flare for additional light scatter
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

        // Bottom-aligned mode (blob repositions to bottom of screen)
        bottomAlignOffsetRem: 5,
        bottomAlignIdleSizeMultiplier: 0.6,
        bottomAlignMaxSizeMultiplierBoost: 1.8,

        // Cross-fade duration between center and bottom positions (seconds)
        fadeDurationSecs: 0.4,
        // Delay before the fade-IN starts (fade-out always starts immediately)
        fadeInDelaySecs: 0.3,
    };

    let smoothedIntensity = 0;
    let smoothedScale = 1;

    // Exponential smoothing for audio level transitions
    const smoothing = {
        // Rise speed toward peak (0–1, higher = snappier)
        attack: 0.1,
        // Decay speed toward idle (0–1, higher = quicker falloff)
        release: 0.1,
    };

    // Cross-fade alphas for center ↔ bottom position transition
    let centerAlpha = 1;
    let bottomAlpha = 0;
    let fadeInDelayRemaining = 0;

    // Duration of gradient color interpolation between stop sets
    const COLOR_FADE_DURATION_SECS = 1.2;

    let currentStops: GradientStop[] = [...DEFAULT_GRADIENT_STOPS];
    let nextStops: GradientStop[] | null = null;
    let colorFadeProgress = 1;

    watch(() => props.gradientStops, (newStops) => {
        currentStops = resolvedStops();
        nextStops = [...(newStops ?? DEFAULT_GRADIENT_STOPS)];
        colorFadeProgress = 0;
    });

    // Lerps between currentStops and nextStops based on colorFadeProgress.
    function resolvedStops() {
        if (!nextStops || colorFadeProgress >= 1) return currentStops;

        const t = colorFadeProgress;
        const len = Math.max(currentStops.length, nextStops.length);
        const resolved = [];

        for (let i = 0; i < len; i++) {
            const a = currentStops[Math.min(i, currentStops.length - 1)]!;
            const b = nextStops[Math.min(i, nextStops.length - 1)]!;
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

    let cachedRemPx = 16;

    function updateRemCache() {
        cachedRemPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    }

    function getBottomCenterY() {
        return displayHeight - config.bottomAlignOffsetRem * cachedRemPx;
    }

    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const documentVisibility = useDocumentVisibility();
    const containerRef = ref(null);
    const isIntersecting = ref(false);

    useIntersectionObserver(
        containerRef,
        (entries) => {
            isIntersecting.value = entries[0]?.isIntersecting ?? false;
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

    // Simplified Perlin noise: deterministic permutation table (no random seed needed).
    const permutation = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
        permutation[i] = permutation[i + 256] = (i * 167 + 53) & 255;
    }

    function fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    function grad(hash: number, x: number, y: number, z: number): number {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    // Returns a value in roughly [-1, 1].
    function noise(x: number, y: number, z: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = fade(x);
        const v = fade(y);
        const w = fade(z);

        const A = permutation[X]! + Y;
        const AA = permutation[A]! + Z;
        const AB = permutation[A + 1]! + Z;
        const B = permutation[X + 1]! + Y;
        const BA = permutation[B]! + Z;
        const BB = permutation[B + 1]! + Z;

        return lerp(w,
                    lerp(v,
                         lerp(u, grad(permutation[AA]!, x, y, z), grad(permutation[BA]!, x - 1, y, z)),
                         lerp(u, grad(permutation[AB]!, x, y - 1, z), grad(permutation[BB]!, x - 1, y - 1, z))),
                    lerp(v,
                         lerp(u, grad(permutation[AA + 1]!, x, y, z - 1), grad(permutation[BA + 1]!, x - 1, y, z - 1)),
                         lerp(u, grad(permutation[AB + 1]!, x, y - 1, z - 1), grad(permutation[BB + 1]!, x - 1, y - 1, z - 1))));
    }

    // Pre-computed trig tables for the blob perimeter polygon.
    const maxSegments = Math.max(config.angularSegments, config.flare.segments);
    const cosTable = new Float32Array(maxSegments + 1);
    const sinTable = new Float32Array(maxSegments + 1);

    for (let i = 0; i <= maxSegments; i++) {
        const angle = (i / maxSegments) * Math.PI * 2;
        cosTable[i] = Math.cos(angle);
        sinTable[i] = Math.sin(angle);
    }

    function getMorphedRadius(
        cosAngle: number,
        sinAngle: number,
        baseRadius: number,
        timeX: number,
        timeY: number,
        noiseOffset: number,
        morphIntensity: number,
        noiseScale: number,
    ): number {
        const noiseValue = noise(
            cosAngle * noiseScale + noiseOffset + timeX,
            sinAngle * noiseScale + noiseOffset + timeY,
            0,
        );
        return baseRadius * (1 + noiseValue * morphIntensity);
    }

    function getGradientColor(normalizedRadius: number, stops: GradientStop[]): string {
        const clampedPos = Math.max(0, Math.min(1, normalizedRadius));

        let stop1 = stops[0]!;
        let stop2 = stops[stops.length - 1]!;

        for (let i = 0; i < stops.length - 1; i++) {
            if (clampedPos >= stops[i]!.position && clampedPos <= stops[i + 1]!.position) {
                stop1 = stops[i]!;
                stop2 = stops[i + 1]!;
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

    function getFlareColor(normalizedRadius: number, layerOpacity: number, shimmerFactor: number, flareIntensity: number): string {
        const { color } = config.flare;
        const v = 1 - normalizedRadius;
        // pow(v, 2.5) approximation
        const falloff = v * v * Math.sqrt(v);
        const alpha = falloff * layerOpacity * flareIntensity * (1 + shimmerFactor);
        return `rgba(${color.r},${color.g},${color.b},${Math.min(1, alpha)})`;
    }

    function drawFlareLayer(
        ctx: CanvasRenderingContext2D, centerX: number, centerY: number, baseRadius: number,
        timeX: number, timeY: number, noiseOffset: number,
        sizeMultiplier: number, layerOpacity: number, shimmerFactor: number,
        flareIntensity: number, morphIntensity: number, noiseScale: number,
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
                const cosAngle = cosTable[cacheIndex]!;
                const sinAngle = sinTable[cacheIndex]!;

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

    function drawLensFlare(
        ctx: CanvasRenderingContext2D, blobCenterX: number, blobCenterY: number,
        blobRadius: number, timeX: number, timeY: number, noiseOffset: number,
        time: number, flareIntensity: number, morphIntensity: number, noiseScale: number,
    ) {
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

    function drawBlob(
        centerY: number, alpha: number, pulsedRadius: number,
        timeX: number, timeY: number, morphIntensity: number,
        noiseScale: number, flareIntensity: number, stops: GradientStop[],
    ) {
        const centerX = displayWidth / 2;
        const segmentRatio = maxSegments / config.angularSegments;

        ctx!.save();
        ctx!.globalAlpha = alpha;

        for (let ring = config.radialRings; ring >= 0; ring--) {
            const normalizedRadius = ring / config.radialRings;
            const ringRadius = pulsedRadius * normalizedRadius;
            const color = getGradientColor(normalizedRadius, stops);

            ctx!.beginPath();

            for (let i = 0; i <= config.angularSegments; i++) {
                const cacheIndex = (i * segmentRatio) | 0;
                const cosAngle = cosTable[cacheIndex]!;
                const sinAngle = sinTable[cacheIndex]!;

                const morphedRadius = getMorphedRadius(cosAngle, sinAngle, ringRadius, timeX, timeY, noiseOffset, morphIntensity, noiseScale);
                const x = centerX + cosAngle * morphedRadius;
                const y = centerY + sinAngle * morphedRadius;

                if (i === 0) ctx!.moveTo(x, y);
                else ctx!.lineTo(x, y);
            }

            ctx!.closePath();
            ctx!.fillStyle = color;
            ctx!.fill();
        }

        drawLensFlare(ctx!, centerX, centerY, pulsedRadius, timeX, timeY, noiseOffset, time, flareIntensity, morphIntensity, noiseScale);

        ctx!.restore();
    }

    const gradientCanvas = ref<HTMLCanvasElement | null>(null);
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let dpr = 1;
    let displayWidth = 0;
    let displayHeight = 0;
    let time = 0;
    let morphPhase = 0;
    let noiseOffset = 0;
    let animationFrameId: number | null = null;
    let lastFrameTime = 0;

    const frameInterval = 1000 / config.targetFps;

    // Uses offsetWidth/offsetHeight instead of getBoundingClientRect so CSS
    // transforms (e.g. scale(0) when hidden) don't cause 0×0 initialization.
    function updateCanvasSize() {
        if (!canvas) return;
        if (!ctx) return;

        displayWidth = canvas.offsetWidth;
        displayHeight = canvas.offsetHeight;

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        updateRemCache();
    }

    function animate(timestamp: number) {
        if (!shouldAnimate.value) {
            animationFrameId = null;
            return;
        }
        if (!ctx) return;

        const elapsed = timestamp - lastFrameTime;

        if (elapsed < frameInterval) {
            animationFrameId = requestAnimationFrame(animate);
            return;
        }

        lastFrameTime = timestamp - (elapsed % frameInterval);

        const target = props.intensity;
        const factor = target > smoothedIntensity ? smoothing.attack : smoothing.release;
        smoothedIntensity += (target - smoothedIntensity) * factor;

        smoothedScale += (props.scale - smoothedScale) * 0.05;

        const elapsedSecs = elapsed / 1000;

        if (nextStops && colorFadeProgress < 1) {
            colorFadeProgress = Math.min(1, colorFadeProgress + elapsedSecs / COLOR_FADE_DURATION_SECS);
            if (colorFadeProgress >= 1) {
                currentStops = [...nextStops];
                nextStops = null;
            }
        }

        const stops = resolvedStops();

        const fadeStep = elapsedSecs / config.fadeDurationSecs;

        if (props.bottomAlign) {
            centerAlpha = Math.max(0, centerAlpha - fadeStep);
            if (fadeInDelayRemaining > 0) {
                fadeInDelayRemaining = Math.max(0, fadeInDelayRemaining - elapsedSecs);
            } else {
                bottomAlpha = Math.min(1, bottomAlpha + fadeStep);
            }
        } else {
            bottomAlpha = Math.max(0, bottomAlpha - fadeStep);
            if (fadeInDelayRemaining > 0) {
                fadeInDelayRemaining = Math.max(0, fadeInDelayRemaining - elapsedSecs);
            } else {
                centerAlpha = Math.min(1, centerAlpha + fadeStep);
            }
        }

        const boost = smoothedIntensity;
        // calm = 1 reduces idle animation to ~10% of its default values
        const calm = 1 - props.calmness * 0.9;
        const animationSpeed = config.idleAnimationSpeed * calm + boost * config.maxAnimationSpeedBoost;
        const morphSpeed = config.idleMorphSpeed * calm + boost * config.maxMorphSpeedBoost;
        const morphIntensity = config.idleMorphIntensity * calm + boost * config.maxMorphIntensityBoost;
        const noiseScale = config.idleNoiseScale + boost * config.maxNoiseScaleBoost;
        const sizeMultiplier = smoothedScale * config.idleSizeMultiplier + boost * config.maxSizeMultiplierBoost;
        const flareIntensity = config.idleFlareIntensity + boost * config.maxFlareIntensityBoost;

        time += animationSpeed;
        morphPhase += animationSpeed * morphSpeed;

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const baseRadius = Math.min(displayWidth, displayHeight) * config.baseSize * sizeMultiplier;
        const idlePulse = Math.sin(time * config.pulseSpeed) * config.idlePulseAmount * calm * (1 - boost);
        const pulsedRadius = baseRadius * (1 + idlePulse);

        const bottomSizeMultiplier = smoothedScale * config.bottomAlignIdleSizeMultiplier + boost * config.bottomAlignMaxSizeMultiplierBoost;
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

    function initBlob() {
        if (!gradientCanvas.value) return;

        canvas = gradientCanvas.value;
        ctx = canvas.getContext('2d', { alpha: true });

        updateCanvasSize();

        centerAlpha = props.bottomAlign ? 0 : 1;
        bottomAlpha = props.bottomAlign ? 1 : 0;
        fadeInDelayRemaining = 0;

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

    watch(() => props.bottomAlign, () => {
        fadeInDelayRemaining = config.fadeInDelaySecs;
    });

    // Transition is only enabled after mount so an initially-hidden blob
    // snaps to scale(0)/opacity:0 instead of animating.
    const blobVisible = ref(!props.hide);
    const blobTransitionEnabled = ref(false);

    watch(() => props.hide, (val) => {
        blobVisible.value = !val;
    });

    const blobContainerStyle = computed(() => {
        const transformDuration = props.hide ? '0.5s' : '1.4s';
        return {
            opacity: blobVisible.value ? 1 : 0,
            transform: `translateZ(0) scale(${blobVisible.value ? 1 : 0})`,
            transition: blobTransitionEnabled.value
                ? `opacity 0.4s ease, transform ${transformDuration} ease`
                : 'none',
        };
    });

    watch(shouldAnimate, (val) => {
        if (val && !animationFrameId) {
            lastFrameTime = performance.now();
            animate(lastFrameTime);
        }
    });

    onMounted(() => {
        initBlob();
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
    height: 100%;
    inset: 0;
    position: absolute;
    width: 100%;
}

.gradient-blob canvas {
    width: 100%;
    height: 100%;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
}
</style>

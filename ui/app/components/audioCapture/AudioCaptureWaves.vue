<template>
    <div
        ref="containerRef"
        class="audio-wave-container"
        :style="{ height: `${canvasHeight}px` }">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<script setup>
    import { useResizeObserver } from '@vueuse/core';

    // ============================================
    // PROPS
    // ============================================

    const props = defineProps({
        analyser: {
            type: Object,
            default: null,
        },
        level: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: null,
        },
        lightModeGlowColor: {
            type: Object,
            default: () => ({ r: 0, g: 0, b: 0 }),
        },
        darkModeGlowColor: {
            type: Object,
            default: () => ({ r: 255, g: 255, b: 255 }),
        },
    });

    // ============================================
    // CANVAS CONFIGURATION
    // ============================================

    const canvasHeight = 400;
    const lineWidth = 1.0;
    // Opacity values - different for light and dark modes
    const lightModeLineOpacity = 0.05;
    const lightModeGlowOpacity = 0.25;
    const darkModeLineOpacity = 0.08;
    const darkModeGlowOpacity = 0.15;
    const glowFadeStop = 0.7;
    const BUFFER_LENGTH = 80;
    const EDGE_FADE = 0.15;
    const MAX_AMPLITUDE = 0.38;

    // ============================================
    // PERFORMANCE CONFIGURATION
    // ============================================

    const IDLE_FRAME_INTERVAL = 50; // ~20fps when idle
    const ACTIVE_FRAME_INTERVAL = 33; // ~30fps when active
    const SMOOTHING_WEIGHTS = new Float32Array([0.01, 0.03, 0.07, 0.12, 0.18, 0.18, 0.18, 0.12, 0.07, 0.03, 0.01]);

    // ============================================
    // ACTIVE GLOW CONFIGURATION
    // ============================================

    const activeGlow = {
        color: { r: 255, g: 140, b: 50 },
        amount: 0.8,
        maxOpacity: 0.4,
    };

    // ============================================
    // IDLE CONFIGURATION
    // ============================================

    const idle = {
        smoothingPasses: 6,
    };

    // ============================================
    // ACTIVE CONFIGURATION
    // ============================================

    const active = {
        sineMix: 1.25,
        attackSpeed: 0.5,
        decaySpeed: 0.06,
        silenceAmplitude: 0.035,
        silenceSineMix: 0.8,
    };

    // ============================================
    // WAVE CONFIGURATIONS
    // ============================================

    const waveConfigs = [
        {
            yOffset: 0.30,
            sineCycles: 2.5,
            sineSpeed: 0.012,
            curveTension: 0.5,
            idleAmplitude: 0.025,
            idlePanSpeed: 0.02,
            activeAmplitudeScale: 1.0,
            activeSmoothingPasses: 8,
            activePeakCount: 2,
            activePanSpeed: 0.0018,
        },
        {
            yOffset: 0.28,
            sineCycles: 2,
            sineSpeed: 0.009,
            curveTension: 0.5,
            idleAmplitude: 0.055,
            idlePanSpeed: 0.001,
            activeAmplitudeScale: 0.5,
            activeSmoothingPasses: 10,
            activePeakCount: 3,
            activePanSpeed: 0.0012,
        },
        {
            yOffset: 0.26,
            sineCycles: 1.5,
            sineSpeed: 0.007,
            curveTension: 0.5,
            idleAmplitude: 0.03,
            idlePanSpeed: 0.05,
            activeAmplitudeScale: 0.5,
            activeSmoothingPasses: 12,
            activePeakCount: 3,
            activePanSpeed: 0.0008,
        },
    ];

    // ============================================
    // COLOR HANDLING
    // ============================================

    const colorMode = useColorMode();
    const isMounted = ref(false);
    const isVisible = ref(true); // Start as visible, intersection observer will update
    const hasStartedAudio = ref(false);
    const isInitialRender = ref(true);
    const shouldAnimate = computed(() => isVisible.value);

    const lineColor = computed(() => {
        if (!isMounted.value) return `rgba(128, 128, 128, ${lightModeLineOpacity})`;
        const opacity = colorMode.value === 'dark' ? darkModeLineOpacity : lightModeLineOpacity;
        return colorMode.value === 'dark'
            ? `rgba(255, 255, 255, ${opacity})`
            : `rgba(0, 0, 0, ${opacity})`;
    });

    const baseGlowOpacity = computed(() => {
        if (!isMounted.value) return lightModeGlowOpacity;

        if (colorMode.value === 'dark') {
            return darkModeGlowOpacity;
        } else {
            // Light mode: adjust opacity based on color brightness
            const color = baseGlowColor.value;
            const brightness = getColorBrightness(color);

            if (brightness > 0.5) {
                // For lighter colors, reduce opacity more (make less transparent)
                // const reductionFactor = (brightness - 0.5) * 1.5; // Up to 50% reduction for white
                return lightModeGlowOpacity * 2;
            } else {
                // For darker colors, use configured glow opacity
                return lightModeGlowOpacity;
            }
        }
    });

    const baseGlowColor = computed(() => {
        if (!isMounted.value) return props.lightModeGlowColor;
        return colorMode.value === 'dark' ? props.darkModeGlowColor : props.lightModeGlowColor;
    });

    // COLOR_TRANSITION: Transition duration in milliseconds
    const COLOR_TRANSITION_DURATION = 1000;

    // Color transition state
    const isTransitioning = ref(false);
    const transitionStartTime = ref(0);
    const fromGlowColor = ref(null);
    const toGlowColor = ref(null);
    const currentGlowColor = ref(null);

    function interpolateColor(from, to, progress) {
        return {
            r: Math.round(from.r + (to.r - from.r) * progress),
            g: Math.round(from.g + (to.g - from.g) * progress),
            b: Math.round(from.b + (to.b - from.b) * progress),
        };
    }

    // Calculate color brightness (0-1 scale)
    function getColorBrightness(color) {
        // Use standard luminance formula
        return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
    }

    // Watch for color changes and trigger transitions
    watch(baseGlowColor, (newColor, oldColor) => {
        if (!isMounted.value || !oldColor || !currentGlowColor.value) {
            currentGlowColor.value = newColor;
            return;
        }

        // Start transition
        fromGlowColor.value = { ...currentGlowColor.value };
        toGlowColor.value = { ...newColor };
        isTransitioning.value = true;
        transitionStartTime.value = import.meta.client ? performance.now() : 0;
    }, { immediate: true });

    // ============================================
    // COMPONENT LOGIC
    // ============================================

    const containerRef = ref(null);
    const canvasRef = ref(null);
    let ctx = null;
    let animationId = null;
    let time = 0;
    let lastDrawTime = 0;
    let intersectionObserver = null;
    let visibilityChangeHandler = null;

    // Cached dimensions for performance
    const cachedWidth = ref(0);
    const cachedHeight = ref(0);

    let frequencyData = null;
    let smoothedWaveData = [];
    let peakDefinitions = [];
    let smoothedEnergy = 0;
    let isActiveMode = false;

    // Pre-allocated buffers for smoothArray (avoids GC pressure)
    let smoothBuffer1 = null;
    let smoothBuffer2 = null;

    // Pre-allocated points array for drawing
    let pointsPool = null;

    const initializeBuffers = () => {
        smoothedWaveData = waveConfigs.map(() => new Float32Array(BUFFER_LENGTH));

        // Pre-allocate smoothing buffers
        smoothBuffer1 = new Float32Array(BUFFER_LENGTH);
        smoothBuffer2 = new Float32Array(BUFFER_LENGTH);

        // Pre-allocate points array
        pointsPool = new Array(BUFFER_LENGTH);
        for (let i = 0; i < BUFFER_LENGTH; i++) {
            pointsPool[i] = { x: 0, y: 0 };
        }

        peakDefinitions = waveConfigs.map((config) => {
            const peaks = [];
            for (let i = 0; i < config.activePeakCount * 2; i++) {
                peaks.push({
                    position: Math.random() * 2,
                    width: 0.15 + Math.random() * 0.20,
                    height: 0.5 + Math.random() * 0.5,
                    breatheSpeed: 0.002 + Math.random() * 0.004,
                    breatheAmount: 0.08 + Math.random() * 0.12,
                    breathePhase: Math.random() * Math.PI * 2,
                });
            }
            return peaks;
        });
    };

    const resizeCanvas = () => {
        if (!canvasRef.value || !containerRef.value) return;

        const container = containerRef.value;
        const canvas = canvasRef.value;
        // Use lower DPI for initial render, upgrade after LCP
        const dpr = isInitialRender.value ? 1 : (window.devicePixelRatio || 1);
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // Cache dimensions for performance
        cachedWidth.value = width;
        cachedHeight.value = height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const getEdgeFade = (position) => {
        if (position < EDGE_FADE) {
            const t = position / EDGE_FADE;
            return t * t * (3 - 2 * t);
        } else if (position > 1 - EDGE_FADE) {
            const t = (1 - position) / EDGE_FADE;
            return t * t * (3 - 2 * t);
        }
        return 1;
    };

    const getSineValue = (waveIndex, position, t, panSpeed) => {
        const config = waveConfigs[waveIndex];
        const phaseOffset = waveIndex * Math.PI * 0.4;
        const pan = t * panSpeed;
        return Math.sin(position * Math.PI * 2 * config.sineCycles + t * config.sineSpeed + pan + phaseOffset);
    };

    // Optimized: reuses pre-allocated buffers instead of creating new arrays
    const smoothArray = (arr, passes) => {
        let current = smoothBuffer1;
        let temp = smoothBuffer2;

        // Copy input to current buffer
        for (let i = 0; i < arr.length; i++) {
            current[i] = arr[i];
        }

        for (let p = 0; p < passes; p++) {
            for (let i = 0; i < current.length; i++) {
                let sum = 0;
                let weightSum = 0;

                for (let j = -5; j <= 5; j++) {
                    const idx = Math.max(0, Math.min(current.length - 1, i + j));
                    const weight = SMOOTHING_WEIGHTS[j + 5];
                    sum += current[idx] * weight;
                    weightSum += weight;
                }
                temp[i] = sum / weightSum;
            }
            // Swap buffers
            const swap = current;
            current = temp;
            temp = swap;
        }

        return current;
    };

    const softClamp = (value, max) => {
        // tanh naturally limits values between -1 and 1 with a smooth curve
        // This creates an S-curve that asymptotically approaches the limit without ever hard-clipping
        return max * Math.tanh(value / max);
    };

    // Optimized: simple loop instead of spread operator + map
    const getMaxAbs = (arr) => {
        let max = 0;
        for (let i = 0; i < arr.length; i++) {
            const abs = arr[i] < 0 ? -arr[i] : arr[i];
            if (abs > max) max = abs;
        }
        return max;
    };

    // Optimized: simple loop instead of spread operator + map
    const getMinY = (points, length) => {
        let min = Infinity;
        for (let i = 0; i < length; i++) {
            if (points[i].y < min) min = points[i].y;
        }
        return min;
    };

    const generateActiveData = (waveIndex, energy, t) => {
        const samples = new Float32Array(BUFFER_LENGTH);
        const peaks = peakDefinitions[waveIndex];
        const config = waveConfigs[waveIndex];

        if (!peaks) return samples;

        const panOffset = (t * config.activePanSpeed) % 1;
        const effectiveEnergy = Math.max(energy, active.silenceAmplitude);
        const energyFactor = Math.min(energy / 0.3, 1);
        const currentSineMix = lerp(active.silenceSineMix, active.sineMix, energyFactor);

        for (let i = 0; i < BUFFER_LENGTH; i++) {
            const position = i / (BUFFER_LENGTH - 1);
            let peakValue = 0;

            for (let p = 0; p < peaks.length; p++) {
                const peak = peaks[p];
                const breathe = 1 + Math.sin(t * peak.breatheSpeed + peak.breathePhase) * peak.breatheAmount;

                let peakPos = (peak.position - panOffset) % 2;
                if (peakPos < 0) peakPos += 2;

                if (peakPos > -0.6 && peakPos < 1.6) {
                    const distance = Math.abs(position - peakPos);
                    const pv = Math.exp(-Math.pow(distance / peak.width, 2));
                    peakValue += pv * peak.height * breathe;
                }

                const wrappedPos = peakPos - 1;
                if (wrappedPos > -0.6 && wrappedPos < 1.6) {
                    const distance = Math.abs(position - wrappedPos);
                    const pv = Math.exp(-Math.pow(distance / peak.width, 2));
                    peakValue += pv * peak.height * breathe;
                }
            }

            const sineValue = getSineValue(waveIndex, position, t, config.activePanSpeed);
            const peakContribution = peakValue * effectiveEnergy;
            const sineContribution = sineValue * effectiveEnergy * currentSineMix;

            samples[i] = (peakContribution + sineContribution) * getEdgeFade(position);
        }

        return samples;
    };

    const generateIdleData = (waveIndex, t) => {
        const samples = new Float32Array(BUFFER_LENGTH);
        const config = waveConfigs[waveIndex];

        for (let i = 0; i < BUFFER_LENGTH; i++) {
            const position = i / (BUFFER_LENGTH - 1);
            const sineValue = getSineValue(waveIndex, position, t, config.idlePanSpeed);
            samples[i] = sineValue * config.idleAmplitude * getEdgeFade(position);
        }

        return samples;
    };

    const getAudioEnergy = () => {
        if (!frequencyData || frequencyData.length === 0) {
            return 0;
        }

        const usableBins = Math.floor(frequencyData.length * 0.5);
        let sum = 0;

        for (let i = 0; i < usableBins; i++) {
            sum += frequencyData[i];
        }

        return sum / (usableBins * 255);
    };

    const updateWaveformData = (t) => {
        let rawEnergy = 0;
        let hasAudioSource = false;

        if (props.analyser) {
            hasAudioSource = true;
            if (!frequencyData || frequencyData.length !== props.analyser.frequencyBinCount) {
                frequencyData = new Uint8Array(props.analyser.frequencyBinCount);
            }
            props.analyser.getByteFrequencyData(frequencyData);
            rawEnergy = getAudioEnergy();
        } else if (props.level > 0) {
            hasAudioSource = true;
            const binCount = 256;
            if (!frequencyData || frequencyData.length !== binCount) {
                frequencyData = new Uint8Array(binCount);
            }

            const level = props.level;
            rawEnergy = level / 255;

            for (let i = 0; i < binCount; i++) {
                const falloff = Math.pow(1 - (i / binCount), 0.5);
                frequencyData[i] = Math.floor(level * falloff);
            }
        }

        if (props.isActive !== null) {
            isActiveMode = props.isActive;
        } else {
            isActiveMode = hasAudioSource;
        }

        // Track if audio has started for deferred animation
        if ((rawEnergy > 0.01 || props.level > 0 || props.isActive) && !hasStartedAudio.value) {
            hasStartedAudio.value = true;
            // Upgrade to full DPI after first audio activity
            if (isInitialRender.value) {
                isInitialRender.value = false;
                nextTick(() => resizeCanvas());
            }
        }

        if (rawEnergy > smoothedEnergy) {
            smoothedEnergy = lerp(smoothedEnergy, rawEnergy, active.attackSpeed);
        } else {
            smoothedEnergy = lerp(smoothedEnergy, rawEnergy, active.decaySpeed);
        }

        for (let waveIndex = 0; waveIndex < waveConfigs.length; waveIndex++) {
            const config = waveConfigs[waveIndex];
            const smoothedData = smoothedWaveData[waveIndex];
            if (!smoothedData) continue;

            let targetData;

            if (isActiveMode) {
                const activeData = generateActiveData(waveIndex, smoothedEnergy, t);
                targetData = smoothArray(activeData, config.activeSmoothingPasses);

                for (let i = 0; i < BUFFER_LENGTH; i++) {
                    targetData[i] *= config.activeAmplitudeScale;
                    targetData[i] = softClamp(targetData[i], MAX_AMPLITUDE);
                }
            } else {
                const idleData = generateIdleData(waveIndex, t);
                targetData = smoothArray(idleData, idle.smoothingPasses);
            }

            const transitionRate = isActiveMode ? active.attackSpeed : active.decaySpeed;

            for (let i = 0; i < BUFFER_LENGTH; i++) {
                smoothedData[i] = lerp(smoothedData[i], targetData[i], transitionRate);
            }
        }
    };

    const drawInternal = () => {
        if (!ctx || !canvasRef.value || !containerRef.value || !cachedWidth.value || !cachedHeight.value) return;

        const width = cachedWidth.value;
        const height = cachedHeight.value;
        const centerY = height * 0.5;
        const now = performance.now();

        ctx.clearRect(0, 0, width, height);

        time += 1;
        updateWaveformData(time);

        // Update color transition if active
        if (isTransitioning.value && fromGlowColor.value && toGlowColor.value) {
            const transitionElapsed = now - transitionStartTime.value;
            const transitionProgress = Math.min(transitionElapsed / COLOR_TRANSITION_DURATION, 1);

            // Use easing function for smooth transition
            const easedProgress = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);

            currentGlowColor.value = interpolateColor(fromGlowColor.value, toGlowColor.value, easedProgress);

            if (transitionProgress >= 1) {
                isTransitioning.value = false;
                fromGlowColor.value = null;
                toGlowColor.value = null;
            }
        }

        const sliceWidth = width / (BUFFER_LENGTH - 1);

        for (let waveIndex = 0; waveIndex < waveConfigs.length; waveIndex++) {
            const config = waveConfigs[waveIndex];
            const waveData = smoothedWaveData[waveIndex];
            if (!waveData) continue;

            const maxVal = getMaxAbs(waveData);
            if (maxVal < 0.001) continue;

            const waveCenterY = centerY + config.yOffset * height;

            // Reuse pre-allocated points array
            for (let i = 0; i < BUFFER_LENGTH; i++) {
                pointsPool[i].x = i * sliceWidth;
                pointsPool[i].y = waveCenterY - waveData[i] * height;
            }

            // Calculate color blend based on intensity
            const intensity = isActiveMode ? Math.min(maxVal / MAX_AMPLITUDE, 1) : 0;
            const colorBlend = intensity * activeGlow.amount;

            const base = currentGlowColor.value || baseGlowColor.value;
            const glowR = Math.round(lerp(base.r, activeGlow.color.r, colorBlend));
            const glowG = Math.round(lerp(base.g, activeGlow.color.g, colorBlend));
            const glowB = Math.round(lerp(base.b, activeGlow.color.b, colorBlend));

            // Boost opacity based on intensity
            const currentGlowOpacity = baseGlowOpacity.value;
            const topOpacity = lerp(currentGlowOpacity, activeGlow.maxOpacity, colorBlend);

            // Create gradient with proper fade-out at bottom
            const minY = getMinY(pointsPool, BUFFER_LENGTH);
            const gradientEndY = minY + (height - minY) * glowFadeStop;
            const gradient = ctx.createLinearGradient(0, minY, 0, gradientEndY);
            gradient.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, ${topOpacity})`);
            gradient.addColorStop(1, `rgba(${glowR}, ${glowG}, ${glowB}, 0)`);

            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(pointsPool[0].x, pointsPool[0].y);

            for (let i = 0; i < BUFFER_LENGTH - 1; i++) {
                const p0 = pointsPool[Math.max(0, i - 1)];
                const p1 = pointsPool[i];
                const p2 = pointsPool[i + 1];
                const p3 = pointsPool[Math.min(BUFFER_LENGTH - 1, i + 2)];

                ctx.bezierCurveTo(
                    p1.x + (p2.x - p0.x) * config.curveTension / 3,
                    p1.y + (p2.y - p0.y) * config.curveTension / 3,
                    p2.x - (p3.x - p1.x) * config.curveTension / 3,
                    p2.y - (p3.y - p1.y) * config.curveTension / 3,
                    p2.x, p2.y,
                );
            }

            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            // Stroke line
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = lineColor.value;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pointsPool[0].x, pointsPool[0].y);

            for (let i = 0; i < BUFFER_LENGTH - 1; i++) {
                const p0 = pointsPool[Math.max(0, i - 1)];
                const p1 = pointsPool[i];
                const p2 = pointsPool[i + 1];
                const p3 = pointsPool[Math.min(BUFFER_LENGTH - 1, i + 2)];

                ctx.bezierCurveTo(
                    p1.x + (p2.x - p0.x) * config.curveTension / 3,
                    p1.y + (p2.y - p0.y) * config.curveTension / 3,
                    p2.x - (p3.x - p1.x) * config.curveTension / 3,
                    p2.y - (p3.y - p1.y) * config.curveTension / 3,
                    p2.x, p2.y,
                );
            }

            ctx.stroke();
        }
    };

    const draw = () => {
        if (!shouldAnimate.value) {
            animationId = requestAnimationFrame(draw);
            return;
        }

        const now = performance.now();

        // Throttle framerate for performance
        const frameInterval = isActiveMode ? ACTIVE_FRAME_INTERVAL : IDLE_FRAME_INTERVAL;
        if (now - lastDrawTime < frameInterval) {
            animationId = requestAnimationFrame(draw);
            return;
        }
        lastDrawTime = now;

        drawInternal();
        animationId = requestAnimationFrame(draw);
    };

    const setupVisibilityObserver = () => {
        if (!containerRef.value) return;

        // Intersection Observer for visibility
        intersectionObserver = new IntersectionObserver(
            (entries) => {
                isVisible.value = entries[0].isIntersecting;
            },
            { threshold: 0.1 },
        );
        intersectionObserver.observe(containerRef.value);

        // Page visibility API
        visibilityChangeHandler = () => {
            if (document.visibilityState === 'hidden') {
                isVisible.value = false;
            } else if (intersectionObserver) {
                // Re-check intersection when tab becomes visible
                const entries = intersectionObserver.takeRecords();
                if (entries.length > 0) {
                    isVisible.value = entries[0].isIntersecting;
                }
            }
        };
        document.addEventListener('visibilitychange', visibilityChangeHandler);
    };

    useResizeObserver(containerRef, () => {
        resizeCanvas();
    });

    onMounted(() => {
        isMounted.value = true;
        currentGlowColor.value = baseGlowColor.value;
        initializeBuffers();
        resizeCanvas();
        setupVisibilityObserver();
        draw();
    });

    onUnmounted(() => {
        if (animationId) cancelAnimationFrame(animationId);
        if (intersectionObserver) {
            intersectionObserver.disconnect();
            intersectionObserver = null;
        }
        if (visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', visibilityChangeHandler);
            visibilityChangeHandler = null;
        }
    });
</script>

<style scoped lang="scss">
.audio-wave-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 5;

    canvas {
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
    }
}
</style>

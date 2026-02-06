<template>
    <!-- we use canvas for better CPU performance -->
    <canvas
        ref="canvasRef"
        class="gradient-canvas">
    </canvas>
</template>

<script setup>
    const props = defineProps({
        lightModeColor: {
            type: Object,
            default: () => ({ r: 191, g: 154, b: 103 }),
        },
        darkModeColor: {
            type: Object,
            default: () => ({ r: 191, g: 154, b: 103 }),
        },
        alpha: {
            type: Number,
            default: 0.75,
        },
    });

    const colorMode = import.meta.client ? useColorMode() : { value: 'light' };
    const isMounted = ref(false);

    const color = computed(() => {
        if (!isMounted.value) return props.lightModeColor;
        return colorMode.value === 'dark' ? props.darkModeColor : props.lightModeColor;
    });

    // COLOR_TRANSITION: Transition duration in milliseconds
    const COLOR_TRANSITION_DURATION = 1000;

    // Color transition state
    const isTransitioning = ref(false);
    const transitionStartTime = ref(0);
    const fromColor = ref(null);
    const toColor = ref(null);
    const currentColor = ref(null);

    // Watch for color changes and trigger transitions
    watch(color, (newColor, oldColor) => {
        if (!isMounted.value || !oldColor || !currentColor.value) {
            currentColor.value = newColor;
            return;
        }

        // Start transition
        fromColor.value = { ...currentColor.value };
        toColor.value = { ...newColor };
        isTransitioning.value = true;
        transitionStartTime.value = import.meta.client ? performance.now() : 0;
    }, { immediate: true });

    // CIRCLE_COUNT: Number of circles (integer)
    const CIRCLE_COUNT = 3;

    // DURATION: Animation cycle length in milliseconds
    const MIN_DURATION = 5000;
    const MAX_DURATION = 8000;

    // SIZE: Circle diameter as ratio of screen WIDTH (0-1+)
    const MIN_SIZE = 2;
    const MAX_SIZE = 3;

    // SPAWN_X: Horizontal position as ratio of screen WIDTH (0-1)
    const SPAWN_X_MIN = -0.2;
    const SPAWN_X_MAX = 1.2;

    // SPAWN_AREA_HEIGHT: Spawn zone as ratio of screen HEIGHT (0-1)
    const SPAWN_AREA_HEIGHT = 0.35;

    // SPAWN_Y: Vertical position as ratio of screen HEIGHT (0-1)
    const SPAWN_Y_MIN = 1 - SPAWN_AREA_HEIGHT;
    const SPAWN_Y_MAX = 1.1;

    // FADE_MASK: Vertical fade mask positions as ratio of screen HEIGHT (0-1)
    const FADE_MASK_START = 0.65;
    const FADE_MASK_END = 1.0;

    const canvasRef = ref(null);
    let animationId = null;
    let circles = [];
    let lastFrameTime = 0;
    const TARGET_FPS = 15;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    function interpolateColor(from, to, progress) {
        return {
            r: Math.round(from.r + (to.r - from.r) * progress),
            g: Math.round(from.g + (to.g - from.g) * progress),
            b: Math.round(from.b + (to.b - from.b) * progress),
        };
    }

    function randomizeCircle(circle) {
        circle.x = randomBetween(SPAWN_X_MIN, SPAWN_X_MAX);
        circle.y = randomBetween(SPAWN_Y_MIN, SPAWN_Y_MAX);
        circle.size = randomBetween(MIN_SIZE, MAX_SIZE);
        circle.duration = randomBetween(MIN_DURATION, MAX_DURATION);
        circle.startTime = import.meta.client ? performance.now() : 0;
    }

    function generateCircle(index) {
        const circle = {
            x: 0,
            y: 0,
            size: 0,
            duration: 0,
            startTime: 0,
            initialDelay: (index / CIRCLE_COUNT) * MAX_DURATION,
        };
        randomizeCircle(circle);
        circle.startTime = (import.meta.client ? performance.now() : 0) - circle.initialDelay;
        return circle;
    }

    function drawCircle(ctx, circle, time, width, height) {
        const elapsed = time - circle.startTime;
        const progress = (elapsed % circle.duration) / circle.duration;
        const pulseOpacity = Math.sin(progress * Math.PI);

        if (elapsed >= circle.duration) {
            randomizeCircle(circle);
        }

        if (pulseOpacity < 0.03) return;

        const scale = 0.9 + (pulseOpacity * 0.3);
        const sizePixels = circle.size * width * scale;
        const x = circle.x * width;
        const y = circle.y * height;

        // Update color transition if active
        if (isTransitioning.value && fromColor.value && toColor.value) {
            const transitionElapsed = time - transitionStartTime.value;
            const transitionProgress = Math.min(transitionElapsed / COLOR_TRANSITION_DURATION, 1);

            // Use easing function for smooth transition
            const easedProgress = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);

            currentColor.value = interpolateColor(fromColor.value, toColor.value, easedProgress);

            if (transitionProgress >= 1) {
                isTransitioning.value = false;
                fromColor.value = null;
                toColor.value = null;
            }
        }

        const { r, g, b } = currentColor.value || color.value;
        const alpha = props.alpha;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, sizePixels / 2);

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * pulseOpacity})`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * pulseOpacity * 0.6})`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * pulseOpacity * 0.2})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, sizePixels / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function applyFadeMask(ctx, width, height) {
        ctx.globalCompositeOperation = 'destination-in';

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(FADE_MASK_START, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(FADE_MASK_END, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'source-over';
    }

    function resizeCanvas() {
        if (!import.meta.client) return;
        const canvas = canvasRef.value;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }

    function animate(timestamp) {
        if (!import.meta.client) return;
        animationId = requestAnimationFrame(animate);

        const delta = timestamp - lastFrameTime;
        if (delta < FRAME_INTERVAL) return;
        lastFrameTime = timestamp - (delta % FRAME_INTERVAL);

        const canvas = canvasRef.value;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        ctx.clearRect(0, 0, rect.width, rect.height);

        for (let i = 0; i < circles.length; i++) {
            drawCircle(ctx, circles[i], timestamp, rect.width, rect.height);
        }

        applyFadeMask(ctx, rect.width, rect.height);
    }

    onMounted(() => {
        if (!import.meta.client) return;
        isMounted.value = true;
        currentColor.value = color.value;
        circles = Array.from({ length: CIRCLE_COUNT }, (_, i) => generateCircle(i));
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animationId = requestAnimationFrame(animate);
    });

    onUnmounted(() => {
        if (!import.meta.client) return;
        window.removeEventListener('resize', resizeCanvas);
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    });
</script>

<style scoped>
.gradient-canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
}
</style>

<template>
    <!-- we use canvas for better CPU performance -->
    <canvas
        ref="canvasRef"
        class="gradient-canvas">
    </canvas>
</template>

<script setup>
    import { ref, computed, onMounted, onUnmounted } from 'vue';

    const COLORS_LIGHT_MODE = [
        {
            start: { r: 191, g: 154, b: 103, a: .75 },
            end: { r: 159, g: 110, b: 75, a: .75 },
        },
        {
            start: { r: 191, g: 154, b: 103, a: 1 },
            end: { r: 159, g: 110, b: 75, a: 1 },
        },
        {
            start: { r: 191, g: 154, b: 103, a: 1 },
            end: { r: 159, g: 110, b: 75, a: 1 },
        },
    ];
    const COLORS_DARK_MODE = [
        {
            start: { r: 191, g: 154, b: 103, a: .75 },
            end: { r: 159, g: 110, b: 75, a: .75 },
        },
        {
            start: { r: 191, g: 154, b: 103, a: .75 },
            end: { r: 159, g: 110, b: 75, a: .75 },
        },
        {
            start: { r: 191, g: 154, b: 103, a: .75 },
            end: { r: 159, g: 110, b: 75, a: .75 },
        },
    ];

    const colorMode = useColorMode();
    const isMounted = ref(false);

    const colors = computed(() => {
        if (!isMounted.value) return COLORS_LIGHT_MODE;
        return colorMode.value === 'dark' ? COLORS_DARK_MODE : COLORS_LIGHT_MODE;
    });

    // CIRCLE_COUNT: Number of circles (integer)
    const CIRCLE_COUNT = 4;

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
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomizeCircle(circle) {
        circle.x = randomBetween(SPAWN_X_MIN, SPAWN_X_MAX);
        circle.y = randomBetween(SPAWN_Y_MIN, SPAWN_Y_MAX);
        circle.size = randomBetween(MIN_SIZE, MAX_SIZE);
        circle.duration = randomBetween(MIN_DURATION, MAX_DURATION);
        circle.startTime = performance.now();
    }

    function generateCircle(index) {
        const circle = {
            x: 0,
            y: 0,
            size: 0,
            colorIndex: index % COLORS_LIGHT_MODE.length,
            duration: 0,
            startTime: 0,
            initialDelay: (index / CIRCLE_COUNT) * MAX_DURATION,
        };
        randomizeCircle(circle);
        circle.startTime = performance.now() - circle.initialDelay;
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

        const { start, end } = colors.value[circle.colorIndex];
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, sizePixels / 2);

        gradient.addColorStop(0, `rgba(${start.r}, ${start.g}, ${start.b}, ${start.a * pulseOpacity})`);
        gradient.addColorStop(0.3, `rgba(${start.r}, ${start.g}, ${start.b}, ${start.a * pulseOpacity * 0.6})`);
        gradient.addColorStop(0.6, `rgba(${end.r}, ${end.g}, ${end.b}, ${end.a * pulseOpacity * 0.2})`);
        gradient.addColorStop(1, `rgba(${end.r}, ${end.g}, ${end.b}, 0)`);

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
        isMounted.value = true;
        circles = Array.from({ length: CIRCLE_COUNT }, (_, i) => generateCircle(i));
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animationId = requestAnimationFrame(animate);
    });

    onUnmounted(() => {
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

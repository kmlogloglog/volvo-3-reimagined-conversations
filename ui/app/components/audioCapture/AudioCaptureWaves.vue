<template>
    <div
        ref="containerRef"
        class="audio-wave-container"
    >
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<script setup>
    import { ref, computed, onMounted, onUnmounted } from 'vue';
    import { useResizeObserver } from '@vueuse/core';

    // Agent Store Connection
    import { useAgentStore } from '@/stores/agentStore';

    // ============================================
    // CONFIGURATION
    // ============================================

    // const canvasWidth = ref(0);
    // const canvasHeight = 250;
    const topPadding = 20;
    const waveTension = 0.4;

    const colorMode = useColorMode();
    const isMounted = ref(false);

    const gradientStart = computed(() => {
        if (!isMounted.value) return 'rgba(128, 128, 128, 0.08)';
        return colorMode.value === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)';
    });

    const gradientEnd = computed(() => {
        if (!isMounted.value) return 'rgba(128, 128, 128, 0.08)';
        return colorMode.value === 'dark'
            ? 'rgba(255, 255, 255, 0)'
            : 'rgba(0, 0, 0, 0)';
    });

    const layers = computed(() => [
        {
            gradientStart: gradientStart.value,
            gradientEnd: gradientEnd.value,
            speed: 0.04,
            baseline: 75,
            amplitude: 20,
            frequency: 0.02,
        },
        {
            gradientStart: gradientStart.value,
            gradientEnd: gradientEnd.value,
            speed: 0.025,
            baseline: 70,
            amplitude: 45,
            frequency: 0.007,
        },
        {
            gradientStart: gradientStart.value,
            gradientEnd: gradientEnd.value,
            speed: 0.009,
            baseline: 70,
            amplitude: 45,
            frequency: 0.03,
        },
        {
            gradientStart: gradientStart.value,
            gradientEnd: gradientEnd.value,
            speed: 0.01,
            baseline: 70,
            amplitude: 40,
            frequency: 0.015,
        },
    ]);

    // ============================================
    // COMPONENT LOGIC
    // ============================================

    // ============================================
    // COMPONENT LOGIC
    // ============================================

    const containerRef = ref(null);
    const canvasRef = ref(null);
    let ctx = null;
    let animationId = null;
    const agentStore = useAgentStore();
    let dataArray = null;

    const waveStates = [
        { phase: Math.random() * Math.PI * 2, offset: Math.random() * 1000 },
        { phase: Math.random() * Math.PI * 2, offset: Math.random() * 1000 },
        { phase: Math.random() * Math.PI * 2, offset: Math.random() * 1000 },
        { phase: Math.random() * Math.PI * 2, offset: Math.random() * 1000 },
    ];

    const resizeCanvas = () => {
        if (!canvasRef.value || !containerRef.value) return;

        const container = containerRef.value;
        const canvas = canvasRef.value;
        const dpr = window.devicePixelRatio || 1;

        const width = container.offsetWidth;
        const height = container.offsetHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    };

    const generateWavePoints = (width, height, phase, layer, offset, audioLevel) => {
        const points = [];
        const baseY = height - layer.baseline;

        const maxAllowedAmplitude = baseY - topPadding;
        // Reactivity: Multiply amplitude by audioLevel (1.0 = normal, >1.0 = louder)
        const currentAmplitude = layer.amplitude * (0.5 + (audioLevel * 1.5));
        const safeAmplitude = Math.min(currentAmplitude, maxAllowedAmplitude);

        for (let x = 0; x <= width; x += 4) {
            const mainWave = Math.sin(x * layer.frequency + phase);
            const wave2 = Math.sin(x * layer.frequency * 0.5 + phase * 0.8 + offset) * 0.3;
            const wave3 = Math.sin(x * layer.frequency * 1.5 + phase * 1.2 + offset * 0.5) * 0.2;

            const combined = mainWave + wave2 + wave3;
            const normalized = (combined + 1.5) / 3;
            const waveValue = normalized * normalized;

            const y = baseY - waveValue * safeAmplitude;

            points.push({ x, y });
        }

        return points;
    };

    const drawSmoothWave = (points, width, height, layer) => {
        if (points.length < 2) return;

        const minY = Math.min(...points.map(p => p.y));
        const gradient = ctx.createLinearGradient(0, minY, 0, height);
        gradient.addColorStop(0, layer.gradientStart);
        gradient.addColorStop(1, layer.gradientEnd);

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            const t = waveTension;
            const cp1x = p1.x + (p2.x - p0.x) * t / 3;
            const cp1y = p1.y + (p2.y - p0.y) * t / 3;
            const cp2x = p2.x - (p3.x - p1.x) * t / 3;
            const cp2y = p2.y - (p3.y - p1.y) * t / 3;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    };

    const animate = () => {
        if (!ctx || !canvasRef.value || !containerRef.value) return;

        const width = containerRef.value.offsetWidth;
        const height = containerRef.value.offsetHeight;

        ctx.clearRect(0, 0, width, height);

        // Calculate Audio Level
        let audioLevel = 0.5; // Base idle movement
        if (agentStore.analyser && agentStore.listening) {
            if (!dataArray) {
                dataArray = new Uint8Array(agentStore.analyser.frequencyBinCount);
            }
            agentStore.analyser.getByteFrequencyData(dataArray);

            // Simple average for volume/activity
            let sum = 0;
            for(let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            // Normalize 0-255 to roughly 0-2.0
            audioLevel = average / 64; // Adjust sensitivity
            if (audioLevel < 0.2) audioLevel = 0.2; // Min movement
        }

        layers.value.forEach((layer, index) => {
            const state = waveStates[index];
            const points = generateWavePoints(width, height, state.phase, layer, state.offset, audioLevel);
            drawSmoothWave(points, width, height, layer);

            // Speed up waves when audio is active
            state.phase += layer.speed * (1 + audioLevel * 2);
        });

        animationId = requestAnimationFrame(animate);
    };

    useResizeObserver(containerRef, () => {
        resizeCanvas();
    });

    onMounted(() => {
        isMounted.value = true;
        resizeCanvas();
        animate();
    });

    onUnmounted(() => {
        if (animationId) cancelAnimationFrame(animationId);
    });
</script>

<style scoped lang="scss">
.audio-wave-container {
  position: absolute;
  top: 0;
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
    width: 100%;
    height: 100%;
  }
}
</style>

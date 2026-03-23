<template>
    <div ref="containerRef" class="blob-mask">
        <div class="blob-mask-backdrop"></div>
        <TransitionGroup
            :key="resetKey"
            name="blob-image-swap"
            tag="div"
            class="blob-mask-images">
            <img
                v-for="instance in instances"
                :key="instance.id"
                :src="instance.src"
                class="blob-mask-images-img"
                :class="{ 'blob-mask-images-img-visible': loadedIds.has(instance.id) }"
                :style="{ transform: `scale(${instance.scale})` }"
                @load="onLoad(instance.id)" />
        </TransitionGroup>
        <canvas ref="maskCanvas" class="blob-mask-canvas" :style="canvasStyle"></canvas>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
    import { useIntersectionObserver, useDocumentVisibility, usePreferredReducedMotion } from '@vueuse/core';

    interface Props {
        imageSrc?: string
        // Uniform scale multiplier applied on top of the contain-fit dimensions.
        // 1.0 = no extra scaling; 1.1 = 10% larger than the contain-fit size.
        imageScale?: number
        // Signals whether the component is actively shown. On transition
        // to true, all image state is reset and the current imageSrc is
        // preloaded fresh. The canvas hole persists when false to allow
        // smooth outer CSS fade-outs.
        visible?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        imageSrc: '',
        imageScale: 1,
        visible: true,
    });

    const config = {
        targetFps: 24,

        // ↑ faster, more energetic movement  ↓ slower, more meditative drift
        animationSpeed: 0.008,

        // ↑ shape changes more rapidly  ↓ shape holds its form longer between morphs
        morphSpeed: 0.4,

        // Fraction of shorter canvas dimension (0–1).
        // ↑ larger spotlight  ↓ smaller, tighter reveal
        baseSize: 0.4,

        // ↑ smoother silhouette, higher CPU cost  ↓ more polygonal, cheaper
        angularSegments: 40,

        // ↑ wilder, more spiky organic shape  ↓ closer to a smooth circle
        morphIntensity: 0.5,

        // ↑ faster detail changes, more wrinkled  ↓ broader, gentler undulations
        noiseScale: 0.5,

        // ↑ quicker breathing rhythm  ↓ slower, deeper breaths
        pulseSpeed: 0.7,

        // ↑ more visible inhale/exhale  ↓ subtler, nearly static size
        pulseAmount: 0.08,

        // ↑ more feathered, dreamy vignette  ↓ crisper, harder spotlight edge
        // Applied via CSS filter: blur() — works consistently across all browsers
        // including Safari/iOS where canvas shadowBlur renders incorrectly.
        edgeBlur: 15,

        // The canvas is scaled up via CSS transform so the blurred outer edges
        // are pushed beyond the container. The blob radius is divided by this
        // value to keep the hole at the same visual size.
        maskScale: 1.2,
    };

    const canvasStyle = {
        '--edge-blur': `${config.edgeBlur}px`,
        '--mask-scale': `${config.maskScale}`,
    };

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
    const cosTable = new Float32Array(config.angularSegments + 1);
    const sinTable = new Float32Array(config.angularSegments + 1);

    for (let i = 0; i <= config.angularSegments; i++) {
        const angle = (i / config.angularSegments) * Math.PI * 2;
        cosTable[i] = Math.cos(angle);
        sinTable[i] = Math.sin(angle);
    }

    function getMorphedRadius(cosAngle: number, sinAngle: number, baseRadius: number, timeX: number, timeY: number): number {
        const noiseValue = noise(
            cosAngle * config.noiseScale + noiseOffset + timeX,
            sinAngle * config.noiseScale + noiseOffset + timeY,
            0,
        );
        return baseRadius * (1 + noiseValue * config.morphIntensity);
    }

    function traceBlobPath(targetCtx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, timeX: number, timeY: number) {
        targetCtx.beginPath();

        for (let i = 0; i <= config.angularSegments; i++) {
            const cosAngle = cosTable[i]!;
            const sinAngle = sinTable[i]!;

            const morphedRadius = getMorphedRadius(cosAngle, sinAngle, radius, timeX, timeY);
            const x = centerX + cosAngle * morphedRadius;
            const y = centerY + sinAngle * morphedRadius;

            if (i === 0) targetCtx.moveTo(x, y);
            else targetCtx.lineTo(x, y);
        }

        targetCtx.closePath();
    }

    function drawOverlay() {
        if (!ctx) return;

        ctx.clearRect(0, 0, displayWidth, displayHeight);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        if (!imageReady.value) return;

        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        const baseRadius = Math.min(displayWidth, displayHeight) * config.baseSize / config.maskScale;
        const pulse = Math.sin(time * config.pulseSpeed) * config.pulseAmount;
        const pulsedRadius = baseRadius * (1 + pulse);

        const loopRadius = 2.0;
        const timeX = Math.cos(morphPhase) * loopRadius;
        const timeY = Math.sin(morphPhase) * loopRadius;

        // Cut the blob shape out of the overlay with destination-out compositing.
        // CSS filter: blur() handles soft feathering consistently across all browsers.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#fff';
        traceBlobPath(ctx, centerX, centerY, pulsedRadius, timeX, timeY);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    let idCounter = 0;
    const instances = ref<Array<{ id: number; src: string; scale: number }>>([]);
    const loadedIds = reactive(new Set<number>());
    let pendingId: number | null = null;
    const imageReady = ref(false);
    let preloadGeneration = 0;
    // Incrementing forces Vue to recreate the TransitionGroup,
    // killing any in-progress leave animations from stale images.
    const resetKey = ref(0);

    function onLoad(id: number) {
        loadedIds.add(id);
        if (id === pendingId) {
            pendingId = null;
            instances.value = instances.value.filter(i => i.id === id);
        }
    }

    function preloadAndShow(src: string, scale: number) {
        const gen = ++preloadGeneration;
        const isFirstImage = instances.value.length === 0 || loadedIds.size === 0;

        if (isFirstImage) {
            imageReady.value = false;
        }

        const img = new Image();
        const newId = idCounter++;

        const onReady = () => {
            if (gen !== preloadGeneration) return;

            if (isFirstImage) {
                instances.value = [{ id: newId, src, scale }];
            } else {
                pendingId = newId;
                instances.value.push({ id: newId, src, scale });
            }

            imageReady.value = true;
        };

        img.onload = onReady;
        img.onerror = onReady;
        img.src = src;
    }

    watch(
        () => props.imageSrc,
        (newSrc) => {
            if (!newSrc || !props.visible) return;
            preloadAndShow(newSrc, props.imageScale);
        },
    );

    const maskCanvas = ref<HTMLCanvasElement | null>(null);
    const containerRef = ref<HTMLElement | null>(null);
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let displayWidth = 0;
    let displayHeight = 0;
    let time = 0;
    let morphPhase = 0;
    let noiseOffset = 0;
    let animationFrameId: number | null = null;
    let lastFrameTime = 0;
    let resizeObserver: ResizeObserver | null = null;

    const frameInterval = 1000 / config.targetFps;

    const documentVisibility = useDocumentVisibility();
    const isIntersecting = ref(false);
    const prefersReducedMotion = usePreferredReducedMotion();

    useIntersectionObserver(
        containerRef,
        (entries) => {
            isIntersecting.value = entries[0]?.isIntersecting ?? false;
        },
        { threshold: 0.1 },
    );

    const shouldAnimate = computed(() => {
        if (prefersReducedMotion.value === 'reduce') return false;
        if (documentVisibility.value === 'hidden') return false;
        if (!isIntersecting.value) return false;
        return true;
    });

    function animate(timestamp: number): void {
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

        drawOverlay();

        animationFrameId = requestAnimationFrame(animate);
    }

    function updateCanvasSize() {
        if (!canvas) return;
        if (!ctx) return;

        displayWidth = canvas.offsetWidth;
        displayHeight = canvas.offsetHeight;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function initMask() {
        if (!maskCanvas.value) return;

        canvas = maskCanvas.value;
        ctx = canvas.getContext('2d', { alpha: true });

        updateCanvasSize();

        // ResizeObserver fires before paint, so the canvas buffer is always
        // updated in the same frame the CSS size changes — no stretched frames.
        resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        resizeObserver.observe(canvas);

        time = 0;
        morphPhase = 0;
        noiseOffset = Math.random() * 1000;
        lastFrameTime = performance.now();

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

    watch(shouldAnimate, (val) => {
        if (val && !animationFrameId) {
            lastFrameTime = performance.now();
            animate(lastFrameTime);
        }
    });

    watch(() => props.visible, (val) => {
        if (!val) return;

        resetKey.value++;
        instances.value = [];
        loadedIds.clear();
        pendingId = null;
        imageReady.value = false;

        if (props.imageSrc) {
            preloadAndShow(props.imageSrc, props.imageScale);
        }
    });

    onMounted(() => {
        initMask();

        if (props.visible && props.imageSrc) {
            preloadAndShow(props.imageSrc, props.imageScale);
        }
    });

    onUnmounted(() => {
        destroyMask();
    });
</script>

<style lang="scss" scoped>
$duration: 1200ms;

.blob-mask {
    height: 100%;
    inset: 0;
    pointer-events: none;
    position: absolute;
    width: 100%;
}

.blob-mask-backdrop {
    background-color: var(--app-background-color);
    height: 100%;
    inset: 0;
    position: absolute;
    width: 100%;
    z-index: 1;
}

.blob-mask-images {
    height: 100%;
    inset: 0;
    position: absolute;
    width: 100%;
    z-index: 2;

    &-img {
        height: 100%;
        inset: 1.25rem;
        object-fit: contain;
        opacity: 0;
        position: absolute;
        transition: opacity 0.8s ease;
        width: calc(100% - 2.5rem);

        &-visible {
            opacity: 1;
        }
    }
}

.blob-mask-canvas {
    -webkit-filter: blur(var(--edge-blur, 0px));
    filter: blur(var(--edge-blur, 0px));
    height: 100%;
    inset: 0;
    position: absolute;
    transform: scale(var(--mask-scale, 1));
    width: 100%;
    z-index: 3;
}

.blob-image-swap-leave-active {
    transition: opacity $duration ease;
    z-index: 3;
}

.blob-image-swap-leave-from {
    opacity: 1;
}

.blob-image-swap-leave-to {
    opacity: 0;
}
</style>

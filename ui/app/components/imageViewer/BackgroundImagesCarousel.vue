<template>
    <div ref="containerRef" class="image-container" :class="{ 'image-container-ready': allImagesLoaded }">
        <VolvoLogo
            color="var(--color-white)"
            drop-shadow="var(--color-black)"
            class="logo" />

        <div
            v-if="safeImageCount > 0"
            class="carousel-slider"
            :class="{ 'no-transition': isJumping }"
            :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
            <div
                v-for="(image, index) in extendedImageArray"
                :key="index"
                class="slide">
                <img
                    :src="image"
                    :alt="`Background image ${index + 1}`"
                    class="background-image"
                    @load="onImageLoad" />
            </div>
        </div>

        <div v-if="safeImageCount > 1" class="carousel-navigation">
            <button
                class="nav-arrow nav-arrow-left"
                @click.stop="handleArrowClick('prev')">
                <span class="icon-chevron-left"></span>
            </button>

            <button
                class="nav-arrow nav-arrow-right"
                @click.stop="handleArrowClick('next')">
                <span class="icon-chevron-right"></span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onUnmounted } from 'vue';
    import { useSwipe, useIntervalFn } from '@vueuse/core';
    import VolvoLogo from '@/components/logo/VolvoLogo.vue';

    interface Props {
        src?: string[]
        interval?: number
    }

    const props = withDefaults(defineProps<Props>(), {
        src: () => [],
        interval: 4000,
    });

    const TRANSITION_DURATION = 500;

    const currentIndex = ref(0);
    const containerRef = ref<HTMLElement | null>(null);
    const loadedCount = ref(0);
    const isJumping = ref(false);

    const safeImageArray = computed(() => Array.isArray(props.src) ? props.src : []);
    const safeImageCount = computed(() => safeImageArray.value.length);

    const extendedImageArray = computed(() => safeImageCount.value > 1
        ? [...safeImageArray.value, safeImageArray.value[0]!]
        : safeImageArray.value,
    );

    const lastRealIndex = computed(() => safeImageCount.value - 1);
    const cloneIndex = computed(() => extendedImageArray.value.length - 1);

    const allImagesLoaded = computed(() =>
        safeImageCount.value > 0 && loadedCount.value >= safeImageCount.value,
    );

    const { pause, resume } = useIntervalFn(() => nextImage(), props.interval, { immediate: false });

    function onImageLoad() {
        loadedCount.value++;
        if (allImagesLoaded.value && safeImageCount.value > 1) {
            resume();
        }
    }

    // Silently reposition to the given index without any visible transition
    async function silentJump(index: number) {
        isJumping.value = true;
        currentIndex.value = index;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        isJumping.value = false;
    }

    function nextImage() {
        if (currentIndex.value === lastRealIndex.value) {
            currentIndex.value = cloneIndex.value;
            setTimeout(() => silentJump(0), TRANSITION_DURATION);
        } else {
            currentIndex.value++;
        }
    }

    function previousImage() {
        if (currentIndex.value === 0) {
            // Silently jump to the clone, then slide back to the last real slide
            silentJump(cloneIndex.value).then(() => {
                currentIndex.value = lastRealIndex.value;
            });
        } else {
            currentIndex.value--;
        }
    }

    const handleArrowClick = (direction: 'prev' | 'next') => {
        pause();
        if (direction === 'prev') {
            previousImage();
        } else if (direction === 'next') {
            nextImage();
        }
    };

    if (import.meta.client) {
        const { lengthX } = useSwipe(containerRef, {
            threshold: 50,
            onSwipeEnd() {
                pause();
                if (lengthX.value > 50) {
                    previousImage();
                } else if (lengthX.value < -50) {
                    nextImage();
                }
            },
        });
    }

    onUnmounted(() => pause());
</script>

<style lang="scss" scoped>
.image-container {
    height: 100%;
    left: 0;
    opacity: 0;
    overflow: hidden;
    position: fixed;
    top: 0;
    touch-action: pan-y;
    transition: opacity 0.8s ease;
    width: 100%;

    &-ready {
        opacity: 1;
    }

    .logo {
        height: auto;
        left: 50%;
        position: fixed;
        top: calc(20px + env(safe-area-inset-top, 0px));
        transform: translateX(-50%);
        width: 110px;
        z-index: 10;
    }
}

.carousel-slider {
    display: flex;
    height: 100%;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;

    &.no-transition {
        transition: none;
    }
}

.slide {
    flex: none;
    height: 100%;
    position: relative;
    width: 100%;

    .background-image {
        height: 100%;
        object-fit: cover;
        user-select: none;
        width: 100%;
        -webkit-user-drag: none;
    }
}

.carousel-navigation {
    display: none;

    @media (hover: hover) and (pointer: fine) {
        display: flex;
        justify-content: space-between;
        padding: 0 1.25rem;
        pointer-events: none;
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
        z-index: 10;
    }
}

.nav-arrow {
    align-items: center;
    aspect-ratio: 1;
    background: var(--carousel-button-color-background);
    border-radius: 50%;
    border: none;
    color: var(--carousel-button-color-font);
    cursor: pointer;
    display: flex;
    font-size: 1rem;
    font-weight: 700;
    justify-content: center;
    pointer-events: auto;
    position: relative;
    transition: all .3s ease;
    width: 2.5rem;

    &.disabled {
        opacity: 0.5;
    }

    &-left {
        margin-left: -0.1875rem;
    }

    &-right {
        margin-left:  0.1875rem;
    }
}
</style>

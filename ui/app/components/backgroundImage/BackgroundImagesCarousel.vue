<template>
    <div ref="containerRef" class="image-container">
        <VolvoLogo
            color="var(--color-white)"
            drop-shadow="var(--color-black)"
            class="logo" />

        <!-- Horizontal slider -->
        <div
            v-if="safeImageCount > 0"
            class="carousel-slider"
            :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
            <div
                v-for="(image, index) in safeImageArray"
                :key="index"
                class="slide">
                <img
                    :src="image"
                    :alt="`Background image ${index + 1}`"
                    class="background-image" />
            </div>
        </div>

        <!-- Navigation arrows -->
        <div v-if="safeImageCount > 1" class="carousel-navigation">
            <button
                :disabled="currentIndex === 0"
                class="nav-arrow nav-arrow-left"
                :class="{ disabled: currentIndex === 0 }"
                @click.stop="handleArrowClick('prev')">
                <span class="icon-chevron-left"></span>
            </button>

            <button
                :disabled="currentIndex === safeImageCount - 1"
                class="nav-arrow nav-arrow-right"
                :class="{ disabled: currentIndex === safeImageCount - 1 }"
                @click.stop="handleArrowClick('next')">
                <span class="icon-chevron-right"></span>
            </button>
        </div>
    </div>
</template>
<script setup>
    import { ref, watch, onMounted, computed } from 'vue';
    import { useSwipe } from '@vueuse/core';
    import VolvoLogo from '@/components/logo/VolvoLogo.vue';

    const props = defineProps({
        src: {
            type: Array,
            default: () => [],
            validator: (value) => Array.isArray(value),
        },
    });

    const currentIndex = ref(0);
    const containerRef = ref(null);

    // Safe array access with null checks
    const safeImageArray = computed(() => {
        return Array.isArray(props.src) ? props.src : [];
    });

    const safeImageCount = computed(() => {
        return safeImageArray.value?.length ?? 0;
    });

    // Navigation functions
    function nextImage() {
        const maxIndex = safeImageCount.value - 1;
        if (currentIndex.value < maxIndex) {
            currentIndex.value++;
        }
    };

    function previousImage () {
        if (currentIndex.value > 0) {
            currentIndex.value--;
        }
    };

    // Reset when src changes
    watch(() => props.src, () => {
        currentIndex.value = 0;
    });

    // Client-side initialization
    onMounted(() => {
        // Swipe gesture handling
        if (containerRef.value) {
            const { lengthX } = useSwipe(containerRef, {
                threshold: 50,
                onSwipeEnd() {
                    if (lengthX.value > 50) {
                        previousImage();
                    } else if (lengthX.value < -50) {
                        nextImage();
                    }
                },
            });
        }
    });

    // Arrow click handler
    const handleArrowClick = (direction) => {
        if (direction === 'prev') {
            previousImage();
        } else if (direction === 'next') {
            nextImage();
        }
    };
</script>
<style lang="scss" scoped>
.image-container {
    display: flex;
    height: 100%;
    left: 0;
    overflow: hidden;
    position: fixed;
    top: 0;
    touch-action: pan-y;
    width: 100%;

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
}

.slide {
    flex: none;
    width: 100%;
    height: 100%;
    position: relative;

    .background-image {
        height: 100%;
        object-fit: cover;
        width: 100%;
        user-select: none;
        -webkit-user-drag: none;
    }
}

.carousel-navigation {
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
        margin-left: 0.1875rem;
    }
}
</style>

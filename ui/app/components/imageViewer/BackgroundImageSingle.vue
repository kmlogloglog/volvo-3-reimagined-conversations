<template>
    <TransitionGroup
        name="image-swap"
        tag="div"
        class="image-stage">
        <div
            v-for="instance in instances"
            :key="instance.id"
            class="image-layer">
            <img
                :src="instance.src"
                alt=""
                class="image-layer-img"
                :class="{ 'image-layer-img-visible': loadedIds.has(instance.id) }"
                @load="onLoad(instance.id)" />
        </div>
    </TransitionGroup>
</template>

<script setup lang="ts">
    import { ref, reactive, watch } from 'vue';

    interface Props {
        src?: string
    }

    const emit = defineEmits<{
        imageLoaded: []
    }>();

    const props = withDefaults(defineProps<Props>(), {
        src: '',
    });

    let idCounter = 0;

    const instances = ref<Array<{ id: number; src: string }>>([
        { id: idCounter++, src: props.src },
    ]);

    // Tracks which instance IDs have finished loading.
    const loadedIds = reactive(new Set<number>());

    // ID of the most recently requested image. The old layer is only retired
    // once this image has loaded, so the leave transition starts at the same
    // moment as the new image's load-driven fade-in — a true crossfade.
    let pendingId: number | null = null;

    function onLoad(id: number) {
        loadedIds.add(id);

        if (id === pendingId) {
            pendingId = null;
            // Retiring old instances here triggers their TransitionGroup leave
            // transition at the exact same time the new image becomes visible.
            instances.value = instances.value.filter(i => i.id === id);
        }

        emit('imageLoaded');
    }

    watch(
        () => props.src,
        (newSrc) => {
            if (!newSrc) return;
            const newId = idCounter++;
            pendingId = newId;
            // Old instances stay in the DOM until the new image has loaded.
            instances.value.push({ id: newId, src: newSrc });
        },
    );
</script>

<style lang="scss" scoped>
$duration: 2000ms;

.image-stage {
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 2;
}

.image-layer {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
    left: 50%;
    max-width: var(--max-width);
    pointer-events: none;
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    width: 100%;

    &-img {
        display: block;
        max-height: 100%;
        object-fit: contain;
        opacity: 0;
        transition: opacity $duration ease;
        width: 100%;

        &-visible {
            opacity: 1;
        }
    }
}

// Only the leave transition is needed — the image's own load-driven fade handles entry.
.image-swap-leave-active {
    transition: opacity $duration ease, filter $duration ease;
    z-index: 2;
}

.image-swap-leave-from {
    filter: blur(0px);
    opacity: 1;
}

.image-swap-leave-to {
    filter: blur(16px);
    opacity: 0;
}
</style>

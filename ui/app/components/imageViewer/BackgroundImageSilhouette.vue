<template>
    <div class="image-container">
        <TransitionGroup
            name="image-swap"
            tag="div"
            class="image-stage">
            <SilhouetteImageLayer
                v-for="instance in instances"
                :key="instance.id"
                :src="instance.src"
                :show-shadow="props.showShadow"
                @loaded="onLoad(instance.id)" />
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
    import SilhouetteImageLayer from '@/components/imageViewer/SilhouetteImageLayer.vue';

    interface Props {
        src?: string
        showShadow?: boolean
    }

    const emit = defineEmits<{
        imageLoaded: []
    }>();

    const props = withDefaults(defineProps<Props>(), {
        src: '',
        showShadow: false,
    });

    let idCounter = 0;

    const instances = ref<Array<{ id: number; src: string }>>([
        { id: idCounter++, src: props.src },
    ]);

    // Old layer is only retired once the new image has loaded,
    // so the leave transition and load-driven fade-in start together.
    let pendingId: number | null = null;

    function onLoad(id: number) {
        if (id === pendingId) {
            pendingId = null;
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
            instances.value.push({ id: newId, src: newSrc });
        },
    );
</script>

<style lang="scss" scoped>
$duration: 2000ms;

.image-container {
    height: 100%;
    left: 0;
    pointer-events: none;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 2;
}

.image-stage {
    height: 100%;
    position: relative;
    width: 100%;
}

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

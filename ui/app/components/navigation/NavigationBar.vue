<template>
    <div class="navigation">
        <nav class="navigation-groups">
            <NavigationBarButton
                :icon="NAVIGATION.CHAT.icon"
                :active="isActive(NAVIGATION.CHAT.id)"
                @click="setActive(NAVIGATION.CHAT)" />
            <NavigationBarAudioButton
                ref="recordingControlsRef"
                :active="isActive(NAVIGATION.AUDIO.id)"
                @select="setActive(NAVIGATION.AUDIO)"
                @recording-change="onRecordingChange" />

            <NavigationBarButton
                class="navigation-photo"
                :class="{ 'navigation-photo-icon-offset': (isActive(NAVIGATION.AUDIO.id) && isAudioRecording) }"
                :icon="NAVIGATION.PHOTO.icon"
                :active="isActive(NAVIGATION.PHOTO.id)"
                @click="setActive(NAVIGATION.PHOTO)" />
            <NavigationBarButton
                :icon="NAVIGATION.UPLOAD.icon"
                :active="isActive(NAVIGATION.UPLOAD.id)"
                @click="setActive(NAVIGATION.UPLOAD)" />
        </nav>
    </div>
</template>

<script setup>
    import NavigationBarButton from './NavigationBarButton.vue';
    import NavigationBarAudioButton from './NavigationBarAudioButton.vue';
    import { NAVIGATION } from '@/constants/navigation.js';
    import { EMITS } from '@/constants/emits.js';

    const props = defineProps({
        forceActive: {
            type: String,
            default: null,
        },
    });

    const route = useRoute();

    const emit = defineEmits([EMITS.NAVIGATION_CHANGE]);

    // Refs
    const recordingControlsRef = ref(props.forceActive ? props.forceActive : null);

    // State
    const activeId = ref(null);

    // Helpers
    const isActive = (id) => activeId.value === id;

    function getNavItemByRouteName(name) {
        return Object.values(NAVIGATION).find(item => item.name === name);
    }

    function syncWithRoute() {
        const navItem = getNavItemByRouteName(route.name);
        if (navItem) {
            activeId.value = navItem.id;
        } else {
            // Unknown route (404, etc.) - reset navigation
            activeId.value = null;
            recordingControlsRef.value?.reset();
        }
    }

    // Actions
    function setActive(navItem) {
        const { id, name } = navItem;

        // Reset recording state when navigating away from audio
        // if (activeId.value === NAVIGATION.AUDIO.id && id !== NAVIGATION.AUDIO.id) {
        //    recordingControlsRef.value?.reset();
        // }

        activeId.value = id;
        emit(EMITS.NAVIGATION_CHANGE, name);
    }

    const isAudioRecording = ref(false);

    // eslint-disable-next-line
    function onRecordingChange({ isRecording, isPaused }) {
        console.log(isRecording);

        isAudioRecording.value = isRecording;
        // Handle recording state changes if needed by parent
    }

    // Watch route changes
    watch(() => route.name, syncWithRoute);

    // Sync with current route on mount
    onMounted(syncWithRoute);
</script>

<style lang="scss" scoped>
.navigation {
    padding: 0 1.25rem 1.25rem;
    width: min(100vw, 768px);
    z-index: 99;

    &-groups {
        $height: 2.625rem;

        align-items: center;
        background-color: var(--navigation-color-background);
        border-radius: calc($height / 2);
        display: flex;
        height: $height;
        padding: 0.1875rem;

        button,
        :deep(.mic-button) {
            border: none;
            flex: 1 0 0%;
            min-width: 0;
        }

        .navigation-photo {
            border: none;
        }

        &:has(.pause-button) {
            button:not(.navigation-photo):not(.pause-button),
            :deep(.mic-button) {
                flex: 0 0 25%;
            }

            .navigation-photo {
                flex: 1 1 0%;
                min-width: 0;
            }

            .pause-button {
                flex: 0 0 auto;
            }
        }
    }

    :deep(.navigation-photo-icon-offset [class^=icon-]){
        margin-right: calc(-15% - 1.15rem);
    }
}
</style>

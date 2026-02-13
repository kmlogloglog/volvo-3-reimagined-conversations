<template>
    <div class="navigation">
        <nav class="navigation-groups">
            <NavigationBarAudioButton
                ref="recordingControlsRef"
                :active="isActive(NAVIGATION.AUDIO.id)"
                :disabled="micRequesting || (isActive(NAVIGATION.AUDIO.id) && (connecting || isLoading))"
                :is-recording="isAudioRecording"
                :loading="(isActive(NAVIGATION.AUDIO.id) && connecting) || micRequesting"
                @[EMITS.RECORD_CLICK]="handleMicrophoneClick" />
            <NavigationBarButton
                :active="isActive(NAVIGATION.CHAT.id)"
                :disabled="micRequesting || isLoading"
                :icon="NAVIGATION.CHAT.icon"
                :loading="isActive(NAVIGATION.CHAT.id) && connecting"
                @click="setActive(NAVIGATION.CHAT)" />
            <NavigationBarButton
                class="navigation-photo"
                :active="isActive(NAVIGATION.PHOTO.id)"
                :disabled="micRequesting || isLoading"
                :icon="NAVIGATION.PHOTO.icon"
                @click="setActive(NAVIGATION.PHOTO)" />
        </nav>
    </div>
</template>

<script setup>
    import NavigationBarButton from './NavigationBarButton.vue';
    import NavigationBarAudioButton from './NavigationBarAudioButton.vue';
    import { NAVIGATION } from '@/constants/navigation';
    import { EMITS } from '@/constants/emits.js';
    import { BUS } from '@/constants/bus.js';
    import { useEventBus } from '@vueuse/core';

    const busMicrophone = useEventBus(BUS.MICROPHONE);
    const busConnection = useEventBus(BUS.AGENT_CONNECTION);
    const busRecord = useEventBus(BUS.TOGGLE_RECORD);

    const props = defineProps({
        forceActive: {
            type: String,
            default: null,
        },
    });

    const { isLoading } = useLoadingIndicator();

    const connected = ref(false);
    const connecting = ref(false);
    const micRequesting = ref(false);

    busConnection.on((payload) => {
        connected.value = payload.connected ?? connected.value;
        connecting.value = payload.connecting ?? connecting.value;
    });

    busMicrophone.on((payload) => {
        micRequesting.value = payload.requesting ?? micRequesting.value;
    });

    const route = useRoute();

    const emit = defineEmits([EMITS.NAVIGATION_CHANGE, EMITS.OPEN_PHOTO_CAPTURE]);

    const recordingControlsRef = ref(props.forceActive ? props.forceActive : null);

    const activeId = ref(null);

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
            resetAudioState();
        }

        if(navItem?.id !== NAVIGATION.AUDIO.id) {
            resetAudioState();
        }
    }

    // Actions
    function setActive(navItem) {
        const { id, name } = navItem;

        activeId.value = id;

        emit(EMITS.NAVIGATION_CHANGE, name);
    }

    const isAudioRecording = ref(false);

    function onToggleRecord(isRecording) {
        busRecord.emit(isRecording);
    }

    // Handle microphone click logic (moved from NavigationBarAudioButton)
    async function handleMicrophoneClick() {
        if (isActive(NAVIGATION.AUDIO.id)) {
            if (isAudioRecording.value) {
                // If recording, stop recording
                isAudioRecording.value = false;
                await nextTick();
                onToggleRecord(isAudioRecording.value);
            } else {
                // If not recording, start recording
                isAudioRecording.value = true;
                await nextTick();
                onToggleRecord(isAudioRecording.value);
            }
        } else {
            // Select this navigation item
            setActive(NAVIGATION.AUDIO);
        }
    }

    // Reset audio state (moved from NavigationBarAudioButton)
    function resetAudioState() {
        isAudioRecording.value = false;
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
        column-gap: .25rem;

        button,
        :deep(.mic-button) {
            border: none;
            flex: 1 0 0%;
            min-width: 0;
        }

        .navigation-photo {
            border: none;
        }
    }
}
</style>

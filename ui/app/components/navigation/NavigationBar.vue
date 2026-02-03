<template>
    <div class="navigation">
        <nav class="navigation-groups">
            <NavigationBarButton
                :icon="NAVIGATION.CHAT.icon"
                :active="isActive(NAVIGATION.CHAT.id)"
                :loading="isActive(NAVIGATION.CHAT.id) && connecting"
                :disabled="connecting || micRequesting"
                @click="setActive(NAVIGATION.CHAT)" />

            <NavigationBarAudioButton
                ref="recordingControlsRef"
                v-model:is-recording="isAudioRecording"
                v-model:is-paused="isAudioPaused"
                :active="isActive(NAVIGATION.AUDIO.id)"
                :loading="(isActive(NAVIGATION.UPLOAD.id) && connecting) || micRequesting"
                :disabled="connecting || micRequesting"
                @select="setActive(NAVIGATION.AUDIO)"
                @toggle-record="onToggleRecord"
                @toggle-pause="onTogglePause" />

            <NavigationBarButton
                class="navigation-photo"
                :class="{ 'navigation-photo-icon-offset': (isActive(NAVIGATION.AUDIO.id) && isAudioRecording) }"
                :icon="NAVIGATION.PHOTO.icon"
                :active="isActive(NAVIGATION.PHOTO.id)"
                :loading="isActive(NAVIGATION.PHOTO.id) && connecting"
                :disabled="connecting || micRequesting"
                @click="setActive(NAVIGATION.PHOTO)" />
            <NavigationBarButton
                :icon="NAVIGATION.UPLOAD.icon"
                :active="isActive(NAVIGATION.UPLOAD.id)"
                :loading="isActive(NAVIGATION.UPLOAD.id) && connecting"
                :disabled="connecting || micRequesting"
                @click="setActive(NAVIGATION.UPLOAD)" />
        </nav>
    </div>
</template>

<script setup>
    import NavigationBarButton from './NavigationBarButton.vue';
    import NavigationBarAudioButton from './NavigationBarAudioButton.vue';
    import { NAVIGATION } from '@/constants/navigation.js';
    import { EMITS } from '@/constants/emits.js';
    import { BUS } from '@/constants/bus.js';

    import { useEventBus } from '@vueuse/core';

    const busRecord = useEventBus('toggle-record');
    const busPause = useEventBus('toggle-pause');
    const busMicrophone = useEventBus(BUS.MICROPHONE);
    const busConnection = useEventBus(BUS.AGENT_CONNECTION);

    const props = defineProps({
        forceActive: {
            type: String,
            default: null,
        },
    });

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

    const emit = defineEmits([EMITS.NAVIGATION_CHANGE]);

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
            recordingControlsRef.value?.reset();
        }

        if(navItem?.id !== NAVIGATION.AUDIO.id) {
            isAudioRecording.value = false;
            isAudioPaused.value = false;
        }
    }

    // Actions
    function setActive(navItem) {
        const { id, name } = navItem;

        activeId.value = id;
        emit(EMITS.NAVIGATION_CHANGE, name);
    }

    const isAudioRecording = ref(false);
    const isAudioPaused = ref(false);

    function onToggleRecord(isRecording) {
        busRecord.emit(isRecording);
    }

    function onTogglePause(isPaused) {
        busPause.emit(isPaused);
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

<template>
    <!--
    ClientOnly is required to prevent hydration mismatch errors caused by device detection
    -->
    <ClientOnly>
        <div class="navigation">
            <nav class="navigation-groups">
                <NavigationBarAudioButton
                    ref="recordingControlsRef"
                    :active="isActive(ROUTE.AUDIO.id)"
                    :disabled="micRequesting || (isActive(ROUTE.AUDIO.id) && (connecting || isLoading))"
                    :is-recording="isAudioRecording"
                    :loading="(isActive(ROUTE.AUDIO.id) && connecting) || micRequesting"
                    @[EMITS.RECORD_CLICK]="handleMicrophoneClick" />
                <NavigationBarButton
                    :active="isActive(ROUTE.CHAT.id)"
                    :disabled="micRequesting || isLoading"
                    :icon="ROUTE.CHAT.icon"
                    :loading="isActive(ROUTE.CHAT.id) && connecting"
                    @click="setActive(ROUTE.CHAT)" />
                <NavigationBarButton
                    class="navigation-photo"
                    :active="isActive(ROUTE.CAMERA.id)"
                    :disabled="micRequesting || isLoading"
                    :icon="$device.isDesktop ? ROUTE.UPLOAD.icon : ROUTE.CAMERA.icon"
                    @click="setActive(ROUTE.CAMERA)" />
            </nav>
        </div>
    </ClientOnly>
</template>

<script setup>
    import NavigationBarButton from './NavigationBarButton.vue';
    import NavigationBarAudioButton from './NavigationBarAudioButton.vue';
    import { ROUTE } from '@/constants/route';
    import { EMITS } from '@/constants/emits.js';
    import { BUS } from '@/constants/bus.js';
    import { useEventBus } from '@vueuse/core';

    const props = defineProps({
        forceActive: {
            type: String,
            default: null,
        },
    });

    const emit = defineEmits([EMITS.NAVIGATION_CHANGE]);

    const { isLoading } = useLoadingIndicator();
    const route = useRoute();

    const busMicrophone = useEventBus(BUS.MICROPHONE);
    const busConnection = useEventBus(BUS.AGENT_CONNECTION);
    const busRecord = useEventBus(BUS.TOGGLE_RECORD);

    const connected = ref(false);
    const connecting = ref(false);
    const micRequesting = ref(false);
    const recordingControlsRef = ref(props.forceActive ? props.forceActive : null);
    const activeId = ref(null);
    const isAudioRecording = ref(false);

    // check if a navigation item is active
    const isActive = (id) => activeId.value === id;

    // get navigation item by route name
    function getNavItemByRouteName(name) {
        return Object.values(ROUTE).find(item => item.name === name);
    }

    // sync active navigation button with current route
    function syncWithRoute() {
        const navItem = getNavItemByRouteName(route.name);
        if (navItem) {
            activeId.value = navItem.id;
        } else {
            // Unknown route (404, etc.) - reset navigation
            activeId.value = null;
            isAudioRecording.value = false;
        }

        if(navItem?.id !== ROUTE.AUDIO.id) {
            isAudioRecording.value = false;
        }
    }

    // set active navigation button
    function setActive(navItem) {
        const { id, name } = navItem;

        const ignoreRouteNames = [ROUTE.CAMERA.name];
        if (!ignoreRouteNames.includes(name)) {
            activeId.value = id;
        }

        emit(EMITS.NAVIGATION_CHANGE, name);
    }

    function onToggleRecord(isRecording) {
        busRecord.emit(isRecording);
    }

    // Handle microphone click logic (moved from NavigationBarAudioButton)
    async function handleMicrophoneClick() {
        if (isActive(ROUTE.AUDIO.id)) {
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
            setActive(ROUTE.AUDIO);
        }
    }

    // bus event listeners
    busConnection.on((payload) => {
        connected.value = payload.connected ?? connected.value;
        connecting.value = payload.connecting ?? connecting.value;
    });

    busMicrophone.on((payload) => {
        micRequesting.value = payload.requesting ?? micRequesting.value;
    });

    // watch route changes to sync active navigation button state
    watch(() => route.name, syncWithRoute);

    onMounted(() => {
        syncWithRoute();
    });
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

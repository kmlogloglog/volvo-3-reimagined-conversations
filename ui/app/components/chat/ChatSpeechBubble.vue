<template>
    <BaseSpeechBubble
        ref="speechBubbleRef"
        :align-bubble="alignBubble"
        :disabled="disabled"
        padding="small">
        <ChatTypeIndicator v-if="!finished" />
        <template v-else>
            <!-- eslint-disable vue/no-v-html -->
            <div
                ref="textRef"
                class="chat-message text-sm"
                :class="{ 'show-all': showAllText }"
                v-html="sanitizedText"></div>
            <!-- eslint-enable vue/no-v-html -->
            <button
                v-show="showReadMoreButton"
                class="button-reset button-read-more"
                :class="{ 'open': showAllText}"
                @[EMITS.CLICK]="onReadMoreClick">
                {{  buttonLabel }}<span class="icon-chevron-right"></span>
            </button>
        </template>
    </BaseSpeechBubble>
</template>
<script setup lang="ts">
    import type { Ref, ComponentPublicInstance } from 'vue';

    import BaseSpeechBubble from '@/components/baseComponents/uiElements/BaseSpeechBubble.vue';
    import { EMITS } from '@/constants/emits';
    import DOMPurify from 'isomorphic-dompurify';
    import ChatTypeIndicator from '@/components/chat/ChatTypeIndicator.vue';
    import { useResizeObserver } from '@vueuse/core';

    interface Props {
        text: string
        alignBubble?: 'user' | 'agent' | 'none'
        finished?: boolean
        disabled?: boolean
        padding?: 'small' | 'large' | ''
    }

    const props = withDefaults(defineProps<Props>(), {
        alignBubble: 'none',
        finished: true,
        disabled: false,
        padding: '',
    });

    const emit = defineEmits<{
        speechBubbleExpand: [payload: { heightDelta: number; scrollBefore: number }]
        imageLoaded: [img: HTMLImageElement]
    }>();

    const sanitizedText = computed(() => {
        const sanitized = DOMPurify.sanitize(props.text);
        // Only convert newlines to <br> for plain-text; agent responses are already HTML.
        if (/<[a-z][\s\S]*>/i.test(sanitized)) {
            return sanitized;
        }
        return sanitized.replace(/\n/g, '<br>');
    });

    const buttonLabel = computed(() => showAllText.value ? 'Collapse message' : 'Show full message');

    const textRef = useTemplateRef<HTMLElement>('textRef');
    const speechBubbleRef = useTemplateRef<ComponentPublicInstance>('speechBubbleRef');
    const showReadMoreButton = ref(false);
    const showAllText = ref(false);

    const scrollContainer = inject<Ref<HTMLElement | null>>('scrollContainer', ref(null));

    // Toggles expanded state and adjusts parent scroll to compensate for height change.
    async function onReadMoreClick() {
        const el = speechBubbleRef.value?.$el as HTMLElement;
        const heightBefore = el.offsetHeight;
        const scrollBefore = scrollContainer.value?.scrollTop ?? 0;

        showAllText.value = !showAllText.value;

        await nextTick();

        const heightAfter = el.offsetHeight;

        emit(EMITS.SPEECH_BUBBLE_EXPAND, {
            heightDelta: heightAfter - heightBefore,
            scrollBefore,
        });
    }

    function onImageLoad(event: Event) {
        emit(EMITS.IMAGE_LOADED, (event.target as HTMLImageElement));
    }

    function attachImageListeners() {
        if (!textRef.value) return;

        const images = textRef.value.querySelectorAll('img');
        images.forEach((img) => {
            img.addEventListener('load', onImageLoad);
            if (img.complete) {
                emit(EMITS.IMAGE_LOADED, img);
            }
        });
    }

    function detachImageListeners() {
        if (!textRef.value) return;

        const images = textRef.value.querySelectorAll('img');
        images.forEach((img) => {
            img.removeEventListener('load', onImageLoad);
        });
    }

    watch(textRef, (newVal, oldVal) => {
        if (oldVal) {
            detachImageListeners();
        }
        if (newVal) {
            showReadMoreButton.value = newVal.scrollHeight > newVal.clientHeight;
            attachImageListeners();
        }
    }, { immediate: true });

    useResizeObserver(textRef, ([entry]) => {
        const el = entry!.target as HTMLElement;
        showReadMoreButton.value = !showAllText.value && el.scrollHeight > el.clientHeight;
    });

    onBeforeUnmount(() => {
        detachImageListeners();
    });
</script>
<style lang="scss" scoped>
    .chat-message {
        margin: 0;
        text-box-trim: trim-both;
        display: -webkit-box;
        -webkit-line-clamp: 8;
        -webkit-box-orient: vertical;
        overflow: hidden;

        &.show-all {
            -webkit-line-clamp: unset;
            overflow: visible;
        }

        :deep(p:not(:first-child)) {
            margin-top: 1rem;
        }

        :deep(p:not(:last-child)) {
            margin-bottom: 1rem;
        }
    }

    .button-read-more {
        background: none;
        border: none;
        color: var(--color-grey-600);
        cursor: pointer;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        padding: 0;
        text-align: left;
        display: inline-flex;
        align-items: center;
        column-gap: .5rem;

         > span {
            display: inline-block;
            margin-left: 0.25rem;
            transition: transform 0.1s ease;
        }

        &.open > span {
            transform: rotate(-90deg);
        }
    }
</style>

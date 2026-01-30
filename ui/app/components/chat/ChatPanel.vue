<template>
    <main>
        <div ref="mainInnerRef" class="main-inner" :class="{ show }">
            <ChatStream
                :chat="chat"
                @[EMITS.IMAGE_LOADED]="onImageLoaded"
                @[EMITS.SPEECH_BUBBLE_EXPAND]="onSpeechBubbleExpand($event)" />
        </div>
    </main>
    <footer>
        <BaseChatTextArea
            v-model="chatMessage"
            @submit="handleChatSubmit" />
    </footer>
</template>
<script setup>
    import { useAudioStore } from '@/stores/audio';
    import BaseChatTextArea from '@/components/baseComponents/uiElements/BaseChatTextArea.vue';
    import ChatStream from '@/components/chat/ChatStream.vue';
    import { EMITS } from '@/constants/emits.js';

    const chat = ref([
        // {
        //     content: {
        //         time: '10:00 AM',
        //         date: 'August 25, 2024',
        //         address: {
        //             name: 'Bilia Jägersro',
        //             street: 'Agnesfridsvägen 119',
        //             city: 'Jägersro, Malmö',
        //         },
        //     },
        //     sender: 'gemini',
        //     type: 'booking',
        // },
        // {
        //     content: {
        //         text: 'Refined materials rather than outright sportiness.',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        // eslint-disable-next-line
        //         text: 'The Volvo XC60 has been a cornerstone of Volvo\'s SUV lineup since its introduction in 2008, establishing itself as one of the most compelling options in the fiercely competitive compact luxury SUV segment. The current second-generation model arrived in 2018 and has been continuously refined over the years. For 2026, Volvo has given the XC60 a notable refresh that includes exterior styling updates, a significantly improved infotainment system, and new color options—all while retaining the understated Scandinavian elegance and safety-focused engineering that have become hallmarks of the Volvo brand.An elder statesman of the compact luxury SUV segment, the 2026 Volvo XC60 leans heavily on its Scandinavian heritage to present an understated yet dignified option in this crowded and highly competitive segment. Car and Driver The XC60 competes directly with vehicles like the BMW X3, Audi Q5, Mercedes-Benz GLC, Acura RDX, Genesis GV70, Lexus NX, and Porsche Macan, yet it distinguishes itself through its emphasis on comfort, safety, and refined materials rather than outright sportiness.',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        //         text: 'Refined materials rather than outright sportiness.',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        //         text: 'The Volvo XC90 is a luxury SUV that offers a blend of performance, safety, and Scandinavian design',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        //         text: 'The Volvo XC90 is a luxury SUV that offers a blend of performance, safety, and Scandinavian design',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        // eslint-disable-next-line
        //         text: '<p>The Volvo XC90</p><img src="https://placehold.net/7-600x800.png" /><p>A luxury SUV that offers a blend of performance, safety, and Scandinavian design</p>',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        // eslint-disable-next-line
        //         text: 'The Volvo XC60 has been a cornerstone of Volvo\'s SUV lineup since its introduction in 2008, establishing itself as one of the most compelling options in the fiercely competitive compact luxury SUV segment. The current second-generation model arrived in 2018 and has been continuously refined over the years. For 2026, Volvo has given the XC60 a notable refresh that includes exterior styling updates, a significantly improved infotainment system, and new color options—all while retaining the understated Scandinavian elegance and safety-focused engineering that have become hallmarks of the Volvo brand.An elder statesman of the compact luxury SUV segment, the 2026 Volvo XC60 leans heavily on its Scandinavian heritage to present an understated yet dignified option in this crowded and highly competitive segment. Car and Driver The XC60 competes directly with vehicles like the BMW X3, Audi Q5, Mercedes-Benz GLC, Acura RDX, Genesis GV70, Lexus NX, and Porsche Macan, yet it distinguishes itself through its emphasis on comfort, safety, and refined materials rather than outright sportiness.',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        //         text: 'Refined materials rather than outright sportiness.',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        //         text: 'The Volvo XC90 is a luxury SUV that offers a blend of performance, safety, and Scandinavian design',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        // {
        //     content: {
        // eslint-disable-next-line
        //         text: 'The Volvo XC60 has been a cornerstone of Volvo\'s SUV lineup since its introduction in 2008, establishing itself as one of the most compelling options in the fiercely competitive compact luxury SUV segment. The current second-generation model arrived in 2018 and has been continuously refined over the years. For 2026, Volvo has given the XC60 a notable refresh that includes exterior styling updates, a significantly improved infotainment system, and new color options—all while retaining the understated Scandinavian elegance and safety-focused engineering that have become hallmarks of the Volvo brand.An elder statesman of the compact luxury SUV segment, the 2026 Volvo XC60 leans heavily on its Scandinavian heritage to present an understated yet dignified option in this crowded and highly competitive segment. Car and Driver The XC60 competes directly with vehicles like the BMW X3, Audi Q5, Mercedes-Benz GLC, Acura RDX, Genesis GV70, Lexus NX, and Porsche Macan, yet it distinguishes itself through its emphasis on comfort, safety, and refined materials rather than outright sportiness.',
        //     },
        //     sender: 'gemini',
        //     type: 'text',
        // },
        {
            content: {
                text: 'The Volvo XC90 is a luxury SUV that offers a blend of performance, safety, and Scandinavian design',
            },
            sender: 'gemini',
            type: 'text',
        },
    ]);

    const chatMessage = ref('');

    // eslint-disable-next-line
    async function handleChatSubmit(message) {
        chatMessage.value = '';

        const audioStore = useAudioStore();
        const response = await audioStore.fetchAudioReply();

        console.log(response);
    };

    const mainInnerRef = ref(null);
    provide('scrollContainer', mainInnerRef);

    function onSpeechBubbleExpand({ heightDelta, scrollBefore }) {
        if (mainInnerRef.value && heightDelta !== 0) {
            mainInnerRef.value.scrollTop = scrollBefore + heightDelta;
        }
    }

    function setScrollToBottom() {
        requestAnimationFrame(() => {
            if (mainInnerRef.value) {
                mainInnerRef.value.scrollTop = mainInnerRef.value.scrollHeight;
            }
        });
    }

    async function onImageLoaded() {
        setScrollToBottom();
    }

    const show = ref(false);

    onMounted(async() => {
        setScrollToBottom();
        show.value = true;
    });
</script>
<style lang="scss" scoped>
    main {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
        justify-content: flex-end;

        .main-inner {
            display: flex;
            flex-direction: column;
            overflow: auto;
            padding: 1.25rem 1.25rem 0;
            row-gap: 1rem;
            overflow-anchor: none;
            visibility: hidden;

            &.show {
                visibility: visible;
            }
        }
    }

    footer {
        padding: 0 1.25rem 1.25rem;
    }
</style>

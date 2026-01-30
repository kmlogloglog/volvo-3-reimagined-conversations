<template>
    <div class="booking-wrapper">
        <BaseSpeechBubble align-bubble="left">
            <div class="booking-card">
                <div class="booking-content">
                    <h4 class="booking-headline">Your test drive booking:</h4>
                    <div class="booking-container">
                        <div class="booking-list">
                            <div class="booking-item">
                                <span class="booking-icon icon-clock"></span>
                                <span>{{ time }}</span>
                            </div>
                            <div class="booking-item">
                                <span class="booking-icon icon-calendar-1-dot"></span>
                                <span>{{ date }}</span>
                            </div>
                            <div class="booking-item">
                                <span class="booking-icon icon-map-pin"></span>
                                <div class="booking-address">
                                    <div class="booking-address-headline">{{ address.name }}</div>
                                    <div>{{ address.street }},<br /> {{ address.city }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="booking-map">
                            <img src="@/assets/images/maps/map.png" @load="onImageLoad" />
                        </div>
                    </div>
                </div>
            </div>
        </BaseSpeechBubble>
    </div>
</template>

<script setup>
    import BaseSpeechBubble from '@/components/baseComponents/uiElements/BaseSpeechBubble.vue';
    import { EMITS } from '@/constants/emits.js';

    defineProps({
        time: {
            type: String,
            default: '',
        },
        date: {
            type: String,
            default: '',
        },
        address: {
            type: Object,
            default: () => ({
                name: '',
                street: '',
                city: '',
            }),
        },
    });

    const emit = defineEmits([EMITS.IMAGE_LOADED]);

    function onImageLoad(event) {
        emit(EMITS.IMAGE_LOADED, event.target);
    }
</script>

<style lang="scss" scoped>
    .booking {
        &-headline {
            font-size: 1.25rem;
            margin-bottom: 1.5rem;
        }

        &-container {
            display: flex;
            flex-direction: column;
        }

        &-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        &-item {
            color: var(--font-color-secondary);
            display: flex;
            font-size: 1rem;
            gap: 0.75rem;

            span {
                text-box-trim: trim-both;
            }
        }

        &-icon {
            font-size: 1.25rem;
        }

        &-address-headline {
            margin-bottom: 0.5rem;
        }

        &-address {
            line-height: 1.25;
        }

        &-map {
            img {
                display: block;
                width: 100%;
            }
        }

    }
</style>

<template>
    <div class="content-container">
        <BaseSpeechBubble
            :align-bubble="AGENT.AGENT"
            :full-width="true">
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
                                <span>{{ datePretty }}</span>
                            </div>
                            <div class="booking-item">
                                <span class="booking-icon icon-map-pin"></span>
                                <div class="booking-address">
                                    <div class="booking-address-headline">{{ retailerName }}</div>
                                    <div>{{ retailerAddress }}</div>
                                </div>
                            </div>
                        </div>
                        <div ref="mapsContainer" class="booking-map">
                            <img
                                :width="size.width"
                                :height="size.height"
                                :src="mapUrl"
                                @load="onImageLoad" />
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
    import { AGENT } from '@/constants/agent.js';

    const props =defineProps({
        time: {
            type: String,
            default: '',
        },
        date: {
            type: String,
            default: '',
        },
        retailerName: {
            type: String,
            default: '',
        },
        retailerAddress: {
            type: String,
            default: '',
        },
        retailerCoordinates: {
            type: Object,
            default: () => ({ lat: 0, lng: 0 }),
        },
    });

    const emit = defineEmits([EMITS.IMAGE_LOADED]);

    function onImageLoad(event) {
        emit(EMITS.IMAGE_LOADED, event.target);
    }

    const datePretty = computed(() => {
        if (!props.date) {
            return '';
        }

        const date = new Date(props.date + 'T00:00:00');

        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    });

    const mapsContainer = useTemplateRef('mapsContainer');

    const size = computed(() => {
        if (!mapsContainer.value) {
            return { width: 0, height: 0 };
        }

        return {
            width: mapsContainer.value.clientWidth,
            height: Math.round(mapsContainer.value.clientWidth / AGENT.GOOGLE_MAPS.RATIO),
        };
    });

    const mapUrl = computed(() => {
        if(!props.retailerCoordinates || !props.retailerCoordinates.lat || !props.retailerCoordinates.lng) {
            return '';
        }

        const containerWidth = size.value.width;
        const containerHeight = size.value.height;

        const url = [
            'https://maps.googleapis.com/maps/api/staticmap',
            `?center=${props.retailerCoordinates.lat},${props.retailerCoordinates.lng}`,
            `&zoom=${AGENT.GOOGLE_MAPS.ZOOM}`,
            `&size=${containerWidth}x${containerHeight}`,
            `&markers=color:white%7Csize:large%7C${props.retailerCoordinates.lat},${props.retailerCoordinates.lng}`,
            '&style=element:geometry%7Ccolor:0x1a1520',
            '&style=element:labels.text.fill%7Ccolor:0x9a9080',
            '&style=element:labels.text.stroke%7Ccolor:0x1a1520',
            '&style=feature:road%7Celement:geometry%7Ccolor:0x4B443F',
            '&style=feature:road.arterial%7Celement:geometry%7Ccolor:0x4B443F',
            '&style=feature:road.highway%7Celement:geometry%7Ccolor:0xA19685',
            '&style=feature:road.highway%7Celement:geometry.stroke%7Ccolor:0x3a3530',
            '&style=feature:road.local%7Celement:geometry%7Ccolor:0x3a3530',
            '&style=feature:poi%7Cvisibility:off',
            '&style=feature:poi.park%7Celement:geometry%7Ccolor:0x542E46%7Cvisibility:on',
            '&style=feature:landscape.natural%7Celement:geometry%7Ccolor:0x512C43',
            '&style=feature:landscape.man_made%7Celement:geometry%7Ccolor:0x7B4D3F',
            '&style=feature:transit%7Celement:geometry%7Ccolor:0x4B443F',
            '&style=feature:water%7Celement:geometry%7Ccolor:0x0d0d18',
            `&key=${AGENT.GOOGLE_MAPS.API_KEY}`,
        ].join('');
        return url;
    });
</script>

<style lang="scss" scoped>
    .content {
        &-container {
            display: flex;
            flex-direction: column;
            padding: 2.5rem 1.875rem 1.25rem;
            overflow: auto;
            margin: auto 0;
        }
    }

    .booking {
        &-headline {
            font-size: 1.25rem;
            margin-bottom: 1.5rem;
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

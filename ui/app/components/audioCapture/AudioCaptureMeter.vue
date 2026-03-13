<template>
    <div class="meter-wrap">
        <div class="meter">
            <!-- Horizontal segmented meter -->
            <div class="meter-bar">
                <!-- Segmented background track -->
                <div class="meter-bg-segments">
                    <div
                        v-for="i in NUM_SEGMENTS"
                        :key="`bg-${i}`"
                        class="meter-bg-segment"
                        :style="{
                            bottom: `${(i - 1) * SEGMENT_WIDTH}%`,
                            height: `${SEGMENT_WIDTH * 0.9}%`,
                        }"></div>
                </div>

                <!-- Active segments -->
                <div class="meter-segments" :style="glowStyle">
                    <div
                        v-for="seg in visibleSegments"
                        :key="seg.i"
                        class="meter-segment"
                        :style="{
                            backgroundColor: seg.color,
                            bottom: `${seg.bottom}%`,
                            height: `${seg.height}%`,
                        }"></div>
                </div>

                <!-- Segment dividers and labels -->
                <div class="meter-ticks">
                    <div
                        v-for="tick in ticks"
                        :key="tick.i"
                        class="meter-tick">
                        <div v-if="tick.label !== null" class="tick-label">{{ tick.label }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue';
    import { watchThrottled } from '@vueuse/core';

    interface Props {
        level?: number
        throttleMs?: number
    }

    const props = withDefaults(defineProps<Props>(), {
        level: 0,
        throttleMs: 500,
    });

    const levelAsPercentage = computed(() => {
        return Math.min(props.level * 100, 100);
    });

    const displayLevel = ref(0);
    watchThrottled(
        () => levelAsPercentage.value,
        (val) => { displayLevel.value = Math.round(val); },
        { throttle: props.throttleMs, leading: true, trailing: true },
    );

    // Interpolate green → yellow → red based on t (0–1)
    // Red appears earlier: green 0-25%, yellow 25-50%, red 50-100%
    function gradientColor(t: number): { r: number; g: number; b: number; css: string } {
        let r: number, g: number, b: number;
        if (t < 0.25) {
            // Green to yellow-green
            const tt = t / 0.25;
            r = Math.round(50 + (180 - 50) * tt);
            g = Math.round(200 + (210 - 200) * tt);
            b = Math.round(60 + (40 - 60) * tt);
        } else if (t < 0.5) {
            // Yellow-green to yellow-orange
            const tt = (t - 0.25) / 0.25;
            r = Math.round(180 + (230 - 180) * tt);
            g = Math.round(210 + (180 - 210) * tt);
            b = Math.round(40 + (40 - 40) * tt);
        } else {
            // Yellow-orange to red
            const tt = (t - 0.5) / 0.5;
            r = Math.round(230 + (210 - 230) * tt);
            g = Math.round(180 + (50 - 180) * tt);
            b = Math.round(40 + (40 - 40) * tt);
        }
        return { r, g, b, css: `rgb(${r},${g},${b})` };
    }

    const NUM_SEGMENTS = ref(30);
    // Percentage width per segment
    const SEGMENT_WIDTH = computed(() => 100 / NUM_SEGMENTS.value);

    const visibleSegments= computed(() => {
        const norm = levelAsPercentage.value / 100;
        const numVisible = Math.ceil(norm * NUM_SEGMENTS.value);

        const result = [];
        for (let i = 0; i < numVisible; i++) {
            const segmentProgress = i / NUM_SEGMENTS.value;
            result.push({
                i,
                bottom: i * SEGMENT_WIDTH.value,
                height: SEGMENT_WIDTH.value * 0.9,
                color: gradientColor(segmentProgress).css,
            });
        }
        return result;
    });

    const glowStyle = computed(() => {
        const norm = levelAsPercentage.value / 100;
        const { r, g, b } = gradientColor(norm);
        return {
            filter: `drop-shadow(0 0 ${2 + norm * 8}px rgba(${r},${g},${b},0.6))`,
        };
    });

    const ticks= computed(() => {
        const result = [];
        const numTicks = 5;

        for (let i = 0; i <= numTicks; i++) {
            result.push({
                i,
                // 0, 10, 20, ..., 100
                label: (i * 10) * 2,
                width: '12px',
                color: 'rgba(191,154,103,0.45)',
                opacity: 1,
            });
        }
        return result;
    });
</script>

<style lang="scss" scoped>
    .meter-wrap {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        padding: 1rem;
        left: 0;
        z-index: 99;
        pointer-events: none;
    }

    .meter {
        width: 100%;
        max-width: 450px;
        height: 300px;
        margin: 0 auto;
        display: flex;
        justify-content: center;
        min-width: 0;
    }

    .meter-bar {
        position: relative;
        width: 10px;
        height: 100%;
        min-width: 0;
    }

    .meter-bg-segments {
        position: absolute;
        inset: 0;
        display: flex;
    }

    .meter-bg-segment {
        position: absolute;
        left: 0;
        right: 0;
        background: rgba(191, 154, 103, 0.12);
    }

    .meter-segments {
        position: absolute;
        inset: 0;
        display: flex;
    }

    .meter-segment {
        position: absolute;
        left: 0;
        right: 0;
        transition: all 0.2s ease;
    }

    .meter-ticks {
        position: absolute;
        top: 0;
        bottom: 0;
        margin-left: 20px;
        display: flex;
        flex-direction: column-reverse;
        justify-content: space-between;
    }

    .meter-tick {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .tick-line {
        transition: opacity 0.2s;
    }

    .tick-label {
        font-family: 'Orbitron', monospace;
        font-size: 9px;
        color: rgba(191,154,103,0.4);
        line-height: 1;
    }
</style>

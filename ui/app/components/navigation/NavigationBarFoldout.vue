<template>
    <div
        ref="containerRef"
        class="fold-out-wrapper">

        <NavigationBarButton
            :active="isOpen"
            @click="isOpen = !isOpen">
            <span class="dots">
                <span class="dot" ></span>
                <span class="dot" ></span>
                <span class="dot" ></span>
            </span>
        </NavigationBarButton>

        <Transition name="menu">
            <ul
                v-if="isOpen"
                class="menu"
                :style="{ ...menuStyle, '--menu-transform-origin': transformOrigin }">
                <li
                    v-for="option in options"
                    :key="option.id"
                    class="menu-item"
                    :class="{ active: option.active === true, disabled: option.disabled === true }"
                    @click="handleSelect(option)">
                    <span
                        v-if="option.icon"
                        class="menu-item-icon"
                        :class="option.icon" ></span>
                    <span class="menu-item-label">{{ option.label }}</span>
                </li>
            </ul>
        </Transition>
    </div>
</template>

<script setup>
    import NavigationBarButton from './NavigationBarButton.vue';
    import { onClickOutside } from '@vueuse/core';

    const props = defineProps({
        options: {
            type: Array,
            default: () => [],
        },
        direction: {
            type: String,
            default: 'up-right',
            validator: (val) => ['up-right', 'up-left', 'down-right', 'down-left'].includes(val),
        },
    });

    const emit = defineEmits(['select']);

    const isOpen = ref(false);
    const containerRef = ref(null);

    const menuStyle = computed(() => {
        const styles = {};
        if (props.direction.startsWith('up')) {
            styles.bottom = 'calc(100% + 0.5rem)';
            styles.top = 'auto';
        } else {
            styles.top = 'calc(100% + 0.5rem)';
            styles.bottom = 'auto';
        }
        if (props.direction.endsWith('right')) {
            styles.left = '0';
            styles.right = 'auto';
        } else {
            styles.right = '0';
            styles.left = 'auto';
        }
        return styles;
    });

    const transformOrigin = computed(() => {
        const vertical = props.direction.startsWith('up') ? 'bottom' : 'top';
        const horizontal = props.direction.endsWith('right') ? 'left' : 'right';
        return `${vertical} ${horizontal}`;
    });

    const stopClickOutside = onClickOutside(containerRef, () => {
        isOpen.value = false;
    });

    onUnmounted(() => {
        stopClickOutside();
    });

    function handleSelect(option) {
        if (option.disabled) return;
        emit('select', option);
        isOpen.value = false;
    }
</script>

<style scoped lang="scss">
.fold-out-wrapper {
    position: relative;
}

.dots {
    align-items: center;
    display: inline-flex;
    flex-direction: column;
    gap: 0.25rem;
    justify-content: center;
}

.dot {
    background: currentColor;
    border-radius: 9999px;
    display: block;
    height: 0.25rem;
    width: 0.25rem;
}

.menu {
    background: var(--navigation-button-active-color-background);
    border-radius: 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    list-style: none;
    margin: 0;
    min-width: 12rem;
    overflow: hidden;
    padding: 0.375rem;
    position: absolute;
    transform-origin: var(--menu-transform-origin, bottom left);

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1.5px;
        background: linear-gradient(
            315deg,
            rgba(255, 255, 255, 0.55) 0%,
            rgba(255, 255, 255, 0.15) 35%,
            rgba(255, 255, 255, 0.00) 65%,
            rgba(255, 255, 255, 0.05) 100%
        );
        -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
    }
}

.menu-item {
    align-items: center;
    border-radius: 0.625rem;
    color: var(--navigation-button-active-color-font);
    cursor: pointer;
    display: flex;
    font-size: 0.9375rem;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    transition: background 0.15s ease;
    white-space: nowrap;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    &:active {
        background: rgba(255, 255, 255, 0.18);
    }

    &.active {
        background: rgba(255, 255, 255, 0.15);

        .menu-item-icon {
            opacity: 1;
        }
    }

    &.disabled {
        cursor: default;
        opacity: 0.35;
        pointer-events: none;
    }
}

.menu-item-icon {
    flex-shrink: 0;
    font-size: 1.1rem;
    line-height: 0;
    opacity: 0.85;
}

.menu-item-label {
    flex: 1;
}

.menu-enter-active,
.menu-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: var(--menu-transform-origin, bottom left);
}

.menu-enter-from,
.menu-leave-to {
    opacity: 0;
    transform: scale(0.92) translateY(0.25rem);
}
</style>

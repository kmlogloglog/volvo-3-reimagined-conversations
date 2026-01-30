import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

export const useAppStore = defineStore('appStore', {
    state: () => ({
        backgroundImageUrl: null,
    }),
    actions,
    getters,
});

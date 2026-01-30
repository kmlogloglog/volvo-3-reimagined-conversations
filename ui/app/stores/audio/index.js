import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

export const useAudioStore = defineStore('audioStore', {
    state: () => ({
    }),
    actions,
    getters,
});

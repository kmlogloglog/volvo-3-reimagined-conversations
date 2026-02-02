import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

export const useAgentStore = defineStore('agentStore', {
    state: () => ({
        conversation: [],
        audioLevel: 0,
    }),
    actions,
    getters,
});

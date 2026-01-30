import { axiosCore } from '@/axios/axiosInstances';

export const geminiAudioAsk = () => axiosCore
    .get('accounts/profile')
    .then((response) => response.data)
    .catch((error) => { throw (error); });

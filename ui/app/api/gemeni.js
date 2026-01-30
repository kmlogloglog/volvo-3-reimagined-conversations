import { axiosCore } from '@/axios/axiosInstances';

export const gemeniAudioAsk = () => axiosCore
    .get('accounts/profile')
    .then((response) => response.data)
    .catch((error) => { throw (error); });

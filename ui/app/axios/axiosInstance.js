import axios from 'axios';

function createStandardInstance() {
    const instance = axios.create();

    instance.interceptors.request.use(
        async (config) => {
            const request = config;

            request.baseURL = 'https://baseurl.example.com/';
            request.headers['x-application-name'] = 'Brief:SPA';

            return request;
        },
        (error) => Promise.reject(error),
    );

    return instance;
}

const axiosCore = createStandardInstance('pathCore');

export {
    axiosCore,
};

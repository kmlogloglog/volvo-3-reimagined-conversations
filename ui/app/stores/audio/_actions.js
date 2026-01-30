export default {
    fetchAudioReply() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('This is a mock audio reply.');
            }, 1000);
        });
    },
};

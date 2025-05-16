export const config = {
    timeouts: {
        navigation: 60000,
        action: 30000,
        protocol: 120000,  // Increased to 2 minutes
        screenshot: 30000
    },
    viewport: {
        width: 1280,
        height: 1024
    },
    browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--single-process'
    ],
    retries: {
        max: 3,
        delay: 2000
    }
};
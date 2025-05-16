import puppeteer from 'puppeteer';
import { config } from './config.js';
import { trackStep } from './utils.js';
import { findProductLink } from './scraper.js';
import { addToCart, goToCheckout } from './steps/cart.js';
import { fillCheckoutForm } from './checkout.js';

process.on('unhandledRejection', (error) => {
    console.error(JSON.stringify({
        status: 'error',
        message: 'Unhandled error in crawler',
        error: error.message
    }));
    process.exit(1);
});

const targetUrl = process.argv[2];

if (!targetUrl) {
    console.error(JSON.stringify({
        status: 'error',
        message: 'URL not provided'
    }));
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        userDataDir: './tmp/puppeteer',
        protocolTimeout: config.protocolTimeout,
        args: config.browserArgs
    });
    
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(config.timeout);
    await page.setDefaultTimeout(config.timeout);
    await page.setViewport(config.viewport);

    const report = {
        url: targetUrl,
        startTime: new Date().toISOString(),
        steps: [],
        errors: [],
        totalTime: null,
        success: false
    };

    try {
        await trackStep(page, report, 'homepage', targetUrl);

        const productLink = await findProductLink(page);
        if (!productLink) {
            throw new Error('No product links found');
        }

        await trackStep(page, report, 'product_page', productLink);
        await addToCart(page, report);
        await goToCheckout(page, report);
        await fillCheckoutForm(page, report);

        report.success = true;
    } catch (error) {
        report.errors.push({
            error: error.message,
            stack: error.stack
        });
        console.error(JSON.stringify({
            status: 'error',
            message: 'Error during crawler execution',
            report: report
        }));
        process.exit(1);
    } finally {
        report.endTime = new Date().toISOString();
        report.totalTime = report.steps.reduce((total, step) => total + step.duration, 0);
        
        await browser.close();
        console.log(JSON.stringify(report));
    }
})();
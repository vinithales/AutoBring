import { config } from './config.js';

export async function fillCheckoutForm(page, report) {
    try {
        // Wait for checkout form to load
        await page.waitForSelector('form.woocommerce-checkout', {
            timeout: config.timeout
        });

        // Fill in billing details
        await page.type('#billing_first_name', 'Test', { delay: 50 });
        await page.type('#billing_last_name', 'User', { delay: 50 });
        await page.type('#billing_email', 'test@example.com', { delay: 50 });
        await page.type('#billing_phone', '11999999999', { delay: 50 });
        await page.type('#billing_address_1', 'Test Street 123', { delay: 50 });
        await page.type('#billing_city', 'São Paulo', { delay: 50 });
        await page.select('#billing_state', 'SP');
        await page.type('#billing_postcode', '01001000', { delay: 50 });

        // Payment method - select first available
        await page.waitForSelector('input[name="payment_method"]', {
            timeout: config.timeout
        });
        await page.click('input[name="payment_method"]');

        // Accept terms if needed
        try {
            await page.waitForSelector('#terms', { timeout: 5000 });
            await page.click('#terms');
        } catch (error) {
            // Terms checkbox not found, continue
        }

        // Place order
        await page.waitForSelector('#place_order', {
            timeout: config.timeout,
            visible: true
        });
        await page.click('#place_order');

        // Verify order completion
        await page.waitForSelector('.woocommerce-order-overview', {
            timeout: config.timeout
        });

        report.steps.push({
            name: 'fill_checkout_form',
            status: 'completed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        await page.screenshot({ path: 'error_checkout_form.png' });
        report.steps.push({
            name: 'fill_checkout_form',
            status: 'Failed to fill checkout form',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}
import { config } from '../config.js';

export async function addToCart(page, report) {
    try {
        let addedToCart = false;
        
        for (const selector of config.selectors.addToCart) {
            try {
                await page.waitForSelector(selector, { 
                    timeout: config.timeout,
                    visible: true 
                });
                
                await Promise.all([
                    page.click(selector, { delay: 100 }),
                    page.waitForResponse(response => 
                        response.url().includes('add_to_cart') || 
                        response.url().includes('wc-ajax=add_to_cart'),
                    { timeout: config.timeout })
                ]);
                
                await page.waitForFunction(() => {
                    return document.querySelector('.woocommerce-message')?.textContent.includes('added to your cart') || 
                           document.querySelector('.added_to_cart') ||
                           document.querySelector('.cart-contents-count')?.textContent.trim() !== '0';
                }, { timeout: config.timeout });
                
                addedToCart = true;
                break;
            } catch (error) {
                continue;
            }
        }

        if (!addedToCart) {
            throw new Error('Could not find or click add to cart button');
        }

        report.steps.push({
            name: 'add_to_cart',
            status: 'completed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        await page.screenshot({ path: 'error_add_to_cart.png' });
        report.steps.push({
            name: 'add_to_cart',
            status: 'Failed to add to cart',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

export async function goToCheckout(page, report) {
    try {
        let checkoutClicked = false;
        
        for (const selector of config.selectors.checkout) {
            try {
                await page.waitForSelector(selector, {
                    timeout: config.timeout,
                    visible: true
                });

                const navigationPromise = page.waitForNavigation({
                    waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
                    timeout: config.timeout
                });

                await page.click(selector, { delay: 100 });
                await navigationPromise;
                
                await page.waitForSelector('form.woocommerce-checkout', { 
                    timeout: config.timeout 
                });
                
                checkoutClicked = true;
                break;
            } catch (error) {
                continue;
            }
        }

        if (!checkoutClicked) {
            throw new Error('Could not proceed to checkout');
        }

        report.steps.push({
            name: 'go_to_checkout',
            status: 'completed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        await page.screenshot({ path: 'error_add_to_cart.png', timeout: 0 });   
        report.steps.push({
            name: 'go_to_checkout',
            status: 'Failed to proceed to checkout',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}
import { config } from './config.js';

export async function findProductLink(page) {
    try {
        let productLink = null;
        
        for (const selector of config.selectors.productLink) {
            try {
                await page.waitForSelector(selector, { timeout: config.timeout });
                productLink = await page.evaluate((sel) => {
                    const links = Array.from(document.querySelectorAll(sel));
                    if (links.length === 0) return null;
                    const randomIndex = Math.floor(Math.random() * links.length);
                    return links[randomIndex].href;
                }, selector);
                
                if (productLink) break;
            } catch (error) {
                continue;
            }
        }

        if (!productLink) {
            throw new Error('No product links found on the page');
        }

        return productLink;
    } catch (error) {
        console.error('Error finding product link:', error.message);
        throw error;
    }
}
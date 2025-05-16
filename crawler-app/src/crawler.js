import puppeteer from 'puppeteer';

process.on('unhandledRejection', (error) => {
    console.error(JSON.stringify({
        status: 'error',
        message: 'Erro não tratado no crawler',
        error: error.message
    }));
    process.exit(1);
});

const targetUrl = process.argv[2];

if (!targetUrl) {
    console.error(JSON.stringify({
        status: 'error',
        message: 'URL não fornecida'
    }));
    process.exit(1);
}




(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        userDataDir: './tmp/puppeteer'
     });
    const page = await browser.newPage();
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

        // Etapa 2: Navegar para um produto
        const productLink = await findProductLink(page);
        if (productLink) {
            await trackStep(page, report, 'product_page', productLink);
            
            // Etapa 3: Adicionar ao carrinho
            await addToCart(page, report);
            
            // Etapa 4: Ir para o checkout
            await goToCheckout(page, report);
            
            // Etapa 5: Preencher formulário de checkout
            await fillCheckoutForm(page, report);
        }

        report.success = true;
    } catch (error) {
        report.errors.push({
            error: error.message,
            stack: error.stack
        });
        console.error(JSON.stringify({
            status: 'error',
            message: 'Erro durante a execução do crawler',
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


async function findProductLink(page){
    try {
        //espera o <a> do carrinho carregar
        await page.waitForSelector('a.woocommerce-LoopProduct-link', {timeout:5000});
            

        return await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a.woocommerce-LoopProduct-link'));
            if (links.length === 0) return null;
        
            const randomIndex = Math.floor(Math.random() * links.length);
            return links[randomIndex].href;
        });

    } catch (error) {
        console.error(JSON.stringify({
            status: 'error',
            message: 'Não foi possível encontrar o link de produto:', 
            erro: error.message,
            report: report
        }));
    }
}


async function addToCart(page, report){
    try {
        await page.waitForSelector('button.single_add_to_cart_button.button.alt', {timeout: 5000});
        await page.click('button.single_add_to_cart_button.button.alt');
        await page.waitForSelector('a.elementor-button.elementor-button--checkout.elementor-size-md', {timeout: 15000});
        await page.click('a.elementor-button.elementor-button--checkout.elementor-size-md');

        report.steps.push({
            name: 'add_to_cart',
            status: 'completed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        report.steps.push({
            name: 'add_to_cart',
            status: 'Não foi possível adicionar ao carrinho',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}


async function trackStep(page, report, stepName, url) {
    const start = performance.now();
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        const duration = performance.now() - start;
        
        report.steps.push({
            name: stepName,
            url: url,
            duration: duration,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });
        
        return true;
    } catch (error) {
        const duration = performance.now() - start;
        
        report.steps.push({
            name: stepName,
            url: url,
            duration: duration,
            timestamp: new Date().toISOString(),
            status: 'failed'
        });
        
        throw error;
    }
}


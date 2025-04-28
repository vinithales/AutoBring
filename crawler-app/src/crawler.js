import puppeteer from 'puppeteer';

const targetUrl = process.argv[2];

if (!targetUrl) {
    console.error(JSON.stringify({
        status: 'error',
        message: 'URL não fornecida'
    }));
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({ headless: true });
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
        // Etapa 1: Acessar a página inicial
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
            step: report.steps.length > 0 ? report.steps[report.steps.length - 1].name : 'unknown',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        report.endTime = new Date().toISOString();
        report.totalTime = report.steps.reduce((total, step) => total + step.duration, 0);
        
        await browser.close();
        console.log(JSON.stringify(report));
    }
})();

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


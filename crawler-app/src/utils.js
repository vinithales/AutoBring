export async function trackStep(page, report, stepName, url) {
    const start = performance.now();
    
    try {
        await page.goto(url, { 
            waitUntil: ['load', 'domcontentloaded', 'networkidle0'], 
            timeout: 60000 
        });
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
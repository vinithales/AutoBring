<form id="crawlerForm">
    @csrf
    <div class="form-group">
        <label for="url">URL do Site WooCommerce</label>
        <input type="url" class="form-control" id="url" name="url" required placeholder="https://exemplo.com">
    </div>
    <button type="submit" class="btn btn-primary">Executar Teste</button>
</form>

<div id="result"></div>

<script>
document.getElementById('crawlerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="alert alert-info">Executando teste, aguarde...</div>';
    
    try {
        const response = await fetch('/api/runCrawler', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Resposta não-JSON: ${text.substring(0, 100)}...`);
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro no servidor');
        }

        resultDiv.innerHTML = `
            <div class="alert alert-success">
                <h4>Teste concluído!</h4>
                <p><strong>URL:</strong> ${data.url}</p>
                <p><strong>Status:</strong> ${data.data?.success ? 'Sucesso' : 'Falha'}</p>
                <button class="btn btn-sm btn-secondary" type="button" 
                    onclick="this.nextElementSibling.classList.toggle('d-none')">
                    Mostrar detalhes
                </button>
                <div class="d-none mt-2">
                    <pre>${JSON.stringify(data.data, null, 2)}</pre>
                </div>
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <h4>Erro na requisição</h4>
                <p>${error.message}</p>
            </div>
        `;
        console.error('Erro:', error);
    }
});
</script>

# Passo a Passo para a Construção do Web Crawler

## Estrutura do Sistema

Este documento descreve o passo a passo para construir um web crawler com Laravel para o backend e frontend, MongoDB para o banco de dados, Puppeteer para o crawler e Nodemailer para envio de e-mails.

---

### Estrutura de Diretórios

```plaintext
/crawler-app/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── LogController.php
│   └── Models/
│       └── SiteLog.php
├── config/
│   └── database.php
├── database/
│   └── migrations/
│       └── 2025_04_25_create_site_logs_table.php
├── routes/
│   └── api.php
├── resources/
│   ├── views/
│   │   └── logs.blade.php
├── scripts/
│   └── crawler.js
├── .env
├── composer.json
├── package.json
└── public/
    └── index.php
```

### Descrição de Cada Diretório e Arquivo

- `/app/`: Contém a lógica de backend (Laravel), como controladores e modelos.
- `/config/`: Arquivos de configuração do Laravel.
- `/database/`: Migrations do banco de dados.
- `/resources/`: Contém as views (Blade) para exibição dos logs.
- `/scripts/`: Scripts do crawler (Node.js + Puppeteer).
- `/public/`: Arquivos públicos, como o ponto de entrada `index.php`.

---

## Passo a Passo de Implementação

### 1. Configuração do Projeto

**Backend (Laravel)**
1. Instalar o Laravel:
   ```bash
   composer create-project --prefer-dist laravel/laravel crawler-app
   ```

2. Instalar o pacote para integração com MongoDB:
   ```bash
   composer require jenssegers/mongodb
   ```

**MongoDB**
1. Instalar o MongoDB localmente ou criar uma conta no MongoDB Atlas.

**Puppeteer (Node.js)**
1. Instalar o Puppeteer:
   ```bash
   npm install puppeteer
   ```

2. Criar um arquivo `crawler.js` dentro de `/scripts/` para implementar o crawler.

---

### 2. Banco de Dados (MongoDB)

No Laravel, crie o modelo e migration para a coleção `site_logs`.

**Modelo SiteLog (app/Models/SiteLog.php):**
```php
use Jenssegers\Mongodb\Eloquent\Model as Eloquent;

class SiteLog extends Eloquent
{
    protected $connection = 'mongodb';
    protected $fillable = ['url', 'status', 'relatorio', 'data_execucao'];
}
```

**Migration (database/migrations/2025_04_25_create_site_logs_table.php):**
```php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSiteLogsTable extends Migration
{
    public function up()
    {
        Schema::create('site_logs', function (Blueprint $table) {
            $table->id();
            $table->string('url');
            $table->string('status');
            $table->text('relatorio');
            $table->timestamp('data_execucao');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('site_logs');
    }
}
```

---

### 3. Desenvolvimento do Crawler (Puppeteer)

No arquivo `/scripts/crawler.js`, implemente o crawler com Puppeteer e Nodemailer.

**Exemplo de código:**

```javascript
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const axios = require('axios');

const productUrls = [
  'https://exemplo.com/produto-1',
  'https://exemplo.com/produto-2',
  'https://exemplo.com/produto-3',
];

const emailReceiver = 'seuemail@dominio.com';

async function sendEmail(report) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'seuemail@gmail.com',
      pass: 'suasenha',
    },
  });

  let info = await transporter.sendMail({
    from: '"Crawler Report" <seuemail@gmail.com>',
    to: emailReceiver,
    subject: 'Relatório de Execução do Crawler',
    text: report,
  });

  console.log('Email enviado:', info.messageId);
}

async function saveLogToDB(url, status, report) {
  await axios.post('http://localhost/api/logs', { url, status, relatorio: report });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let report = '';

  for (const url of productUrls) {
    try {
      console.log(`Visitando ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });

      const addToCartBtn = await page.$('.botao-adicionar');
      if (!addToCartBtn) {
        report += `Erro: Não encontrou o botão de adicionar ao carrinho na URL: ${url}
`;
        await saveLogToDB(url, 'erro', report);
        continue;
      }

      await addToCartBtn.click();
      await page.waitForTimeout(2000);

      const checkoutBtn = await page.$('.botao-checkout');
      if (!checkoutBtn) {
        report += `Erro: Não conseguiu acessar o carrinho ou finalizar compra na URL: ${url}
`;
        await saveLogToDB(url, 'erro', report);
        continue;
      }

      await checkoutBtn.click();
      await page.waitForTimeout(2000);

      report += `Compra simulada com sucesso na URL: ${url}
`;
      await saveLogToDB(url, 'completo', report);
    } catch (error) {
      report += `Erro inesperado na URL ${url}: ${error.message}
`;
      await saveLogToDB(url, 'erro', report);
    }
  }

  await browser.close();
  await sendEmail(report);
})();
```

---

### 4. Backend (Laravel)

Crie a rota e o controlador para receber os logs gerados pelo crawler e armazená-los no banco de dados.

**Rota (routes/api.php):**
```php
use App\Models\SiteLog;

Route::post('/logs', function (Request $request) {
    $log = new SiteLog();
    $log->url = $request->input('url');
    $log->status = $request->input('status');
    $log->relatorio = $request->input('relatorio');
    $log->data_execucao = now();
    $log->save();

    return response()->json(['message' => 'Log salvo com sucesso!']);
});
```

---

### 5. Interface (Laravel Blade)

Exiba os logs na interface usando Laravel Blade.

**View Blade (resources/views/logs.blade.php):**

```php
@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Logs de Execução do Crawler</h1>
    <table class="table">
        <thead>
            <tr>
                <th>URL</th>
                <th>Status</th>
                <th>Relatório</th>
                <th>Data de Execução</th>
            </tr>
        </thead>
        <tbody>
            @foreach($logs as $log)
                <tr>
                    <td>{{ $log->url }}</td>
                    <td>{{ $log->status }}</td>
                    <td>{{ $log->relatorio }}</td>
                    <td>{{ $log->data_execucao }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
```

**Controlador (app/Http/Controllers/LogController.php):**
```php
use App\Models\SiteLog;

public function showLogs()
{
    $logs = SiteLog::all();
    return view('logs', compact('logs'));
}
```

---

### 6. Conceitos de Web Crawling para Estudo

- **HTTP Requests e Response**: Como fazer requisições para páginas web e interpretar as respostas.
- **DOM Manipulation**: Interagir com o DOM de uma página para coletar dados ou interagir com elementos (como botões).
- **Headless Browsing**: Utilizar navegadores sem interface gráfica (como Puppeteer) para realizar tarefas automaticamente.
- **Cookies e Sessions**: Entender como os cookies e sessões funcionam para manter o estado entre requisições.
- **User-Agent**: Modificar o User-Agent para simular diferentes navegadores e evitar bloqueios.
- **Requisições Assíncronas (AJAX)**: Como lidar com conteúdo dinâmico carregado via JavaScript.
- **Captcha e Anti-bot**: Como lidar com desafios como reCAPTCHA em crawlers.
- **Armazenamento de Logs**: Como registrar e persistir os erros e sucessos do crawler.

---

### Conclusão

Com este guia, você deve ser capaz de implementar o seu web crawler e o sistema completo para gerenciar as execuções e visualizar os logs. Se precisar de mais ajuda em algum ponto específico, é só me avisar!


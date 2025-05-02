<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;


class CrawlerController extends Controller
{

    public function runCrawler(Request $request)
    {

        $request->validate([
            'url' => 'required|url'
        ]);


        $targetUrl = $request->input('url');
        
        $command = [
            'node',
            base_path('crawler-app/src/crawler.js'), //Mudar esse caminho futuramente
            $targetUrl
        ];

        
        try {

            $process = new Process($command);
            $process->setTimeout(30);
            $process->run();

            if(!$process->isSuccessful()){
                throw new ProcessFailedException($process);
            }


            $output = $process->getOutput();
            $result = json_decode($output, true) ?? $output;

            
            Log::info('Crawler executado com sucesso', [
                'url' => $targetUrl,
                'output' => $result
            ]);

            return response()->json([
                'status' => 'success',
                'url' => $targetUrl,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao executar o crawler', [
                'url' => $targetUrl,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erro ao executar o crawler',
                'error' => $e->getMessage(),
                'url' => $targetUrl
            ], 500);
        }
    }
}
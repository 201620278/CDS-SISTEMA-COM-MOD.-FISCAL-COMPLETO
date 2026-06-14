#!/usr/bin/env node

/**
 * Script de teste para endpoint de geração de sugestões de promoções
 * Testa a classificação correta de produtos por motivo
 */

const http = require('http');

function testarSugestoes() {
    const data = JSON.stringify({
        produto_ids: [],
        desconto_percentual: 15
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/produtos/promocoes/gerar-sugestoes',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log('\n========================================');
            console.log('TESTE DE ENDPOINT: /produtos/promocoes/gerar-sugestoes');
            console.log('========================================\n');

            if (res.statusCode === 200) {
                console.log('✅ Status: 200 OK\n');
                try {
                    const resultado = JSON.parse(responseData);
                    console.log('📊 Resultado:\n');
                    console.log(JSON.stringify(resultado, null, 2));
                    console.log('\n========================================');
                    console.log('✅ TESTE CONCLUÍDO COM SUCESSO');
                    console.log('========================================\n');
                    
                    if (resultado.total > 0) {
                        console.log('Dicas de validação:\n');
                        console.log('1. Verifique se há sugestões com motivos como:');
                        console.log('   - "🔴 Produto Vencido" / "🔴 Vence Hoje" / "🔴 Vence em até 3 dias"');
                        console.log('   - "🟠 Vence em até 7 dias" / "🔵 Vence em até 30 dias"');
                        console.log('   - "🔴 Nunca Vendeu" / "🔴 Produto Encalhado"');
                        console.log('   - "⚫ Produto Parado" / "🟡 Giro Baixo"');
                        console.log('\n2. Verifique se estão ordenadas por prioridade (encalhe/vencimento primeiro)');
                        console.log('\n3. Abra o modal de sugestões no navegador para confirmar badges corretas\n');
                    }
                } catch (e) {
                    console.log('❌ Erro ao parsear resposta JSON:', e.message);
                    console.log('Resposta bruta:', responseData);
                }
            } else {
                console.log(`❌ Status: ${res.statusCode}`);
                console.log('Resposta:', responseData);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Erro na requisição:', error.message);
        console.log('\nCertifique-se de que o servidor está rodando em http://localhost:3000');
    });

    req.write(data);
    req.end();
}

// Executar teste
console.log('\n🔄 Iniciando teste do endpoint de sugestões...\n');
testarSugestoes();

#!/usr/bin/env node

/**
 * Script de teste para endpoint de geração de sugestões de promoções
 * Detecta automaticamente a porta do servidor
 */

const http = require('http');
const net = require('net');

async function encontrarPortaServidor() {
    for (let porta = 3001; porta <= 3010; porta++) {
        const disponivel = await testarPorta(porta);
        if (disponivel) {
            return porta;
        }
    }
    return null;
}

function testarPorta(porta) {
    return new Promise((resolve) => {
        const request = http.get(`http://localhost:${porta}/`, (res) => {
            resolve(true);
        }).on('error', () => {
            resolve(false);
        });
        
        request.setTimeout(1000);
    });
}

async function testarSugestoes(porta) {
    const data = JSON.stringify({
        produto_ids: [],
        desconto_percentual: 15
    });

    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: porta,
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
                        } else {
                            console.log('⚠️ AVISO: Endpoint retornou 0 sugestões. Verificar se há produtos na base.\n');
                        }
                    } catch (e) {
                        console.log('❌ Erro ao parsear resposta JSON:', e.message);
                        console.log('Resposta bruta:', responseData);
                    }
                } else {
                    console.log(`❌ Status: ${res.statusCode}`);
                    console.log('Resposta:', responseData);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error('❌ Erro na requisição:', error.message);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('\n🔄 Procurando servidor disponível...\n');
    const porta = await encontrarPortaServidor();

    if (!porta) {
        console.log('❌ Nenhum servidor encontrado nas portas 3001-3010');
        console.log('\nProcedimento para testar:');
        console.log('1. Abra a aplicação (npm start)');
        console.log('2. Aguarde o sistema carregar completamente');
        console.log('3. Execute este script novamente\n');
        process.exit(1);
    }

    console.log(`✅ Servidor encontrado na porta ${porta}\n`);
    await testarSugestoes(porta);
}

main();

#!/usr/bin/env node

/**
 * Script de diagnóstico completo: verifica classificação de TODOS os produtos
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbDir = process.env.DB_DIR || path.join(
  process.env.PROGRAMDATA || 'C:\\ProgramData',
  'MercantilFiscal',
  'dados'
);

const dbPath = path.join(dbDir, 'mercantil.db');

console.log('\n🔍 DIAGNÓSTICO COMPLETO DE CLASSIFICAÇÃO DE PRODUTOS');
console.log('=' .repeat(60) + '\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }

  // Função de classificação idêntica ao backend
  function classificarProduto(produto) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let diasParaVencer = null;
    if (produto.controlar_validade == 1 && produto.data_validade && produto.data_validade !== '0000-00-00') {
      const validade = new Date(produto.data_validade);
      validade.setHours(0, 0, 0, 0);
      diasParaVencer = Math.floor((validade - hoje) / 86400000);
    }

    let diasSemVenda = null;
    if (produto.ultima_venda) {
      const ultima = new Date(produto.ultima_venda);
      ultima.setHours(0, 0, 0, 0);
      diasSemVenda = Math.floor((hoje - ultima) / 86400000);
    }

    // Priorizar problemas de validade
    if (diasParaVencer !== null) {
      if (diasParaVencer < 0) {
        return { tipo: 'vencido', texto: '🔴 Produto Vencido', dias: diasParaVencer, prioridade: 100 };
      }
      if (diasParaVencer === 0) {
        return { tipo: 'vence_hoje', texto: '🔴 Vence Hoje', dias: diasParaVencer, prioridade: 95 };
      }
      if (diasParaVencer <= 3) {
        return { tipo: 'vencimento_3dias', texto: '🔴 Vence em até 3 dias', dias: diasParaVencer, prioridade: 90 };
      }
      if (diasParaVencer <= 7) {
        return { tipo: 'vencimento_7dias', texto: '🟠 Vence em até 7 dias', dias: diasParaVencer, prioridade: 80 };
      }
      if (diasParaVencer <= 30) {
        return { tipo: 'vencimento_30dias', texto: '🔵 Vence em até 30 dias', dias: diasParaVencer, prioridade: 70 };
      }
    }

    // Sem problema de validade: verificar giro / vendas
    if (!produto.ultima_venda) {
      return { tipo: 'sem_vendas', texto: '🔴 Nunca Vendeu', dias: null, prioridade: 65 };
    }

    if (diasSemVenda >= 60) {
      return { tipo: 'encalhado', texto: '🔴 Produto Encalhado', dias: diasSemVenda, prioridade: 60 };
    }

    if (diasSemVenda >= 30) {
      return { tipo: 'parado', texto: '⚫ Produto Parado', dias: diasSemVenda, prioridade: 50 };
    }

    if (diasSemVenda >= 15) {
      return { tipo: 'giro_baixo', texto: '🟡 Giro Baixo', dias: diasSemVenda, prioridade: 40 };
    }

    return null; // Produto com giro normal
  }

  // Buscar TODOS os produtos elegíveis
  db.all(`
    SELECT
      p.id,
      p.nome,
      p.estoque_atual,
      p.controlar_validade,
      p.data_validade,
      (
        SELECT MAX(v.created_at)
        FROM vendas_itens vi
        INNER JOIN vendas v ON v.id = vi.venda_id
        WHERE vi.produto_id = p.id
      ) AS ultima_venda
    FROM produtos p
    LEFT JOIN promocoes pr ON pr.produto_id = p.id 
      AND pr.status = 'ativa' 
      AND DATE(pr.data_inicio) <= DATE('now')
      AND DATE(pr.data_fim) > DATE('now')
    WHERE
      p.ativo = 1
      AND p.estoque_atual > 0
      AND pr.id IS NULL
    ORDER BY p.nome ASC
  `, (err, produtos) => {
    if (err) {
      console.error('❌ Erro ao buscar produtos:', err.message);
      db.close();
      return;
    }

    if (!produtos || produtos.length === 0) {
      console.log('⚠️  Nenhum produto elegível encontrado\n');
      db.close();
      return;
    }

    console.log(`📦 Total de produtos elegíveis: ${produtos.length}\n`);
    console.log('DIAGNÓSTICO DETALHADO:');
    console.log('-'.repeat(60));

    const sugestoes = [];
    let contadores = {
      vencido: 0,
      vence_hoje: 0,
      vencimento_3dias: 0,
      vencimento_7dias: 0,
      vencimento_30dias: 0,
      sem_vendas: 0,
      encalhado: 0,
      parado: 0,
      giro_baixo: 0,
      sem_sugestao: 0
    };

    produtos.forEach((prod, idx) => {
      const classif = classificarProduto(prod);

      console.log(`\n[${idx + 1}] ${prod.nome}`);
      console.log(`    ID: ${prod.id} | Estoque: ${prod.estoque_atual}`);
      console.log(`    Controla Validade: ${prod.controlar_validade === 1 ? 'SIM' : 'NÃO'}`);

      if (prod.data_validade && prod.data_validade !== '0000-00-00') {
        console.log(`    Data Validade: ${prod.data_validade}`);
      }

      if (prod.ultima_venda) {
        console.log(`    Última Venda: ${prod.ultima_venda}`);
      } else {
        console.log(`    Última Venda: NUNCA`);
      }

      if (classif) {
        console.log(`    ✅ CLASSIFICAÇÃO: ${classif.texto}`);
        if (classif.dias !== null) {
          console.log(`       Dias: ${classif.dias}`);
        }
        console.log(`       Prioridade: ${classif.prioridade}`);
        contadores[classif.tipo]++;
        sugestoes.push({
          id: prod.id,
          nome: prod.nome,
          estoque: prod.estoque_atual,
          motivo: classif.texto,
          tipo: classif.tipo,
          dias: classif.dias,
          prioridade: classif.prioridade
        });
      } else {
        console.log(`    ℹ️  SEM SUGESTÃO (giro normal)`);
        contadores.sem_sugestao++;
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DE CLASSIFICAÇÕES:');
    console.log('='.repeat(60));
    console.log(`🔴 Produto Vencido:         ${contadores.vencido}`);
    console.log(`🔴 Vence Hoje:              ${contadores.vence_hoje}`);
    console.log(`🔴 Vence em até 3 dias:    ${contadores.vencimento_3dias}`);
    console.log(`🟠 Vence em até 7 dias:    ${contadores.vencimento_7dias}`);
    console.log(`🔵 Vence em até 30 dias:   ${contadores.vencimento_30dias}`);
    console.log(`🔴 Nunca Vendeu:            ${contadores.sem_vendas}`);
    console.log(`🔴 Produto Encalhado:      ${contadores.encalhado}`);
    console.log(`⚫ Produto Parado:          ${contadores.parado}`);
    console.log(`🟡 Giro Baixo:              ${contadores.giro_baixo}`);
    console.log(`ℹ️  Sem Sugestão:            ${contadores.sem_sugestao}`);
    console.log(`📈 TOTAL COM SUGESTÃO:     ${sugestoes.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('🔍 PROCURANDO PROBLEMAS:');
    console.log('='.repeat(60));

    // Procurar por produtos que parecem estar incorretos
    let problemas = 0;

    sugestoes.forEach(s => {
      // Se tem motivo de vencimento mas não controla validade
      if (s.tipo.includes('vencimento') && !produtos.find(p => p.id === s.id)?.controlar_validade) {
        console.log(`❌ PROBLEMA: ${s.nome}`);
        console.log(`   Motivo: ${s.motivo} (motivo de vencimento)`);
        console.log(`   Mas: controlar_validade = NÃO`);
        console.log(`   CAUSA: Classificação incorreta\n`);
        problemas++;
      }
    });

    if (problemas === 0) {
      console.log('✅ Nenhum problema detectado na classificação\n');
    } else {
      console.log(`⚠️  Total de problemas: ${problemas}\n`);
    }

    console.log('='.repeat(60));
    console.log('💡 RECOMENDAÇÕES:');
    console.log('='.repeat(60));
    console.log('1. Verifique se produtos sem vencimento mostram motivos de VENDA');
    console.log('2. Verifique se o frontend exibe "dias sem venda" corretamente');
    console.log('3. Verifique se badges têm cores apropriadas\n');

    db.close();
  });
});

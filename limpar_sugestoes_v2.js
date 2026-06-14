#!/usr/bin/env node

/**
 * Script para limpar sugestões antigas e forçar regeneração
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determinar diretório de dados
const dbDir = process.env.DB_DIR || path.join(
  process.env.PROGRAMDATA || 'C:\\ProgramData',
  'MercantilFiscal',
  'dados'
);

const dbPath = path.join(dbDir, 'mercantil.db');

console.log('\n📋 Limpeza de Sugestões de Promoção');
console.log('===================================\n');
console.log(`📁 Banco de dados: ${dbPath}\n`);

const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }

  console.log('✅ Conectado ao banco de dados\n');
  
  try {
    // Criar tabela se não existir
    await execQuery(db, `
      CREATE TABLE IF NOT EXISTS promocoes_sugestoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        motivo TEXT,
        dias_para_vencer INTEGER,
        estoque_atual INTEGER,
        preco_atual REAL,
        preco_sugerido REAL,
        desconto_percentual REAL DEFAULT 15,
        ativo BOOLEAN DEFAULT 1,
        aceito_em DATETIME,
        rejeitado_em DATETIME,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      )
    `);
    console.log('✅ Tabela promocoes_sugestoes verificada/criada\n');

    // Contar antes
    const rowBefore = await getOne(db, 'SELECT COUNT(*) as total FROM promocoes_sugestoes WHERE ativo = 1');
    const totalBefore = rowBefore?.total || 0;
    console.log(`📊 Sugestões ativas antes: ${totalBefore}`);

    // Limpar
    const result = await execQuery(db, `
      DELETE FROM promocoes_sugestoes 
      WHERE ativo = 1 
        AND aceito_em IS NULL 
        AND rejeitado_em IS NULL
    `);
    console.log(`🗑️  Sugestões limpas: ${result}`);

    // Contar depois
    const rowAfter = await getOne(db, 'SELECT COUNT(*) as total FROM promocoes_sugestoes WHERE ativo = 1');
    console.log(`📊 Sugestões ativas depois: ${rowAfter?.total || 0}\n`);

    // Contar elegíveis
    const stats = await getOne(db, `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN controlar_validade = 1 THEN 1 ELSE 0 END) as com_validade,
        SUM(CASE WHEN controlar_validade = 0 THEN 1 ELSE 0 END) as sem_validade
      FROM produtos p
      LEFT JOIN promocoes pr ON pr.produto_id = p.id 
        AND pr.status = 'ativa' 
        AND DATE(pr.data_inicio) <= DATE('now')
        AND DATE(pr.data_fim) > DATE('now')
      WHERE
        p.ativo = 1
        AND p.estoque_atual > 0
        AND pr.id IS NULL
    `);

    console.log('📦 Produtos elegíveis para sugestão:');
    console.log(`   Total: ${stats?.total || 0}`);
    console.log(`   Com controle de validade: ${stats?.com_validade || 0}`);
    console.log(`   Sem controle de validade: ${stats?.sem_validade || 0}`);

    console.log('\n✅ Limpeza concluída!');
    console.log('\n📝 Próximas etapas:');
    console.log('   1. Abra o aplicativo (npm start)');
    console.log('   2. Navegue até Produtos → Sugestões de Promoções');
    console.log('   3. Clique em "Gerar Sugestões"');
    console.log('   4. Verifique os novos motivos com emojis\n');

    db.close();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    db.close();
    process.exit(1);
  }
});

function execQuery(db, query) {
  return new Promise((resolve, reject) => {
    db.run(query, function(err) {
      if (err) reject(err);
      else resolve(this.changes || 0);
    });
  });
}

function getOne(db, query) {
  return new Promise((resolve, reject) => {
    db.get(query, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

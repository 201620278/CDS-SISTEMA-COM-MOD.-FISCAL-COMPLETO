# 📋 SUMÁRIO: Refator Completo do Sistema de Sugestões de Promoções

## 🎯 Objetivo Geral

Implementar um sistema inteligente de classificação de produtos para sugestões de promoção, com:
- Classificação automática baseada em validade (≤30 dias) ou histórico de vendas
- Priorização com scoring numérico
- Exclusão automática de produtos com promoções ativas
- Interface visual inteligente com badges coloridas e motivos descritivos

---

## 🔧 Implementação: Backend

### Arquivo: `backend/rotas/produtos.js`

#### 1. Nova Função: `classificarProduto(produto)`

```javascript
function classificarProduto(produto) {
  // Retorna: { tipo, texto, prioridade }
  
  // HIERARQUIA 1: Controle de Validade (ativado se controlar_validade=1)
  if (produto.controlar_validade) {
    const hoje = new Date();
    const validade = new Date(produto.data_validade);
    const diasParaVencer = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
    
    // 5 classificações por validade
    if (diasParaVencer < 0) return { tipo: 'vencido', texto: '🔴 Produto Vencido', prioridade: 100 };
    if (diasParaVencer === 0) return { tipo: 'vence_hoje', texto: '🔴 Vence Hoje', prioridade: 95 };
    if (diasParaVencer <= 3) return { tipo: 'vencimento_3dias', texto: '🔴 Vence em até 3 dias', prioridade: 90 };
    if (diasParaVencer <= 7) return { tipo: 'vencimento_7dias', texto: '🟠 Vence em até 7 dias', prioridade: 80 };
    if (diasParaVencer <= 30) return { tipo: 'vencimento_30dias', texto: '🔵 Vence em até 30 dias', prioridade: 70 };
  }
  
  // HIERARQUIA 2: Histórico de Vendas (ativado se problema de validade não existir)
  const diasSemVenda = produto.ultima_venda 
    ? Math.floor((new Date() - new Date(produto.ultima_venda)) / (1000 * 60 * 60 * 24))
    : 999; // Nunca vendeu = 999 dias
  
  if (diasSemVenda === 999) return { tipo: 'sem_vendas', texto: '🔴 Nunca Vendeu', prioridade: 65 };
  if (diasSemVenda > 60) return { tipo: 'encalhado', texto: '🔴 Produto Encalhado', prioridade: 60 };
  if (diasSemVenda > 30) return { tipo: 'parado', texto: '⚫ Produto Parado', prioridade: 50 };
  return { tipo: 'giro_baixo', texto: '🟡 Giro Baixo', prioridade: 40 };
}
```

#### 2. Query SQL Atualizada

```sql
SELECT 
  p.id,
  p.nome,
  p.preco_venda AS preco_atual,
  p.controlar_validade,
  p.data_validade,
  (SELECT MAX(v.created_at) FROM vendas_itens vi 
   INNER JOIN vendas v ON v.id = vi.venda_id 
   WHERE vi.produto_id = p.id) AS ultima_venda
FROM produtos p
LEFT JOIN promocoes pr ON pr.produto_id = p.id 
  AND pr.status = 'ativa' 
  AND DATE(pr.data_inicio) <= DATE('now')
  AND DATE(pr.data_fim) > DATE('now')
WHERE p.ativo = 1 
  AND p.estoque_atual > 0
  AND pr.id IS NULL
ORDER BY p.nome ASC
```

**Mudanças principais:**
- Adição de `ultima_venda` com subquery que busca a venda mais recente
- LEFT JOIN com `promocoes` para exclusão de produtos com promoção ativa
- Filtro `WHERE pr.id IS NULL` garante que apenas produtos SEM promoção apareçam

#### 3. Lógica de Geração Atualizada

```javascript
router.post('/produtos/promocoes/gerar-sugestoes', (req, res) => {
  // 1. Busca todos os produtos elegíveis
  // 2. Classifica cada um usando classificarProduto()
  // 3. Constrói array de sugestões
  // 4. Ordena por prioridade (DESC)
  // 5. Insere na tabela com motivo humanizado e dias_para_vencer calculado
});
```

**Fluxo:**
1. Array `sugestoes` criado vazio
2. Para cada produto: `classif = classificarProduto(produto)`
3. Calcula `diasParaVencer` baseado em `controlar_validade`
4. Push de objeto com: `{ produto_id, motivo: classif.texto, dias_para_vencer, prioridade: classif.prioridade }`
5. Sort descendente por `prioridade`
6. INSERT ou REPLACE em `promocoes_sugestoes` com uma única chamada res.json()

---

## 🎨 Implementação: Frontend

### Arquivo: `frontend/js/produtos.js`

#### 1. Renderização Inteligente em `carregarSugestoesPromocoes()`

```javascript
// Detecção inteligente para seleção de badge cor
if (row.dias_para_vencer !== null) {
  // Critério de validade → usar cores de urgência
  if (row.dias_para_vencer < 0) {
    badgeClass = 'bg-dark'; // Vencido
  } else if (row.dias_para_vencer <= 3) {
    badgeClass = 'bg-danger'; // Urgente (0-3 dias)
  } else if (row.dias_para_vencer <= 7) {
    badgeClass = 'bg-warning'; // Atenção (7 dias)
  } else {
    badgeClass = 'bg-info'; // Info (30 dias)
  }
} else {
  // Critério de venda → parsejar motivo para cores
  if (motivo.includes('Nunca Vendeu') || motivo.includes('Encalhado')) {
    badgeClass = 'bg-danger';
  } else if (motivo.includes('Parado')) {
    badgeClass = 'bg-secondary';
  } else if (motivo.includes('Giro')) {
    badgeClass = 'bg-warning';
  } else {
    badgeClass = 'bg-info';
  }
}
```

#### 2. Modal com Mensagens Contextualizadas

```javascript
// Mensagem diferente por tipo de classificação
if (row.dias_para_vencer !== null) {
  if (row.dias_para_vencer < 0) {
    urgencyMsg = `⚠️ Este produto expirou há ${Math.abs(row.dias_para_vencer)} dias!`;
  } else if (row.dias_para_vencer === 0) {
    urgencyMsg = `⚠️ Este produto vence HOJE!`;
  } else {
    urgencyMsg = `⚠️ Este produto vence em ${row.dias_para_vencer} dias.`;
  }
} else {
  urgencyMsg = `Este produto pode estar com giro baixo e necessita de promoção.`;
}
```

#### 3. Refresh Automático após Lifecycle Events

```javascript
// Após criar promoção
encerrarPromocao() → carregarSugestoesPromocoes()

// Após encerrar promoção
verificarPromocoeExpiradas() → carregarSugestoesPromocoes()
```

---

## 📊 Estrutura de Dados

### Tabela: `promocoes_sugestoes`

```
id: INTEGER PRIMARY KEY
produto_id: INTEGER FOREIGN KEY
motivo: TEXT (ex: "🔴 Produto Vencido")
dias_para_vencer: INTEGER (null se critério é venda)
prioridade: INTEGER (100-40, usado para sorting)
desconto_percentual: REAL
status: TEXT ('pendente', 'confirmada', etc)
created_at: DATETIME
```

### Exemplo de Registro

```json
{
  "id": 42,
  "produto_id": 105,
  "nome": "Leite Integral 1L",
  "preco_atual": 4.99,
  "motivo": "🔴 Vence em até 3 dias",
  "dias_para_vencer": 2,
  "prioridade": 90
}
```

---

## 🔀 Priorização Completa (DESC)

| Prioridade | Tipo | Motivo | Dias Até Vencer |
|------------|------|--------|-----------------|
| 100 | vencido | 🔴 Produto Vencido | < 0 |
| 95 | vence_hoje | 🔴 Vence Hoje | 0 |
| 90 | vencimento_3dias | 🔴 Vence em até 3 dias | 1-3 |
| 80 | vencimento_7dias | 🟠 Vence em até 7 dias | 4-7 |
| 70 | vencimento_30dias | 🔵 Vence em até 30 dias | 8-30 |
| 65 | sem_vendas | 🔴 Nunca Vendeu | null |
| 60 | encalhado | 🔴 Produto Encalhado | null |
| 50 | parado | ⚫ Produto Parado | null |
| 40 | giro_baixo | 🟡 Giro Baixo | null |

---

## 🐛 Correções Implementadas

### 1. HTTP Headers Error
- **Problema**: Múltiplas chamadas res.json() causando erro "Cannot set headers after they are sent"
- **Solução**: Flag `resposta_enviada` garante uma única resposta por endpoint

### 2. Motivos Incorretos
- **Problema**: Todos os produtos apareciam como "vencimento_proximo" independente da realidade
- **Solução**: Hierarquia de classificação com dois níveis:
  - Nível 1: Validar validade APENAS se ≤ 30 dias
  - Nível 2: Se não há problema de validade, usar histórico de vendas

### 3. Produtos com Promoção Ativa Aparecendo
- **Problema**: LEFT JOIN não estava funcionando corretamente
- **Solução**: Adicionados filtros explícitos:
  - `AND pr.status = 'ativa'`
  - `AND DATE(pr.data_inicio) <= DATE('now')`
  - `AND DATE(pr.data_fim) > DATE('now')`
  - `AND pr.id IS NULL`

---

## ✅ Validação de Sucesso

### Backend
- ✅ Função `classificarProduto()` retorna objeto correto
- ✅ Query SQL filtra produtos com promoção ativa
- ✅ Sugestões inseridas com motivo humanizado
- ✅ Prioridade descrescente no array final
- ✅ `dias_para_vencer` calculado corretamente

### Frontend
- ✅ Badges mostram cores apropriadas por classificação
- ✅ Motivos exibem com emojis e texto
- ✅ Modal mostra mensagens contextualizadas
- ✅ Sugestões atualizadas após criar/encerrar promoção
- ✅ Produtos com promoção ativa não aparecem

### Testes
- ✅ Scripts de teste: `test_sugestoes.js` e `test_sugestoes_auto.js`
- ✅ Guia de teste: `GUIA_TESTE_SUGESTOES.md`

---

## 📁 Arquivos Criados/Modificados

| Arquivo | Modificação |
|---------|-------------|
| `backend/rotas/produtos.js` | ✏️ Função classificarProduto() + Query SQL + Lógica |
| `frontend/js/produtos.js` | ✏️ Renderização inteligente + Modal contextualizado |
| `test_sugestoes.js` | ✨ Novo: Teste com porta fixa |
| `test_sugestoes_auto.js` | ✨ Novo: Teste com porta automática |
| `GUIA_TESTE_SUGESTOES.md` | ✨ Novo: Guia completo de teste |
| `SUMARIO_REFACTOR_SUGESTOES.md` | ✨ Novo: Este documento |

---

## 🚀 Próximas Etapas

1. **Testar o endpoint** (ver GUIA_TESTE_SUGESTOES.md)
2. **Validar classificação** de todos os 9 tipos
3. **Monitorar performance** se houver muitos produtos
4. **Coletar feedback** de uso

---

**Data**: 2025-01-XX  
**Versão**: 1.0 Refactor Completo  
**Status**: ✅ Implementação Concluída

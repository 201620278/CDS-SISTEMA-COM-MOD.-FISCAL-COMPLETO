# 🎓 GUIA RÁPIDO - SUGESTÕES DE PROMOÇÕES v2

## ⚡ O Que Mudou?

Antes, produtos sem vencimento próximo (como "Balão de festa") apareciam com motivo genérico. **Agora aparecem com motivo correto baseado em histórico de vendas** e mostram **"X dias sem venda"** abaixo do nome.

## 📋 Motivos e Cores

### 🔴 Vermelho (CRÍTICO - Ação Imediata)
- **Produto Vencido**: Vencimento passou (dias < 0)
- **Nunca Vendeu**: Sem registro de venda
- **Encalhado**: 60+ dias sem venda

### 🟠 Laranja (ALTA - 7 dias)
- **Vence em até 7 dias**: Atenção para reposição

### 🔵 Azul (MÉDIA - 30 dias)
- **Vence em até 30 dias**: Monitorar

### ⚫ Cinza (NORMAL - 30-60 dias)
- **Parado**: 30-60 dias sem venda

### 🟡 Amarelo (BAIXO - 15-30 dias)
- **Giro Baixo**: 15-30 dias sem venda

## 📱 Como Usar

### Gerar Sugestões
1. Vá para **Produtos** → **Sugestões de Promoções**
2. Clique **"Gerar Sugestões"** (limpa antigas e cria novas)
3. Sistema exibe tabela com sugestões ordenadas por prioridade

### Aceitar Sugestão
1. Clique **"Aceitar"** no produto desejado
2. Modal abre com opções:
   - **Desconto (%)**: Customize se desejar
   - **Data Início/Fim**: Defina período
3. Clique **"Confirmar Promoção"**
4. Produto sai das sugestões (agora tem promoção ativa)

### Rejeitar Sugestão
1. Clique **"Rejeitar"** para descartar sugestão
2. Produto é removido do sistema de sugestões

## 🔍 Interpretando a Tabela

### Exemplo 1: Produto Vencido
```
Margarina Primor
🔴 Produto Vencido
  Venceu há 35 dias
```
→ **Ação**: Remover do estoque, não promover

### Exemplo 2: Produto Parado
```
Balão de festa
⚫ Produto Parado
  45 dias sem venda
```
→ **Ação**: Criar promoção para ativar vendas

### Exemplo 3: Vencimento Próximo
```
Queijo Coalho
🔴 Vence em até 3 dias
  2 dias para vencer
```
→ **Ação**: Promoção URGENTE para esgotar estoque

### Exemplo 4: Nunca Vendeu
```
Produto XYZ
🔴 Nunca Vendeu
  Sem vendas registradas
```
→ **Ação**: Investigar preço/qualidade, depois promoção

## 🎯 Estratégia por Tipo

### Vencimento (🔴🟠🔵)
- **Objetivo**: Esgotar estoque antes de vencer
- **Desconto**: Quanto mais próximo do vencimento, maior o desconto
- **Urgência**: Vencido > Hoje > 3 dias > 7 dias > 30 dias

### Vendas (🔴⚫🟡)
- **Objetivo**: Reativar giro de produtos parados
- **Desconto**: Teste pequenos descontos, aumentar se necessário
- **Análise**: Verificar se é problema de preço, qualidade ou sazonalidade

## 📊 Métricas Úteis

### Quantos dias sem venda é "crítico"?

| Dias | Status | Ação |
|------|--------|------|
| 0 dias | ✅ Venda recente | Mantém |
| 7-14 dias | ⚠️ Normal | Monitora |
| 15-30 dias | 🟡 Giro baixo | Promove |
| 30-60 dias | ⚫ Parado | Promove forte |
| 60+ dias | 🔴 Encalhado | Promove urgente |
| ∞ (nunca) | 🔴 Crítico | Investiga + promove |

## 🛠️ Troubleshooting

### "Produto X não aparece em sugestões"
**Possíveis razões**:
- ❌ Produto desativado (marque como ativo)
- ❌ Estoque zerado (reponha)
- ❌ Já tem promoção ativa (encerre e regredir)
- ✅ Giro normal (5-15 dias) - é esperado

### "Todas as sugestões têm mesma data"
✅ Normal! Clique "Gerar Sugestões" para atualizar

### "Motivo parece errado"
1. Verifique dados do produto:
   - Controla validade? Qual data?
   - Qual foi a última venda?
2. Clique "Gerar Sugestões" novamente
3. Se persiste, execute diagnóstico:
   ```bash
   node diagnostico_completo.js
   ```

## 💡 Dicas Profissionais

### 1. Priorize por Urgência
- Vencidos: ação imediata
- Vencendo em dias: próxima prioridade
- Parados: terceira onda
- Giro baixo: oportunidade

### 2. Não Force Desconto Alto
- Comece com 5-10%
- Se não vender, aumenta para 15-20%
- Produtos bom-movimento não precisam

### 3. Combine com Marketing
- Produtos vencidos: urgência ("Últimos dias!")
- Parados: inovação ("Descubra este produto")
- Giro baixo: oportunidade ("Aproveitando...")

### 4. Monitore Resultados
Após aplicar promoção:
- 🔴 Vencido: acompanhe diariamente
- ⚫ Parado: dê 5-7 dias para virar
- 🟡 Giro baixo: dê 7-14 dias

## 📞 Suporte

Se algo não funcionar:
1. **Verifique dados**: Produto tem vendas? Validade?
2. **Limpe e regredir**:
   ```bash
   node limpar_sugestoes_v2.js
   ```
3. **Gere novamente**: Produtos → Sugestões → "Gerar Sugestões"
4. **Diagnóstico técnico**:
   ```bash
   node diagnostico_completo.js
   ```

---

**Versão**: 2.0  
**Última Atualização**: 2026-06-14  
**Status**: Pronto para Uso

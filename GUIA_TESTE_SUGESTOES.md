# 🧪 Guia de Teste - Geração de Sugestões de Promoções

## 📋 Resumo das Alterações Implementadas

Foi implementado um sistema completo de **classificação inteligente de produtos** para sugestões de promoção com base em:

1. **Critérios de Validade** (se controlar_validade = 1):
   - 🔴 **Vencido**: produto.data_validade < hoje
   - 🔴 **Vence Hoje**: produto.data_validade = hoje  
   - 🔴 **Vence em até 3 dias**: produto.data_validade ≤ hoje + 3 dias
   - 🟠 **Vence em até 7 dias**: produto.data_validade ≤ hoje + 7 dias
   - 🔵 **Vence em até 30 dias**: produto.data_validade ≤ hoje + 30 dias

2. **Critérios de Vendas** (se não há problema de validade):
   - 🔴 **Nunca Vendeu**: nenhum registro em vendas_itens
   - 🔴 **Encalhado**: última venda > 60 dias atrás
   - ⚫ **Parado**: última venda entre 30-60 dias atrás
   - 🟡 **Giro Baixo**: última venda entre 7-30 dias atrás

## 🔍 Como Testar

### Opção 1: Teste Automático (Recomendado)

1. **Abra a aplicação**:
   ```bash
   npm start
   ```

2. **Em outro terminal, execute o teste automático**:
   ```bash
   node test_sugestoes_auto.js
   ```

   O script irá:
   - Procurar automaticamente pela porta do servidor (3001-3010)
   - Fazer uma requisição POST ao endpoint
   - Exibir as sugestões geradas com motivos

### Opção 2: Teste pela Interface (Manual)

1. **Abra a aplicação**: `npm start`

2. **Navegue até a aba de Produtos** → **Sugestões de Promoções**

3. **Clique em "Gerar Sugestões"**

4. **Verifique na tabela**:
   - ✅ Motivos aparecem com emojis descritivos
   - ✅ Badges mostram cores apropriadas (vermelho para urgente, azul para prazo maior)
   - ✅ Produtos aparecem ordenados por prioridade (mais urgentes primeiro)
   - ✅ Não aparecem produtos com promoções ativas

### Opção 3: Teste com cURL

1. **Com a aplicação rodando**, abra um terminal:

```bash
curl -X POST http://localhost:3001/produtos/promocoes/gerar-sugestoes ^
  -H "Content-Type: application/json" ^
  -d "{\"produto_ids\": [], \"desconto_percentual\": 15}"
```

## 📊 Resposta Esperada

```json
{
  "total": 5,
  "sugestoes": [
    {
      "id": 1,
      "nome": "Produto XYZ",
      "preco_atual": 29.90,
      "motivo": "🔴 Produto Vencido",
      "dias_para_vencer": -2,
      "prioridade": 100
    },
    {
      "id": 2,
      "nome": "Produto ABC",
      "preco_atual": 15.50,
      "motivo": "🟠 Vence em até 7 dias",
      "dias_para_vencer": 5,
      "prioridade": 80
    },
    {
      "id": 3,
      "nome": "Produto DEF",
      "preco_atual": 42.00,
      "motivo": "🔴 Nunca Vendeu",
      "dias_para_vencer": null,
      "prioridade": 65
    }
  ]
}
```

## ✅ Checklist de Validação

- [ ] Endpoint `/produtos/promocoes/gerar-sugestoes` retorna status 200
- [ ] Sugestões estão ordenadas por `prioridade` (descendente)
- [ ] Motivos contêm emojis e texto descritivo
- [ ] `dias_para_vencer` é calculado corretamente (null para critérios de venda)
- [ ] Produtos com promoções ativas **NÃO** aparecem
- [ ] Na UI, badges mostram cores apropriadas:
  - 🔴 Vermelho para vencimento urgente (0-3 dias)
  - 🟠 Laranja para 7 dias
  - 🔵 Azul para 30 dias
  - ⚫ Cinza para critérios de venda
- [ ] Ao clicar em "Confirmar Sugestão", a promoção é criada
- [ ] Após criar, o produto desaparece da lista (por ter promoção ativa)
- [ ] Ao encerrar uma promoção, o produto reaparece nas sugestões

## 🐛 Troubleshooting

### "Nenhum servidor encontrado"
- Verifique se a aplicação foi iniciada com `npm start`
- Aguarde 10-15 segundos para o servidor ficar pronto

### "Status: 500"
- Verifique o console do Electron para mensagens de erro
- Verifique se há produtos na base de dados
- Verifique se a coluna `ultima_venda` existe na tabela `vendas_itens`

### "Endpoints retorna 0 sugestões"
- Verifique se há produtos ativos com `estoque_atual > 0`
- Produtos com data_validade muito distante não aparecem (devem estar ≤ 30 dias)
- Produtos com histórico de venda recente não aparecem

## 📝 Arquivos Modificados

- `backend/rotas/produtos.js`: Implementação da função `classificarProduto()` e lógica de geração
- `frontend/js/produtos.js`: Atualização da exibição de motivos com detecção inteligente
- Testes: `test_sugestoes.js` (porta fixa) e `test_sugestoes_auto.js` (porta automática)

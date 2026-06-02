# Decisoes do PRD

## Produto

- MVP para uso pessoal/profissional, com arquitetura que possa evoluir.
- PWA instalavel para celular e web.
- Uso offline no celular com sincronizacao posterior.
- Sem orcamentos, metas, notificacoes ou lembretes no MVP.

## Stack

- Preferencia atual: Vite + React + TypeScript + PWA + Supabase.
- Next.js fica como alternativa caso surjam requisitos fortes de SSR, paginas publicas, SEO ou backend integrado ao framework.
- Supabase sera considerado para autenticacao, Postgres, Row Level Security e fonte de verdade no servidor.

## Dados financeiros

- Grupos financeiros personalizados, como PF, PJ, Investimentos, Cripto ou Exterior.
- Contas/carteiras pertencem a um grupo financeiro.
- Relatorios operacionais ficam segregados por grupo.
- Relatorio de patrimonio consolidado pode juntar todos os grupos.
- Contas podem usar BRL, USD ou BTC.
- Lancamentos sempre usam a moeda da conta.
- Relatorios consolidados podem converter para BRL, USD ou BTC.
- Cotacoes online serao cacheadas para visualizacao offline.

## Lancamentos

- Despesas e receitas.
- Status pendente ou realizado.
- Categorias e subcategorias por grupo financeiro.
- Apenas um nivel de subcategoria: Categoria > Subcategoria.
- Um lancamento tem uma categoria/subcategoria principal.
- Um lancamento pode ter uma ou mais tags.
- Tags entram no MVP com filtros e resumo por tag.
- Recorrencia mensal apenas.

## Cartao de credito

- Cartoes com fechamento, vencimento e fatura mensal.
- Faturas com status aberta, fechada e paga.
- Parcelas entram no mes correspondente.
- Pagamento de fatura debita uma conta/carteira.

## Relatorios

- Balanco mensal: receitas vs despesas.
- Despesas por categoria e subcategoria.
- Evolucao mensal.
- Extrato por conta/carteira.
- Contas a pagar e receber.
- Faturas de cartao por mes.
- Patrimonio ao longo do tempo com filtros mensal, 3 meses, 6 meses e anual.
- Distribuicao por moeda/ativo: BRL vs USD vs BTC.
- Projecao de saldo considerando receitas, despesas, recorrencias, parcelas e faturas.

## Sincronizacao

- Botao manual para sincronizar agora.
- Sincronizacao automatica quando online, a definir no plano tecnico.
- Web/servidor prevalece como fonte da verdade em conflitos.

## Fora do MVP

- Orcamentos.
- Metas financeiras.
- Notificacoes e lembretes.
- Open Finance.
- Exportacao de dados.
- Transferencias multi-conta vinculadas.
- Importacao CSV do Mobills fica para V2 e exige pesquisa do formato exportado.


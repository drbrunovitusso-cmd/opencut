# Esquema do banco

Cada coleção é um arquivo `.jsonl` nesta pasta, um registro JSON por linha. Gravar sempre pelo script `cerebro/scripts/banco.mjs`, que gera `id` e `data` e valida os campos. Nenhum dado de paciente, CPF ou conversa privada entra aqui.

## pecas

Obrigatórios: `tema`, `formato` (CAR carrossel, REE reels, POS post, STO stories, LEG legenda, MSG mensagem, DOC documento), `pilar` (P1 a P5), `persona`, `funil` (descoberta, identificacao, confianca, conversa, consulta, acompanhamento, indicacao), `status` (rascunho, aprovado, publicado, arquivado).

Opcionais: `gancho`, `angulo` (mesmos valores dos ganchos), `ganchos_alternativos` (lista), `objetivo`, `fontes` (lista de IDs F-), `campanha` (ID C-), `origem` (projeto ou chat), `link`, `link_arte`, `publicado_em`, `metricas` (`alcance`, `curtidas`, `comentarios`, `salvamentos`, `compartilhamentos`, `seguidores_ganhos`, `visitas_perfil`, `mensagens`), `notas`.

ID: `AAAA-MM-FORMATO-PILAR-NN`, ex. `2026-10-CAR-P1-01`.

## ganchos

Obrigatórios: `texto`, `tema`, `angulo` (dor, mito, alerta, bastidor, referencia, dado, pergunta), `status` (guardado, usado, descartado).
Opcionais: `pilar`, `persona`, `peca` (ID da peça onde foi usado), `desempenho` (texto curto com o número), `pontuacao` (0 a 15).
ID: `G-0001`.

## fontes

Obrigatórios: `afirmacao` (como pode ir para a peça), `referencia` (autor ou instituição e título), `ano`, `nivel` (meta-analise, rct, diretriz, coorte, dado-oficial, outro).
Opcionais: `link`, `pmid`, `tema`, `confianca` (alta, media, baixa), `cuidado` (o que não pode ser dito a partir dela).
ID: `F-0001`.

## campanhas

Obrigatórios: `nome`, `objetivo`, `inicio` e `fim` (AAAA-MM-DD).
Opcionais: `status` (planejada, ativa, encerrada), `tema`, `pilares`, `personas`, `pecas` (lista de IDs), `metrica_sucesso`, `meta`, `orcamento_anuncio`, `retrospectiva`.
ID: `C-AAAA-MM-NN`.

## aprendizados

Obrigatórios: `licao`, `evidencia` (ID de peça, campanha ou número que sustenta).
Opcionais: `tema`, `pilar`, `formato`, `aplicar_em` (o que muda daqui para frente).
ID: `A-0001`.

## Exemplos

```
node cerebro/scripts/banco.mjs add pecas '{"tema":"Insônia e celular","formato":"CAR","pilar":"P4","persona":"Camila","funil":"identificacao","status":"aprovado","angulo":"alerta","gancho":"Seu sono começa antes de deitar"}'
node cerebro/scripts/banco.mjs status 2026-10-CAR-P4-01 publicado https://instagram.com/p/...
node cerebro/scripts/banco.mjs metricas 2026-10-CAR-P4-01 '{"alcance":4200,"salvamentos":180,"compartilhamentos":95}'
```

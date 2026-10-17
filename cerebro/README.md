# Segundo Cérebro · Dr. Bruno Vitusso

Agente orquestrador que recebe qualquer pedido de conteúdo, campanha, análise ou estratégia, decide o caminho, distribui para agentes especialistas, escolhe as ferramentas e guarda tudo num banco que melhora as próximas campanhas.

## Como usar

Nesta sessão do Claude Code, peça normalmente ("cria um carrossel sobre insônia", "planeja novembro", "analisa outubro") ou chame `/segundo-cerebro` seguido do pedido. Os comandos curtos estão em `.claude/skills/segundo-cerebro/SKILL.md`.

## Como está organizado

- `.claude/skills/segundo-cerebro/` orquestrador: ciclo de raciocínio, distribuição, comandos.
- `.claude/agents/` especialistas: estrategista, pesquisador, redator, diretor-de-arte, revisor-cfm (veto), analista, arquivista.
- `cerebro/perfil.md` fatos confirmados e pendências.
- `cerebro/metodo/` brainstorm, lacunas, roteamento de ferramentas, qualidade.
- `cerebro/templates/` briefing, entrega de peça, campanha, relatório.
- `cerebro/banco/` banco em JSONL (peças, ganchos, fontes, campanhas, aprendizados) e esquema.
- `cerebro/scripts/banco.mjs` consulta e registro no banco, sem dependências (Node 18+).

## Fluxo de uma peça

pedido → orquestrador (classifica, consulta banco, brainstorm, lacunas, decide) → estrategista + pesquisador → redator → diretor de arte → revisor CFM → arquivista → publicado → analista coleta métricas → aprendizado volta para o banco.

## Relação com as skills do claude.ai

Este agente segue as skills cerebro-dr-bruno, conteudo-instagram-dr-bruno e mega-brain e o projeto "Cerebro Dr Bruno". Se houver divergência, vale o projeto, e a divergência é anotada em `perfil.md`.

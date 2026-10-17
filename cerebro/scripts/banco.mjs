#!/usr/bin/env node
// Banco do segundo cérebro: registros em cerebro/banco/<colecao>.jsonl, uma linha por registro.
// Uso: node cerebro/scripts/banco.mjs <comando> [args]. Rode sem argumentos para ver a ajuda.

import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "banco");

const FORMATOS = ["CAR", "REE", "POS", "STO", "LEG", "MSG", "DOC"];
const PILARES = { P1: ["Saúde mental", 30], P2: ["Clínica e prevenção", 25], P3: ["Emagrecimento e performance", 15], P4: ["Rotina e descanso", 15], P5: ["Bruno (bastidores)", 15] };
const ANGULOS = ["dor", "mito", "alerta", "bastidor", "referencia", "dado", "pergunta"];
const FUNIL = ["descoberta", "identificacao", "confianca", "conversa", "consulta", "acompanhamento", "indicacao"];

const COLECOES = {
  pecas: {
    obrigatorios: ["tema", "formato", "pilar", "persona", "funil", "status"],
    enums: { formato: FORMATOS, pilar: Object.keys(PILARES), funil: FUNIL, angulo: ANGULOS, status: ["rascunho", "aprovado", "publicado", "arquivado"] },
    id: (r, todos) => sequencial(`${r.data.slice(0, 7)}-${r.formato}-${r.pilar}-`, todos, 2),
  },
  ganchos: {
    obrigatorios: ["texto", "tema", "angulo", "status"],
    enums: { status: ["guardado", "usado", "descartado"], angulo: ANGULOS },
    id: (_r, todos) => sequencial("G-", todos, 4),
  },
  fontes: {
    obrigatorios: ["afirmacao", "referencia", "ano", "nivel"],
    enums: { nivel: ["meta-analise", "rct", "diretriz", "coorte", "dado-oficial", "outro"] },
    id: (_r, todos) => sequencial("F-", todos, 4),
  },
  campanhas: {
    obrigatorios: ["nome", "objetivo", "inicio", "fim"],
    enums: { status: ["planejada", "ativa", "encerrada"] },
    id: (r, todos) => sequencial(`C-${r.inicio.slice(0, 7)}-`, todos, 2),
  },
  aprendizados: {
    obrigatorios: ["licao", "evidencia"],
    enums: {},
    id: (_r, todos) => sequencial("A-", todos, 4),
  },
};

function sequencial(prefixo, todos, digitos) {
  const usados = todos.filter((r) => r.id?.startsWith(prefixo)).map((r) => Number(r.id.slice(prefixo.length)) || 0);
  return prefixo + String(Math.max(0, ...usados) + 1).padStart(digitos, "0");
}

function arquivo(col) {
  if (!COLECOES[col]) falhar(`coleção desconhecida: ${col}. Use ${Object.keys(COLECOES).join(", ")}.`);
  return join(DIR, `${col}.jsonl`);
}

function ler(col) {
  const f = arquivo(col);
  if (!existsSync(f)) return [];
  return readFileSync(f, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}

function gravarTudo(col, registros) {
  writeFileSync(arquivo(col), registros.map((r) => JSON.stringify(r)).join("\n") + (registros.length ? "\n" : ""));
}

function falhar(msg) {
  console.error(`Erro: ${msg}`);
  process.exit(1);
}

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Aceita JSON no argumento ou "-" para ler do stdin, o que evita problema de aspas no shell.
function lerJson(arg) {
  const texto = arg === "-" || arg === undefined ? readFileSync(0, "utf8") : arg;
  try {
    return JSON.parse(texto);
  } catch (e) {
    falhar(`JSON inválido: ${e.message}`);
  }
}

function validar(col, r) {
  const { obrigatorios, enums } = COLECOES[col];
  const faltando = obrigatorios.filter((c) => r[c] === undefined || r[c] === "");
  if (faltando.length) falhar(`faltam campos obrigatórios em ${col}: ${faltando.join(", ")}`);
  for (const [campo, valores] of Object.entries(enums)) {
    if (r[campo] !== undefined && !valores.includes(r[campo])) falhar(`${campo} inválido: "${r[campo]}". Valores aceitos: ${valores.join(", ")}`);
  }
}

function localizar(id) {
  for (const col of Object.keys(COLECOES)) {
    const todos = ler(col);
    const i = todos.findIndex((r) => r.id === id);
    if (i >= 0) return { col, todos, i };
  }
  falhar(`ID não encontrado: ${id}`);
}

function porMil(parte, total) {
  return total ? ((parte || 0) / total) * 1000 : null;
}

function fmt(n) {
  return n === null || n === undefined ? "-" : n.toFixed(1);
}

function diasAtras(data) {
  return (Date.now() - new Date(data).getTime()) / 86400000;
}

const comandos = {
  add(col, json) {
    const r = lerJson(json);
    r.data ??= hoje();
    validar(col, r);
    const todos = ler(col);
    r.id ??= COLECOES[col].id(r, todos);
    if (todos.some((t) => t.id === r.id)) falhar(`ID já existe: ${r.id}`);
    appendFileSync(arquivo(col), JSON.stringify(r) + "\n");
    console.log(`Registrado em ${col}: ${r.id}`);
  },

  status(id, novo, link) {
    const { col, todos, i } = localizar(id);
    const r = { ...todos[i], status: novo };
    if (link) r.link = link;
    if (novo === "publicado") r.publicado_em ??= hoje();
    validar(col, r);
    todos[i] = r;
    gravarTudo(col, todos);
    console.log(`${id}: status ${novo}${link ? `, link ${link}` : ""}`);
  },

  metricas(id, json) {
    const { col, todos, i } = localizar(id);
    if (col !== "pecas") falhar("métricas só valem para peças");
    todos[i].metricas = { ...todos[i].metricas, ...lerJson(json), coletado_em: hoje() };
    gravarTudo(col, todos);
    console.log(`Métricas atualizadas em ${id}`);
  },

  listar(col) {
    for (const r of ler(col)) console.log(JSON.stringify(r));
  },

  buscar(...termos) {
    const termo = termos.join(" ").toLowerCase();
    if (!termo) falhar("informe um termo de busca");
    let achou = 0;
    for (const col of Object.keys(COLECOES)) {
      for (const r of ler(col)) {
        if (JSON.stringify(r).toLowerCase().includes(termo)) {
          console.log(`[${col}] ${JSON.stringify(r)}`);
          achou++;
        }
      }
    }
    if (!achou) console.log(`Nada no banco sobre "${termo}".`);
  },

  ganchos(...termos) {
    const termo = termos.join(" ").toLowerCase();
    const lista = ler("ganchos").filter((g) => g.status !== "descartado" && (!termo || JSON.stringify(g).toLowerCase().includes(termo)));
    if (!lista.length) return console.log("Nenhum gancho guardado" + (termo ? ` sobre "${termo}".` : "."));
    for (const g of lista) console.log(`${g.id} [${g.status}] (${g.angulo}) ${g.tema}: ${g.texto}${g.desempenho ? ` · ${g.desempenho}` : ""}`);
  },

  fontes(...termos) {
    const termo = termos.join(" ").toLowerCase();
    const lista = ler("fontes").filter((f) => !termo || JSON.stringify(f).toLowerCase().includes(termo));
    if (!lista.length) return console.log("Nenhuma fonte registrada" + (termo ? ` sobre "${termo}".` : "."));
    for (const f of lista) console.log(`${f.id} (${f.nivel}, ${f.ano}) ${f.afirmacao} · ${f.referencia}${f.pmid ? ` · PMID ${f.pmid}` : ""}${f.link ? ` · ${f.link}` : ""}`);
  },

  pilares(dias = "90") {
    const janela = Number(dias);
    const pecas = ler("pecas").filter((p) => ["aprovado", "publicado"].includes(p.status) && diasAtras(p.publicado_em || p.data) <= janela);
    const total = pecas.length;
    console.log(`Pilares nos últimos ${janela} dias (${total} peças aprovadas ou publicadas)`);
    let atrasado = null;
    for (const [cod, [nome, meta]] of Object.entries(PILARES)) {
      const n = pecas.filter((p) => p.pilar === cod).length;
      const real = total ? (n / total) * 100 : 0;
      const deficit = meta - real;
      if (!atrasado || deficit > atrasado.deficit) atrasado = { cod, nome, deficit };
      console.log(`${cod} ${nome.padEnd(28)} ${String(n).padStart(3)} peças  ${real.toFixed(0).padStart(3)}% (meta ${meta}%)`);
    }
    console.log(total ? `Próximo pilar recomendado: ${atrasado.cod} ${atrasado.nome}` : "Sem peças no período; seguir a meta de proporção.");
  },

  relatorio() {
    const pub = ler("pecas").filter((p) => p.status === "publicado" && p.metricas?.alcance);
    if (!pub.length) return console.log("Nenhuma peça publicada com métricas ainda. Use o comando metricas depois de coletar no Windsor ou Metricool.");
    const taxa = (p) => ({ salv: porMil(p.metricas.salvamentos, p.metricas.alcance), comp: porMil(p.metricas.compartilhamentos, p.metricas.alcance) });
    const agrupar = (campo) => {
      const grupos = {};
      for (const p of pub) (grupos[p[campo] ?? "sem registro"] ??= []).push(taxa(p));
      for (const [k, ts] of Object.entries(grupos)) {
        const media = (c) => ts.reduce((s, t) => s + (t[c] || 0), 0) / ts.length;
        console.log(`  ${k.padEnd(14)} n=${ts.length}  salvamentos/mil ${fmt(media("salv"))}  compartilhamentos/mil ${fmt(media("comp"))}`);
      }
    };
    console.log(`Peças publicadas com métricas: ${pub.length}`);
    console.log("Por formato:"); agrupar("formato");
    console.log("Por pilar:"); agrupar("pilar");
    console.log("Por ângulo do gancho:"); agrupar("angulo");
    console.log("Top 5 por salvamentos a cada mil alcançados:");
    for (const p of [...pub].sort((a, b) => taxa(b).salv - taxa(a).salv).slice(0, 5)) {
      console.log(`  ${p.id} ${fmt(taxa(p).salv)} · ${p.tema}`);
    }
  },

  resumo() {
    for (const col of Object.keys(COLECOES)) {
      const todos = ler(col);
      const porStatus = {};
      for (const r of todos) if (r.status) porStatus[r.status] = (porStatus[r.status] || 0) + 1;
      const detalhe = Object.entries(porStatus).map(([s, n]) => `${s} ${n}`).join(", ");
      console.log(`${col.padEnd(13)} ${String(todos.length).padStart(4)}${detalhe ? `  (${detalhe})` : ""}`);
    }
    const recentes = ler("pecas").filter((p) => diasAtras(p.publicado_em || p.data) <= 60);
    if (recentes.length) {
      console.log("Temas dos últimos 60 dias (evitar repetir sem ângulo novo):");
      for (const p of recentes) console.log(`  ${p.id} ${p.tema}`);
    }
    const ativas = ler("campanhas").filter((c) => c.status === "ativa");
    for (const c of ativas) console.log(`Campanha ativa: ${c.id} ${c.nome} (${c.inicio} a ${c.fim})`);
  },
};

const AJUDA = `Banco do segundo cérebro
  resumo                         contagem por coleção, temas recentes, campanhas ativas
  pilares [dias]                 proporção dos pilares contra a meta (padrão 90 dias)
  relatorio                      taxas de salvamento e compartilhamento por formato, pilar e ângulo
  buscar <termo>                 procura em todas as coleções
  ganchos [termo]                ganchos guardados e usados
  fontes [termo]                 fontes já verificadas
  listar <colecao>               todos os registros de uma coleção
  add <colecao> '<json>' | -     novo registro (ID e data automáticos); "-" lê o JSON do stdin
  status <ID> <status> [link]    muda status (ex.: publicado) e grava link
  metricas <ID> '<json>' | -     grava métricas de uma peça publicada
Coleções: ${Object.keys(COLECOES).join(", ")}. Esquema em cerebro/banco/schema.md.`;

const [cmd, ...args] = process.argv.slice(2);
if (!cmd || !comandos[cmd]) {
  console.log(AJUDA);
  process.exit(cmd ? 1 : 0);
}
comandos[cmd](...args);

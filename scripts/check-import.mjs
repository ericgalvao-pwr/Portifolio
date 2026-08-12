// Confere o parser GSB contra as planilhas reais em docs/.
// Rodar: node scripts/check-import.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import * as XLSX from "xlsx";
import { parseGSBWorkbook, parseGSBCsv } from "../src/lib/gsb.js";

// o build ESM do xlsx não traz readFile (não depende de fs) — lê o buffer igual ao navegador
const abrir = (caminho) => XLSX.read(fs.readFileSync(caminho), { type: "buffer" });

const FASES_PADRAO = [
  "F1 - Diagnóstico de Processos e Modelo de Gestão",
  "F2 - Concepção do Modelo de Gestão para Processos",
  "F3 - Melhorias e Padronização",
  "F4 - Realização de Auditorias",
  "F5 - Gestão de Rotinas Diárias (Industrial e Financeiro)",
];

// contagens conferidas direto nas colunas da aba Backlog, não na saída do parser
const CASOS = [
  { arq: "GSB - Gosto Mineiro.xlsx", total: 146, comFase: 0, comAb: 146, comFp: 105, comFr: 34 },
  { arq: "GSB - MatMed.xlsx", total: 47, comFase: 0, comAb: 47, comFp: 47, comFr: 42 },
  {
    arq: "GSB - Metálica.xlsx", total: 139, comFase: 139, comAb: 128, comFp: 137, comFr: 36,
    porFase: { [FASES_PADRAO[0]]: 30, [FASES_PADRAO[1]]: 29, [FASES_PADRAO[2]]: 26, [FASES_PADRAO[3]]: 21, [FASES_PADRAO[4]]: 33 },
  },
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_VALIDOS = ["Aberta", "Em Andamento", "Atrasada", "Finalizada", "Backlog"];

for (const caso of CASOS) {
  const { rows, fases } = parseGSBWorkbook(abrir(`docs/${caso.arq}`));

  assert.equal(rows.length, caso.total, `${caso.arq}: total de ações`);
  assert.deepEqual(fases, FASES_PADRAO, `${caso.arq}: catálogo de fases da aba Dados`);

  for (const r of rows) {
    // a regressão original: cabeçalho errado fazia a coluna Nº virar a descrição
    assert.ok(!/^\d+$/.test(r.descricao), `${caso.arq}: descrição virou número ("${r.descricao}")`);
    assert.ok(r.descricao.length > 3, `${caso.arq}: descrição curta demais ("${r.descricao}")`);
    for (const campo of ["ab", "fp", "fr"]) {
      if (r[campo] != null) assert.match(r[campo], ISO, `${caso.arq}: ${campo} fora do ISO`);
    }
    assert.ok(STATUS_VALIDOS.includes(r.st), `${caso.arq}: status não mapeado ("${r.st}")`);
  }

  assert.equal(rows.filter((r) => r.fase).length, caso.comFase, `${caso.arq}: ações com fase`);
  assert.equal(rows.filter((r) => r.ab).length, caso.comAb, `${caso.arq}: ações com data de início`);
  assert.equal(rows.filter((r) => r.fp).length, caso.comFp, `${caso.arq}: ações com data prevista`);
  assert.equal(rows.filter((r) => r.fr).length, caso.comFr, `${caso.arq}: ações com data real`);

  if (caso.porFase) {
    const cont = {};
    for (const r of rows) if (r.fase) cont[r.fase] = (cont[r.fase] || 0) + 1;
    assert.deepEqual(cont, caso.porFase, `${caso.arq}: distribuição por fase`);
  }

  console.log(`ok  ${caso.arq}: ${rows.length} ações, ${fases.length} fases`);
}

// CSV exportado pelo próprio app tem cabeçalho na linha 1 e datas dd/mm/aaaa —
// tem que continuar passando pelo mesmo mapeador.
const csv = [
  "ACAO;FASE;ORIGEM;RESPONSAVEL;ABERTURA;FECHO_PLANEJADO;STATUS",
  '"Revisar POP da linha";Diagnóstico;Ata;Miguel;05/12/2025;19/12/2025;Em Andamento',
].join("\n");
const doApp = parseGSBCsv(csv).rows;
assert.equal(doApp.length, 1, "CSV do app: 1 linha");
assert.equal(doApp[0].descricao, "Revisar POP da linha");
assert.equal(doApp[0].ab, "2025-12-05");
assert.equal(doApp[0].fp, "2025-12-19");
assert.equal(doApp[0].st, "Em Andamento");
console.log("ok  CSV exportado pelo app");

console.log("\ntodos os checks passaram");

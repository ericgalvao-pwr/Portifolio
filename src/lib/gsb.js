import * as XLSX from "xlsx";

// Leitor da planilha GSB (aba Backlog) e do catálogo de fases (aba Dados).
// Fora do App.jsx de propósito: assim o parser roda em node, sem React,
// e dá para conferir contra as planilhas reais em docs/ (scripts/check-import.mjs).

const norm = (s) =>
  String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "");

// Cada campo aceita vários nomes: os da planilha GSB e os do CSV que o próprio
// app exporta, para os dois continuarem importáveis pelo mesmo caminho.
const COLUNAS = {
  descricao: ["acao", "descricao", "acao/descricao"],
  fase: ["fase"],
  origem: ["origem"],
  resp: ["responsavel", "resp"],
  ab: ["data de inicio", "abertura", "data abertura", "data_abertura"],
  fp: ["data prevista de conclusao", "fech. plan.", "fecho planejado", "fecho_planejado", "prazo", "fech plan"],
  fr: ["data real de conclusao", "fech. real", "fecho real", "fecho_real"],
  st: ["status (automatico)", "status"],
};

// Status calculado pelo GSB -> chaves de STATUS do app.
const STATUS_GSB = {
  "concluido no prazo": "Finalizada",
  "concluido com atraso": "Finalizada",
  "em andamento": "Em Andamento",
  atrasado: "Atrasada",
  "nao iniciado": "Aberta",
};

// Datas vêm como número de série do Excel (dias desde 1899-12-30). A conta é feita
// em UTC e lida com getUTC*: no horário local a meia-noite UTC cairia no dia anterior
// em UTC-3. Serial baixo é lixo (ou o bug do ano bissexto de 1900), então é descartado.
const serialParaISO = (n) => {
  if (!(n > 1000)) return null;
  const d = new Date(Math.round((n - 25569) * 86400000));
  if (isNaN(d)) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

const cellISO = (v) => {
  if (v === "" || v == null) return null;
  if (v instanceof Date) {
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}-${String(v.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof v === "number") return serialParaISO(v);
  const s = String(v).trim();
  if (!s || s === "–") return null;
  if (s.includes("/")) {
    const [d, m, y] = s.split("/");
    if (!d || !m || !y) return null;
    return `${y.length === 2 ? "20" + y : y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
};

// O cabeçalho do GSB fica na linha 4 (linhas 1-3 são título e resumo), e o CSV
// exportado pelo app tem cabeçalho na linha 1 — então procura em vez de assumir.
function acharCabecalho(matriz) {
  const limite = Math.min(matriz.length, 15);
  for (let i = 0; i < limite; i++) {
    if ((matriz[i] || []).some((c) => COLUNAS.descricao.includes(norm(c)))) return i;
  }
  return -1;
}

function mapear(matriz) {
  const iCab = acharCabecalho(matriz);
  if (iCab < 0) return [];
  const cab = (matriz[iCab] || []).map(norm);
  // As 104 colunas do Gantt têm cabeçalho numérico (data serial) e não casam
  // com nome nenhum, então caem fora sozinhas.
  const idx = {};
  for (const [campo, nomes] of Object.entries(COLUNAS)) {
    idx[campo] = cab.findIndex((c) => nomes.includes(c));
  }
  const val = (linha, campo) => (idx[campo] >= 0 ? linha[idx[campo]] : "");
  const texto = (linha, campo) => String(val(linha, campo) ?? "").replace(/\s+/g, " ").trim();

  const linhas = [];
  for (let i = iCab + 1; i < matriz.length; i++) {
    const linha = matriz[i] || [];
    const descricao = texto(linha, "descricao");
    if (!descricao) continue;
    const stBruto = texto(linha, "st");
    linhas.push({
      descricao,
      fase: texto(linha, "fase"),
      origem: texto(linha, "origem"),
      resp: texto(linha, "resp"),
      ab: cellISO(val(linha, "ab")),
      fp: cellISO(val(linha, "fp")),
      fr: cellISO(val(linha, "fr")),
      st: STATUS_GSB[norm(stBruto)] || stBruto || "Aberta",
    });
  }
  return linhas;
}

// Catálogo de fases do cliente: coluna A da aba Dados, abaixo do próprio cabeçalho.
function lerFases(wb) {
  const sh = wb.Sheets["Dados"];
  if (!sh) return [];
  const matriz = XLSX.utils.sheet_to_json(sh, { header: 1, blankrows: false, defval: "" });
  const iCab = matriz.findIndex((l) => norm((l || [])[0]) === "fase");
  if (iCab < 0) return [];
  const fases = [];
  for (let i = iCab + 1; i < matriz.length; i++) {
    const v = String((matriz[i] || [])[0] ?? "").trim();
    if (v && !fases.includes(v)) fases.push(v);
  }
  return fases;
}

export function parseGSBWorkbook(wb) {
  const sh = wb.Sheets["Backlog"] || wb.Sheets[wb.SheetNames[0]];
  if (!sh) return { rows: [], fases: [] };
  // header:1 lê a grade direto, sem passar por CSV: os cabeçalhos com quebra de
  // linha ("Data Prevista\nde Conclusão") quebravam o split por \n do parser antigo.
  const matriz = XLSX.utils.sheet_to_json(sh, { header: 1, blankrows: false, defval: "" });
  return { rows: mapear(matriz), fases: lerFases(wb) };
}

export function parseGSBCsv(text) {
  const linhas = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!linhas.length) return { rows: [], fases: [] };
  const delim = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ";" : ",";
  const parseLinha = (linha) => {
    const out = []; let cur = "", q = false;
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i];
      if (c === '"') { if (q && linha[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === delim && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  return { rows: mapear(linhas.map(parseLinha)), fases: [] };
}

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, ScatterChart, Scatter, ReferenceLine, Cell, LabelList,
} from "recharts";
import {
  LayoutGrid, Map, BarChart3, AlignLeft, ListChecks, Columns3, FileText,
  PenLine, Users, File as FileIcon, MessageSquare, Settings, ChevronRight,
  ChevronDown, X, Plus, Download, Upload, LogOut, Menu, Sparkles, ExternalLink,
} from "lucide-react";

/* ============================ TOKENS DE MARCA ============================ */
const C = {
  orange: "#FF5B00",
  navy: "#05244F",
  navyMed: "#273A76",
  blue: "#3C58B4",
  sidebar: "#071a3a",
  page: "#f3f5f8",
  border: "#e6eaf0",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#dc2626",
  gray: "#94a3b8",
};
const STATUS = {
  Finalizada: { c: C.green, label: "Finalizada" },
  "Em Andamento": { c: C.amber, label: "Em Andamento" },
  Atrasada: { c: C.red, label: "Atrasada" },
  Aberta: { c: C.gray, label: "Aberta" },
};
const PHASES = ["Diagnóstico", "Estruturação", "Implantação", "Estabilização", "Governança"];

/* ============================ DADOS MOCK ============================ */
const PROJECTS = [
  { id: "iseletrica", name: "Iselétrica", client: "Iselétrica Instalações", city: "Belo Horizonte", uf: "MG", region: "Sudeste", color: C.orange, letter: "I", status: "Não iniciado", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [["Industrial", 100]] },
  { id: "metalica", name: "Metálica", client: "Metálica Estruturas", city: "Contagem", uf: "MG", region: "Sudeste", color: C.navy, letter: "M", status: "Ativo", acoes: 23, pct: 70, atras: 5, emAnd: 2, portfolios: [["ACG", 100]] },
  { id: "matmed", name: "Matmed", client: "Matmed Hospitalar", city: "São Paulo", uf: "SP", region: "Sudeste", color: C.navyMed, letter: "M", status: "Ativo", acoes: 22, pct: 45, atras: 10, emAnd: 2, portfolios: [["Financeiro", 50], ["A&B", 50]] },
  { id: "condogroup", name: "Condogroup", client: "Condogroup Administração", city: "Rio de Janeiro", uf: "RJ", region: "Sudeste", color: C.green, letter: "C", status: "Ativo", acoes: 17, pct: 41, atras: 10, emAnd: 0, portfolios: [["A&B", 50], ["Pessoas e Cultura", 50]] },
  { id: "anaju", name: "Anaju", client: "Anaju Alimentos", city: "Goiânia", uf: "GO", region: "Centro-Oeste", color: C.navy, letter: "A", status: "Ativo", acoes: 18, pct: 39, atras: 10, emAnd: 1, portfolios: [["Comercial", 100]] },
  { id: "gosto", name: "Gosto Mineiro", client: "Gosto Mineiro Laticínios", city: "Uberlândia", uf: "MG", region: "Sudeste", color: C.red, letter: "G", status: "Ativo", acoes: 17, pct: 47, atras: 5, emAnd: 1, portfolios: [["ACG", 50], ["Pessoas e Cultura", 50]] },
  { id: "tubonord", name: "Tubonord / Tubocone", client: "Tubonord Industrial", city: "Fortaleza", uf: "CE", region: "Nordeste", color: "#06b6d4", letter: "T", status: "Ativo", acoes: 26, pct: 65, atras: 6, emAnd: 2, portfolios: [["Pessoas e Cultura", 100]] },
  { id: "estacao7", name: "Estação 7", client: "Estação 7 Log", city: "Curitiba", uf: "PR", region: "Sul", color: "#7c3aed", letter: "E", status: "Ativo", acoes: 24, pct: 50, atras: 7, emAnd: 3, portfolios: [["ACG", 100]] },
];
const PROJ = (id) => PROJECTS.find((p) => p.id === id);

// contadores exibidos nos cards do Portfólio (fin, atras, and)
const PORTFOLIO_COUNTS = {
  metalica: [16, 5, 2], matmed: [10, 10, 2], condogroup: [7, 10, 0],
  anaju: [7, 10, 1], gosto: [8, 5, 1], tubonord: [17, 6, 2], estacao7: [12, 7, 3],
};

const RESPONSAVEIS = [
  { nome: "Ana Prado", empresa: "PWR Gestão", pwr: true, papel: "Consultora", email: "ana.prado@pwrgestao.com", acoes: 5 },
  { nome: "Carlos Nunes", empresa: "Gosto Mineiro Laticínios", pwr: false, papel: "Diretor", email: "carlos.nunes@gostomineiro.com", acoes: 2 },
  { nome: "Marina Lopes", empresa: "Gosto Mineiro Laticínios", pwr: false, papel: "Gerente", email: "marina.lopes@gostomineiro.com", acoes: 3 },
  { nome: "Rafael Dias", empresa: "PWR Gestão", pwr: true, papel: "Consultor", email: "rafael.dias@pwrgestao.com", acoes: 0 },
  { nome: "Juliana Reis", empresa: "Gosto Mineiro Laticínios", pwr: false, papel: "Coordenadora", email: "juliana.reis@gostomineiro.com", acoes: 5 },
  { nome: "Bruno Teixeira", empresa: "Gosto Mineiro Laticínios", pwr: false, papel: "Analista", email: "bruno.teixeira@gostomineiro.com", acoes: 2 },
  { nome: "Patricia Melo", empresa: "Gosto Mineiro Laticínios", pwr: false, papel: "Assistente", email: "patricia.melo@gostomineiro.com", acoes: 1 },
];

// 17 ações do Gosto Mineiro (transcritas do protótipo)
const GOSTO_ACOES = [
  ["GOS-1", "Padronizar procedimento operacional", "Implantação", "Ata", "Marina Lopes", "–", "09/07/25", "–", "Aberta"],
  ["GOS-2", "Revisar indicadores de produção", "Estabilização", "Visita", "Juliana Reis", "05/05/26", "20/05/26", "08/05/26", "Finalizada"],
  ["GOS-3", "Implantar rotina de reunião tática", "Estruturação", "Auditoria", "Carlos Nunes", "–", "18/07/26", "01/07/26", "Finalizada"],
  ["GOS-4", "Mapear fluxo de caixa", "Diagnóstico", "Auditoria", "Marina Lopes", "24/09/25", "01/11/25", "–", "Atrasada"],
  ["GOS-5", "Treinar equipe no novo processo", "Diagnóstico", "Reunião", "Patricia Melo", "01/08/25", "23/08/25", "21/08/25", "Finalizada"],
  ["GOS-6", "Definir metas do trimestre", "Implantação", "Balanço", "Juliana Reis", "21/01/26", "11/03/26", "02/03/26", "Finalizada"],
  ["GOS-7", "Auditar controle de qualidade", "Implantação", "Ata", "Carlos Nunes", "12/09/25", "28/11/25", "10/12/25", "Finalizada"],
  ["GOS-8", "Ajustar cronograma de manutenção", "Estabilização", "Auditoria", "Bruno Teixeira", "17/10/25", "30/12/25", "–", "Atrasada"],
  ["GOS-9", "Consolidar relatório gerencial", "Estruturação", "Visita", "Juliana Reis", "–", "12/06/25", "–", "Aberta"],
  ["GOS-10", "Estruturar gestão à vista", "Implantação", "Balanço", "Ana Prado", "04/03/26", "21/03/26", "08/03/26", "Finalizada"],
  ["GOS-11", "Revisar contrato de fornecedores", "Implantação", "Balanço", "Ana Prado", "25/07/25", "02/10/25", "–", "Atrasada"],
  ["GOS-12", "Criar plano de ação 5S", "Estruturação", "Ata", "Ana Prado", "11/06/25", "07/07/25", "21/06/25", "Finalizada"],
  ["GOS-13", "Documentar instrução de trabalho", "Implantação", "Auditoria", "Ana Prado", "03/04/25", "–", "–", "Em Andamento"],
  ["GOS-14", "Validar dados do ERP", "Implantação", "Auditoria", "Ana Prado", "16/11/25", "07/01/26", "23/12/25", "Finalizada"],
  ["GOS-15", "Organizar follow-up semanal", "Estruturação", "Ata", "Bruno Teixeira", "24/01/26", "01/03/26", "–", "Atrasada"],
  ["GOS-16", "Padronizar procedimento operacional", "Governança", "Ata", "Juliana Reis", "03/03/26", "21/04/26", "–", "Atrasada"],
  ["GOS-17", "Revisar indicadores de produção", "Governança", "Auditoria", "Juliana Reis", "–", "28/08/25", "–", "Aberta"],
].map(([id, acao, fase, origem, resp, ab, fp, fr, st]) => ({ id, acao, fase, origem, resp, ab, fp, fr, st }));

const GOSTO_ATA_EXTRA = [
  { id: "GOS-18", acao: "Marina ficou de organizar o treinamento da equipe até 30/07/2026.", fase: "Implantação", origem: "Ata", resp: "Marina Lopes", ab: "17/07/26", fp: "30/07/26", fr: "–", st: "Aberta" },
  { id: "GOS-19", acao: "Vou consolidar o relatório gerencial e enviar até 25/07/2026.", fase: "Estruturação", origem: "Ata", resp: "Ana Prado", ab: "17/07/26", fp: "25/07/26", fr: "–", st: "Aberta" },
  { id: "GOS-20", acao: "Precisamos revisar o contrato com o fornecedor de embalagens.", fase: "Implantação", origem: "Ata", resp: "Carlos Nunes", ab: "17/07/26", fp: "–", fr: "–", st: "Aberta" },
];

// gera ações sintéticas p/ projetos sem lista real (para popular dashboards)
function genActions(p) {
  const fin = Math.round((p.acoes * p.pct) / 100);
  const atras = p.atras, emAnd = p.emAnd;
  const aberta = Math.max(0, p.acoes - fin - atras - emAnd);
  const pool = RESPONSAVEIS.map((r) => r.nome);
  const arr = [];
  const push = (n, st) => { for (let i = 0; i < n; i++) arr.push({ fase: PHASES[arr.length % PHASES.length], resp: pool[arr.length % pool.length], st }); };
  push(fin, "Finalizada"); push(atras, "Atrasada"); push(emAnd, "Em Andamento"); push(aberta, "Aberta");
  return arr;
}

// KPIs + dados de gráfico a partir de uma lista de ações
function buildDashboard(actions) {
  const k = { total: actions.length, Finalizada: 0, "Em Andamento": 0, Atrasada: 0, Aberta: 0 };
  actions.forEach((a) => { k[a.st]++; });
  const pct = k.total ? Math.round((k.Finalizada / k.total) * 100) : 0;

  const atrasoBy = {};
  actions.filter((a) => a.st === "Atrasada").forEach((a) => { atrasoBy[a.resp] = (atrasoBy[a.resp] || 0) + 1; });
  const paretoRaw = Object.entries(atrasoBy).sort((a, b) => b[1] - a[1]).map(([resp, n]) => ({ resp: resp.split(" ")[0], n }));
  const tot = paretoRaw.reduce((s, x) => s + x.n, 0) || 1;
  let acc = 0;
  const pareto = paretoRaw.map((x) => { acc += x.n; return { ...x, cum: Math.round((acc / tot) * 100) }; });

  const byPhase = PHASES.map((fase) => {
    const o = { fase, Finalizada: 0, "Em Andamento": 0, Atrasada: 0, Aberta: 0 };
    actions.filter((a) => a.fase === fase).forEach((a) => o[a.st]++);
    return o;
  });

  const respOrder = ["Marina Lopes", "Juliana Reis", "Carlos Nunes", "Patricia Melo", "Bruno Teixeira", "Ana Prado", "Rafael Dias"];
  const present = respOrder.filter((r) => actions.some((a) => a.resp === r));
  const byResp = present.map((resp) => {
    const o = { resp: resp.split(" ")[0], Finalizada: 0, "Em Andamento": 0, Atrasada: 0, Aberta: 0 };
    actions.filter((a) => a.resp === resp).forEach((a) => o[a.st]++);
    return o;
  });

  // mapa de calor: X=% prazo decorrido, Y=% executado
  const execByPhase = { "Diagnóstico": 50, "Estruturação": 50, "Implantação": 57, "Estabilização": 50, "Governança": 0 };
  const elapsedByPhase = { "Diagnóstico": 96, "Estruturação": 92, "Implantação": 90, "Estabilização": 86, "Governança": 42 };
  const heat = PHASES.filter((f) => byPhase.find((b) => b.fase === f).Finalizada + byPhase.find((b) => b.fase === f).Atrasada + byPhase.find((b) => b.fase === f)["Em Andamento"] + byPhase.find((b) => b.fase === f).Aberta > 0)
    .map((f) => {
      const x = elapsedByPhase[f], y = execByPhase[f];
      const color = y >= x - 3 ? C.green : y >= x - 18 ? C.amber : C.red;
      return { fase: f, x, y, color, label: `${f} ${y}%` };
    });

  return { kpis: { total: k.total, fin: k.Finalizada, emAnd: k["Em Andamento"], atras: k.Atrasada, aberta: k.Aberta, pct }, pareto, byPhase, byResp, heat };
}

const GANTT = [
  { fase: "Diagnóstico", ini: "01/04/25", fim: "12/07/25", pct: 50 },
  { fase: "Estruturação", ini: "16/07/25", fim: "26/10/25", pct: 50 },
  { fase: "Implantação", ini: "30/10/25", fim: "10/02/26", pct: 57 },
  { fase: "Estabilização", ini: "14/02/26", fim: "27/05/26", pct: 50 },
  { fase: "Governança", ini: "31/05/26", fim: "11/09/26", pct: 0 },
];
const parseD = (s) => { const [d, m, y] = s.split("/").map(Number); return new Date(2000 + y, m - 1, d); };

const KANBAN = {
  Aberta: [
    ["Padronizar procedimento operacional", "gosto", "Gosto Mineiro Laticínios", "Marina Lopes", "Ata", "09/07/25"],
    ["Consolidar relatório gerencial", "gosto", "Gosto Mineiro Laticínios", "Juliana Reis", "Visita", "12/06/25"],
    ["Revisar indicadores de produção", "gosto", "Gosto Mineiro Laticínios", "Juliana Reis", "Auditoria", "28/08/25"],
    ["Ajustar cronograma de manutenção", "tubonord", "PWR Gestão", "Rafael Dias", "Visita", "09/03/26"],
    ["Treinar equipe no novo processo", "estacao7", "Estação 7 Log", "Juliana Reis", "Ata", "15/07/26"],
    ["Padronizar procedimento operacional", "estacao7", "Estação 7 Log", "Carlos Nunes", "Visita", "02/10/25"],
  ],
  "Em Andamento": [
    ["Mapear fluxo de caixa", "metalica", "Metálica Estruturas", "Marina Lopes", "Visita", "25/07/26"],
    ["Estruturar gestão à vista", "metalica", "PWR Gestão", "Rafael Dias", "Reunião", "29/09/26"],
    ["Organizar follow-up semanal", "matmed", "Matmed Hospitalar", "Carlos Nunes", "Ata", "26/08/26"],
    ["Revisar indicadores de produção", "matmed", "Matmed Hospitalar", "Marina Lopes", "Reunião", ""],
    ["Validar dados do ERP", "anaju", "Anaju Alimentos", "Carlos Nunes", "Auditoria", "17/09/26"],
    ["Documentar instrução de trabalho", "gosto", "PWR Gestão", "Ana Prado", "Auditoria", ""],
    ["Auditar controle de qualidade", "tubonord", "Tubonord Industrial", "Marina Lopes", "Ata", ""],
    ["Estruturar gestão à vista", "tubonord", "Tubonord Industrial", "Marina Lopes", "Auditoria", ""],
    ["Revisar indicadores de produção", "estacao7", "Estação 7 Log", "Carlos Nunes", "Balanço", "26/07/26"],
  ],
  Atrasada: [
    ["Definir metas do trimestre", "metalica", "Metálica Estruturas", "Bruno Teixeira", "Reunião", "04/10/25"],
    ["Auditar controle de qualidade", "metalica", "PWR Gestão", "Ana Prado", "Auditoria", "18/11/25"],
    ["Revisar contrato de fornecedores", "metalica", "PWR Gestão", "Rafael Dias", "Ata", "06/02/26"],
    ["Implantar rotina de reunião tática", "metalica", "Metálica Estruturas", "Juliana Reis", "Visita", "10/07/26"],
    ["Treinar equipe no novo processo", "metalica", "PWR Gestão", "Rafael Dias", "Balanço", "14/01/26"],
    ["Revisar indicadores de produção", "matmed", "Matmed Hospitalar", "Carlos Nunes", "Ata", "26/02/26"],
    ["Auditar controle de qualidade", "matmed", "Matmed Hospitalar", "Marina Lopes", "Reunião", "02/04/26"],
    ["Ajustar cronograma de manutenção", "matmed", "Matmed Hospitalar", "Juliana Reis", "Auditoria", "16/07/25"],
    ["Consolidar relatório gerencial", "matmed", "PWR Gestão", "Ana Prado", "Reunião", "07/02/26"],
  ],
  Finalizada: [
    ["Padronizar procedimento operacional", "metalica", "PWR Gestão", "Rafael Dias", "Balanço", "07/06/26"],
    ["Revisar indicadores de produção", "metalica", "Metálica Estruturas", "Marina Lopes", "Auditoria", "22/05/26"],
    ["Implantar rotina de reunião tática", "metalica", "Metálica Estruturas", "Carlos Nunes", "Auditoria", "29/11/25"],
    ["Treinar equipe no novo processo", "metalica", "Metálica Estruturas", "Juliana Reis", "Balanço", "29/07/26"],
    ["Ajustar cronograma de manutenção", "metalica", "Metálica Estruturas", "Juliana Reis", "Auditoria", "16/04/26"],
    ["Consolidar relatório gerencial", "metalica", "Metálica Estruturas", "Juliana Reis", "Ata", "10/07/26"],
    ["Criar plano de ação 5S", "metalica", "Metálica Estruturas", "Bruno Teixeira", "Visita", "05/11/25"],
    ["Documentar instrução de trabalho", "metalica", "PWR Gestão", "Ana Prado", "Auditoria", "03/12/25"],
    ["Validar dados do ERP", "metalica", "Metálica Estruturas", "Carlos Nunes", "Reunião", "15/05/26"],
  ],
};
const KANBAN_COUNTS = { Aberta: 6, "Em Andamento": 11, Atrasada: 53, Finalizada: 77 };

const DOCS = [
  { tipo: "Kickoff", data: "01/04/25", nome: "Kickoff – Gosto Mineiro" },
  { tipo: "Proposta", data: "17/03/25", nome: "Proposta comercial" },
  { tipo: "Relatório", data: "23/06/26", nome: "Relatório mensal" },
];
const SOLICITACOES = [
  { data: "10/07/26", quem: "carlos@condogroup.com", tipo: "Correção de dados", proj: "Condogroup", desc: "A ação CON-4 está com responsável errado.", st: "Aberta" },
  { data: "08/07/26", quem: "marina@matmed.com", tipo: "Dúvida", proj: "Matmed", desc: "Como registro horas de impacto retroativas?", st: "Aberta" },
  { data: "03/07/26", quem: "diego@pwrgestao.com", tipo: "Novo projeto", proj: "—", desc: "Solicitar abertura de projeto para novo cliente do Sul.", st: "Em análise" },
];
const ATA_EXAMPLE = {
  data: "17/07/2026", local: "Sede do cliente / Online",
  participantes: [["Ana Prado", "PWR Gestão"], ["Carlos Nunes", "Gosto Mineiro Laticínios"], ["Marina Lopes", "Gosto Mineiro Laticínios"], ["Rafael Dias", "PWR Gestão"]],
  pauta: [
    "Bom dia a todos, vamos iniciar a reunião de acompanhamento.",
    "A padronização do procedimento de recebimento foi concluída na semana passada.",
    "Ainda temos pendência no treinamento da equipe do turno da noite.",
    "Como ponto de atenção, a disponibilidade de dados do ERP ainda está limitada.",
  ],
  decisoes: ["Ótimo. Ficou decidido que vamos adotar o novo checklist em todas as unidades.", "Foi aprovado o novo cronograma de manutenção preventiva."],
  encaminhamentos: [
    ["Marina ficou de organizar o treinamento da equipe até 30/07/2026.", "Marina Lopes", "30/07/2026"],
    ["Vou consolidar o relatório gerencial e enviar até 25/07/2026.", "", "25/07/2026"],
    ["Precisamos revisar o contrato com o fornecedor de embalagens.", "", ""],
  ],
};

/* ============================ MENU POR PAPEL ============================ */
const NAV = [
  { id: "portfolio", label: "Portfólio", icon: LayoutGrid, level: "portfolio" },
  { id: "mapa", label: "Mapa Brasil", icon: Map, level: "portfolio" },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, level: "project" },
  { id: "gantt", label: "Fases & Gantt", icon: AlignLeft, level: "project" },
  { id: "acoes", label: "Base de Ações", icon: ListChecks, level: "project", badge: "acoes" },
  { id: "kanban", label: "Kanban", icon: Columns3, level: "portfolio" },
  { id: "followup", label: "Follow-Up", icon: FileText, level: "project" },
  { id: "ata", label: "Emissão de ATA", icon: PenLine, level: "project" },
  { id: "responsaveis", label: "Responsáveis", icon: Users, level: "project" },
  { id: "documentos", label: "Documentos", icon: FileIcon, level: "project" },
  { id: "solicitacoes", label: "Solicitações", icon: MessageSquare, level: "portfolio", badge3: true },
  { id: "administracao", label: "Administração", icon: Settings, level: "portfolio" },
];
const ROLE_PAGES = {
  admin: ["portfolio", "mapa", "dashboard", "gantt", "acoes", "kanban", "followup", "ata", "responsaveis", "documentos", "solicitacoes", "administracao"],
  consultor: ["dashboard", "gantt", "acoes", "kanban", "followup", "ata", "responsaveis", "documentos", "solicitacoes"],
  cliente: ["dashboard", "gantt", "acoes", "kanban", "followup", "ata", "responsaveis", "documentos", "solicitacoes"],
};
const ROLE_LABEL = { admin: "Admin PWR", consultor: "Consultor", cliente: "Cliente" };

/* ============================ UI HELPERS ============================ */
const ProjIcon = ({ p, size = 28 }) => (
  <div style={{ width: size, height: size, background: p.color }}
    className="rounded-md flex items-center justify-center text-white font-bold shrink-0"
    ><span style={{ fontSize: size * 0.5 }}>{p.letter}</span></div>
);
const StatusBadge = ({ st }) => {
  const s = STATUS[st] || STATUS.Aberta;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <span className="w-2 h-2 rounded-full" style={{ background: s.c }} />
      <span style={{ color: s.c }}>{s.label}</span>
    </span>
  );
};
const OriginPill = ({ o }) => (
  <span className="inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-medium"
    style={{ borderColor: C.border, color: C.navyMed }}>{o}</span>
);
const StatCard = ({ value, label, accent }) => (
  <div className="bg-white rounded-lg border px-4 py-3 flex-1 min-w-[120px] relative overflow-hidden"
    style={{ borderColor: C.border }}>
    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent }} />
    <div className="text-2xl font-extrabold" style={{ color: C.navy }}>{value}</div>
    <div className="text-[11px] font-semibold tracking-wide mt-0.5" style={{ color: C.gray }}>{label}</div>
  </div>
);

/* ============================ SIDEBAR ============================ */
function Sidebar({ role, page, setPage, project, ataAdded }) {
  const pages = ROLE_PAGES[role];
  const items = NAV.filter((n) => pages.includes(n.id));
  const acoesBadge = project ? (project.id === "gosto" ? (ataAdded ? 20 : 17) : project.acoes) : 17;
  return (
    <aside className="w-[224px] shrink-0 flex flex-col text-white" style={{ background: C.sidebar }}>
      <div className="px-5 py-4 flex items-center gap-2.5 border-b" style={{ borderColor: "#ffffff14" }}>
        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: C.orange }}>
          <ChevronRight size={16} color={C.orange} />
        </div>
        <div className="leading-none">
          <div className="font-extrabold text-lg tracking-tight">pwr<span style={{ color: C.orange }}>.</span></div>
          <div className="text-[8px] tracking-[0.2em] mt-0.5" style={{ color: "#7f93b5" }}>GESTÃO · PORTFOLIO</div>
        </div>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {items.map((n) => {
          const active = page === n.id;
          const Ico = n.icon;
          return (
            <button key={n.id} onClick={() => setPage(n.id)}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors"
              style={{ background: active ? C.orange : "transparent", color: active ? "#fff" : "#c7d2e6", fontWeight: active ? 700 : 500 }}>
              <Ico size={18} />
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge === "acoes" && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: active ? "#ffffff33" : "#ffffff1a", color: "#fff" }}>{acoesBadge}</span>}
              {n.badge3 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: active ? "#ffffff33" : "#ffffff1a", color: "#fff" }}>3</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ============================ TOPBAR ============================ */
function TopBar({ role, setRole, page, project, openProjectPicker, onLogout }) {
  const isProjectLevel = NAV.find((n) => n.id === page)?.level === "project";
  const title = NAV.find((n) => n.id === page)?.label || "";
  const crumbProj = isProjectLevel && project ? project.name : "PWR Gestão";
  return (
    <header className="h-16 bg-white border-b flex items-center px-5 gap-4 shrink-0" style={{ borderColor: C.border }}>
      <Menu size={20} color={C.navyMed} className="shrink-0" />
      <div className="leading-tight">
        <div className="text-[11px]" style={{ color: C.gray }}>{crumbProj} · {ROLE_LABEL[role]}</div>
        <div className="text-lg font-extrabold" style={{ color: C.navy }}>{title}</div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {isProjectLevel && project && (
          <button onClick={openProjectPicker}
            className="flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm font-bold"
            style={{ borderColor: C.border, color: C.navy }}>
            <ProjIcon p={project} size={20} /> {project.name} <ChevronDown size={14} />
          </button>
        )}
        {role === "cliente" ? (
          <button onClick={() => setRole("admin")} className="border rounded-md px-3 py-1.5 text-sm font-semibold" style={{ borderColor: C.border, color: C.navy }}>Acesso Cliente</button>
        ) : (
          <div className="flex items-center rounded-md p-0.5 gap-0.5" style={{ background: "#eef1f6" }}>
            {["admin", "consultor", "cliente"].map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className="px-3 py-1 rounded text-sm transition-all"
                style={{ background: role === r ? "#fff" : "transparent", color: role === r ? C.navy : C.gray, fontWeight: role === r ? 700 : 500, boxShadow: role === r ? "0 1px 2px #0001" : "none" }}>
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        )}
        <button onClick={onLogout} className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: C.border }} title="Sair">
          <LogOut size={14} color={C.gray} />
        </button>
      </div>
    </header>
  );
}

/* ============================ PÁGINAS ============================ */
function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: C.navy }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: C.gray }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Portfolio({ openProject }) {
  const totals = { proj: 8, ativos: 7, acoes: 147, fin: 77, atras: 53, pct: 52 };
  return (
    <div>
      <PageHeader title="Portfólio PWR" subtitle="8 projetos de consultoria · 7 ativos" />
      <div className="flex gap-3 flex-wrap mb-5">
        <StatCard value={totals.proj} label="PROJETOS" accent={C.navy} />
        <StatCard value={totals.ativos} label="ATIVOS" accent={C.navy} />
        <StatCard value={totals.acoes} label="AÇÕES" accent={C.navy} />
        <StatCard value={totals.fin} label="FINALIZADAS" accent={C.green} />
        <StatCard value={totals.atras} label="ATRASADAS" accent={C.red} />
        <StatCard value={`${totals.pct}%`} label="CONCLUÍDO" accent={C.orange} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {PROJECTS.map((p) => {
          const counts = PORTFOLIO_COUNTS[p.id];
          return (
            <button key={p.id} onClick={() => openProject(p)}
              className="bg-white rounded-lg border p-4 text-left hover:shadow-md transition-shadow" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2.5 mb-3">
                <ProjIcon p={p} size={26} />
                <div className="leading-tight">
                  <div className="font-bold text-sm" style={{ color: C.navy }}>{p.name}</div>
                  <div className="text-[11px]" style={{ color: C.gray }}>{p.city}/{p.uf}</div>
                </div>
              </div>
              {p.status === "Não iniciado" ? (
                <div className="border border-dashed rounded-md py-4 text-center text-xs" style={{ borderColor: C.border, color: C.gray }}>Entrará em breve</div>
              ) : (
                <>
                  <div className="relative h-5 rounded bg-slate-100 overflow-hidden mb-3">
                    <div className="absolute inset-y-0 left-0 flex items-center rounded" style={{ width: `${p.pct}%`, background: C.orange }}>
                      <span className="text-[11px] font-bold text-white px-2">{p.pct}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#dcfce7", color: C.green }}>{counts[0]} fin.</span>
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#fee2e2", color: C.red }}>{counts[1]} atras.</span>
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#fef3c7", color: "#b45309" }}>{counts[2]} and.</span>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MapaBrasil({ openProject }) {
  // grid 8 linhas x 6 colunas (posições aproximadas do protótipo)
  const cells = {
    RR: [1, 4], AP: [1, 5],
    AM: [2, 2], PA: [2, 3], MA: [2, 4], CE: [2, 5], RN: [2, 6],
    AC: [3, 1], RO: [3, 2], TO: [3, 3], PI: [3, 4], PE: [3, 5], PB: [3, 6],
    MT: [4, 2], GO: [4, 3], BA: [4, 4], SE: [4, 5], AL: [4, 6],
    MS: [5, 2], DF: [5, 3], MG: [5, 4], ES: [5, 5],
    SP: [6, 3], RJ: [6, 4],
    PR: [7, 3], SC: [7, 4],
    RS: [8, 3],
  };
  const byUf = {};
  PROJECTS.forEach((p) => { byUf[p.uf] = (byUf[p.uf] || 0) + 1; });
  const regions = [
    ["Sudeste", PROJECTS.filter((p) => p.region === "Sudeste")],
    ["Centro-Oeste", PROJECTS.filter((p) => p.region === "Centro-Oeste")],
    ["Nordeste", PROJECTS.filter((p) => p.region === "Nordeste")],
    ["Sul", PROJECTS.filter((p) => p.region === "Sul")],
  ];
  return (
    <div>
      <PageHeader title="Mapa de Projetos" subtitle="Distribuição geográfica dos projetos ativos por região" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: C.border }}>
          <div className="grid gap-1.5 mx-auto w-fit" style={{ gridTemplateColumns: "repeat(6, 42px)", gridTemplateRows: "repeat(8, 42px)" }}>
            {Object.entries(cells).map(([uf, [r, c]]) => {
              const n = byUf[uf] || 0;
              const active = n > 0;
              return (
                <div key={uf} style={{ gridRow: r, gridColumn: c, background: active ? C.orange : "#e2e8f0", color: active ? "#fff" : "#94a3b8" }}
                  className="rounded-md flex flex-col items-center justify-center text-[10px] font-bold">
                  {uf}
                  {active && <span className="text-[8px] font-medium opacity-90">{n}proj</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-5 justify-center mt-6 text-xs" style={{ color: C.gray }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.orange }} /> Ativo</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Não iniciado</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
          <div className="font-bold" style={{ color: C.navy }}>Por região</div>
          <p className="text-xs mb-4" style={{ color: C.gray }}>Clique num ponto do mapa para abrir o projeto</p>
          {regions.map(([name, list]) => (
            <div key={name} className="mb-4">
              <div className="text-sm font-bold mb-2" style={{ color: C.navy }}>{name}<span className="font-normal ml-1 text-xs" style={{ color: C.gray }}>{list.length} proj.</span></div>
              <div className="flex flex-wrap gap-2">
                {list.map((p) => (
                  <button key={p.id} onClick={() => openProject(p)} className="border rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" style={{ borderColor: C.border, color: C.navy }}>{p.name}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ data }) {
  const { kpis, pareto, byPhase, byResp, heat } = data;
  const legend = (
    <div className="flex gap-4 text-xs mt-2" style={{ color: C.gray }}>
      {[["Finalizada", C.green], ["Em Andamento", C.amber], ["Atrasada", C.red], ["Aberta", C.gray]].map(([l, c]) => (
        <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}</span>
      ))}
    </div>
  );
  const Panel = ({ title, sub, children }) => (
    <div className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
      <div className="font-bold text-sm" style={{ color: C.navy }}>{title}</div>
      <div className="text-[11px] mb-2" style={{ color: C.gray }}>{sub}</div>
      {children}
    </div>
  );
  return (
    <div>
      <div className="flex gap-4 mb-4 flex-wrap">
        {[["FASE", ["Todas", ...PHASES]], ["RESPONSÁVEL", ["Todas"]], ["STATUS", ["Todos"]], ["ORIGEM", ["Todas"]]].map(([lbl, opts]) => (
          <div key={lbl}>
            <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>{lbl}</div>
            <select className="border rounded-md px-3 py-1.5 text-sm bg-white" style={{ borderColor: C.border, color: C.navy }}>
              {opts.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap mb-4">
        <StatCard value={kpis.total} label="TOTAL" accent={C.navy} />
        <StatCard value={kpis.fin} label="FINALIZADAS" accent={C.green} />
        <StatCard value={kpis.emAnd} label="EM ANDAMENTO" accent={C.blue} />
        <StatCard value={kpis.atras} label="ATRASADAS" accent={C.red} />
        <StatCard value={kpis.aberta} label="ABERTAS" accent={C.gray} />
        <StatCard value={`${kpis.pct}%`} label="CONCLUÍDO" accent={C.orange} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Pareto de atrasos por responsável" sub="Barras = nº de ações atrasadas · linha laranja = % acumulado">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={pareto} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f6" />
              <XAxis dataKey="resp" tick={{ fontSize: 12, fill: C.navyMed }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" hide />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar yAxisId="l" dataKey="n" fill={C.red} radius={[3, 3, 0, 0]} maxBarSize={48}>
                <LabelList dataKey="n" position="top" style={{ fill: C.navy, fontWeight: 700, fontSize: 12 }} />
              </Bar>
              <Line yAxisId="r" dataKey="cum" stroke={C.orange} strokeWidth={2} dot={{ fill: C.orange, r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Ações por fase" sub="Empilhado por status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byPhase} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f6" />
              <XAxis dataKey="fase" tick={{ fontSize: 10, fill: C.navyMed }} axisLine={false} tickLine={false} tickFormatter={(v) => v.length > 9 ? v.slice(0, 8) + "…" : v} />
              <YAxis tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="Finalizada" stackId="a" fill={C.green} />
              <Bar dataKey="Em Andamento" stackId="a" fill={C.amber} />
              <Bar dataKey="Atrasada" stackId="a" fill={C.red} />
              <Bar dataKey="Aberta" stackId="a" fill={C.gray} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {legend}
        </Panel>
        <Panel title="Mapa de Calor por fase" sub="X = % do prazo decorrido · Y = % executado · acima da diagonal = adiantado · use o filtro Fase acima">
          <div className="relative" style={{ height: 260 }}>
            <div className="absolute inset-0 rounded" style={{ margin: "10px 10px 30px 40px", background: "linear-gradient(135deg,#dcfce7 0%,#fef9c3 50%,#fee2e2 100%)" }} />
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis type="number" dataKey="x" domain={[0, 100]} tick={{ fontSize: 10, fill: C.gray }} tickFormatter={(v) => `${v}`} label={{ value: "% do prazo decorrido →", position: "insideBottom", offset: -8, fontSize: 10, fill: C.gray }} />
                <YAxis type="number" dataKey="y" domain={[0, 100]} tick={{ fontSize: 10, fill: C.gray }} width={30} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#334155" strokeDasharray="5 4" />
                <Scatter data={heat}>
                  {heat.map((h, i) => <Cell key={i} fill={h.color} />)}
                  <LabelList dataKey="label" position="left" style={{ fontSize: 9, fill: C.navy, fontWeight: 600 }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="absolute top-3 right-4 text-[9px] font-bold" style={{ color: C.green }}>ADIANTADO</div>
            <div className="absolute bottom-9 left-11 text-[9px] font-bold" style={{ color: C.red }}>ATRASADO</div>
          </div>
          <div className="flex gap-4 text-xs mt-1" style={{ color: C.gray }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.green }} />Adiantado</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.amber }} />No limite</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.red }} />Atrasado</span>
          </div>
        </Panel>
        <Panel title="Ações por responsável" sub="Empilhado por status · clique na legenda para ligar/desligar séries">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byResp} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f6" />
              <XAxis dataKey="resp" tick={{ fontSize: 11, fill: C.navyMed }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="Finalizada" stackId="a" fill={C.green} />
              <Bar dataKey="Em Andamento" stackId="a" fill={C.amber} />
              <Bar dataKey="Atrasada" stackId="a" fill={C.red} />
              <Bar dataKey="Aberta" stackId="a" fill={C.gray} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {legend}
        </Panel>
      </div>
    </div>
  );
}

function Gantt({ project }) {
  const min = parseD(GANTT[0].ini).getTime();
  const max = parseD(GANTT[GANTT.length - 1].fim).getTime();
  const range = max - min;
  const today = new Date(2026, 6, 17).getTime();
  const todayPct = ((today - min) / range) * 100;
  return (
    <div>
      <PageHeader title={`Fases & Gantt — ${project.name}`} subtitle="Barras coloridas pela saúde da fase · linha laranja = hoje" />
      <div className="bg-white rounded-lg border p-6 relative" style={{ borderColor: C.border }}>
        <div className="relative">
          {GANTT.map((g) => {
            const s = parseD(g.ini).getTime(), e = parseD(g.fim).getTime();
            const left = ((s - min) / range) * 100;
            const width = ((e - s) / range) * 100;
            return (
              <div key={g.fase} className="flex items-center mb-5">
                <div className="w-40 shrink-0 pr-3">
                  <div className="font-bold text-sm" style={{ color: C.navy }}>{g.fase}</div>
                  <div className="text-[11px]" style={{ color: C.gray }}>{g.ini} – {g.fim}</div>
                </div>
                <div className="relative flex-1 h-7">
                  <div className="absolute h-7 rounded" style={{ left: `${left}%`, width: `${width}%`, background: "#fde2e2" }}>
                    <div className="h-7 rounded flex items-center" style={{ width: `${g.pct}%`, background: C.red, minWidth: 34 }}>
                      <span className="text-[11px] font-bold text-white px-2">{g.pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="absolute top-0 bottom-0" style={{ left: `calc(160px + (100% - 160px) * ${todayPct / 100})` }}>
            <div className="w-0.5 h-full" style={{ background: C.orange }} />
            <div className="absolute -top-1 -translate-x-1/2 text-[9px] font-bold" style={{ color: C.orange }}>HOJE</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BaseAcoes({ project, actions }) {
  const [f, setF] = useState({ fase: "Todas", resp: "Todas", st: "Todos", origem: "Todas" });
  const resps = [...new Set(actions.map((a) => a.resp))];
  const origens = [...new Set(actions.map((a) => a.origem))];
  const filtered = actions.filter((a) =>
    (f.fase === "Todas" || a.fase === f.fase) &&
    (f.resp === "Todas" || a.resp === f.resp) &&
    (f.st === "Todos" || a.st === f.st) &&
    (f.origem === "Todas" || a.origem === f.origem));
  const Sel = ({ k, label, opts }) => (
    <div>
      <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>{label}</div>
      <select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="border rounded-md px-3 py-1.5 text-sm bg-white" style={{ borderColor: C.border, color: C.navy }}>
        {opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
  return (
    <div>
      <PageHeader title={`Base de Ações — ${project.name}`} subtitle={`${filtered.length} de ${actions.length} ações · status calculado automaticamente`}
        right={
          <div className="flex gap-2">
            <button className="border rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5" style={{ borderColor: C.border, color: C.navy }}><Download size={14} /> Exportar CSV</button>
            <button className="border rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5" style={{ borderColor: C.border, color: C.navy }}><Upload size={14} /> Importar GSB</button>
            <button className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Nova ação</button>
          </div>
        } />
      <div className="flex gap-3 items-end mb-4 flex-wrap">
        <Sel k="fase" label="FASE" opts={["Todas", ...PHASES]} />
        <Sel k="resp" label="RESPONSÁVEL" opts={["Todas", ...resps]} />
        <Sel k="st" label="STATUS" opts={["Todos", ...Object.keys(STATUS)]} />
        <Sel k="origem" label="ORIGEM" opts={["Todas", ...origens]} />
        <button onClick={() => setF({ fase: "Todas", resp: "Todas", st: "Todos", origem: "Todas" })} className="border rounded-md px-3 py-1.5 text-sm" style={{ borderColor: C.border, color: C.navyMed }}>Limpar</button>
      </div>
      <div className="bg-white rounded-lg border overflow-x-auto" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-semibold text-left" style={{ color: C.gray }}>
              {["ID", "AÇÃO", "FASE", "ORIGEM", "RESPONSÁVEL", "ABERTURA", "FECH. PLAN.", "FECH. REAL", "STATUS"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t" style={{ borderColor: C.border }}>
                <td className="px-4 py-3 font-semibold" style={{ color: C.blue }}>{a.id}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: C.navy }}>{a.acao}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{a.fase}</td>
                <td className="px-4 py-3"><OriginPill o={a.origem} /></td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{a.resp}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{a.ab}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{a.fp}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{a.fr}</td>
                <td className="px-4 py-3"><StatusBadge st={a.st} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kanban() {
  const cols = ["Aberta", "Em Andamento", "Atrasada", "Finalizada"];
  return (
    <div>
      <PageHeader title="Kanban de Ações" subtitle="Todas as suas ações em todos os projetos · filtre por projeto, empresa e responsável · arraste os cards entre colunas" />
      <div className="flex gap-3 items-end mb-4 flex-wrap">
        {[["PROJETO", "Todos os projetos"], ["EMPRESA", "Todas as empresas"], ["RESPONSÁVEL", "Todos os responsáveis"]].map(([l, o]) => (
          <div key={l}><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>{l}</div>
            <select className="border rounded-md px-3 py-1.5 text-sm bg-white" style={{ borderColor: C.border, color: C.navy }}><option>{o}</option></select></div>
        ))}
        <button className="border rounded-md px-3 py-1.5 text-sm" style={{ borderColor: C.border, color: C.navyMed }}>Limpar</button>
        <div className="ml-auto text-sm" style={{ color: C.gray }}>147 ações</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cols.map((col) => {
          const s = STATUS[col];
          return (
            <div key={col} className="bg-white rounded-lg border p-3" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.c }} />
                <span className="font-bold text-sm" style={{ color: C.navy }}>{col}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#eef1f6", color: C.navyMed }}>{KANBAN_COUNTS[col]}</span>
              </div>
              <div className="space-y-2.5">
                {KANBAN[col].map((c, i) => {
                  const p = PROJ(c[1]);
                  const isPwr = c[2] === "PWR Gestão";
                  return (
                    <div key={i} className="border rounded-md p-3 border-l-2" style={{ borderColor: C.border, borderLeftColor: s.c }}>
                      <div className="font-semibold text-[13px] mb-2" style={{ color: C.navy }}>{c[0]}</div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] mb-1.5">
                        <span className="flex items-center gap-1 font-semibold" style={{ color: C.navy }}><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
                        <span className="font-semibold" style={{ color: isPwr ? C.orange : C.blue }}>{c[2]}</span>
                        <span style={{ color: C.gray }}>{c[3]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <OriginPill o={c[4]} />
                        {c[5] && <span style={{ color: C.gray }}>{c[5]}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FollowUp({ project }) {
  const recent = [["Revisar indicadores de produção", "GOS-2"], ["Implantar rotina de reunião tática", "GOS-3"], ["Treinar equipe no novo processo", "GOS-5"], ["Definir metas do trimestre", "GOS-6"], ["Auditar controle de qualidade", "GOS-7"], ["Estruturar gestão à vista", "GOS-10"], ["Criar plano de ação 5S", "GOS-12"], ["Validar dados do ERP", "GOS-14"]];
  const [notes, setNotes] = useState({ av: "", imp: "", prox: "" });
  const [draft, setDraft] = useState("");
  const gerar = () => setDraft(
    "Avanço: nesta semana concluímos a padronização de procedimentos operacionais e validamos os indicadores de produção junto à equipe. A rotina de reunião tática foi implantada e já está em uso pela liderança." +
    (notes.av ? " " + notes.av : "") +
    "\n\nImpedimentos e pontos de atenção: o treinamento da equipe do turno da noite segue pendente e a disponibilidade de dados do ERP ainda está limitada, o que impacta o mapeamento do fluxo de caixa." +
    (notes.imp ? " " + notes.imp : "") +
    "\n\nPróximos passos: iniciar o treinamento da equipe no novo processo, revisar o contrato com o fornecedor de embalagens e consolidar o relatório gerencial para envio até o fim da semana." +
    (notes.prox ? " " + notes.prox : ""));
  const fields = [
    ["AVANÇO", "O que avançou nesta semana...", "av"],
    ["IMPEDIMENTOS E PONTOS DE ATENÇÃO", "Bloqueios, riscos, dependências...", "imp"],
    ["PRÓXIMOS PASSOS", "O que será feito a seguir...", "prox"],
  ];
  return (
    <div>
      <PageHeader title={`Follow-Up Semanal — ${project.name}`} subtitle="Registre o avanço da semana e gere um rascunho executivo com IA" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
          <div className="font-bold text-sm" style={{ color: C.navy }}>Ações concluídas recentes</div>
          <div className="text-[11px] mb-3" style={{ color: C.gray }}>Selecione as relacionadas a esta semana</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
            {recent.map(([t, id]) => (
              <label key={id} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.navyMed }}>
                <input type="checkbox" /> {t}<span className="text-[10px]" style={{ color: C.gray }}>{id}</span>
              </label>
            ))}
          </div>
          <div className="font-bold text-sm mb-1" style={{ color: C.navy }}>Nota do consultor</div>
          <div className="inline-block text-[11px] px-2 py-0.5 rounded mb-3" style={{ background: "#fff1e8", color: C.orange }}>Consultor / Admin</div>
          {fields.map(([label, ph, k]) => (
            <div key={k} className="mb-4">
              <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>{label}</div>
              <textarea value={notes[k]} onChange={(e) => setNotes((n) => ({ ...n, [k]: e.target.value }))} placeholder={ph} rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none" style={{ borderColor: C.border }} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-sm" style={{ color: C.navy }}>Rascunho do follow-up</div>
            <button onClick={gerar} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Sparkles size={14} /> Gerar rascunho com IA</button>
          </div>
          <div className="text-[11px] rounded-md px-3 py-2 mb-3" style={{ background: "#fff7f0", color: C.orange }}>Tom: direto, executivo, 1ª pessoa do plural, sem emojis · estrutura: Avanço / Impedimentos e pontos de atenção / Próximos passos</div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} placeholder="O texto gerado aparece aqui e pode ser editado antes de salvar ou gerar o relatório."
            className="w-full border rounded-md px-3 py-2 text-sm resize-none" style={{ borderColor: C.border }} />
          <div className="flex gap-2 mt-3">
            <button className="rounded-md px-4 py-2 text-sm font-bold text-white" style={{ background: C.navy }}>Salvar no banco</button>
            <button className="border rounded-md px-4 py-2 text-sm font-semibold" style={{ borderColor: C.border, color: C.navy }}>Gerar relatório PDF (ISO 9001:2015)</button>
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold mb-2" style={{ color: C.gray }}>HISTÓRICO SALVO (1)</div>
            <div className="font-bold text-sm" style={{ color: C.navy }}>07/07 – 11/07</div>
            <p className="text-xs mt-1" style={{ color: C.gray }}>O que avançamos: concluímos a padronização de dois procedimentos operacionais e validamos os indicadores de produção. Pontos de atenção: a rotina de reunião tática ainda depende do engajamento da liderança. Próximos passos: iniciar o treinamento da equipe no novo processo.</p>
            <div className="flex gap-2 mt-2">
              <button className="border rounded-md px-3 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Visualizar</button>
              <button className="border rounded-md px-3 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Imprimir (ISO 9001:2015)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmissaoAta({ project, onFill, filled }) {
  const [transcricao, setTranscricao] = useState("");
  const usarExemplo = () => setTranscricao('Ana Prado: Bom dia a todos, vamos iniciar a reunião de acompanhamento.\nCarlos Nunes: A padronização do procedimento de recebimento foi concluída na semana passada.\nMarina Lopes: Ainda temos pendência no treinamento da equipe do turno da noite.\nRafael Dias: Como ponto de atenção, a disponibilidade de dados do ERP ainda está limitada.\nCarlos Nunes: Ótimo. Ficou decidido que vamos adotar o novo checklist em todas as unidades.\nAna Prado: Foi aprovado o novo cronograma de manutenção preventiva.');
  const SectionHead = ({ children, orange }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-t-md text-white text-xs font-bold" style={{ background: orange ? C.orange : C.navyMed }}>
      {children}<button className="ml-2 text-[11px] px-2 py-0.5 rounded" style={{ background: "#ffffff2e" }}>+ Linha</button>
    </div>
  );
  const inp = "border rounded px-2 py-1 text-sm";
  return (
    <div>
      <PageHeader title={`Emissão de ATA — ${project.name}`} subtitle="Suba ou cole a transcrição · a IA preenche a ATA no modelo padrão · encaminhamentos entram automaticamente na Base de Ações" />
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Esquerda */}
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm" style={{ color: C.navy }}>Transcrição</div>
            <button onClick={usarExemplo} className="border rounded-md px-2 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Usar exemplo</button>
          </div>
          <div className="border border-dashed rounded-md py-5 text-center mb-3" style={{ borderColor: C.border }}>
            <div className="font-bold text-sm" style={{ color: C.navy }}>Subir transcrição</div>
            <div className="text-[11px]" style={{ color: C.gray }}>.txt · .csv · .vtt · .srt</div>
          </div>
          <div className="text-[10px] font-semibold" style={{ color: C.gray }}>DATA</div>
          <input placeholder="dd/mm/aaaa" className={`${inp} w-full mb-2`} style={{ borderColor: C.border }} />
          <div className="text-[10px] font-semibold" style={{ color: C.gray }}>LOCAL</div>
          <input placeholder="Sede / Online" className={`${inp} w-full mb-2`} style={{ borderColor: C.border }} />
          <textarea value={transcricao} onChange={(e) => setTranscricao(e.target.value)} rows={8} placeholder='Cole aqui a transcrição (ex: "Ana Prado: ...")...'
            className="w-full border rounded-md px-3 py-2 text-sm resize-none mb-3" style={{ borderColor: C.border }} />
          <button onClick={onFill} className="w-full rounded-md py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Preencher ATA automaticamente</button>
        </div>
        {/* Direita */}
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
          <div className="font-bold text-sm mb-3" style={{ color: C.navy }}>ATA — modelo padrão</div>
          {!filled ? (
            <div className="border border-dashed rounded-md py-16 text-center text-sm" style={{ borderColor: C.border, color: C.gray }}>
              Suba ou cole a transcrição e clique em "Preencher ATA automaticamente" para gerar a ata no modelo padrão.
            </div>
          ) : (
            <div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <button className="rounded-md px-3 py-1.5 text-sm font-bold text-white" style={{ background: C.navy }}>Salvar ATA</button>
                {["Visualizar ISO", "Imprimir (ISO 9001:2015)", "Excel"].map((b) => <button key={b} className="border rounded-md px-3 py-1.5 text-sm font-semibold" style={{ borderColor: C.border, color: C.navy }}>{b}</button>)}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><div className="text-[10px] font-semibold" style={{ color: C.gray }}>DATA</div><input defaultValue={ATA_EXAMPLE.data} className={`${inp} w-full`} style={{ borderColor: C.border }} /></div>
                <div><div className="text-[10px] font-semibold" style={{ color: C.gray }}>LOCAL</div><input defaultValue={ATA_EXAMPLE.local} className={`${inp} w-full`} style={{ borderColor: C.border }} /></div>
              </div>
              <SectionHead>PARTICIPANTES</SectionHead>
              <div className="border border-t-0 rounded-b-md p-2 mb-4" style={{ borderColor: C.border }}>
                {ATA_EXAMPLE.participantes.map(([n, emp], i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-xs w-4" style={{ color: C.gray }}>{i + 1}</span>
                    <input defaultValue={n} className={`${inp} flex-1`} style={{ borderColor: C.border }} />
                    <select className={inp} style={{ borderColor: C.border }}><option>Presente</option><option>Ausente</option></select>
                    <input defaultValue={emp} className={`${inp} w-48`} style={{ borderColor: C.border }} />
                    <X size={14} color={C.red} />
                  </div>
                ))}
              </div>
              <SectionHead>PAUTA DA REUNIÃO</SectionHead>
              <div className="border border-t-0 rounded-b-md p-2 mb-4" style={{ borderColor: C.border }}>
                {ATA_EXAMPLE.pauta.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-xs w-4" style={{ color: C.gray }}>{i + 1}</span>
                    <input defaultValue={p} className={`${inp} flex-1`} style={{ borderColor: C.border }} />
                    <select className={inp} style={{ borderColor: C.border }}><option>Discutido</option></select>
                    <X size={14} color={C.red} />
                  </div>
                ))}
              </div>
              <SectionHead>DECISÕES E CONCLUSÕES DA REUNIÃO</SectionHead>
              <div className="border border-t-0 rounded-b-md p-2 mb-4" style={{ borderColor: C.border }}>
                {ATA_EXAMPLE.decisoes.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-xs w-4" style={{ color: C.gray }}>{i + 1}</span>
                    <input defaultValue={d} className={`${inp} flex-1`} style={{ borderColor: C.border }} />
                    <input placeholder="Responsável" className={`${inp} w-40`} style={{ borderColor: C.border }} />
                    <X size={14} color={C.red} />
                  </div>
                ))}
              </div>
              <div className="text-[11px] rounded-md px-3 py-2 mb-3" style={{ background: "#fff7f0", color: C.orange }}>3 encaminhamentos lançados automaticamente na Base de Ações (origem: Ata)</div>
              <SectionHead orange>ENCAMINHAMENTOS → BASE DE AÇÕES</SectionHead>
              <div className="border border-t-0 rounded-b-md p-2" style={{ borderColor: C.border }}>
                {ATA_EXAMPLE.encaminhamentos.map(([d, r, prazo], i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="text-xs w-4" style={{ color: C.gray }}>{i + 1}</span>
                    <input defaultValue={d} className={`${inp} flex-1`} style={{ borderColor: C.border }} />
                    <input defaultValue={r} placeholder="Responsável" className={`${inp} w-36`} style={{ borderColor: C.border }} />
                    <input defaultValue={prazo} placeholder="Prazo" className={`${inp} w-24`} style={{ borderColor: C.border }} />
                    <select className={inp} style={{ borderColor: C.border }}><option>Aberta</option></select>
                    <X size={14} color={C.red} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Responsaveis({ project }) {
  const [modal, setModal] = useState(false);
  return (
    <div>
      <PageHeader title={`Responsáveis — ${project.name}`} subtitle="Lista de referência que alimenta o campo Responsável das ações"
        right={<button onClick={() => setModal(true)} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Novo responsável</button>} />
      <div className="bg-white rounded-lg border overflow-x-auto" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] font-semibold text-left" style={{ color: C.gray }}>{["NOME", "EMPRESA", "PAPEL / FUNÇÃO", "E-MAIL", "AÇÕES", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {RESPONSAVEIS.map((r) => (
              <tr key={r.email} className="border-t" style={{ borderColor: C.border }}>
                <td className="px-4 py-3 font-bold" style={{ color: C.navy }}>{r.nome}</td>
                <td className="px-4 py-3"><span className="text-xs font-semibold" style={{ color: r.pwr ? C.orange : C.blue }}>{r.empresa}</span></td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{r.papel}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{r.email}</td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{r.acoes} ações</td>
                <td className="px-4 py-3"><div className="flex gap-2">
                  <button className="border rounded px-2.5 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Editar</button>
                  <button className="border rounded px-2.5 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.red }}>Excluir</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Novo responsável" onClose={() => setModal(false)}>
          <LabeledInput label="NOME" ph="Nome completo" />
          <LabeledInput label="EMPRESA" defaultValue="Gosto Mineiro Laticínios" />
          <LabeledInput label="PAPEL / FUNÇÃO" ph="Ex: Consultor, Gerente..." />
          <LabeledInput label="E-MAIL" ph="pessoa@empresa.com" />
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(false)} className="rounded-md px-4 py-2 text-sm font-bold text-white" style={{ background: C.orange }}>Salvar</button>
            <button onClick={() => setModal(false)} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Documentos({ project }) {
  const [modal, setModal] = useState(false);
  const pillColor = { Kickoff: C.blue, Proposta: C.navyMed, Relatório: C.orange };
  return (
    <div>
      <PageHeader title={`Documentos — ${project.name}`} subtitle="Kickoff, proposta, relatórios · com link para o Drive"
        right={<button onClick={() => setModal(true)} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Registrar documento</button>} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {DOCS.map((d) => (
          <div key={d.nome} className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: "#eef1f6", color: pillColor[d.tipo] }}>{d.tipo}</span>
              <span className="text-[11px]" style={{ color: C.gray }}>{d.data}</span>
            </div>
            <div className="font-bold text-sm mb-2" style={{ color: C.navy }}>{d.nome}</div>
            <a className="text-sm font-semibold flex items-center gap-1" style={{ color: C.blue }}>Abrir no Drive <ExternalLink size={12} /></a>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={`Registrar documento — ${project.name}`} onClose={() => setModal(false)}>
          <LabeledInput label="NOME DO DOCUMENTO" ph="Ex: Relatório mensal" />
          <div className="mb-3"><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>TIPO</div>
            <select className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}><option>Relatório</option><option>Kickoff</option><option>Proposta</option></select></div>
          <LabeledInput label="LINK DO DRIVE" ph="https://drive.google.com/..." />
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(false)} className="rounded-md px-4 py-2 text-sm font-bold text-white" style={{ background: C.orange }}>Registrar</button>
            <button onClick={() => setModal(false)} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Solicitacoes() {
  const tipoColor = { "Correção de dados": C.blue, "Dúvida": C.navyMed, "Novo projeto": C.orange };
  return (
    <div>
      <PageHeader title="Solicitações" subtitle="Dúvidas, pedidos de novo projeto ou correção de dados — lista central da PWR" />
      <div className="bg-white rounded-lg border overflow-x-auto mb-4" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] font-semibold text-left" style={{ color: C.gray }}>{["DATA", "SOLICITANTE", "TIPO", "PROJETO", "DESCRIÇÃO", "STATUS"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {SOLICITACOES.map((s, i) => (
              <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                <td className="px-4 py-3" style={{ color: C.gray }}>{s.data}</td>
                <td className="px-4 py-3" style={{ color: C.blue }}>{s.quem}</td>
                <td className="px-4 py-3"><span className="border rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ borderColor: C.border, color: tipoColor[s.tipo] }}>{s.tipo}</span></td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{s.proj}</td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{s.desc}</td>
                <td className="px-4 py-3"><span className="text-xs font-bold" style={{ color: s.st === "Aberta" ? C.red : C.amber }}>{s.st}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
        <div className="font-bold text-sm" style={{ color: C.navy }}>Nova solicitação</div>
        <div className="text-[11px] mb-3" style={{ color: C.gray }}>Qualquer usuário pode registrar</div>
        <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>TIPO</div>
        <select className="border rounded-md px-3 py-2 text-sm w-full bg-white mb-3" style={{ borderColor: C.border, color: C.navy }}><option>Dúvida</option><option>Correção de dados</option><option>Novo projeto</option></select>
        <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>DESCRIÇÃO</div>
        <textarea rows={3} placeholder="Descreva sua solicitação..." className="w-full border rounded-md px-3 py-2 text-sm resize-none mb-3" style={{ borderColor: C.border }} />
        <button className="w-full rounded-md py-2.5 text-sm font-bold text-white" style={{ background: C.orange }}>Registrar solicitação</button>
      </div>
    </div>
  );
}

function Administracao() {
  const [modal, setModal] = useState(false);
  const chips = ["admin@pwrgestao.com · Admin", "ana.prado@pwrgestao.com · Consultor PWR", "consultor@pwrgestao.com · Consultor PWR", "carlos@gostomineiro.com · Cliente", "marina@gostomineiro.com · Cliente"];
  return (
    <div>
      <PageHeader title="Administração" subtitle="Projetos, clientes e controle de acesso"
        right={<button onClick={() => setModal(true)} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Novo projeto / cliente</button>} />
      <div className="bg-white rounded-lg border overflow-x-auto mb-4" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] font-semibold text-left" style={{ color: C.gray }}>{["PROJETO", "CLIENTE", "REGIÃO", "PORTFÓLIOS", "STATUS", "AÇÕES", "% CONCL.", "ACESSOS"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {PROJECTS.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: C.border }}>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><ProjIcon p={p} size={24} /><span className="font-bold" style={{ color: C.navy }}>{p.name}</span></div></td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{p.client}</td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{p.region}/{p.uf}</td>
                <td className="px-4 py-3"><div className="flex gap-1.5 flex-wrap">{p.portfolios.map(([n, v]) => <span key={n} className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ background: "#eef1f6", color: C.blue }}>{n} {v}%</span>)}</div></td>
                <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: p.status === "Ativo" ? "#dcfce7" : "#f1f5f9", color: p.status === "Ativo" ? C.green : C.gray }}>{p.status}</span></td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{p.acoes}</td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{p.pct}%</td>
                <td className="px-4 py-3"><button className="border rounded px-2.5 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
        <div className="font-bold text-sm" style={{ color: C.navy }}>Conceder acesso por projeto</div>
        <div className="text-[11px] mb-3" style={{ color: C.gray }}>Selecione o projeto, informe e-mail + senha inicial e o papel</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_130px_120px] gap-3 items-end">
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>PROJETO</div><select className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}><option>Gosto Mineiro — Gosto Mineiro Laticínios</option></select></div>
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>E-MAIL</div><input placeholder="pessoa@empresa.com" className="border rounded-md px-3 py-2 text-sm w-full" style={{ borderColor: C.border }} /></div>
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>SENHA INICIAL</div><input type="password" defaultValue="123456" className="border rounded-md px-3 py-2 text-sm w-full" style={{ borderColor: C.border }} /></div>
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>PAPEL</div><select className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}><option>Cliente</option><option>Consultor</option><option>Admin</option></select></div>
          <button className="rounded-md py-2 text-sm font-bold text-white" style={{ background: C.navy }}>Conceder</button>
        </div>
        <div className="text-[10px] font-semibold mt-4 mb-2" style={{ color: C.gray }}>COM ACESSO A GOSTO MINEIRO</div>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => <span key={c} className="flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs" style={{ borderColor: C.border, color: C.navy }}>{c} <X size={12} color={C.red} /></span>)}
        </div>
      </div>
      {modal && (
        <Modal title="Novo projeto / cliente" onClose={() => setModal(false)}>
          <LabeledInput label="NOME DO PROJETO" ph="Ex: Nova Indústria" />
          <LabeledInput label="CLIENTE" ph="Razão social do cliente" />
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>REGIÃO</div><select className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}><option>Sudeste</option><option>Sul</option><option>Nordeste</option><option>Centro-Oeste</option><option>Norte</option></select></div>
            <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>UF</div><select className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}><option>SP</option><option>MG</option><option>RJ</option></select></div>
          </div>
          <LabeledInput label="CIDADE" ph="Cidade" />
          <div className="mt-2"><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>ESTADO DO PROJETO</div>
            <div className="flex gap-2"><button className="rounded-md px-4 py-1.5 text-sm font-bold text-white" style={{ background: C.orange }}>Ativo</button><button className="border rounded-md px-4 py-1.5 text-sm font-semibold" style={{ borderColor: C.border, color: C.navy }}>Não iniciado</button></div></div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setModal(false)} className="rounded-md px-4 py-2 text-sm font-bold text-white" style={{ background: C.orange }}>Criar projeto</button>
            <button onClick={() => setModal(false)} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================ MODAIS ============================ */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#05244f66" }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold text-lg" style={{ color: C.navy }}>{title}</div>
          <button onClick={onClose} className="w-7 h-7 rounded-md border flex items-center justify-center" style={{ borderColor: C.border }}><X size={14} color={C.gray} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function LabeledInput({ label, ph, defaultValue }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>{label}</div>
      <input placeholder={ph} defaultValue={defaultValue} className="border rounded-md px-3 py-2 text-sm w-full" style={{ borderColor: C.border }} />
    </div>
  );
}
function ProjectPicker({ onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#05244f66" }}>
      <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold text-lg" style={{ color: C.navy }}>Selecionar projeto</div>
          <button onClick={onClose} className="w-7 h-7 rounded-md border flex items-center justify-center" style={{ borderColor: C.border }}><X size={14} color={C.gray} /></button>
        </div>
        <div className="space-y-3">
          {PROJECTS.filter((p) => p.status === "Ativo").map((p) => (
            <button key={p.id} onClick={() => onPick(p)} className="w-full border rounded-lg p-3 text-left hover:shadow-md transition-shadow" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2.5 mb-1"><ProjIcon p={p} size={26} /><span className="font-bold" style={{ color: C.navy }}>{p.name}</span></div>
              <div className="text-[11px] mb-1" style={{ color: C.gray }}>{p.region} · {p.uf}</div>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#dcfce7", color: C.green }}>Ativo</span>
              <span className="text-xs ml-2" style={{ color: C.gray }}>{p.pct}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ LOGIN ============================ */
function Login({ onLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "radial-gradient(circle at 30% 20%, #0d2f63, #05122b)" }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center mb-4" style={{ borderColor: C.orange, background: C.navy }}>
          <ChevronRight size={22} color={C.orange} />
        </div>
        <div className="font-extrabold text-3xl tracking-tight" style={{ color: C.navy }}>pwr<span style={{ color: C.orange }}>.</span></div>
        <div className="text-[10px] tracking-[0.25em] mb-6" style={{ color: C.blue }}>PORTFOLIO · PAINEL CENTRAL</div>
        <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>E-MAIL</div>
        <input placeholder="voce@empresa.com" className="border rounded-md px-3 py-2.5 text-sm w-full mb-4" style={{ borderColor: C.border }} />
        <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>SENHA</div>
        <input type="password" defaultValue="demo1234" className="border rounded-md px-3 py-2.5 text-sm w-full mb-4" style={{ borderColor: C.border }} />
        <button onClick={() => onLogin("admin")} className="w-full rounded-md py-2.5 text-sm font-bold text-white mb-5" style={{ background: C.orange }}>Entrar</button>
        <div className="text-[11px] font-semibold mb-2" style={{ color: C.blue }}>Entrar como (demo):</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onLogin("admin")} className="border rounded-md py-2 text-sm font-bold" style={{ borderColor: C.border, color: C.navy }}>Admin PWR</button>
          <button onClick={() => onLogin("consultor")} className="border rounded-md py-2 text-sm font-bold" style={{ borderColor: C.border, color: C.navy }}>Consultor</button>
          <button onClick={() => onLogin("cliente")} className="border rounded-md py-2 text-sm font-bold col-span-2" style={{ borderColor: C.border, color: C.navy }}>Cliente</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ APP ============================ */
export default function App() {
  const [logged, setLogged] = useState(false);
  const [role, setRole] = useState("admin");
  const [page, setPage] = useState("portfolio");
  const [project, setProject] = useState(PROJ("gosto"));
  const [picker, setPicker] = useState(false);
  const [ataFilled, setAtaFilled] = useState(false);
  const [ataAdded, setAtaAdded] = useState(false);

  const login = (r) => { setLogged(true); setRole(r); setPage(r === "admin" ? "portfolio" : "dashboard"); if (r !== "admin") setProject(PROJ(r === "cliente" ? "gosto" : "metalica")); };

  const changeRole = (r) => {
    setRole(r);
    const pages = ROLE_PAGES[r];
    if (!pages.includes(page)) setPage(r === "admin" ? "portfolio" : "dashboard");
    if (r === "consultor" && project.id === "gosto") setProject(PROJ("metalica"));
  };

  const openProject = (p) => { setProject(p); setPage("dashboard"); };

  // ações do projeto atual (Gosto Mineiro tem lista real; demais são sintéticas)
  const actions = useMemo(() => {
    if (project.id === "gosto") return ataAdded ? [...GOSTO_ACOES, ...GOSTO_ATA_EXTRA] : GOSTO_ACOES;
    if (project.status === "Não iniciado") return [];
    return genActions(project);
  }, [project, ataAdded]);

  const dashData = useMemo(() => buildDashboard(actions), [actions]);

  if (!logged) return <Login onLogin={login} />;

  const render = () => {
    switch (page) {
      case "portfolio": return <Portfolio openProject={openProject} />;
      case "mapa": return <MapaBrasil openProject={openProject} />;
      case "dashboard": return <Dashboard data={dashData} />;
      case "gantt": return <Gantt project={project} />;
      case "acoes": return <BaseAcoes project={project} actions={actions} />;
      case "kanban": return <Kanban />;
      case "followup": return <FollowUp project={project} />;
      case "ata": return <EmissaoAta project={project} filled={ataFilled} onFill={() => { setAtaFilled(true); setAtaAdded(true); }} />;
      case "responsaveis": return <Responsaveis project={project} />;
      case "documentos": return <Documentos project={project} />;
      case "solicitacoes": return <Solicitacoes />;
      case "administracao": return <Administracao />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen text-[15px]" style={{ background: C.page, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <Sidebar role={role} page={page} setPage={setPage} project={project} ataAdded={ataAdded} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar role={role} setRole={changeRole} page={page} project={project} openProjectPicker={() => setPicker(true)} onLogout={() => setLogged(false)} />
        <main className="flex-1 overflow-y-auto p-6">{render()}</main>
      </div>
      {picker && <ProjectPicker onPick={(p) => { setProject(p); setPicker(false); }} onClose={() => setPicker(false)} />}
    </div>
  );
}

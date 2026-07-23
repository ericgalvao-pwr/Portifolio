import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, ScatterChart, Scatter, ReferenceLine, Cell, LabelList,
} from "recharts";
import {
  LayoutGrid, Map, BarChart3, AlignLeft, ListChecks, Columns3, FileText,
  PenLine, Users, File as FileIcon, MessageSquare, Settings, ChevronRight,
  ChevronDown, X, Plus, Download, Upload, LogOut, Menu, Sparkles, ExternalLink,
  Eye, EyeOff, KeyRound,
} from "lucide-react";
import { hasSupabase, supabase } from "./lib/supabase";
import * as api from "./lib/api";
import brazil from "@svg-maps/brazil";

/* ============================ TOKENS DE MARCA ============================ */
const C = {
  orange: "#FF5B00", navy: "#05244F", navyMed: "#273A76", blue: "#3C58B4",
  sidebar: "#071a3a", page: "#f3f5f8", border: "#e6eaf0",
  green: "#16a34a", amber: "#f59e0b", red: "#dc2626", gray: "#94a3b8",
};
const STATUS = {
  Finalizada: { c: C.green, label: "Finalizada" },
  "Em Andamento": { c: C.amber, label: "Em Andamento" },
  Atrasada: { c: C.red, label: "Atrasada" },
  Aberta: { c: C.gray, label: "Aberta" },
};
const PHASES = ["Diagnóstico", "Estruturação", "Implantação", "Estabilização", "Governança"];
const ORIGINS = ["Ata", "Visita", "Auditoria", "Reunião", "Balanço"];

/* ============================ DADOS MOCK (fallback) ============================ */
const PROJECTS = [
  { id: "gosto", name: "Gosto Mineiro", client: "Gosto Mineiro", city: "", uf: "CE", region: "Nordeste", color: C.orange, letter: "G", status: "Ativo", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [] },
  { id: "iseletrica", name: "Iselétrica", client: "Iselétrica", city: "", uf: "CE", region: "Nordeste", color: C.navy, letter: "I", status: "Ativo", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [] },
  { id: "matmed", name: "Matmed", client: "Matmed", city: "", uf: "CE", region: "Nordeste", color: C.navyMed, letter: "M", status: "Ativo", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [] },
  { id: "condogroup", name: "Condogroup", client: "Condogroup", city: "", uf: "CE", region: "Nordeste", color: C.blue, letter: "C", status: "Ativo", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [] },
  { id: "anaju", name: "Anaju", client: "Anaju", city: "", uf: "CE", region: "Nordeste", color: C.orange, letter: "A", status: "Ativo", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [] },
  { id: "metalica", name: "Metálica", client: "Metálica", city: "", uf: "CE", region: "Nordeste", color: C.navy, letter: "M", status: "Ativo", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [] },
  { id: "estacao7", name: "Estação 7", client: "Estação 7", city: "", uf: "CE", region: "Nordeste", color: C.navyMed, letter: "E", status: "Ativo", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [] },
  { id: "tubonord", name: "Tubonord", client: "Tubonord", city: "", uf: "PE", region: "Nordeste", color: C.blue, letter: "T", status: "Ativo", acoes: 0, pct: 0, atras: 0, emAnd: 0, portfolios: [] },
];
const PROJ = (id, list = PROJECTS) => list.find((p) => p.id === id) || PROJECTS.find((p) => p.id === id);

const RESPONSAVEIS = [];

const GOSTO_ACOES = [];

const DOCS = [];
const SOLICITACOES = [];
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
const GOSTO_ATA_EXTRA = [
  { id: "GOS-18", acao: ATA_EXAMPLE.encaminhamentos[0][0], fase: "Implantação", origem: "Ata", resp: "Marina Lopes", ab: "17/07/26", fp: "30/07/26", fr: "–", st: "Aberta" },
  { id: "GOS-19", acao: ATA_EXAMPLE.encaminhamentos[1][0], fase: "Estruturação", origem: "Ata", resp: "Ana Prado", ab: "17/07/26", fp: "25/07/26", fr: "–", st: "Aberta" },
  { id: "GOS-20", acao: ATA_EXAMPLE.encaminhamentos[2][0], fase: "Implantação", origem: "Ata", resp: "Carlos Nunes", ab: "17/07/26", fp: "–", fr: "–", st: "Aberta" },
];

function genActions(p) {
  const fin = Math.round((p.acoes * p.pct) / 100);
  const atras = p.atras, emAnd = p.emAnd;
  const aberta = Math.max(0, p.acoes - fin - atras - emAnd);
  const pool = RESPONSAVEIS.map((r) => r.nome);
  const arr = [];
  const push = (n, st) => { for (let i = 0; i < n; i++) arr.push({ fase: PHASES[arr.length % PHASES.length], resp: pool[arr.length % pool.length], st, id: "", acao: "", origem: "Ata", ab: "–", fp: "–", fr: "–" }); };
  push(fin, "Finalizada"); push(atras, "Atrasada"); push(emAnd, "Em Andamento"); push(aberta, "Aberta");
  return arr;
}

function buildDashboard(actions) {
  const k = { total: actions.length, Finalizada: 0, "Em Andamento": 0, Atrasada: 0, Aberta: 0 };
  actions.forEach((a) => { k[effStatus(a)]++; });
  const pct = k.total ? Math.round((k.Finalizada / k.total) * 100) : 0;

  const atrasoBy = {};
  actions.filter((a) => effStatus(a) === "Atrasada").forEach((a) => { atrasoBy[a.resp] = (atrasoBy[a.resp] || 0) + 1; });
  const paretoRaw = Object.entries(atrasoBy).sort((a, b) => b[1] - a[1]).map(([resp, n]) => ({ resp: (resp || "—").split(" ")[0], n }));
  const tot = paretoRaw.reduce((s, x) => s + x.n, 0) || 1;
  let acc = 0;
  const pareto = paretoRaw.map((x) => { acc += x.n; return { ...x, cum: Math.round((acc / tot) * 100) }; });

  const byPhase = PHASES.map((fase) => {
    const o = { fase, Finalizada: 0, "Em Andamento": 0, Atrasada: 0, Aberta: 0 };
    actions.filter((a) => a.fase === fase).forEach((a) => o[effStatus(a)]++);
    return o;
  });

  const names = [...new Set(actions.map((a) => a.resp).filter(Boolean))];
  const byResp = names.map((resp) => {
    const o = { resp: resp.split(" ")[0], Finalizada: 0, "Em Andamento": 0, Atrasada: 0, Aberta: 0 };
    actions.filter((a) => a.resp === resp).forEach((a) => o[effStatus(a)]++);
    return o;
  });

  // alertas: ações vencidas ou a vencer nos próximos 7 dias (não finalizadas)
  const pd = (s) => { if (!s || s === "–") return null; const [d, m, y] = s.split("/").map(Number); return new Date(y < 100 ? 2000 + y : y, m - 1, d); };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const semana = new Date(hoje); semana.setDate(semana.getDate() + 7);
  const vencidas = [], aVencer = [];
  actions.forEach((a) => {
    if (a.st === "Finalizada") return;
    const d = pd(a.fp);
    if (!d) return;
    if (d < hoje) vencidas.push(a);
    else if (d <= semana) aVencer.push(a);
  });

  const execByPhase = { "Diagnóstico": 50, "Estruturação": 50, "Implantação": 57, "Estabilização": 50, "Governança": 0 };
  const elapsedByPhase = { "Diagnóstico": 96, "Estruturação": 92, "Implantação": 90, "Estabilização": 86, "Governança": 42 };
  const heat = PHASES.filter((f) => { const b = byPhase.find((x) => x.fase === f); return b.Finalizada + b.Atrasada + b["Em Andamento"] + b.Aberta > 0; })
    .map((f) => {
      const x = elapsedByPhase[f], y = execByPhase[f];
      const color = y >= x - 3 ? C.green : y >= x - 18 ? C.amber : C.red;
      return { fase: f, x, y, color, label: `${f} ${y}%` };
    });

  return { kpis: { total: k.total, fin: k.Finalizada, emAnd: k["Em Andamento"], atras: k.Atrasada, aberta: k.Aberta, pct }, pareto, byPhase, byResp, heat, alerts: { vencidas, aVencer } };
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

/* ============================ MENU POR PAPEL ============================ */
const NAV = [
  { id: "portfolio", label: "Portfólio", icon: LayoutGrid, level: "portfolio" },
  { id: "mapa", label: "Mapa Brasil", icon: Map, level: "portfolio" },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, level: "project" },
  { id: "gantt", label: "Fases & Gantt", icon: AlignLeft, level: "project" },
  { id: "acoes", label: "Base de Ações", icon: ListChecks, level: "project", badge: "acoes" },
  { id: "kanban", label: "Kanban", icon: Columns3, level: "project" },
  { id: "followup", label: "Follow-Up", icon: FileText, level: "project" },
  { id: "ata", label: "Emissão de ATA", icon: PenLine, level: "project" },
  { id: "responsaveis", label: "Responsáveis", icon: Users, level: "project" },
  { id: "documentos", label: "Documentos", icon: FileIcon, level: "project" },
  { id: "solicitacoes", label: "Solicitações", icon: MessageSquare, level: "portfolio", badge: "solic" },
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
    className="rounded-md flex items-center justify-center text-white font-bold shrink-0">
    <span style={{ fontSize: size * 0.5 }}>{p.letter}</span></div>
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
  <span className="inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-medium" style={{ borderColor: C.border, color: C.navyMed }}>{o}</span>
);
const StatCard = ({ value, label, accent }) => (
  <div className="bg-white rounded-lg border px-4 py-3 flex-1 min-w-[120px] relative overflow-hidden" style={{ borderColor: C.border }}>
    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent }} />
    <div className="text-2xl font-extrabold" style={{ color: C.navy }}>{value}</div>
    <div className="text-[11px] font-semibold tracking-wide mt-0.5" style={{ color: C.gray }}>{label}</div>
  </div>
);
function AlertPanel({ color, title, items, empty }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: C.border }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="font-bold text-sm" style={{ color: C.navy }}>{title}</span>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color, color: "#fff" }}>{items.length}</span>
      </div>
      <div className="p-2">
        {items.length === 0 ? (
          <div className="text-xs px-2 py-3" style={{ color: C.gray }}>{empty}</div>
        ) : (
          items.slice(0, 6).map((a, i) => (
            <div key={a.id || i} className="flex items-center gap-2 px-2 py-1.5 text-[13px] border-b last:border-b-0" style={{ borderColor: C.border }}>
              <span className="font-semibold shrink-0" style={{ color: C.blue }}>{a.id || "—"}</span>
              <span className="flex-1 truncate" style={{ color: C.navy }}>{a.acao || "—"}</span>
              <span className="shrink-0 hidden sm:inline" style={{ color: C.gray }}>{(a.resp || "").split(" ")[0]}</span>
              <span className="font-semibold shrink-0" style={{ color }}>{a.fp}</span>
            </div>
          ))
        )}
        {items.length > 6 && <div className="text-[11px] px-2 pt-1.5" style={{ color: C.gray }}>+{items.length - 6} outras</div>}
      </div>
    </div>
  );
}

/* ============================ SIDEBAR ============================ */
function Sidebar({ role, page, setPage, acoesCount, solicCount, collapsed }) {
  const pages = ROLE_PAGES[role];
  const items = NAV.filter((n) => pages.includes(n.id));
  return (
    <aside className="shrink-0 flex flex-col text-white transition-all duration-200" style={{ background: C.sidebar, width: collapsed ? 64 : 224 }}>
      <div className={`py-4 flex items-center border-b ${collapsed ? "px-0 justify-center" : "px-5"}`} style={{ borderColor: "#ffffff14" }}>
        {collapsed ? (
          <img src="/logo-mark.svg" alt="PWR" style={{ width: 30, height: 30 }} />
        ) : (
          <img src="/logo-branco.svg" alt="PWR Gestão" style={{ height: 30 }} />
        )}
      </div>
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {items.map((n) => {
          const active = page === n.id;
          const Ico = n.icon;
          return (
            <button key={n.id} onClick={() => setPage(n.id)} title={collapsed ? n.label : undefined}
              className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors ${collapsed ? "px-0 justify-center" : "px-5"}`}
              style={{ background: active ? C.orange : "transparent", color: active ? "#fff" : "#c7d2e6", fontWeight: active ? 700 : 500 }}>
              <Ico size={18} className="shrink-0" />
              {!collapsed && <span className="flex-1 text-left">{n.label}</span>}
              {!collapsed && n.badge === "acoes" && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: active ? "#ffffff33" : "#ffffff1a", color: "#fff" }}>{acoesCount}</span>}
              {!collapsed && n.badge === "solic" && solicCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: active ? "#ffffff33" : "#ffffff1a", color: "#fff" }}>{solicCount}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ============================ TOPBAR ============================ */
function DbBadge({ status }) {
  const map = {
    checking: [C.gray, "Verificando banco…"],
    online: [C.green, "Banco conectado"],
    demo: [C.gray, "Modo demo"],
    error: [C.red, "Banco com erro"],
  };
  const [c, label] = map[status] || map.demo;
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ borderColor: C.border, color: c }}>
      <span className="w-2 h-2 rounded-full" style={{ background: c }} />{label}
    </span>
  );
}

function ScopePicker({ projetos, scopeIds, onChange }) {
  const [open, setOpen] = useState(false);
  const ativos = projetos.filter((p) => p.status === "Ativo");
  const allIds = ativos.map((p) => p.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => scopeIds.includes(id));
  const toggle = (id) => {
    const set = new Set(scopeIds);
    set.has(id) ? set.delete(id) : set.add(id);
    const next = allIds.filter((x) => set.has(x));
    if (next.length) onChange(next);
  };
  const toggleAll = () => onChange(allSelected ? [allIds[0]] : allIds);
  const single = scopeIds.length === 1 ? projetos.find((p) => p.id === scopeIds[0]) : null;
  const label = allSelected ? "Todos os projetos" : single ? single.name : `${scopeIds.length} projetos`;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm font-bold" style={{ borderColor: C.border, color: C.navy }}>
        {single && <ProjIcon p={single} size={20} />} {label} <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg border shadow-xl z-50 py-2 max-h-80 overflow-y-auto" style={{ borderColor: C.border }}>
            <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 font-bold" style={{ color: C.navy }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} /> Todos os projetos
            </label>
            <div className="border-t my-1" style={{ borderColor: C.border }} />
            {ativos.map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50" style={{ color: C.navy }}>
                <input type="checkbox" checked={scopeIds.includes(p.id)} onChange={() => toggle(p.id)} />
                <ProjIcon p={p} size={18} /> <span className="text-sm">{p.name}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TopBar({ role, setRole, page, projetos, scopeIds, onScopeChange, onLogout, dbStatus, canSwitchRole, onToggleSidebar, onChangePw }) {
  const isProjectLevel = NAV.find((n) => n.id === page)?.level === "project";
  const title = NAV.find((n) => n.id === page)?.label || "";
  const single = scopeIds.length === 1 ? projetos.find((p) => p.id === scopeIds[0]) : null;
  const crumbProj = !isProjectLevel ? "PWR Gestão" : (single ? single.name : `${scopeIds.length} projetos`);
  return (
    <header className="h-16 bg-white border-b flex items-center px-5 gap-4 shrink-0" style={{ borderColor: C.border }}>
      <button onClick={onToggleSidebar} className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-100 transition-colors" title="Recolher/expandir menu">
        <Menu size={20} color={C.navyMed} />
      </button>
      <div className="leading-tight">
        <div className="text-[11px]" style={{ color: C.gray }}>{crumbProj} · {ROLE_LABEL[role]}</div>
        <div className="text-lg font-extrabold" style={{ color: C.navy }}>{title}</div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <DbBadge status={dbStatus} />
        {isProjectLevel && role !== "cliente" && (
          <ScopePicker projetos={projetos} scopeIds={scopeIds} onChange={onScopeChange} />
        )}
        {canSwitchRole ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold hidden md:inline" style={{ color: C.gray }}>PAPEL</span>
            <div className="relative">
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="appearance-none border rounded-md pl-3 pr-8 py-1.5 text-sm font-bold bg-white cursor-pointer" style={{ borderColor: C.border, color: C.navy }}>
                <option value="admin">Admin PWR</option>
                <option value="consultor">Consultor</option>
                <option value="cliente">Cliente</option>
              </select>
              <ChevronDown size={14} color={C.gray} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        ) : (
          <span className="text-sm font-bold px-3 py-1.5 rounded-md" style={{ background: "#eef1f6", color: C.navy }}>{ROLE_LABEL[role]}</span>
        )}
        {hasSupabase && (
          <button onClick={onChangePw} className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: C.border }} title="Alterar minha senha">
            <KeyRound size={14} color={C.gray} />
          </button>
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

function Portfolio({ projetos, openProject }) {
  const ativos = projetos.filter((p) => p.status === "Ativo").length;
  const totacoes = projetos.reduce((s, p) => s + (p.acoes || 0), 0);
  const totfin = projetos.reduce((s, p) => s + Math.round((p.acoes * p.pct) / 100), 0);
  const totatras = projetos.reduce((s, p) => s + (p.atras || 0), 0);
  const media = ativos ? Math.round(projetos.filter((p) => p.status === "Ativo").reduce((s, p) => s + p.pct, 0) / ativos) : 0;
  return (
    <div>
      <PageHeader title="Portfólio PWR" subtitle={`${projetos.length} projetos de consultoria · ${ativos} ativos`} />
      <div className="flex gap-3 flex-wrap mb-5">
        <StatCard value={projetos.length} label="PROJETOS" accent={C.navy} />
        <StatCard value={ativos} label="ATIVOS" accent={C.navy} />
        <StatCard value={totacoes} label="AÇÕES" accent={C.navy} />
        <StatCard value={totfin} label="FINALIZADAS" accent={C.green} />
        <StatCard value={totatras} label="ATRASADAS" accent={C.red} />
        <StatCard value={`${media}%`} label="CONCLUÍDO" accent={C.orange} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {projetos.map((p) => {
          const fin = Math.round((p.acoes * p.pct) / 100);
          return (
            <button key={p.id} onClick={() => openProject(p)} className="bg-white rounded-lg border p-4 text-left hover:shadow-md transition-shadow" style={{ borderColor: C.border }}>
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
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#dcfce7", color: C.green }}>{fin} fin.</span>
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#fee2e2", color: C.red }}>{p.atras} atras.</span>
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "#fef3c7", color: "#b45309" }}>{p.emAnd} and.</span>
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

function MapaBrasil({ projetos, openProject }) {
  const [hover, setHover] = useState(null);
  const byUf = {};
  projetos.forEach((p) => { const k = (p.uf || "").toLowerCase(); byUf[k] = (byUf[k] || 0) + 1; });
  const regions = ["Nordeste", "Sudeste", "Sul", "Centro-Oeste", "Norte"]
    .map((r) => [r, projetos.filter((p) => p.region === r)]).filter(([, l]) => l.length);
  const estados = projetos.length;
  return (
    <div>
      <PageHeader title="Mapa de Projetos" subtitle="Distribuição geográfica dos projetos pelo Brasil" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div className="bg-white rounded-lg border p-4 relative" style={{ borderColor: C.border }}>
          <svg viewBox={brazil.viewBox} className="w-full" style={{ maxHeight: 520 }} role="img" aria-label="Mapa do Brasil">
            {brazil.locations.map((loc) => {
              const n = byUf[loc.id] || 0;
              const active = n > 0;
              const hovered = hover && hover.id === loc.id;
              return (
                <path key={loc.id} d={loc.path}
                  fill={active ? C.orange : "#e5e9f0"} fillOpacity={hovered ? 0.85 : 1}
                  stroke="#ffffff" strokeWidth={0.8}
                  style={{ cursor: active ? "pointer" : "default", transition: "fill-opacity .15s" }}
                  onMouseEnter={() => setHover({ id: loc.id, name: loc.name, n })}
                  onMouseLeave={() => setHover(null)} />
              );
            })}
          </svg>
          {hover && (
            <div className="absolute top-4 right-4 bg-white border rounded-md px-3 py-2 shadow-sm text-sm" style={{ borderColor: C.border }}>
              <span className="font-bold" style={{ color: C.navy }}>{hover.name}</span>
              <span className="ml-2" style={{ color: hover.n ? C.orange : C.gray }}>{hover.n ? `${hover.n} projeto(s)` : "sem projetos"}</span>
            </div>
          )}
          <div className="flex gap-5 justify-center mt-3 text-xs" style={{ color: C.gray }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded" style={{ background: C.orange }} /> Com projetos</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded" style={{ background: "#e5e9f0" }} /> Sem projetos</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
          <div className="font-bold" style={{ color: C.navy }}>Por região</div>
          <p className="text-xs mb-4" style={{ color: C.gray }}>{estados} projeto(s) · clique para abrir</p>
          {regions.length === 0 && <div className="text-sm" style={{ color: C.gray }}>Nenhum projeto cadastrado ainda.</div>}
          {regions.map(([name, list]) => (
            <div key={name} className="mb-4">
              <div className="text-sm font-bold mb-2" style={{ color: C.navy }}>{name}<span className="font-normal ml-1 text-xs" style={{ color: C.gray }}>{list.length} proj.</span></div>
              <div className="flex flex-wrap gap-2">
                {list.map((p) => (
                  <button key={p.id} onClick={() => openProject(p)} className="flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" style={{ borderColor: C.border, color: C.navy }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.name} <span style={{ color: C.gray }}>{p.uf}</span>
                  </button>
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
  const { kpis, pareto, byPhase, byResp, heat, alerts } = data;
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
            <select className="border rounded-md px-3 py-1.5 text-sm bg-white" style={{ borderColor: C.border, color: C.navy }}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <AlertPanel color={C.red} title="Ações vencidas" items={alerts.vencidas} empty="Nenhuma ação vencida 🎉" />
        <AlertPanel color={C.amber} title="A vencer esta semana" items={alerts.aVencer} empty="Nada vencendo nos próximos 7 dias" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Pareto de atrasos por responsável" sub="Barras = ações atrasadas · linha = % acumulado">
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
        <Panel title="Mapa de Calor por fase" sub="X = % do prazo decorrido · Y = % executado">
          <div className="relative" style={{ height: 260 }}>
            <div className="absolute inset-0 rounded" style={{ margin: "10px 10px 30px 40px", background: "linear-gradient(135deg,#dcfce7 0%,#fef9c3 50%,#fee2e2 100%)" }} />
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis type="number" dataKey="x" domain={[0, 100]} tick={{ fontSize: 10, fill: C.gray }} label={{ value: "% do prazo decorrido →", position: "insideBottom", offset: -8, fontSize: 10, fill: C.gray }} />
                <YAxis type="number" dataKey="y" domain={[0, 100]} tick={{ fontSize: 10, fill: C.gray }} width={30} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#334155" strokeDasharray="5 4" />
                <Scatter data={heat}>
                  {heat.map((h, i) => <Cell key={i} fill={h.color} />)}
                  <LabelList dataKey="label" position="left" style={{ fontSize: 9, fill: C.navy, fontWeight: 600 }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-1" style={{ color: C.gray }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.green }} />Adiantado</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.amber }} />No limite</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.red }} />Atrasado</span>
          </div>
        </Panel>
        <Panel title="Ações por responsável" sub="Empilhado por status">
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

function BaseAcoes({ project, actions, responsaveis, onCreate, onUpdate, onImport, multi }) {
  const [f, setF] = useState({ fase: "Todas", resp: "Todas", st: "Todos", origem: "Todas" });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const vazio = { descricao: "", fase: "Diagnóstico", origem: "Ata", resp: "", ab: "", fp: "", fr: "", st: "Aberta" };
  const [form, setForm] = useState(vazio);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const resps = [...new Set(actions.map((a) => a.resp).filter(Boolean))];
  const origens = [...new Set(actions.map((a) => a.origem).filter(Boolean))];
  const filtered = actions.filter((a) =>
    (f.fase === "Todas" || a.fase === f.fase) && (f.resp === "Todas" || a.resp === f.resp) &&
    (f.st === "Todos" || effStatus(a) === f.st) && (f.origem === "Todas" || a.origem === f.origem));

  const abrirNova = () => { setEditing(null); setForm(vazio); setModal(true); };
  const abrirEdicao = (a) => {
    setEditing(a);
    setForm({ descricao: a.acao, fase: a.fase || "Diagnóstico", origem: a.origem || "Ata", resp: a.resp || "", ab: asISO(a.ab) || "", fp: asISO(a.fp) || "", fr: asISO(a.fr) || "", st: a.st || "Aberta" });
    setModal(true);
  };

  const exportar = () => {
    const headers = ["ACAO", "FASE", "ORIGEM", "RESPONSAVEL", "ABERTURA", "FECHO_PLANEJADO", "STATUS"];
    const linhas = filtered.map((a) => [a.acao, a.fase, a.origem, a.resp, a.ab, a.fp, a.st]);
    const csv = [headers, ...linhas].map((r) => r.map(csvCell).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `acoes-${project.id}.csv`; link.click();
    URL.revokeObjectURL(url);
  };
  const importar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const rows = parseAcoesCSV(String(reader.result)); if (rows.length) onImport(rows); else alert("Nenhuma linha reconhecida no arquivo."); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const salvar = async () => {
    if (!form.descricao.trim()) return;
    setSaving(true);
    if (editing) await onUpdate(editing.id, form); else await onCreate(form);
    setSaving(false); setModal(false); setEditing(null); setForm(vazio);
  };
  const Sel = ({ k, label, opts }) => (
    <div>
      <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>{label}</div>
      <select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="border rounded-md px-3 py-1.5 text-sm bg-white" style={{ borderColor: C.border, color: C.navy }}>
        {opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
  const inp = "border rounded-md px-3 py-2 text-sm w-full";
  return (
    <div>
      <PageHeader title={`Base de Ações — ${multi ? "vários projetos" : project.name}`} subtitle={`${filtered.length} de ${actions.length} ações`}
        right={
          <div className="flex gap-2">
            <button onClick={exportar} className="border rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5" style={{ borderColor: C.border, color: C.navy }}><Download size={14} /> Exportar CSV</button>
            {!multi && <>
              <button onClick={() => fileRef.current?.click()} className="border rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5" style={{ borderColor: C.border, color: C.navy }}><Upload size={14} /> Importar GSB</button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={importar} className="hidden" />
              <button onClick={abrirNova} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Nova ação</button>
            </>}
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
              {[...(multi ? ["PROJETO"] : []), "ID", "AÇÃO", "FASE", "ORIGEM", "RESPONSÁVEL", "ABERTURA", "FECH. PLAN.", "FECH. REAL", "STATUS", ...(!multi ? [""] : [])].map((h, i) => <th key={h || `x${i}`} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={a.id || i} className="border-t" style={{ borderColor: C.border }}>
                {multi && <td className="px-4 py-3 font-semibold" style={{ color: C.navyMed }}>{a.projName || "—"}</td>}
                <td className="px-4 py-3 font-semibold" style={{ color: C.blue }}>{a.id || "—"}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: C.navy }}>{a.acao || "—"}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{a.fase}</td>
                <td className="px-4 py-3">{a.origem ? <OriginPill o={a.origem} /> : null}</td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{a.resp || "—"}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{a.ab}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{a.fp}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{a.fr}</td>
                <td className="px-4 py-3"><StatusBadge st={effStatus(a)} /></td>
                {!multi && <td className="px-4 py-3"><button onClick={() => abrirEdicao(a)} className="border rounded px-2.5 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Editar</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editing ? `Editar ${editing.id}` : `Nova ação — ${project.name}`} onClose={() => { setModal(false); setEditing(null); }}>
          <div className="mb-3"><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>AÇÃO</div>
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva a ação" className={inp} style={{ borderColor: C.border }} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>FASE</div>
              <select value={form.fase} onChange={(e) => setForm({ ...form, fase: e.target.value })} className={`${inp} bg-white`} style={{ borderColor: C.border }}>{PHASES.map((o) => <option key={o}>{o}</option>)}</select></div>
            <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>ORIGEM</div>
              <select value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} className={`${inp} bg-white`} style={{ borderColor: C.border }}>{ORIGINS.map((o) => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="mt-3"><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>RESPONSÁVEL</div>
            <select value={form.resp} onChange={(e) => setForm({ ...form, resp: e.target.value })} className={`${inp} bg-white`} style={{ borderColor: C.border }}>
              <option value="">Selecione</option>{responsaveis.map((r) => <option key={r.email || r.nome}>{r.nome}</option>)}
            </select></div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>ABERTURA</div><input type="date" value={form.ab} onChange={(e) => setForm({ ...form, ab: e.target.value })} className={inp} style={{ borderColor: C.border }} /></div>
            <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>FECH. PLAN.</div><input type="date" value={form.fp} onChange={(e) => setForm({ ...form, fp: e.target.value })} className={inp} style={{ borderColor: C.border }} /></div>
            <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>FECH. REAL</div><input type="date" value={form.fr} onChange={(e) => setForm({ ...form, fr: e.target.value })} className={inp} style={{ borderColor: C.border }} /></div>
          </div>
          <div className="mt-3"><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>STATUS</div>
            <select value={form.st} onChange={(e) => setForm({ ...form, st: e.target.value })} className={`${inp} bg-white`} style={{ borderColor: C.border }}>{Object.keys(STATUS).map((o) => <option key={o}>{o}</option>)}</select></div>
          <div className="flex gap-2 mt-4">
            <button onClick={salvar} disabled={saving} className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{saving ? "Salvando…" : (editing ? "Salvar alterações" : "Salvar ação")}</button>
            <button onClick={() => { setModal(false); setEditing(null); }} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Kanban({ project, actions, multi, onMove }) {
  const cols = ["Aberta", "Em Andamento", "Atrasada", "Finalizada"];
  const [resp, setResp] = useState("Todos");
  const [dragged, setDragged] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const resps = [...new Set(actions.map((a) => a.resp).filter(Boolean))];
  const list = actions.filter((a) => resp === "Todos" || a.resp === resp);
  const grouped = { Aberta: [], "Em Andamento": [], Atrasada: [], Finalizada: [] };
  list.forEach((a) => { const s = effStatus(a); (grouped[s] || grouped.Aberta).push(a); });
  const soltar = (col) => { if (dragged && onMove) onMove(dragged, col); setDragged(null); setOverCol(null); };
  return (
    <div>
      <PageHeader title={`Kanban — ${multi ? "vários projetos" : project.name}`} subtitle="Arraste os cards entre as colunas para mudar o status" />
      <div className="flex gap-3 items-end mb-4 flex-wrap">
        <div>
          <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>RESPONSÁVEL</div>
          <select value={resp} onChange={(e) => setResp(e.target.value)} className="border rounded-md px-3 py-1.5 text-sm bg-white" style={{ borderColor: C.border, color: C.navy }}>
            {["Todos", ...resps].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <button onClick={() => setResp("Todos")} className="border rounded-md px-3 py-1.5 text-sm" style={{ borderColor: C.border, color: C.navyMed }}>Limpar</button>
        <div className="ml-auto text-sm" style={{ color: C.gray }}>{list.length} ações</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cols.map((col) => {
          const s = STATUS[col];
          return (
            <div key={col} onDragOver={(e) => { e.preventDefault(); setOverCol(col); }} onDragLeave={() => setOverCol((c) => c === col ? null : c)} onDrop={() => soltar(col)}
              className="bg-white rounded-lg border p-3 transition-shadow" style={{ borderColor: overCol === col ? s.c : C.border, boxShadow: overCol === col ? `0 0 0 2px ${s.c}33` : "none" }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.c }} />
                <span className="font-bold text-sm" style={{ color: C.navy }}>{col}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#eef1f6", color: C.navyMed }}>{grouped[col].length}</span>
              </div>
              <div className="space-y-2.5 min-h-[40px]">
                {grouped[col].length === 0 && <div className="text-xs px-1 py-2" style={{ color: C.gray }}>—</div>}
                {grouped[col].map((a, i) => (
                  <div key={a.id || i} draggable onDragStart={() => setDragged(a)} onDragEnd={() => { setDragged(null); setOverCol(null); }}
                    className="border rounded-md p-3 border-l-2 cursor-grab active:cursor-grabbing bg-white" style={{ borderColor: C.border, borderLeftColor: s.c }}>
                    <div className="font-semibold text-[13px] mb-2" style={{ color: C.navy }}>{a.acao || "—"}</div>
                    {multi && a.projName && <div className="text-[10px] font-bold mb-1.5" style={{ color: C.orange }}>{a.projName}</div>}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] mb-1.5">
                      {a.id && <span className="font-semibold" style={{ color: C.blue }}>{a.id}</span>}
                      {a.resp && <span style={{ color: C.gray }}>{a.resp}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">{a.origem && <OriginPill o={a.origem} />}{a.fp && a.fp !== "–" && <span style={{ color: C.gray }}>{a.fp}</span>}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FollowUp({ project, actions = [] }) {
  const recent = actions.filter((a) => a.st === "Finalizada").map((a) => [a.acao, a.id]);
  const [notes, setNotes] = useState({ av: "", imp: "", prox: "" });
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lista, setLista] = useState([]);
  const [editId, setEditId] = useState(null);

  const carregar = () => {
    if (!hasSupabase || typeof api.listFollowups !== "function") return;
    api.listFollowups(project.id).then(setLista).catch((e) => console.error("followups:", e.message));
  };
  useEffect(() => { setLista([]); carregar(); /* eslint-disable-next-line */ }, [project.id]);

  const gerar = () => setDraft(
    "Avanço:" + (notes.av ? " " + notes.av : " (descreva o que avançou nesta semana).") +
    "\n\nImpedimentos e pontos de atenção:" + (notes.imp ? " " + notes.imp : " (bloqueios, riscos e dependências).") +
    "\n\nPróximos passos:" + (notes.prox ? " " + notes.prox : " (o que será feito a seguir)."));
  const novo = () => { setEditId(null); setNotes({ av: "", imp: "", prox: "" }); setDraft(""); };
  const abrir = (fu) => {
    setEditId(fu.id);
    setNotes({ av: fu.avanco || "", imp: fu.impedimentos || "", prox: fu.proximos_passos || "" });
    setDraft(fu.texto_final || "");
  };
  const salvar = async () => {
    setSaving(true);
    const payload = { avanco: notes.av, impedimentos: notes.imp, proximos_passos: notes.prox, texto_final: draft };
    try {
      if (hasSupabase) {
        if (editId) await api.updateFollowup(editId, payload);
        else { const row = await api.saveFollowup(project.id, payload); setEditId(row?.id || null); }
        carregar();
      }
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error("salvar followup:", e.message); }
    finally { setSaving(false); }
  };
  const fields = [["AVANÇO", "O que avançou nesta semana...", "av"], ["IMPEDIMENTOS E PONTOS DE ATENÇÃO", "Bloqueios, riscos, dependências...", "imp"], ["PRÓXIMOS PASSOS", "O que será feito a seguir...", "prox"]];
  const fmtData = (iso) => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };
  return (
    <div>
      <PageHeader title={`Follow-Up Semanal — ${project.name}`} subtitle="Registre o avanço da semana e gere um rascunho executivo com IA"
        right={editId ? <button onClick={novo} className="border rounded-md px-3 py-1.5 text-sm font-bold flex items-center gap-1.5" style={{ borderColor: C.border, color: C.navy }}><Plus size={14} /> Novo follow-up</button> : null} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
          <div className="font-bold text-sm" style={{ color: C.navy }}>Ações concluídas recentes</div>
          <div className="text-[11px] mb-3" style={{ color: C.gray }}>Selecione as relacionadas a esta semana</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
            {recent.length === 0 && <span className="text-[13px]" style={{ color: C.gray }}>Nenhuma ação concluída ainda.</span>}
            {recent.map(([t, id]) => (
              <label key={id} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.navyMed }}><input type="checkbox" /> {t}<span className="text-[10px]" style={{ color: C.gray }}>{id}</span></label>
            ))}
          </div>
          <div className="font-bold text-sm mb-1" style={{ color: C.navy }}>{editId ? "Editando follow-up" : "Nota do consultor"}</div>
          <div className="inline-block text-[11px] px-2 py-0.5 rounded mb-3" style={{ background: "#fff1e8", color: C.orange }}>Consultor / Admin</div>
          {fields.map(([label, ph, k]) => (
            <div key={k} className="mb-4">
              <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>{label}</div>
              <textarea value={notes[k]} onChange={(e) => setNotes((n) => ({ ...n, [k]: e.target.value }))} placeholder={ph} rows={2} className="w-full border rounded-md px-3 py-2 text-sm resize-none" style={{ borderColor: C.border }} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-sm" style={{ color: C.navy }}>Rascunho do follow-up</div>
            <button onClick={gerar} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Sparkles size={14} /> Gerar rascunho com IA</button>
          </div>
          <div className="text-[11px] rounded-md px-3 py-2 mb-3" style={{ background: "#fff7f0", color: C.orange }}>Tom: direto, executivo, 1ª pessoa do plural, sem emojis · estrutura: Avanço / Impedimentos e pontos de atenção / Próximos passos</div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} placeholder="O texto gerado aparece aqui e pode ser editado antes de salvar." className="w-full border rounded-md px-3 py-2 text-sm resize-none" style={{ borderColor: C.border }} />
          <div className="flex gap-2 mt-3 items-center">
            <button onClick={salvar} disabled={saving} className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.navy }}>{saving ? "Salvando…" : editId ? "Salvar alterações" : "Salvar no banco"}</button>
            <button className="border rounded-md px-4 py-2 text-sm font-semibold" style={{ borderColor: C.border, color: C.navy }}>Gerar relatório PDF (ISO 9001:2015)</button>
            {saved && <span className="text-sm font-semibold" style={{ color: C.green }}>✓ Salvo</span>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-5 mt-4" style={{ borderColor: C.border }}>
        <div className="font-bold text-sm mb-3" style={{ color: C.navy }}>Follow-ups salvos</div>
        {lista.length === 0 && <span className="text-[13px]" style={{ color: C.gray }}>Nenhum follow-up salvo ainda.</span>}
        <div className="space-y-2">
          {lista.map((fu) => (
            <div key={fu.id} className="flex items-start gap-3 border rounded-md px-3 py-2" style={{ borderColor: editId === fu.id ? C.orange : C.border }}>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold" style={{ color: C.gray }}>{fmtData(fu.created_at)}</div>
                <div className="text-[13px] truncate" style={{ color: C.navy }}>{(fu.texto_final || fu.avanco || "—").slice(0, 120)}</div>
              </div>
              <button onClick={() => abrir(fu)} className="border rounded px-2.5 py-1 text-xs font-semibold shrink-0" style={{ borderColor: C.border, color: C.navy }}>Abrir / editar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmissaoAta({ project, onFill, filled }) {
  const [transcricao, setTranscricao] = useState("");
  const usarExemplo = () => setTranscricao('Ana Prado: Bom dia a todos, vamos iniciar a reunião de acompanhamento.\nCarlos Nunes: A padronização do procedimento de recebimento foi concluída na semana passada.\nMarina Lopes: Ainda temos pendência no treinamento da equipe do turno da noite.\nRafael Dias: Como ponto de atenção, a disponibilidade de dados do ERP ainda está limitada.');
  const SectionHead = ({ children, orange }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-t-md text-white text-xs font-bold" style={{ background: orange ? C.orange : C.navyMed }}>
      {children}<button className="ml-2 text-[11px] px-2 py-0.5 rounded" style={{ background: "#ffffff2e" }}>+ Linha</button>
    </div>
  );
  const inp = "border rounded px-2 py-1 text-sm";
  return (
    <div>
      <PageHeader title={`Emissão de ATA — ${project.name}`} subtitle="A IA preenche a ATA no modelo padrão · encaminhamentos entram na Base de Ações" />
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm" style={{ color: C.navy }}>Transcrição</div>
            <button onClick={usarExemplo} className="border rounded-md px-2 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Usar exemplo</button>
          </div>
          <div className="border border-dashed rounded-md py-5 text-center mb-3" style={{ borderColor: C.border }}>
            <div className="font-bold text-sm" style={{ color: C.navy }}>Subir transcrição</div>
            <div className="text-[11px]" style={{ color: C.gray }}>.txt · .csv · .vtt · .srt</div>
          </div>
          <textarea value={transcricao} onChange={(e) => setTranscricao(e.target.value)} rows={8} placeholder='Cole aqui a transcrição...' className="w-full border rounded-md px-3 py-2 text-sm resize-none mb-3" style={{ borderColor: C.border }} />
          <button onClick={onFill} className="w-full rounded-md py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Preencher ATA automaticamente</button>
        </div>
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
          <div className="font-bold text-sm mb-3" style={{ color: C.navy }}>ATA — modelo padrão</div>
          {!filled ? (
            <div className="border border-dashed rounded-md py-16 text-center text-sm" style={{ borderColor: C.border, color: C.gray }}>
              Cole a transcrição e clique em "Preencher ATA automaticamente" para gerar a ata.
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

function Responsaveis({ project, projetos, responsaveis, actions, onCreate }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", empresa: project.client || "PWR Gestão", papel: "", email: "" });
  const [saving, setSaving] = useState(false);
  const empresas = ["PWR Gestão", ...[...new Set((projetos || []).map((p) => p.client).filter(Boolean))]];
  const countByNome = useMemo(() => {
    const m = {}; actions.forEach((a) => { if (a.resp) m[a.resp] = (m[a.resp] || 0) + 1; }); return m;
  }, [actions]);
  const salvar = async () => {
    if (!form.nome.trim()) return;
    setSaving(true); await onCreate(form); setSaving(false); setModal(false);
    setForm({ nome: "", empresa: project.client || "PWR Gestão", papel: "", email: "" });
  };
  return (
    <div>
      <PageHeader title={`Responsáveis — ${project.name}`} subtitle="Lista de referência que alimenta o campo Responsável das ações"
        right={<button onClick={() => setModal(true)} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Novo responsável</button>} />
      <div className="bg-white rounded-lg border overflow-x-auto" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] font-semibold text-left" style={{ color: C.gray }}>{["NOME", "EMPRESA", "PAPEL / FUNÇÃO", "E-MAIL", "AÇÕES", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {responsaveis.map((r) => (
              <tr key={r.email || r.nome} className="border-t" style={{ borderColor: C.border }}>
                <td className="px-4 py-3 font-bold" style={{ color: C.navy }}>{r.nome}</td>
                <td className="px-4 py-3"><span className="text-xs font-semibold" style={{ color: r.pwr ? C.orange : C.blue }}>{r.empresa}</span></td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{r.papel}</td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{r.email}</td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{countByNome[r.nome] || 0} ações</td>
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
          <LabeledInput label="NOME" ph="Nome completo" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          <div className="mb-3">
            <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>EMPRESA</div>
            <select value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}>
              {empresas.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <LabeledInput label="PAPEL / FUNÇÃO" ph="Ex: Consultor, Gerente..." value={form.papel} onChange={(v) => setForm({ ...form, papel: v })} />
          <LabeledInput label="E-MAIL" ph="pessoa@empresa.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <div className="flex gap-2 mt-4">
            <button onClick={salvar} disabled={saving} className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{saving ? "Salvando…" : "Salvar"}</button>
            <button onClick={() => setModal(false)} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Documentos({ project, documentos, onCreate }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "Relatório", link: "" });
  const [saving, setSaving] = useState(false);
  const pillColor = { Kickoff: C.blue, Proposta: C.navyMed, Relatório: C.orange };
  const salvar = async () => {
    if (!form.nome.trim()) return;
    setSaving(true); await onCreate(form); setSaving(false); setModal(false);
    setForm({ nome: "", tipo: "Relatório", link: "" });
  };
  return (
    <div>
      <PageHeader title={`Documentos — ${project.name}`} subtitle="Kickoff, proposta, relatórios · com link para o Drive"
        right={<button onClick={() => setModal(true)} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Registrar documento</button>} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documentos.map((d, i) => (
          <div key={i} className="bg-white rounded-lg border p-4" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: "#eef1f6", color: pillColor[d.tipo] || C.navyMed }}>{d.tipo}</span>
              <span className="text-[11px]" style={{ color: C.gray }}>{d.data}</span>
            </div>
            <div className="font-bold text-sm mb-2" style={{ color: C.navy }}>{d.nome}</div>
            <a href={d.link} target="_blank" rel="noreferrer" className="text-sm font-semibold flex items-center gap-1" style={{ color: C.blue }}>Abrir no Drive <ExternalLink size={12} /></a>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={`Registrar documento — ${project.name}`} onClose={() => setModal(false)}>
          <LabeledInput label="NOME DO DOCUMENTO" ph="Ex: Relatório mensal" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          <div className="mb-3"><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>TIPO</div>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}><option>Relatório</option><option>Kickoff</option><option>Proposta</option></select></div>
          <LabeledInput label="LINK DO DRIVE" ph="https://drive.google.com/..." value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
          <div className="flex gap-2 mt-4">
            <button onClick={salvar} disabled={saving} className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{saving ? "Salvando…" : "Registrar"}</button>
            <button onClick={() => setModal(false)} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Solicitacoes({ solicitacoes, projetos, onCreate, onUpdate }) {
  const [form, setForm] = useState({ tipo: "Dúvida", descricao: "", projetoId: "" });
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(null); // solicitação em edição
  const [ef, setEf] = useState({ status: "Aberta", data_fechamento: "", observacao: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const tipoColor = { "Correção de dados": C.blue, "Dúvida": C.navyMed, "Novo projeto": C.orange };
  const stInfo = { Aberta: C.red, "Em análise": C.amber, Fechada: C.green };
  const salvar = async () => {
    if (!form.descricao.trim()) return;
    setSaving(true); await onCreate(form); setSaving(false); setForm({ tipo: "Dúvida", descricao: "", projetoId: "" });
  };
  const abrirEdicao = (s) => { setEdit(s); setEf({ status: s.st || "Aberta", data_fechamento: asISO(s.fechamento) || "", observacao: s.obs || "" }); };
  const salvarEdicao = async () => {
    setSavingEdit(true);
    await onUpdate(edit.id, { status: ef.status, data_fechamento: ef.data_fechamento || null, observacao: ef.observacao });
    setSavingEdit(false); setEdit(null);
  };
  const ativos = (projetos || []).filter((p) => p.status === "Ativo");
  return (
    <div>
      <PageHeader title="Solicitações" subtitle="Dúvidas, pedidos de novo projeto ou correção de dados — lista central da PWR" />
      <div className="bg-white rounded-lg border overflow-x-auto mb-4" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] font-semibold text-left" style={{ color: C.gray }}>{["", "DATA", "SOLICITANTE", "TIPO", "PROJETO", "DESCRIÇÃO", "STATUS", "FECHAMENTO", ""].map((h, i) => <th key={h || `x${i}`} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {solicitacoes.map((s, i) => (
              <tr key={s.id || i} className="border-t" style={{ borderColor: C.border }}>
                <td className="px-4 py-3"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: stInfo[s.st] || C.gray }} /></td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{s.data}</td>
                <td className="px-4 py-3" style={{ color: C.blue }}>{s.quem}</td>
                <td className="px-4 py-3"><span className="border rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ borderColor: C.border, color: tipoColor[s.tipo] || C.navyMed }}>{s.tipo}</span></td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{s.proj}</td>
                <td className="px-4 py-3" style={{ color: C.navyMed }}>{s.desc}</td>
                <td className="px-4 py-3"><span className="text-xs font-bold" style={{ color: stInfo[s.st] || C.gray }}>{s.st}</span></td>
                <td className="px-4 py-3" style={{ color: C.gray }}>{s.fechamento && s.fechamento !== "–" ? s.fechamento : "—"}</td>
                <td className="px-4 py-3">{s.id && <button onClick={() => abrirEdicao(s)} className="border rounded px-2.5 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Editar</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-lg border p-5" style={{ borderColor: C.border }}>
        <div className="font-bold text-sm" style={{ color: C.navy }}>Nova solicitação</div>
        <div className="text-[11px] mb-3" style={{ color: C.gray }}>Qualquer usuário pode registrar</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>TIPO</div>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}><option>Dúvida</option><option>Correção de dados</option><option>Novo projeto</option></select></div>
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>PROJETO</div>
            <select value={form.projetoId} onChange={(e) => setForm({ ...form, projetoId: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}>
              <option value="">Sem projeto específico</option>
              {ativos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
        </div>
        <div className="text-[10px] font-semibold mb-1 mt-3" style={{ color: C.gray }}>DESCRIÇÃO</div>
        <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} placeholder="Descreva sua solicitação..." className="w-full border rounded-md px-3 py-2 text-sm resize-none mb-3" style={{ borderColor: C.border }} />
        <button onClick={salvar} disabled={saving} className="w-full rounded-md py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{saving ? "Registrando…" : "Registrar solicitação"}</button>
      </div>
      {edit && (
        <Modal title="Editar solicitação" onClose={() => setEdit(null)}>
          <div className="text-[13px] mb-3" style={{ color: C.navyMed }}>{edit.desc}</div>
          <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>STATUS</div>
          <select value={ef.status} onChange={(e) => setEf({ ...ef, status: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full bg-white mb-3" style={{ borderColor: C.border, color: C.navy }}>
            <option>Aberta</option><option>Em análise</option><option>Fechada</option>
          </select>
          <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>DATA DE FECHAMENTO</div>
          <input type="date" value={ef.data_fechamento} onChange={(e) => setEf({ ...ef, data_fechamento: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full mb-3" style={{ borderColor: C.border }} />
          <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>OBSERVAÇÃO (o que foi feito)</div>
          <textarea value={ef.observacao} onChange={(e) => setEf({ ...ef, observacao: e.target.value })} rows={3} placeholder="Descreva o que foi feito para resolver..." className="w-full border rounded-md px-3 py-2 text-sm resize-none mb-4" style={{ borderColor: C.border }} />
          <div className="flex gap-2">
            <button onClick={salvarEdicao} disabled={savingEdit} className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{savingEdit ? "Salvando…" : "Salvar"}</button>
            <button onClick={() => setEdit(null)} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Administracao({ projetos, onCreateUser, onResetSenha }) {
  const [modal, setModal] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [novo, setNovo] = useState({ nome: "", email: "", senha: "", papel: "cliente", projetoId: projetos[0]?.id || "" });
  const [msg, setMsg] = useState(null); // {tipo:'ok'|'erro', texto}
  const [saving, setSaving] = useState(false);
  const [resetAlvo, setResetAlvo] = useState(null);
  const [resetPw, setResetPw] = useState("");
  const [resetMsg, setResetMsg] = useState(null);
  const [resetting, setResetting] = useState(false);
  const papelLabel = { admin: "Admin", consultor: "Consultor", cliente: "Cliente" };

  const fazerReset = async () => {
    if (resetPw.length < 6) { setResetMsg({ tipo: "erro", texto: "Mínimo de 6 caracteres." }); return; }
    setResetting(true); setResetMsg(null);
    try {
      await onResetSenha({ email: resetAlvo, novaSenha: resetPw });
      setResetMsg({ tipo: "ok", texto: "Senha redefinida com sucesso." });
      setResetPw("");
    } catch (e) {
      setResetMsg({ tipo: "erro", texto: e.message || "Falha ao redefinir." });
    } finally { setResetting(false); }
  };

  const carregarUsuarios = () => {
    if (!hasSupabase || typeof api.listUsuarios !== "function") return;
    api.listUsuarios().then(setUsuarios).catch((e) => console.error("usuarios:", e.message));
  };
  useEffect(() => { carregarUsuarios(); }, []);

  const criar = async () => {
    if (!hasSupabase) { setMsg({ tipo: "erro", texto: "Disponível apenas com o banco conectado." }); return; }
    if (!novo.email || !novo.senha) { setMsg({ tipo: "erro", texto: "Preencha e-mail e senha." }); return; }
    setSaving(true); setMsg(null);
    try {
      await onCreateUser({ email: novo.email.trim(), password: novo.senha, papel: novo.papel, nome: novo.nome, projetoId: novo.projetoId });
      setMsg({ tipo: "ok", texto: `Conta criada para ${novo.email} (${papelLabel[novo.papel]}).` });
      setNovo({ nome: "", email: "", senha: "", papel: "cliente", projetoId: projetos[0]?.id || "" });
      carregarUsuarios();
    } catch (e) {
      setMsg({ tipo: "erro", texto: e.message || "Falha ao criar a conta." });
    } finally { setSaving(false); }
  };
  return (
    <div>
      <PageHeader title="Administração" subtitle="Projetos, clientes e controle de acesso"
        right={<button onClick={() => setModal(true)} className="rounded-md px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ background: C.orange }}><Plus size={14} /> Novo projeto / cliente</button>} />
      <div className="bg-white rounded-lg border overflow-x-auto mb-4" style={{ borderColor: C.border }}>
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] font-semibold text-left" style={{ color: C.gray }}>{["PROJETO", "CLIENTE", "REGIÃO", "PORTFÓLIOS", "STATUS", "AÇÕES", "% CONCL.", "ACESSOS"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {projetos.map((p) => (
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
        <div className="font-bold text-sm" style={{ color: C.navy }}>Criar conta de acesso</div>
        <div className="text-[11px] mb-3" style={{ color: C.gray }}>Crie o usuário, defina o papel e, para cliente, o projeto que ele poderá ver</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_130px_130px] gap-3 items-end">
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>NOME</div><input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome da pessoa" className="border rounded-md px-3 py-2 text-sm w-full" style={{ borderColor: C.border }} /></div>
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>E-MAIL</div><input value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} placeholder="pessoa@empresa.com" className="border rounded-md px-3 py-2 text-sm w-full" style={{ borderColor: C.border }} /></div>
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>SENHA INICIAL</div><input type="text" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} placeholder="mín. 6 caract." className="border rounded-md px-3 py-2 text-sm w-full" style={{ borderColor: C.border }} /></div>
          <div><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>PAPEL</div>
            <select value={novo.papel} onChange={(e) => setNovo({ ...novo, papel: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}>
              <option value="cliente">Cliente</option><option value="consultor">Consultor</option><option value="admin">Admin</option>
            </select></div>
        </div>
        {novo.papel === "cliente" && (
          <div className="mt-3 max-w-md"><div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>PROJETO DO CLIENTE</div>
            <select value={novo.projetoId} onChange={(e) => setNovo({ ...novo, projetoId: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full bg-white" style={{ borderColor: C.border, color: C.navy }}>
              {projetos.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
            </select></div>
        )}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={criar} disabled={saving} className="rounded-md px-5 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.navy }}>{saving ? "Criando…" : "Criar conta"}</button>
          {msg && <span className="text-sm font-semibold" style={{ color: msg.tipo === "ok" ? C.green : C.red }}>{msg.texto}</span>}
        </div>
        <div className="text-[10px] font-semibold mt-5 mb-2" style={{ color: C.gray }}>USUÁRIOS COM ACESSO</div>
        <div className="flex flex-col gap-2">
          {usuarios.length === 0 && <span className="text-xs" style={{ color: C.gray }}>Nenhum usuário carregado.</span>}
          {usuarios.map((u) => (
            <div key={u.email} className="flex items-center gap-3 border rounded-md px-3 py-2" style={{ borderColor: C.border }}>
              <span className="text-sm font-semibold" style={{ color: C.navy }}>{u.nome || u.email}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#eef1f6", color: C.blue }}>{papelLabel[u.papel] || u.papel}</span>
              <span className="text-[11px]" style={{ color: C.gray }}>{u.email}</span>
              <button onClick={() => { setResetAlvo(u.email); setResetPw(""); setResetMsg(null); }} className="ml-auto border rounded px-2.5 py-1 text-xs font-semibold" style={{ borderColor: C.border, color: C.navy }}>Redefinir senha</button>
            </div>
          ))}
        </div>
      </div>
      {resetAlvo && (
        <Modal title="Redefinir senha" onClose={() => setResetAlvo(null)}>
          <p className="text-[13px] mb-3" style={{ color: C.gray }}>Definindo nova senha para <b>{resetAlvo}</b>.</p>
          <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>NOVA SENHA</div>
          <input type="text" value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder="mín. 6 caracteres" className="border rounded-md px-3 py-2 text-sm w-full mb-3" style={{ borderColor: C.border }} />
          {resetMsg && <div className="text-sm mb-3 rounded-md px-3 py-2" style={{ background: resetMsg.tipo === "ok" ? "#dcfce7" : "#fee2e2", color: resetMsg.tipo === "ok" ? C.green : C.red }}>{resetMsg.texto}</div>}
          <div className="flex gap-2">
            <button onClick={fazerReset} disabled={resetting} className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{resetting ? "Salvando…" : "Salvar nova senha"}</button>
            <button onClick={() => setResetAlvo(null)} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Fechar</button>
          </div>
        </Modal>
      )}
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
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold text-lg" style={{ color: C.navy }}>{title}</div>
          <button onClick={onClose} className="w-7 h-7 rounded-md border flex items-center justify-center" style={{ borderColor: C.border }}><X size={14} color={C.gray} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function PwInput({ value, onChange, onEnter, placeholder = "••••••••", wrap = "mb-4" }) {
  const [show, setShow] = useState(false);
  return (
    <div className={`relative ${wrap}`}>
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter && onEnter()} placeholder={placeholder}
        className="border rounded-md px-3 py-2.5 text-sm w-full pr-10" style={{ borderColor: C.border }} />
      <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1} className="absolute right-2.5 top-1/2 -translate-y-1/2" title={show ? "Ocultar" : "Mostrar"}>
        {show ? <EyeOff size={16} color={C.gray} /> : <Eye size={16} color={C.gray} />}
      </button>
    </div>
  );
}

function LabeledInput({ label, ph, value, defaultValue, onChange }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>{label}</div>
      <input placeholder={ph} value={value} defaultValue={defaultValue} onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="border rounded-md px-3 py-2 text-sm w-full" style={{ borderColor: C.border }} />
    </div>
  );
}
function ChangePasswordModal({ onClose }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const salvar = async () => {
    if (pw.length < 6) { setMsg({ tipo: "erro", texto: "Mínimo de 6 caracteres." }); return; }
    if (pw !== pw2) { setMsg({ tipo: "erro", texto: "As senhas não conferem." }); return; }
    setBusy(true); setMsg(null);
    try { await api.updatePassword(pw); setMsg({ tipo: "ok", texto: "Senha alterada com sucesso." }); setPw(""); setPw2(""); }
    catch (e) { setMsg({ tipo: "erro", texto: e.message || "Falha ao alterar a senha." }); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Alterar minha senha" onClose={onClose}>
      <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>NOVA SENHA</div>
      <PwInput value={pw} onChange={setPw} />
      <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>CONFIRMAR SENHA</div>
      <PwInput value={pw2} onChange={setPw2} onEnter={salvar} />
      {msg && <div className="text-sm mb-3 rounded-md px-3 py-2" style={{ background: msg.tipo === "ok" ? "#dcfce7" : "#fee2e2", color: msg.tipo === "ok" ? C.green : C.red }}>{msg.texto}</div>}
      <div className="flex gap-2">
        <button onClick={salvar} disabled={busy} className="rounded-md px-4 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{busy ? "Salvando…" : "Salvar"}</button>
        <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-semibold" style={{ color: C.navy }}>Fechar</button>
      </div>
    </Modal>
  );
}

function ProjectPicker({ projetos, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#05244f66" }}>
      <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold text-lg" style={{ color: C.navy }}>Selecionar projeto</div>
          <button onClick={onClose} className="w-7 h-7 rounded-md border flex items-center justify-center" style={{ borderColor: C.border }}><X size={14} color={C.gray} /></button>
        </div>
        <div className="space-y-3">
          {projetos.filter((p) => p.status === "Ativo").map((p) => (
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
function Login({ onLogin, onSignIn, onReset, loginError, busy }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mode, setMode] = useState("login"); // login | recuperar
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const submit = () => { if (email && senha) onSignIn(email, senha); };
  const enviarReset = async () => {
    if (!email) return;
    setResetBusy(true);
    try { await onReset(email); setResetSent(true); } catch (e) { console.error(e); }
    finally { setResetBusy(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "radial-gradient(circle at 30% 20%, #0d2f63, #05122b)" }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <img src="/logo.svg" alt="PWR Gestão" className="h-14 mb-4" />
        <div className="text-[10px] tracking-[0.25em] mb-6" style={{ color: C.blue }}>PORTFOLIO · PAINEL CENTRAL</div>

        {hasSupabase && mode === "recuperar" ? (
          <>
            <div className="font-bold text-lg mb-1" style={{ color: C.navy }}>Recuperar senha</div>
            {resetSent ? (
              <div className="text-sm rounded-md px-3 py-3 mb-4" style={{ background: "#dcfce7", color: C.green }}>
                Enviamos um link de recuperação para <b>{email}</b>. Abra o e-mail e clique no link para definir uma nova senha.
              </div>
            ) : (
              <>
                <p className="text-[13px] mb-4" style={{ color: C.gray }}>Informe seu e-mail. Enviaremos um link para você criar uma nova senha.</p>
                <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>E-MAIL</div>
                <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarReset()} placeholder="voce@empresa.com" className="border rounded-md px-3 py-2.5 text-sm w-full mb-4" style={{ borderColor: C.border }} />
                <button onClick={enviarReset} disabled={resetBusy} className="w-full rounded-md py-2.5 text-sm font-bold text-white disabled:opacity-60 mb-3" style={{ background: C.orange }}>{resetBusy ? "Enviando…" : "Enviar link de recuperação"}</button>
              </>
            )}
            <button onClick={() => { setMode("login"); setResetSent(false); }} className="w-full text-sm font-semibold" style={{ color: C.blue }}>← Voltar ao login</button>
          </>
        ) : hasSupabase ? (
          <>
            <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>E-MAIL</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="voce@empresa.com" className="border rounded-md px-3 py-2.5 text-sm w-full mb-4" style={{ borderColor: C.border }} />
            <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>SENHA</div>
            <PwInput value={senha} onChange={setSenha} onEnter={submit} wrap="mb-2" />
            <button onClick={() => setMode("recuperar")} className="text-[13px] font-semibold mb-4 block" style={{ color: C.blue }}>Esqueci minha senha</button>
            {loginError && <div className="text-sm mb-3 rounded-md px-3 py-2" style={{ background: "#fee2e2", color: C.red }}>{loginError}</div>}
            <button onClick={submit} disabled={busy} className="w-full rounded-md py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{busy ? "Entrando…" : "Entrar"}</button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

function ResetPassword({ onDone }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const salvar = async () => {
    if (pw.length < 6) { setErr("A senha precisa ter ao menos 6 caracteres."); return; }
    if (pw !== pw2) { setErr("As senhas não conferem."); return; }
    setErr(""); setBusy(true);
    try { await onDone(pw); } catch (e) { setErr("Não foi possível salvar. Tente o link novamente."); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "radial-gradient(circle at 30% 20%, #0d2f63, #05122b)" }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <img src="/logo.svg" alt="PWR Gestão" className="h-12 mb-4" />
        <div className="font-extrabold text-2xl tracking-tight mb-1" style={{ color: C.navy }}>Definir nova senha</div>
        <p className="text-[13px] mb-5" style={{ color: C.gray }}>Digite a nova senha de acesso ao sistema.</p>
        <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>NOVA SENHA</div>
        <PwInput value={pw} onChange={setPw} placeholder="••••••••" />
        <div className="text-[10px] font-semibold mb-1" style={{ color: C.gray }}>CONFIRMAR SENHA</div>
        <PwInput value={pw2} onChange={setPw2} onEnter={salvar} placeholder="••••••••" />
        {err && <div className="text-sm mb-3 rounded-md px-3 py-2" style={{ background: "#fee2e2", color: C.red }}>{err}</div>}
        <button onClick={salvar} disabled={busy} className="w-full rounded-md py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: C.orange }}>{busy ? "Salvando…" : "Salvar e entrar"}</button>
      </div>
    </div>
  );
}

/* ============================ HELPERS APP ============================ */
const numFrom = (id) => { const n = parseInt(String(id).split("-")[1], 10); return isNaN(n) ? 0 : n; };
const toISO = (s) => { if (!s || s === "–") return null; const [d, m, y] = s.split("/"); if (!d || !m || !y) return null; const yyyy = y.length === 2 ? "20" + y : y; return `${yyyy}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`; };
const asISO = (v) => { if (!v) return null; if (v.includes("/")) return toISO(v); if (v.includes("-")) return v; return null; };
const effStatus = (a) => {
  if (a.st === "Finalizada") return "Finalizada";
  const iso = asISO(a.fp);
  if (iso) { const hoje = new Date(); hoje.setHours(0, 0, 0, 0); if (new Date(iso + "T00:00:00") < hoje) return "Atrasada"; }
  return a.st;
};
const csvCell = (v) => { const s = String(v ?? ""); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function parseAcoesCSV(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const delim = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ";" : ",";
  const parseLine = (line) => {
    const out = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === delim && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur); return out.map((s) => s.trim());
  };
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const header = parseLine(lines[0]).map(norm);
  const idx = (names) => { for (const n of names) { const i = header.indexOf(n); if (i >= 0) return i; } return -1; };
  const iAcao = idx(["acao", "descricao", "acao/descricao"]), iFase = idx(["fase"]), iOrigem = idx(["origem"]),
    iResp = idx(["responsavel", "resp"]), iAb = idx(["abertura", "data abertura", "data_abertura"]),
    iFp = idx(["fech. plan.", "fecho planejado", "fecho_planejado", "prazo", "fech plan"]), iSt = idx(["status"]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseLine(lines[i]);
    const descricao = iAcao >= 0 ? c[iAcao] : c[0];
    if (!descricao) continue;
    rows.push({ descricao, fase: iFase >= 0 ? c[iFase] : "", origem: iOrigem >= 0 ? c[iOrigem] : "", resp: iResp >= 0 ? c[iResp] : "", ab: iAb >= 0 ? c[iAb] : "", fp: iFp >= 0 ? c[iFp] : "", st: iSt >= 0 ? c[iSt] : "" });
  }
  return rows;
}

/* ============================ APP ============================ */
export default function App() {
  const [logged, setLogged] = useState(false);
  const [role, setRole] = useState("admin");
  const [page, setPage] = useState("portfolio");
  const [projetos, setProjetos] = useState(PROJECTS);
  const [project, setProject] = useState(PROJ("gosto"));
  const [scopeIds, setScopeIds] = useState(["gosto"]);
  const [picker, setPicker] = useState(false);
  const [ataFilled, setAtaFilled] = useState(false);
  const [dbStatus, setDbStatus] = useState(hasSupabase ? "checking" : "demo");
  const [perfil, setPerfil] = useState(null);
  const [authReady, setAuthReady] = useState(!hasSupabase);
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);

  const [acoesState, setAcoesState] = useState(GOSTO_ACOES);
  const [respState, setRespState] = useState(RESPONSAVEIS);
  const [docState, setDocState] = useState(DOCS);
  const [solic, setSolic] = useState(SOLICITACOES);

  // testa conexão ao banco na inicialização
  useEffect(() => {
    if (!hasSupabase) { setDbStatus("demo"); return; }
    api.pingDB().then(() => setDbStatus("online")).catch((e) => { console.error("ping:", e.message); setDbStatus("error"); });
  }, []);

  // sessão Supabase Auth: papel vem do perfil, não de um seletor
  const bootstrap = async () => {
    try {
      const p = await api.getPerfil();
      const papel = p?.papel || "cliente";
      setPerfil(p); setRole(papel);
      setPage(papel === "admin" ? "portfolio" : "dashboard");
      setLogged(true);
    } catch (e) {
      console.error("perfil:", e.message);
      setPerfil(null); setRole("cliente"); setPage("dashboard"); setLogged(true);
    } finally { setAuthReady(true); }
  };
  useEffect(() => {
    if (!hasSupabase) return;
    const isRecovery = window.location.hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      if (isRecovery) { setRecovery(true); setAuthReady(true); return; }
      if (data.session) bootstrap(); else setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "INITIAL_SESSION") return;
      if (ev === "PASSWORD_RECOVERY") { setRecovery(true); setAuthReady(true); return; }
      if (session) bootstrap(); else { setLogged(false); setPerfil(null); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignIn = async (email, senha) => {
    setLoginError(""); setBusy(true);
    try { await api.signIn(email, senha); }
    catch (e) { console.error("signIn:", e.message); setLoginError("E-mail ou senha inválidos."); }
    finally { setBusy(false); }
  };
  const handleLogout = async () => {
    if (hasSupabase) { try { await api.signOut(); } catch (e) { console.error(e); } }
    setLogged(false); setPerfil(null);
  };

  // carrega projetos + solicitações ao logar
  useEffect(() => {
    if (!logged || !hasSupabase) return;
    (async () => {
      try { const ps = await api.listProjetos(); if (ps.length) { setProjetos(ps); setProject((cur) => ps.find((p) => p.id === cur.id) || ps[0]); setScopeIds((cur) => cur.filter((id) => ps.some((p) => p.id === id)).length ? cur : [(ps.find((p) => scopeIds.includes(p.id)) || ps[0]).id]); } } catch (e) { console.error("projetos:", e.message); }
      try { const ss = await api.listSolicitacoes(); setSolic(ss); } catch (e) { console.error("solicitacoes:", e.message); }
    })();
  }, [logged]);

  const projById = (id) => projetos.find((p) => p.id === id) || PROJ(id);

  // carrega dados do escopo (1, vários ou todos os projetos)
  const loadScope = async (ids) => {
    if (!ids || ids.length === 0) return;
    let merged = [];
    for (const id of ids) {
      let acts = null;
      if (hasSupabase) { try { acts = await api.listAcoes(id); } catch (e) { console.error("acoes:", e.message); } }
      if (!acts) acts = [];
      const proj = projById(id);
      merged = merged.concat(acts.map((a) => ({ ...a, projId: id, projName: proj?.name })));
    }
    setAcoesState(merged);
    // responsáveis e documentos usam o projeto primário (telas de projeto único)
    const primary = ids[0];
    let resp = null, docs = null;
    if (hasSupabase) {
      try { resp = await api.listResponsaveis(primary); } catch (e) { console.error("resp:", e.message); }
      try { docs = await api.listDocumentos(primary); } catch (e) { console.error("docs:", e.message); }
    }
    setRespState(resp || []); setDocState(docs || []);
  };

  useEffect(() => { if (logged) loadScope(scopeIds); /* eslint-disable-next-line */ }, [logged, scopeIds.join(",")]);

  const setScope = (ids) => { setScopeIds(ids); setProject(projById(ids[0])); };

  const login = (r) => {
    setLogged(true); setRole(r); setPage(r === "admin" ? "portfolio" : "dashboard");
    if (r !== "admin") { const pid = r === "cliente" ? "gosto" : "metalica"; setProject(PROJ(pid)); setScopeIds([pid]); }
    setAtaFilled(false);
  };
  const changeRole = (r) => {
    setRole(r);
    if (!ROLE_PAGES[r].includes(page)) setPage(r === "admin" ? "portfolio" : "dashboard");
    if (r === "consultor" && project.id === "gosto") { setProject(PROJ("metalica")); setScopeIds(["metalica"]); }
  };
  const openProject = (p) => { setProject(p); setScopeIds([p.id]); setPage("dashboard"); setAtaFilled(false); };

  // ---- handlers de escrita ----
  const nextCodigo = (offset = 0) => {
    const prefix = project.id.slice(0, 3).toUpperCase();
    const max = acoesState.reduce((m, a) => Math.max(m, numFrom(a.id)), 0);
    return `${prefix}-${max + 1 + offset}`;
  };
  const handleCreateAcao = async (form) => {
    const codigo = nextCodigo();
    if (hasSupabase) {
      try {
        const responsavel_id = respState.find((r) => r.nome === form.resp)?.id || null;
        await api.createAcao(project.id, {
          codigo, descricao: form.descricao, fase: form.fase, origem: form.origem,
          responsavel_id, data_abertura: asISO(form.ab), fecho_planejado: asISO(form.fp), fecho_real: asISO(form.fr), status: form.st,
        });
        await loadScope(scopeIds);
        return;
      } catch (e) { console.error("createAcao:", e.message); }
    }
    setAcoesState((prev) => [...prev, { id: codigo, acao: form.descricao, fase: form.fase, origem: form.origem, resp: form.resp, ab: form.ab || "–", fp: form.fp || "–", fr: form.fr || "–", st: form.st }]);
  };
  const handleUpdateAcao = async (codigo, form) => {
    if (hasSupabase) {
      try {
        const responsavel_id = respState.find((r) => r.nome === form.resp)?.id || null;
        await api.updateAcao(codigo, {
          descricao: form.descricao, fase: form.fase, origem: form.origem, responsavel_id,
          data_abertura: asISO(form.ab), fecho_planejado: asISO(form.fp), fecho_real: asISO(form.fr), status: form.st,
        });
        await loadScope(scopeIds);
        return;
      } catch (e) { console.error("updateAcao:", e.message); }
    }
    setAcoesState((prev) => prev.map((a) => a.id === codigo ? { ...a, acao: form.descricao, fase: form.fase, origem: form.origem, resp: form.resp, ab: form.ab || "–", fp: form.fp || "–", fr: form.fr || "–", st: form.st } : a));
  };
  const handleCreateResponsavel = async (form) => {
    const is_pwr = form.empresa === "PWR Gestão";
    if (hasSupabase) {
      try { const r = await api.createResponsavel(project.id, { nome: form.nome, empresa: form.empresa, papel: form.papel, email: form.email, is_pwr }); setRespState((prev) => [...prev, r]); return; }
      catch (e) { console.error("createResponsavel:", e.message); }
    }
    setRespState((prev) => [...prev, { nome: form.nome, empresa: form.empresa, pwr: is_pwr, papel: form.papel, email: form.email }]);
  };
  const handleCreateDocumento = async (form) => {
    if (hasSupabase) {
      try { await api.createDocumento(project.id, { nome: form.nome, tipo: form.tipo, link_drive: form.link, data: new Date().toISOString().slice(0, 10) }); await loadScope(scopeIds); return; }
      catch (e) { console.error("createDocumento:", e.message); }
    }
    const hoje = new Date(); const dd = String(hoje.getDate()).padStart(2, "0"), mm = String(hoje.getMonth() + 1).padStart(2, "0"), yy = String(hoje.getFullYear()).slice(2);
    setDocState((prev) => [{ tipo: form.tipo, data: `${dd}/${mm}/${yy}`, nome: form.nome, link: form.link || "https://drive.google.com/" }, ...prev]);
  };
  const handleCreateSolicitacao = async (form) => {
    if (hasSupabase) {
      try { await api.createSolicitacao({ tipo: form.tipo, descricao: form.descricao, projeto_id: form.projetoId || null, solicitante_email: perfil?.email || "demo@pwrgestao.com" }); const ss = await api.listSolicitacoes(); setSolic(ss); return; }
      catch (e) { console.error("createSolicitacao:", e.message); }
    }
    const hoje = new Date(); const dd = String(hoje.getDate()).padStart(2, "0"), mm = String(hoje.getMonth() + 1).padStart(2, "0"), yy = String(hoje.getFullYear()).slice(2);
    setSolic((prev) => [{ data: `${dd}/${mm}/${yy}`, quem: "demo@pwrgestao.com", tipo: form.tipo, proj: "—", desc: form.descricao, st: "Aberta" }, ...prev]);
  };
  const handleUpdateSolicitacao = async (id, payload) => {
    if (hasSupabase) {
      try { await api.updateSolicitacao(id, payload); const ss = await api.listSolicitacoes(); setSolic(ss); return; }
      catch (e) { console.error("updateSolicitacao:", e.message); }
    }
    setSolic((prev) => prev.map((s) => s.id === id ? { ...s, st: payload.status ?? s.st, fechamento: payload.data_fechamento || s.fechamento, obs: payload.observacao ?? s.obs } : s));
  };
  const handleSaveFollowup = async (form) => {
    if (hasSupabase) { try { await api.saveFollowup(project.id, form); return; } catch (e) { console.error("saveFollowup:", e.message); } }
    // modo mock: nada a persistir
  };
  const handleFillAta = async () => {
    if (hasSupabase) {
      try {
        const enc = ATA_EXAMPLE.encaminhamentos.map((e, i) => ({
          codigo: nextCodigo(i), descricao: e[0], fase: ["Implantação", "Estruturação", "Implantação"][i] || "Implantação",
          origem: "Ata", status: "Aberta", fecho_planejado: toISO(e[2]) || null,
          responsavel_id: respState.find((r) => r.nome === e[1])?.id || null,
        }));
        await api.saveAta(project.id, {
          data: ATA_EXAMPLE.data, local: ATA_EXAMPLE.local,
          participantes: ATA_EXAMPLE.participantes.map(([nome, empresa]) => ({ nome, presenca: "Presente", empresa })),
          pauta: ATA_EXAMPLE.pauta.map((texto) => ({ texto, status: "Discutido" })),
          decisoes: ATA_EXAMPLE.decisoes.map((texto) => ({ texto, responsavel: "" })),
        }, enc);
        await loadScope(scopeIds);
      } catch (e) { console.error("saveAta:", e.message); }
    } else if (project.id === "gosto" && !acoesState.some((a) => a.id === "GOS-18")) {
      setAcoesState((prev) => [...prev, ...GOSTO_ATA_EXTRA]);
    }
    setAtaFilled(true);
  };

  const handleCreateUser = async (payload) => { await api.createUserAsAdmin(payload); };
  const handleMoveAcao = async (action, novoStatus) => {
    if (!action || action.st === novoStatus) return;
    const payload = { status: novoStatus };
    if (novoStatus === "Finalizada" && (!action.fr || action.fr === "–")) payload.fecho_real = new Date().toISOString().slice(0, 10);
    if (hasSupabase) {
      try { await api.updateAcao(action.id, payload); await loadScope(scopeIds); return; }
      catch (e) { console.error("move:", e.message); }
    }
    setAcoesState((prev) => prev.map((a) => a.id === action.id ? { ...a, st: novoStatus, ...(payload.fecho_real ? { fr: payload.fecho_real } : {}) } : a));
  };
  const handleImportAcoes = async (rows) => {
    const prefix = project.id.slice(0, 3).toUpperCase();
    let max = acoesState.reduce((m, a) => Math.max(m, numFrom(a.id)), 0);
    if (hasSupabase) {
      for (const r of rows) {
        max += 1;
        const responsavel_id = respState.find((x) => x.nome === r.resp)?.id || null;
        try {
          await api.createAcao(project.id, {
            codigo: `${prefix}-${max}`, descricao: r.descricao, fase: r.fase || "Diagnóstico",
            origem: r.origem || "Ata", responsavel_id, data_abertura: asISO(r.ab), fecho_planejado: asISO(r.fp), status: r.st || "Aberta",
          });
        } catch (e) { console.error("import:", e.message); }
      }
      await loadScope(scopeIds);
    } else {
      setAcoesState((prev) => [...prev, ...rows.map((r, i) => ({ id: `${prefix}-${max + 1 + i}`, acao: r.descricao, fase: r.fase, origem: r.origem, resp: r.resp, ab: r.ab || "–", fp: r.fp || "–", fr: "–", st: r.st || "Aberta" }))]);
    }
  };
  const handleResetSenha = async ({ email, novaSenha }) => { await api.resetSenhaUsuario(email, novaSenha); };

  const dashData = useMemo(() => buildDashboard(acoesState), [acoesState]);

  if (hasSupabase && recovery) return <ResetPassword onDone={async (pw) => { await api.updatePassword(pw); setRecovery(false); if (window.history.replaceState) window.history.replaceState(null, "", window.location.pathname); bootstrap(); }} />;
  if (hasSupabase && !authReady) return (
    <div className="min-h-screen grid place-items-center" style={{ background: C.page }}>
      <span className="text-sm" style={{ color: C.gray }}>Carregando…</span>
    </div>
  );
  if (!logged) return <Login onLogin={login} onSignIn={handleSignIn} onReset={api.resetPassword} loginError={loginError} busy={busy} />;

  const canSwitchRole = !hasSupabase || perfil?.papel === "admin";

  const render = () => {
    const multi = scopeIds.length > 1;
    const nota = multi ? (
      <div className="mb-4 text-[13px] rounded-md px-3 py-2" style={{ background: "#fff7f0", color: C.orange }}>
        Esta tela é por projeto. Exibindo <b>{project?.name}</b>. Selecione um único projeto no seletor acima para trocar.
      </div>
    ) : null;
    switch (page) {
      case "portfolio": return <Portfolio projetos={projetos} openProject={openProject} />;
      case "mapa": return <MapaBrasil projetos={projetos} openProject={openProject} />;
      case "dashboard": return <Dashboard data={dashData} />;
      case "gantt": return <>{nota}<Gantt project={project} /></>;
      case "acoes": return <BaseAcoes project={project} actions={acoesState} responsaveis={respState} onCreate={handleCreateAcao} onUpdate={handleUpdateAcao} onImport={handleImportAcoes} multi={multi} />;
      case "kanban": return <Kanban project={project} actions={acoesState} multi={multi} onMove={handleMoveAcao} />;
      case "followup": return <>{nota}<FollowUp project={project} actions={acoesState.filter((a) => !a.projId || a.projId === project?.id)} onSave={handleSaveFollowup} /></>;
      case "ata": return <>{nota}<EmissaoAta project={project} filled={ataFilled} onFill={handleFillAta} /></>;
      case "responsaveis": return <>{nota}<Responsaveis project={project} projetos={projetos} responsaveis={respState} actions={acoesState.filter((a) => !a.projId || a.projId === project?.id)} onCreate={handleCreateResponsavel} /></>;
      case "documentos": return <>{nota}<Documentos project={project} documentos={docState} onCreate={handleCreateDocumento} /></>;
      case "solicitacoes": return <Solicitacoes solicitacoes={solic} projetos={projetos} onCreate={handleCreateSolicitacao} onUpdate={handleUpdateSolicitacao} />;
      case "administracao": return <Administracao projetos={projetos} onCreateUser={handleCreateUser} onResetSenha={handleResetSenha} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-[15px]" style={{ background: C.page, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <Sidebar role={role} page={page} setPage={setPage} acoesCount={acoesState.length} solicCount={solic.filter((s) => s.st === "Aberta").length} collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <TopBar role={role} setRole={changeRole} page={page} projetos={projetos} scopeIds={scopeIds} onScopeChange={setScope} onLogout={handleLogout} dbStatus={dbStatus} canSwitchRole={canSwitchRole} onToggleSidebar={() => setSidebarCollapsed((v) => !v)} onChangePw={() => setChangePwOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 min-h-0">{render()}</main>
      </div>
      {changePwOpen && <ChangePasswordModal onClose={() => setChangePwOpen(false)} />}
    </div>
  );
}
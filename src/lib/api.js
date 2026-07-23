import { supabase, makeAuxClient } from './supabase'

// ---- helpers de data ----
export const fmt = (d) => {
  if (!d) return '–'
  const [y, m, day] = String(d).split('-')
  return `${day}/${m}/${y.slice(2)}`
}
export const toISO = (s) => {
  if (!s || s === '–') return null
  const [d, m, y] = s.split('/')
  if (!d || !m || !y) return null
  const yyyy = y.length === 2 ? '20' + y : y
  return `${yyyy}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
const numFrom = (codigo) => {
  const n = parseInt(String(codigo).split('-')[1], 10)
  return isNaN(n) ? 0 : n
}

// ---- PROJETOS ----
export async function listProjetos() {
  const { data, error } = await supabase
    .from('projetos')
    .select('*, projeto_portfolios(nome, percentual)')
    .order('created_at')
  if (error) throw error
  return data.map((p) => ({
    id: p.id, name: p.nome, client: p.cliente, city: p.cidade, uf: p.uf,
    region: p.regiao, color: p.cor, letter: p.letra, status: p.status,
    acoes: p.acoes_total, pct: p.percentual, atras: p.atrasadas, emAnd: p.em_andamento,
    portfolios: (p.projeto_portfolios || []).map((x) => [x.nome, x.percentual]),
  }))
}

// ---- AÇÕES ----
export async function listAcoes(projetoId) {
  const { data, error } = await supabase
    .from('acoes')
    .select('codigo, descricao, fase, origem, data_abertura, fecho_planejado, fecho_real, status, responsaveis(nome)')
    .eq('projeto_id', projetoId)
  if (error) throw error
  return data
    .map((a) => ({
      id: a.codigo, acao: a.descricao, fase: a.fase, origem: a.origem,
      resp: a.responsaveis?.nome || '', ab: fmt(a.data_abertura),
      fp: fmt(a.fecho_planejado), fr: fmt(a.fecho_real), st: a.status,
    }))
    .sort((x, y) => numFrom(x.id) - numFrom(y.id))
}

export async function createAcao(projetoId, payload) {
  const { error } = await supabase.from('acoes').insert({ projeto_id: projetoId, ...payload })
  if (error) throw error
}

export async function updateAcao(codigo, payload) {
  const { error } = await supabase.from('acoes').update(payload).eq('codigo', codigo)
  if (error) throw error
}

export async function deleteAcao(codigo) {
  const { error } = await supabase.from('acoes').delete().eq('codigo', codigo)
  if (error) throw error
}

// ---- RESPONSÁVEIS ----
export async function listResponsaveis(projetoId) {
  const { data, error } = await supabase
    .from('responsaveis').select('*').eq('projeto_id', projetoId).order('created_at')
  if (error) throw error
  return data.map((r) => ({ id: r.id, nome: r.nome, empresa: r.empresa, pwr: r.is_pwr, papel: r.papel, email: r.email }))
}

export async function createResponsavel(projetoId, payload) {
  const { data, error } = await supabase.from('responsaveis')
    .insert({ projeto_id: projetoId, ...payload }).select().single()
  if (error) throw error
  return { id: data.id, nome: data.nome, empresa: data.empresa, pwr: data.is_pwr, papel: data.papel, email: data.email }
}

// ---- DOCUMENTOS ----
export async function listDocumentos(projetoId) {
  const { data, error } = await supabase
    .from('documentos').select('*').eq('projeto_id', projetoId).order('created_at')
  if (error) throw error
  return data.map((d) => ({ tipo: d.tipo, data: fmt(d.data), nome: d.nome, link: d.link_drive || 'https://drive.google.com/' }))
}

export async function createDocumento(projetoId, payload) {
  const { error } = await supabase.from('documentos').insert({ projeto_id: projetoId, ...payload })
  if (error) throw error
}

// ---- SOLICITAÇÕES ----
export async function listSolicitacoes() {
  const { data, error } = await supabase
    .from('solicitacoes').select('*, projetos(nome)').order('data', { ascending: false })
  if (error) throw error
  return data.map((s) => ({
    id: s.id, data: fmt(s.data), quem: s.solicitante_email, tipo: s.tipo,
    projetoId: s.projeto_id, proj: s.projetos?.nome || '—', desc: s.descricao,
    st: s.status, fechamento: fmt(s.data_fechamento), obs: s.observacao || '',
  }))
}

export async function createSolicitacao(payload) {
  const { error } = await supabase.from('solicitacoes').insert(payload)
  if (error) throw error
}

export async function updateSolicitacao(id, payload) {
  const { error } = await supabase.from('solicitacoes').update(payload).eq('id', id)
  if (error) throw error
}

// ---- FOLLOW-UP ----
export async function saveFollowup(projetoId, payload) {
  const { data, error } = await supabase.from('followups').insert({ projeto_id: projetoId, ...payload }).select().single()
  if (error) throw error
  return data
}
export async function listFollowups(projetoId) {
  const { data, error } = await supabase.from('followups').select('*').eq('projeto_id', projetoId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function updateFollowup(id, payload) {
  const { error } = await supabase.from('followups').update(payload).eq('id', id)
  if (error) throw error
}

// ---- ATA ----
export async function saveAta(projetoId, ata, encaminhamentos) {
  const { data, error } = await supabase.from('atas').insert({
    projeto_id: projetoId, data: toISO(ata.data), local: ata.local,
    participantes: ata.participantes, pauta: ata.pauta, decisoes: ata.decisoes,
  }).select().single()
  if (error) throw error
  if (encaminhamentos?.length) {
    const rows = encaminhamentos.map((e) => ({ ...e, projeto_id: projetoId, ata_id: data.id }))
    const { error: e2 } = await supabase.from('acoes').insert(rows)
    if (e2) throw e2
  }
  return data
}

// ---- PING (teste de conexão) ----
export async function pingDB() {
  const { error } = await supabase.from('projetos').select('id', { head: true, count: 'exact' })
  if (error) throw error
  return true
}

// ---- AUTENTICAÇÃO (Supabase Auth) ----
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
export async function signOut() {
  await supabase.auth.signOut()
}
export async function getPerfil() {
  const { data: u } = await supabase.auth.getUser()
  if (!u?.user) return null
  const { data, error } = await supabase.from('perfis').select('papel, nome, email').eq('id', u.user.id).single()
  if (error) throw error
  return data
}

// ---- RECUPERAÇÃO DE SENHA ----
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
  if (error) throw error
}
export async function updatePassword(novaSenha) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  if (error) throw error
}

// ---- ADMIN: CRIAR CONTA + PERMISSÕES ----
export async function listUsuarios() {
  const { data, error } = await supabase.from('perfis').select('email, nome, papel').order('papel')
  if (error) throw error
  return data
}
export async function createUserAsAdmin({ email, password, papel, nome, projetoId }) {
  const aux = makeAuxClient()
  if (!aux) throw new Error('Banco não conectado.')
  const { data, error } = await aux.auth.signUp({ email, password })
  if (error) throw error
  const uid = data.user?.id
  if (!uid) throw new Error('Não foi possível criar o usuário (e-mail já existe?).')
  const { error: e2 } = await supabase.from('perfis').upsert({ id: uid, email, nome: nome || email, papel })
  if (e2) throw e2
  if (papel === 'cliente' && projetoId) {
    const { error: e3 } = await supabase.from('projeto_acessos').upsert({ projeto_id: projetoId, user_id: uid, papel: 'cliente' })
    if (e3) throw e3
  }
  return uid
}

// ---- ADMIN: REDEFINIR SENHA DE OUTRO USUÁRIO (via Edge Function) ----
export async function resetSenhaUsuario(email, novaSenha) {
  const { data, error } = await supabase.functions.invoke('admin-reset-senha', {
    body: { email, novaSenha },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}
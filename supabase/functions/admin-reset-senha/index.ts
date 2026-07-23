// Edge Function: admin-reset-senha
// O admin (logado) chama esta função para redefinir a senha de outro usuário.
// A troca usa a service_role, que fica SÓ no servidor (nunca no app).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // 1) Identifica quem está chamando (pelo token do admin logado)
    const asCaller = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: uErr } = await asCaller.auth.getUser();
    if (uErr || !userData?.user) return json({ error: "Não autenticado." }, 401);

    // 2) Confere se o chamador é admin
    const admin = createClient(url, service);
    const { data: perfil } = await admin
      .from("perfis").select("papel").eq("id", userData.user.id).single();
    if (perfil?.papel !== "admin") return json({ error: "Apenas admin pode redefinir senhas." }, 403);

    // 3) Valida entrada
    const { email, novaSenha } = await req.json();
    if (!email || !novaSenha || String(novaSenha).length < 6) {
      return json({ error: "Informe e-mail e uma senha com ao menos 6 caracteres." }, 400);
    }

    // 4) Acha o usuário-alvo e troca a senha
    const { data: alvo } = await admin
      .from("perfis").select("id").eq("email", email).single();
    if (!alvo) return json({ error: "Usuário não encontrado." }, 404);

    const { error: upErr } = await admin.auth.admin.updateUserById(alvo.id, { password: novaSenha });
    if (upErr) return json({ error: upErr.message }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

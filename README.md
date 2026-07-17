# Portfólio PWR — protótipo

Protótipo navegável (front-end, dados mock) do painel central da PWR Gestão.
Stack: Vite + React 18 + Tailwind CSS + Recharts + lucide-react.

> Protótipo de validação: os dados são fixos (mock) e ficam em memória — nada
> persiste ao recarregar. Sem login real e sem backend.

## Rodar local

```bash
npm install
npm run dev      # http://localhost:5173
```

Build de produção:

```bash
npm run build    # gera a pasta dist/
npm run preview  # serve o build localmente
```

## Publicar na Vercel

### Opção A — CLI (mais rápido)

```bash
npm i -g vercel      # se ainda não tiver
vercel               # 1º deploy (preview) — responda as perguntas
vercel --prod        # publica em produção
```

Na 1ª pergunta de configuração a Vercel detecta o Vite sozinho:
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Opção B — GitHub + Vercel (recomendado p/ atualizar depois)

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com → **Add New… → Project → Import** o repositório.
3. A Vercel detecta o Vite automaticamente. Clique em **Deploy**.
4. Cada `git push` na branch principal republica sozinho.

Depois do deploy a Vercel te dá a URL (algo como
`https://portfolio-pwr.vercel.app`) para enviar ao cliente.

## Estrutura

```
index.html            # entrada
src/main.jsx          # bootstrap do React
src/App.jsx           # aplicação inteira (todas as telas)
src/index.css         # diretivas do Tailwind
tailwind.config.js
postcss.config.js
vite.config.js
```

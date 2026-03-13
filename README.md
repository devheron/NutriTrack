# NutriTrack v3

Aplicativo de gerenciamento nutricional com:
- **Supabase** — banco de dados PostgreSQL + autenticação
- **Open Food Facts** — busca de produtos reais com fotos
- **OpenStreetMap / Overpass** — mercados e farmácias por geolocalização
- **Login com Google e GitHub**

---

## 1. Configurar o Supabase

### 1.1 Criar projeto
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL** e a **anon key** (em Settings > API)

### 1.2 Criar as tabelas
1. No painel do Supabase, vá em **SQL Editor > New Query**
2. Cole o conteúdo do arquivo `supabase_schema.sql` e execute

### 1.3 Ativar Storage (para fotos de produtos)
1. Vá em **Storage > New bucket**
2. Crie um bucket chamado `product-photos`
3. Em **Policies**, adicione uma policy de leitura pública:
   ```sql
   CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'product-photos');
   CREATE POLICY "Auth upload"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-photos' AND auth.role() = 'authenticated');
   ```

### 1.4 Ativar login Google e GitHub
**Google:**
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto > Credenciais > OAuth 2.0
3. Authorized redirect URI: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
4. No Supabase: Authentication > Providers > Google → cole Client ID e Secret

**GitHub:**
1. GitHub > Settings > Developer Settings > OAuth Apps > New
2. Authorization callback URL: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
3. No Supabase: Authentication > Providers > GitHub → cole Client ID e Secret

---

## 2. Instalar e rodar localmente

```bash
# 1. Instale as dependências
npm install

# 2. Configure o .env
cp .env.example .env
# Edite o .env com sua URL e anon key do Supabase

# 3. Rode o dev server
npm run dev
```

---

## 3. Deploy no Vercel

```bash
# 1. Suba para o GitHub
git init
git add .
git commit -m "feat: nutritrack v3"
git remote add origin https://github.com/SEU_USER/nutritrack.git
git push -u origin main

# 2. No Vercel:
# - Importe o repositório
# - Em Environment Variables, adicione:
#   VITE_SUPABASE_URL = https://SEU_PROJETO.supabase.co
#   VITE_SUPABASE_ANON_KEY = sua_anon_key

# 3. Clique em Deploy — pronto!
```

**Importante:** no Supabase, adicione a URL do Vercel em:
Authentication > URL Configuration > Redirect URLs

---

## Estrutura do projeto

```
src/
├── components/
│   ├── AddToDayModal.jsx   — modal para registrar refeição
│   ├── ItemForm.jsx         — formulário com busca Open Food Facts
│   ├── LoginPage.jsx        — login Google/GitHub
│   ├── Navbar.jsx
│   ├── ProductCard.jsx      — card de produto com macros
│   └── Toast.jsx
├── hooks/
│   ├── useAuth.js           — autenticação Supabase
│   └── useLocation.js       — geolocalização browser
├── lib/
│   └── supabase.js          — cliente Supabase
├── pages/
│   ├── FoodBank.jsx         — banco de alimentos
│   ├── NearbyStores.jsx     — mercados/farmácias via OSM
│   ├── DailyPlan.jsx        — plano diário
│   └── Schedule.jsx         — agendamentos
├── services/
│   ├── dailyLogs.js         — CRUD logs diários
│   ├── foodItems.js         — CRUD produtos + upload foto
│   ├── goals.js             — metas do usuário
│   ├── nearbyStores.js      — Overpass API (OSM)
│   └── openFoodFacts.js     — busca produtos reais
└── App.jsx                  — rotas + auth guard
```

# NutriTrack — 📊 
Aplicativo de controle diário nutricional com React, Supabase e Open Food Facts:
React 18  |  Supabase  |  Vite  |  Tailwind CSS  |  MIT License

### Sobre
O NutriTrack é uma aplicação web para controle de consumo nutricional diário, focado em calorias e proteína. Com login social, banco de dados por usuário, busca automática de alimentos e mapa de farmacias e mercados nas proximidades.

### Funcionalidades
•	🔐  Login com Google e GitHub (OAuth via Supabase);

•	🥗  Banco de alimentos pessoal com CRUD completo;

•	🔍  Busca de produtos reais via Open Food Facts (3M+ itens com foto);

•	📅  Plano diário com refeições organizadas e totais em tempo real;

•	📆  Agendamentos para os próximos 14 dias;

•	🗺️  Mapa de supermercados e farmácias próximas (GPS + OpenStreetMap);

•	📸  Upload de foto de produto via Supabase Storage;

•	🎯  Metas personalizáveis de calorias e proteína;

### Stack Tech
#### Camada / Tecnologia
- Frontend / React 18 + Vite + React Router v6
- Style / Tailwind CSS +  Custom Design
- Backend / Auth	Supabase (PostgreSQL + Auth + Storage)
- Alimentos	/ Open Food Facts API
- Mapa / OpenStreetMap + Overpass API + Nominatim
- Deploy /	Vercel

### 🗄️ Tabelas do banco
#### Tabela	/ Descrição
- food_items /	**Alimentos cadastrados pelo usuário (nome, marca, macros, foto, serving)**
- daily_logs /	**Refeições registradas por data com snapshot nutricional imutável**
- scheduled_plans /	**Planos alimentares agendados para datas futuras**
- user_goals /	**Metas diárias de calorias e proteína por usuário**

📄 **heron dev license** 📄
#### Acess: https://nutri-track-seven.vercel.app/
#### github.com/devheron

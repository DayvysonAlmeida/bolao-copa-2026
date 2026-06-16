# 🏆 Bolão Copa do Mundo 2026

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

Uma plataforma completa, moderna e gamificada de bolão para a Copa do Mundo de 2026. 
Projetada com uma arquitetura robusta dividida entre um backend em **Python/Django REST Framework** e um frontend ultrarrápido em **React + Vite**. O design utiliza a estética *Dark Mode* com destaques em Verde Neon, proporcionando uma experiência de usuário (UX) premium, envolvente e altamente competitiva.

---

## ✨ Principais Funcionalidades

* **Autenticação Segura (JWT):** Sistema robusto de login e cadastro com tokens JWT.
* **Meu Perfil:** Gerenciamento de conta completo, permitindo edição de nome, sobrenome, email e alteração de senha inteligente.
* **Navegação Dinâmica & Filtros:** Abas inteligentes na tela principal separando os jogos em "Todos", "Faltam Palpitar" e "Encerrados", para o usuário nunca perder um prazo.
* **Painel de Juiz (Admin Panel):** Área exclusiva para administradores lançarem placares oficiais e corrigirem palpites pelo frontend, sem precisar abrir o painel do Django.
* **Dashboard Gamificado & Interativo:**
  * **Secador do Líder 👀:** Ferramenta que compara automaticamente o seu palpite do próximo jogo com o palpite do líder do ranking.
  * **Pódio 3D Animado:** O Top 3 do ranking possui destaque visual e coroação animada.
  * **Estatísticas e Gráficos:** *Donut Charts* para ilustrar a Precisão do Jogador (Cravadas vs Erros) e a Tendência Global da Copa (Mandantes vs Visitantes).
  * **Medalhas / Badges de *Streak*:** Indicadores visuais que mostram se o jogador está "🔥 Em Chamas" ou "🥶 Gelado" baseados no seu histórico recente.
  * **A Maior Goleada:** Extração dinâmica da partida mais emocionante do torneio.
  * **Banners de Urgência:** Alerta dinâmico e pulsante de jogos que ocorrem em menos de 12 horas e ainda estão sem palpites.
* **Feedback Visual Instantâneo:** Selo dourado animado **"🎯 Mitou!"** quando o usuário acerta o placar exato (5 pontos) e alertas pulsantes **"🔴 AO VIVO"** para jogos em andamento.
* **Sincronização Oficial Automática (Live Scores):** Integração inteligente com a API `football-data.org` (via gatilho invisível em requisições). Atualiza os placares oficiais, ajusta horários, muda o status para Em Andamento e recalcula a pontuação do ranking **ao vivo**, sem necessidade de CRON jobs externos.

---

## 🛠️ Tecnologias Utilizadas

### Frontend (Aplicação Web)
* **React 18** (com Vite para build ultrarrápido)
* **Tailwind CSS** (estilização utilitária e responsiva avançada)
* **Context API & Custom Hooks** (para gerenciamento de estados, autenticação e rotas)

### Backend (API RESTful)
* **Python & Django** (ORM, validações e painel de administração nativo)
* **Django REST Framework (DRF)** (Construção da API)
* **Simple JWT** (Segurança via Tokens)

### Banco de Dados & Infraestrutura
* **MySQL** via Aiven (Produção) / SQLite (Desenvolvimento)
* **Render** (Hospedagem do Backend em nuvem)
* **Vercel** (Hospedagem do Frontend web)
* **Docker & Docker Compose** (Ambiente de desenvolvimento local simplificado)

---

## ⚙️ Como Executar Localmente

Certifique-se de ter o **Python**, **Node.js** e **Git** instalados. Se preferir usar Docker, as instruções do `docker-compose` também estão listadas abaixo.

**1. Clone o repositório**
```bash
git clone https://github.com/DayvysonAlmeida/bolao-copa-2026.git
cd bolao-copa-2026
```

**2. Configure as Variáveis de Ambiente**
Crie um arquivo `.env` na pasta `backend/` contendo a sua chave do `football-data.org` na variável `FOOTBALL_DATA_API_KEY`. (Isso habilitará a atualização automática de placares localmente).

### 🐳 Opção 1: Usando Docker (Recomendado)
**Suba o ambiente completo (Backend, Frontend e Banco de Dados)**
```bash
docker-compose up --build -d
```
*Após subir os contêineres, rode as migrações e popule o banco:*
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py sync_copa
docker-compose exec backend python manage.py createsuperuser
```

### 💻 Opção 2: Manual (Ambiente Virtual + Node)
**Subindo o Backend:**
```bash
cd backend
python -m venv venv
# No Windows: venv\Scripts\activate | No Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py sync_copa
python manage.py createsuperuser
python manage.py runserver
```

**Subindo o Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**4. Acesse a Aplicação**
* **Frontend (App):** `http://localhost:5173`
* **Backend API:** `http://localhost:8000/api/`
* **Admin do Django:** `http://localhost:8000/admin/`

---

## 👨‍💻 Desenvolvido por

**Dayvyson Fernando Almeida da Silva (DayFer)** 💚

Projeto construído com paixão para aprofundamento em arquitetura Full-Stack, UX Design, Gamificação e deploy na nuvem.

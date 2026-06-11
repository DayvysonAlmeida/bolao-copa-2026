# 🏆 Bolão Copa do Mundo 2026

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

Uma plataforma completa, moderna e gamificada de bolão para a Copa do Mundo de 2026. 
Projetada com uma arquitetura robusta dividida entre um backend em **Python/Django REST Framework** e um frontend ultrarrápido em **React + Vite**. O design utiliza a estética *Dark Mode* com destaques em Verde Neon, proporcionando uma experiência de usuário (UX) premium e imersiva.

---

## ✨ Principais Funcionalidades

* **Autenticação Segura (JWT):** Sistema robusto de login e cadastro com tokens JWT.
* **Meu Perfil:** Gerenciamento de conta completo, permitindo edição de nome, sobrenome, email e alteração de senha inteligente (com interface otimizada).
* **Navegação Dinâmica & Filtros:** Abas inteligentes na tela principal separando os jogos em "Todos", "Faltam Palpitar" e "Encerrados", para o usuário nunca perder um prazo.
* **Feedback Visual e Gamificação:**
  * Indicadores **"🔴 AO VIVO"** pulsantes para jogos em andamento.
  * Pódio no Ranking com exibição de medalhas (🥇, 🥈, 🥉).
  * Selo dourado animado **"🎯 Mitou!"** quando o usuário acerta o placar exato (5 pontos).
* **Painel de Jogos e Grupos:** Visualização completa da tabela de jogos com suas respectivas bandeiras, organizados da fase de grupos (A ao L) até a fase final.
* **Sincronização de Dados:** Motor pronto para alimentar o banco de dados via script JSON e preparado para receber integração com APIs de esportes no futuro.

---

## 🛠️ Tecnologias Utilizadas

### Frontend (Aplicação Web)
* **React 18** (com Vite para build ultrarrápido)
* **Tailwind CSS** (estilização utilitária e responsiva)
* **Context API & Custom Hooks** (para gerenciamento de estados, autenticação e rotas)

### Backend (API RESTful)
* **Python & Django** (ORM, validações e painel de administração nativo)
* **Django REST Framework (DRF)** (Construção da API)
* **Simple JWT** (Segurança)

### Banco de Dados & Infraestrutura
* **MySQL** via Aiven (Produção) / SQLite (Desenvolvimento)
* **Render** (Hospedagem do Backend em nuvem)
* **Vercel** (Hospedagem do Frontend web)
* **Docker & Docker Compose** (Ambiente de desenvolvimento)

---

## ⚙️ Como Executar Localmente

Certifique-se de ter o **Python**, **Node.js** e **Git** instalados. (Se preferir usar Docker, o arquivo docker-compose também está disponível).

**1. Clone o repositório**
```bash
git clone https://github.com/DayvysonAlmeida/bolao-copa-2026.git
cd bolao-copa-2026
```

**2. Configure o Backend (Django)**
```bash
cd backend
python -m venv venv
# No Windows: .\venv\Scripts\activate
# No Linux/Mac: source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py sync_copa  # Sincroniza os jogos do arquivo JSON
python manage.py createsuperuser  # Cria seu usuário de admin
python manage.py runserver
```

**3. Configure o Frontend (React)**
Abra um novo terminal e navegue para a pasta frontend:
```bash
cd frontend
npm install
npm run dev
```

**4. Acesse a Aplicação**
* **Frontend (App):** `http://localhost:5173`
* **Backend API:** `http://localhost:8000/api/`
* **Admin:** `http://localhost:8000/admin/`

---

## 👨‍💻 Desenvolvido por

**Dayvyson Fernando Almeida da Silva (DayFer)** 💚

Projeto construído com paixão para aprofundamento em arquitetura Full-Stack, UX Design e deploy na nuvem.

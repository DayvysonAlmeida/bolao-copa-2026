# 🏆 Bolão Copa do Mundo 2026

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Uma plataforma completa de bolão para a Copa do Mundo de 2026, projetada com uma arquitetura moderna dividida entre um backend robusto em Python/Django e um frontend rápido e responsivo em React. O projeto possui um design voltado para o estilo *Dark Mode* com destaques em Verde Neon, proporcionando uma excelente experiência de usuário.

---

## 🚀 Funcionalidades

* **Sincronização Automática:** Motor de integração no backend capaz de ler e popular o banco de dados via JSON. ⚠️ **Atenção:** Os dados populados referem-se *exclusivamente à Primeira Fase (Fase de Grupos)* do campeonato, contendo as 48 seleções e seus respectivos 72 confrontos iniciais.
* **Autenticação Segura:** Sistema de login validado por tokens JWT (JSON Web Tokens). O acesso e envio de palpites são restritos a usuários autenticados.
* **Dashboard Dinâmico:** Visualização completa da tabela de jogos separados por grupos (A ao L), além do placar de partidas finalizadas e horários.
* **Ranking em Tempo Real:** Tabela de classificação interativa que atualiza a pontuação dos usuários com destaques em ouro, prata e bronze para o Top 3.
* **Infraestrutura em Contêineres:** Todo o ecossistema (banco de dados, API e frontend) roda orquestrado via Docker.

---

## 🛠️ Tecnologias Utilizadas

### Backend
* **Python & Django REST Framework:** Criação de rotas, serialização de dados e regras de negócio.
* **Simple JWT:** Segurança e geração de tokens de acesso.
* **MySQL:** Banco de dados relacional.

### Frontend
* **React + Vite:** Construção rápida de interfaces de usuário e gerenciamento de estado.
* **Tailwind CSS:** Estilização utilitária aplicada diretamente no JSX para o tema *Dark/Neon*.

### Infraestrutura
* **Docker & Docker Compose:** Padronização e isolamento do ambiente de desenvolvimento.

---

## ⚙️ Como Executar o Projeto Localmente

Certifique-se de ter o **Docker** e o **Git** instalados na sua máquina.

**1. Clone o repositório**
```bash
git clone [https://github.com/SeuUsuario/bolao-copa-2026.git](https://github.com/SeuUsuario/bolao-copa-2026.git)
cd bolao-copa-2026

2. Suba a infraestrutura com o Docker

Bash
docker-compose up --build -d
3. Prepare o banco de dados (Backend)

Bash
# Rode as migrações do Django
docker-compose exec backend python manage.py migrate

# Sincronize os dados da Copa de 2026 (Times e Partidas da Primeira Fase)
docker-compose exec backend python manage.py sync_copa

# Crie um superusuário para acessar o painel Admin e fazer os primeiros palpites
docker-compose exec backend python manage.py createsuperuser
4. Acesse a Aplicação

Frontend (React): http://localhost:5173

API / Backend (Django): http://localhost:8000/api/

Painel Admin: http://localhost:8000/admin/

👨‍💻 Autor
Dayvyson Fernando Almeida da Silva

Projeto construído para aprofundamento em arquitetura Full-Stack, integração de APIs e orquestração com DevOps.

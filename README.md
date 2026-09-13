# 2026-2-Sistema-Reservas

## Pré-requisitos

O login depende do HUB rodando localmente (via Docker/Dev Containers). Setup completo (variáveis de ambiente, credencial do Google, cadastro do sistema no HUB): [docs/HUB_SETUP.md](docs/HUB_SETUP.md).

## Rodando o backend

```powershell
cd backend
python manage.py migrate
python manage.py runserver 8001
```

Acesse sempre como `http://localhost:8001`, nunca `127.0.0.1:8001`, os cookies do HUB são host-only e ficam presos ao host usado no login.

## Rodando o frontend

Tem dois jeitos de rodar o front, dependendo do que você está fazendo.

### Desenvolvimento (código no front)

```powershell
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. O Vite atualiza a tela sozinho a cada mudança de código, sem precisar buildar nada. Chamadas de API (`/session/...`, `/api/...`) são encaminhadas automaticamente pro backend (`localhost:8001`), configurado em `vite.config.js` (`server.proxy`).

Pra logar: como o cookie do HUB é preso a `localhost` (não à porta), basta ter feito login uma vez pelo fluxo normal (HUB → clica no card do Reserva de Recursos, que abre em `:8001`), o mesmo cookie já vale pra `:5173`.

### Como vai rodar de verdade (backend servindo o React já buildado)

```powershell
cd frontend
npm run build
```

Isso gera os arquivos finais em `backend/frontend/` (não em `frontend/dist/`, é uma pasta de saída customizada — ver `vite.config.js`). Com o backend rodando, acesse `http://localhost:8001/` direto: o Django serve o `index.html` buildado.

Use esse modo pra validar que tudo funciona numa origem só, do jeito que vai rodar em produção, não pra codar no dia a dia (precisaria rodar `npm run build` de novo a cada mudança).

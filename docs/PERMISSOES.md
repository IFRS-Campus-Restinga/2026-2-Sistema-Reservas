# Permissões: como usar nas suas telas e APIs

**Regra de ouro:** quem decide é o **backend**. O front só usa as permissões para mostrar ou esconder botões e telas. Toda API precisa validar por conta própria.

## Quem pode o quê

| Papel | Reservar | Criar grupos |
|---|---|---|
| **Admin** | Tudo, sem precisar de grupo | De alunos e de servidores |
| **Servidor** | Tudo, **exceto veículo**. Veículo só se estiver em um grupo vigente | Só de alunos |
| **Aluno** | Só o que um grupo vigente autorizar | Não cria |

Um grupo é "vigente" quando está dentro da validade dele e da validade do membro.

Todas as regras ficam em `backend/api/permissions/`.

## Backend

Aqui entram duas classes diferentes, e é importante não misturar:

| | O que é | Herda de | Onde fica |
|---|---|---|---|
| **View** | O endpoint (o `get`, o `post`...) | `APIView`, como sempre | `api/views/` |
| **Permissão** | A regra que diz *quem* pode | `UsuarioAutenticado` | `api/permissions/` |

A view **não** herda de `UsuarioAutenticado`. Ela só **informa** qual permissão usar, no atributo `permission_classes`.

### 1. Criando uma view: escolha uma permissão que já existe

```python
from rest_framework.views import APIView
from api.permissions.escrita_admin import EscritaAdmin


class VeiculoListCreateView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request):
        ...  # qualquer usuário logado consegue

    def post(self, request):
        ...  # só admin consegue; os outros recebem 403
```

A view não precisa checar login nem papel. A permissão faz isso antes do `get`/`post` rodar.

Permissões que já existem:

| Permissão | Quem passa |
|---|---|
| `EscritaAdmin` | Leitura: qualquer usuário logado. Escrita: só admin. Use nos cadastros (veículos, áreas, recursos...) |
| `PodeCriarGrupo` | Leitura: qualquer usuário logado. Criar: admin e servidor, conforme o tipo do grupo |
| `PodeGerenciarGrupo` | O criador do grupo ou admin |
| `PodeGerenciarMembrosGrupo` | O criador do grupo ou admin |
| `PodeGerenciarReserva` | O responsável pela reserva ou admin |

> ⚠️ **Nunca deixe uma view sem `permission_classes`.** Sem esse atributo, qualquer usuário logado consegue criar, editar e excluir.

### 2. Nenhuma serve? Crie uma permissão e use na view

**Passo 1:** crie a permissão em `api/permissions/`, herdando de `UsuarioAutenticado`, e escreva a regra em `tem_permissao`:

```python
# api/permissions/reserva_permissions.py
from api.permissions.regras_comuns import UsuarioAutenticado, usuario_e_admin


class PodeAprovarReserva(UsuarioAutenticado):
    message = "Apenas administradores podem aprovar reservas."

    def tem_permissao(self, request, view):
        return usuario_e_admin(request.user)
```

- O `UsuarioAutenticado` barra quem não está logado (a API responde 401) **antes** de chamar `tem_permissao`. Então ali o usuário sempre está logado, e você não precisa checar isso.
- Retornou `True`, a pessoa passa. Retornou `False`, a API responde 403 com a `message`.

**Passo 2:** use a permissão na view, igual ao passo 1:

```python
from rest_framework.views import APIView
from api.permissions.reserva_permissions import PodeAprovarReserva


class AprovarReservaView(APIView):
    permission_classes = [PodeAprovarReserva]

    def post(self, request, pk):
        ...
```

Para saber se alguém é admin, use **sempre** `usuario_e_admin(user)`. Não compare `user.papel == 'admin'`, porque isso ignora o `is_staff`.

> A regra depende do registro (ex.: "só o dono da reserva pode editar")? Veja `PodeGerenciarReserva`, em `reserva_permissions.py`, e como a `ReservaRecursoGeralDetailView` a usa.

### 3. Reservas: chame `pode_reservar` ao criar e ao editar

```python
from rest_framework.exceptions import PermissionDenied
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.permissions.regras_reserva import pode_reservar

if not pode_reservar(request.user, TipoRecursoReservavel.RECURSO_GERAL, recurso.tipo_recurso_id, data, data_devolucao):
    raise PermissionDenied("Você não tem autorização para reservar este recurso nesse período.")
```

| Reserva de | Tipo | `tipo_recurso_id` |
|---|---|---|
| Recurso geral | `TipoRecursoReservavel.RECURSO_GERAL` | `recurso.tipo_recurso_id` |
| Veículo | `TipoRecursoReservavel.VEICULO` | não precisa |
| Área | `TipoRecursoReservavel.AREA` | não precisa |

- Passe em `data` o **dia da retirada** e em `data_fim` o **dia da devolução**. A autorização precisa valer no período da reserva, não só hoje. Em reservas de um dia só, basta a `data`.
- **Ao editar**, confira a autorização do **dono da reserva** (`reserva.usuario`), não de quem está editando. Um admin pode editar a reserva de um aluno, mas o que importa é se o aluno pode reservar aquilo.
- Exemplo pronto: `validar_autorizacao` em `api/validators/reserva_recurso_geral_validator.py`.

Para veículos, somente administradores e servidores autorizados podem reservar. `pode_reservar` exige cobertura contínua de grupo/vínculo em todos os dias da viagem; alunos não recebem essa autorização, inclusive por configurações antigas. Na edição, revalide o dono. No cancelamento, use `validar_cancelamento` de `services/reserva_veiculo_service.py`, que não exige autorização de grupo vigente. Veja [as regras de veículos](RESERVAS_VEICULOS.md).

## Frontend

O `/session/me/` já traz as permissões calculadas, e elas ficam disponíveis em qualquer página:

```jsx
const { usuario } = useOutletContext();
```

```json
{
  "papel": "servidor",
  "permissoes": {
    "administrador": false,
    "criar_grupos_de": ["aluno"],
    "reservar_sem_grupo": ["AREA", "RECURSO_GERAL"]
  },
  "autorizacoes": [
    { "grupo": 12, "grupo_nome": "...", "tipo_recurso_autorizado": "VEICULO", "tipo_recurso": null, "valido_ate": "2026-12-31" }
  ]
}
```

- Use as funções de `src/utils/permissoes.js` (`ehAdministrador`, `podeCriarGrupo`, `podeGerenciarGrupos`) ou leia `usuario.permissoes`.
- **Não** faça `usuario.papel === 'admin'` nas telas. Se a regra mudar no backend, o front acompanha sozinho.
- Esconder um botão não protege nada. Trate o erro **403** da API e mostre a mensagem que vier nele.

## Precisa mudar uma regra?

| Regra | Onde mudar |
|---|---|
| O que cada papel reserva sem grupo | `TIPOS_RESERVA_LIVRE_POR_PAPEL` em `regras_reserva.py` |
| Quem cria qual tipo de grupo | `PAPEIS_QUE_PODEM_CRIAR_POR_TIPO_MEMBRO` em `grupo_permissions.py` |

Mude só ali. O `/me`, as permissões e a validação dos grupos já usam esses valores.

## Checklist antes do PR

- [ ] Toda view nova tem `permission_classes` com uma permissão que herda de `UsuarioAutenticado`
- [ ] Criação e edição de reserva chamam `pode_reservar`
- [ ] Nenhuma comparação `papel == 'admin'`, nem no back nem no front

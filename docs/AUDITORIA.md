# Auditoria: registre as ações nas suas views

**Regra:** toda view que cria, edita, cancela ou exclui algo precisa chamar `registrar_auditoria`. Chame sempre, sem checar papel: a função decide o que vai para o log.

- **Admin:** registra todas as ações, inclusive nos próprios grupos. Só não registra quando o admin mexe na própria reserva.
- **Servidor:** registra apenas as ações em grupos e membros de grupo (criar, editar e excluir grupo; adicionar, alterar e remover membro).
- **Aluno e convidado:** não registra.

Cada log guarda o responsável e o perfil dele no momento da ação (`perfil_responsavel`). Os logs aparecem na tela de Administração, na aba de auditoria, que só o admin acessa.

## Como registrar

```python
from django.db import transaction
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria

with transaction.atomic():
    antes = foto(reserva)
    reserva.status = StatusReserva.CANCELADA
    reserva.save(update_fields=["status"])
    registrar_auditoria(request.user, AcaoAuditoria.CANCELAR, reserva, antes=antes, depois=foto(reserva))
```

| Ação | `AcaoAuditoria` | `antes` | `depois` |
|---|---|---|---|
| Criar | `CRIAR` | não passa | `foto(obj)` depois de salvar |
| Editar | `EDITAR` | `foto(obj)` antes de alterar | `foto(obj)` depois de salvar |
| Cancelar | `CANCELAR` | `foto(obj)` antes de alterar | `foto(obj)` depois de salvar |
| Excluir | `EXCLUIR` | `foto(obj)` antes de excluir | não passa |

- Tire o `antes` **antes** de mudar o objeto e registre dentro do mesmo `transaction.atomic()` da alteração.
- Ação que altera vários registros de uma vez (ex.: cancelar uma série de reservas) registra **um log por registro**.
- Exemplos prontos: `ReservaAreaDetailView` e `AreaDetailView`.

## Já registram sozinhos

Os helpers `criar`, `atualizar` e `remover` de `views/view_helpers.py` já chamam `registrar_auditoria`. Se a view usa eles, não chame de novo.

## Model novo

Adicione o model em `EntidadeAuditoria` (`enumerations/auditoria_enumerations/auditoria_enums.py`) e em `ENTIDADE_POR_MODEL` (`services/auditoria/registro_auditoria_service.py`). Senão, quando um admin alterar esse registro, o `registrar_auditoria` quebra com `KeyError`.

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const RAIZ_FRONTEND = path.resolve(import.meta.dirname, '..');

describe('Gerenciamento de reservas do grupo pelo criador (Frontend)', () => {
  let vite;
  let CardGrupo;

  before(async () => {
    vite = await createServer({
      root: RAIZ_FRONTEND,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
    });

    ({ default: CardGrupo } = await vite.ssrLoadModule('/src/components/Grupos/CardGrupo/CardGrupo.jsx'));
  });

  after(async () => {
    await vite?.close();
  });

  test('unitário: CardGrupo exibe o botão "Ver reservas do grupo" apenas para grupos de alunos', () => {
    const grupoAlunos = {
      id: 1,
      nome: 'Monitoria de Programação',
      tipo_membro_permitido: 'aluno',
      quantidade_membros: 5,
      criador_nome: 'Prof. Silva',
      data_inicio_validade: '2026-03-01',
      data_fim_validade: '2026-12-31',
      tipos_recurso_autorizados: ['area'],
    };

    const htmlAlunos = renderToStaticMarkup(
      React.createElement(CardGrupo, { grupo: grupoAlunos })
    );

    assert.match(htmlAlunos, /Gerenciar membros/);
    assert.match(htmlAlunos, /Ver reservas do grupo/);

    const grupoServidores = {
      id: 2,
      nome: 'Coordenação de Curso',
      tipo_membro_permitido: 'servidor',
      quantidade_membros: 3,
      criador_nome: 'Admin',
      data_inicio_validade: '2026-03-01',
      data_fim_validade: null,
      tipos_recurso_autorizados: ['area'],
    };

    const htmlServidores = renderToStaticMarkup(
      React.createElement(CardGrupo, { grupo: grupoServidores })
    );

    assert.match(htmlServidores, /Gerenciar membros/);
    assert.doesNotMatch(htmlServidores, /Ver reservas do grupo/);
  });
});

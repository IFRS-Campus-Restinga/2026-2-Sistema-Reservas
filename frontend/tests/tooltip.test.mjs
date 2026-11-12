import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const RAIZ_FRONTEND = path.resolve(import.meta.dirname, '..');

describe('Componentes Tooltip e DicaInfo', () => {
  let vite;
  let Tooltip;
  let DicaInfo;

  before(async () => {
    vite = await createServer({
      root: RAIZ_FRONTEND,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
    });

    ({ default: Tooltip } = await vite.ssrLoadModule('/src/components/Tooltip/Tooltip.jsx'));
    ({ default: DicaInfo } = await vite.ssrLoadModule('/src/components/Tooltip/DicaInfo.jsx'));
  });

  after(async () => {
    await vite?.close();
  });

  test('unitário: Tooltip sem texto devolve o elemento filho sem modificá-lo', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Tooltip,
        { texto: '' },
        React.createElement('button', { type: 'button' }, 'Salvar'),
      ),
    );

    assert.equal(html, '<button type="button">Salvar</button>');
  });

  test('unitário: Tooltip com texto e desabilitado=true envolve filho em span focável e acessível', () => {
    const motivo = 'Esta reserva não pode ser editada após o início.';
    const html = renderToStaticMarkup(
      React.createElement(
        Tooltip,
        { texto: motivo, desabilitado: true, className: 'classe-extra' },
        React.createElement('button', { type: 'button', disabled: true }, 'Editar'),
      ),
    );

    assert.match(html, /^<span /);
    assert.match(html, /tabindex="0"/i);
    assert.match(html, /aria-label="Esta reserva não pode ser editada após o início\."/);
    assert.match(html, /classe-extra/);
    assert.match(html, /<button type="button" disabled="">Editar<\/button>/);
  });

  test('unitário: Tooltip com texto e desabilitado=false mantém o próprio filho como gatilho', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Tooltip,
        { texto: 'Editar área' },
        React.createElement('button', { type: 'button', 'aria-label': 'Editar área' }, 'Editar'),
      ),
    );

    assert.doesNotMatch(html, /^<span /);
    assert.equal(html, '<button type="button" aria-label="Editar área">Editar</button>');
  });

  test('unitário: DicaInfo sem texto não renderiza nada', () => {
    const html = renderToStaticMarkup(React.createElement(DicaInfo, { texto: '' }));
    assert.equal(html, '');
  });

  test('unitário: DicaInfo renderiza botão acessível com ícone decorativo e respeita rótulo customizado', () => {
    const htmlPadrao = renderToStaticMarkup(
      React.createElement(DicaInfo, { texto: 'Explicação da regra.' }),
    );
    assert.match(htmlPadrao, /^<button type="button"/);
    assert.match(htmlPadrao, /aria-label="Explicação da regra\."/);
    assert.match(htmlPadrao, /aria-hidden="true"/);

    const htmlRotulo = renderToStaticMarkup(
      React.createElement(DicaInfo, {
        texto: 'Explicação detalhada.',
        rotulo: 'Ajuda sobre vigência',
      }),
    );
    assert.match(htmlRotulo, /aria-label="Ajuda sobre vigência"/);
  });
});

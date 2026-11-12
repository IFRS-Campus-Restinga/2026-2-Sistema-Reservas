import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const RAIZ_FRONTEND = path.resolve(import.meta.dirname, '..');
const PASTA_BUILD = path.resolve(RAIZ_FRONTEND, '../backend/frontend');
const PASTA_ASSETS = path.join(PASTA_BUILD, 'assets');

describe('Carregamento de rotas sob demanda', () => {
  let vite;

  before(async () => {
    vite = await createServer({
      root: RAIZ_FRONTEND,
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'silent',
    });
  });

  after(async () => {
    await vite?.close();
  });

  test('unitário: todas as rotas em rotas.js usam React.lazy e apontam para módulos válidos', async () => {
    const { ITENS_MENU, ROTAS, rotaInicial } = await vite.ssrLoadModule('/src/config/rotas.js');
    const tipoLazy = Symbol.for('react.lazy');

    assert.ok(ROTAS.length >= 11);
    for (const rota of ROTAS) {
      assert.equal(
        rota.componente?.$$typeof,
        tipoLazy,
        `A rota "${rota.id}" (${rota.path}) deveria usar React.lazy`,
      );
      const moduloCarregado = await rota.componente._payload._result();
      assert.equal(
        typeof moduloCarregado.default,
        'function',
        `A rota "${rota.id}" não exporta um componente default válido`,
      );
    }

    assert.ok(ITENS_MENU.length > 0);
    assert.equal(rotaInicial(null), '/calendario');
  });

  test('unitário: CarregandoRota renderiza indicador acessível e ErrorBoundaryRota trata e reseta erro de chunk', async () => {
    const { default: CarregandoRota } = await vite.ssrLoadModule('/src/components/CarregandoRota/CarregandoRota.jsx');
    const { default: ErrorBoundaryRota } = await vite.ssrLoadModule('/src/components/CarregandoRota/ErrorBoundaryRota.jsx');

    const htmlFallback = renderToStaticMarkup(React.createElement(CarregandoRota));
    assert.match(htmlFallback, /role="status"/);
    assert.match(htmlFallback, /Carregando página\.\.\./);

    assert.deepEqual(ErrorBoundaryRota.getDerivedStateFromError(new Error('ChunkLoadError')), {
      falhou: true,
    });

    const instancia = new ErrorBoundaryRota({ chave: '/areas', children: 'ok' });
    instancia.state = { falhou: true };
    const htmlErro = renderToStaticMarkup(instancia.render());
    assert.match(htmlErro, /Não foi possível carregar esta página/);
    assert.match(htmlErro, /Recarregar página/);

    let novoEstado = null;
    instancia.setState = (atualizacao) => {
      novoEstado = atualizacao;
    };
    instancia.props = { chave: '/calendario', children: 'ok' };
    instancia.componentDidUpdate({ chave: '/areas' });
    assert.deepEqual(novoEstado, { falhou: false });
  });

  test('integração: MainLayout e AppRoutes carregam sem erros e build gera chunks separados por rota', async () => {
    const { default: MainLayout } = await vite.ssrLoadModule('/src/layouts/MainLayout.jsx');
    const { default: AppRoutes } = await vite.ssrLoadModule('/src/routes/AppRoutes.jsx');
    assert.equal(typeof MainLayout, 'function');
    assert.equal(typeof AppRoutes, 'function');

    assert.ok(fs.existsSync(path.join(PASTA_BUILD, 'index.html')), 'Build não encontrado; execute npm run build.');
    const htmlIndex = fs.readFileSync(path.join(PASTA_BUILD, 'index.html'), 'utf-8');
    const arquivosAssets = fs.readdirSync(PASTA_ASSETS);
    const arquivosJs = arquivosAssets.filter((arquivo) => arquivo.endsWith('.js'));

    const chunksEsperados = [
      'Home',
      'Calendario',
      'Areas',
      'AreaDetalhe',
      'Veiculos',
      'VeiculoDetalhe',
      'Recursos',
      'MinhasReservas',
      'Notificacoes',
      'Grupos',
      'Administracao',
      'NaoAutenticado',
      'NotFound',
    ];

    for (const nomeChunk of chunksEsperados) {
      const encontrado = arquivosJs.find((arquivo) => arquivo.startsWith(`${nomeChunk}-`));
      assert.ok(encontrado, `Chunk separado não encontrado para a página ${nomeChunk}`);
      assert.equal(
        htmlIndex.includes(encontrado),
        false,
        `O chunk ${encontrado} não deveria ser carregado no index.html inicial`,
      );
    }

    const bundlePrincipal = arquivosJs.find((arquivo) => arquivo.startsWith('index-'));
    assert.ok(bundlePrincipal, 'Bundle principal index-*.js não encontrado');
    const tamanhoBytes = fs.statSync(path.join(PASTA_ASSETS, bundlePrincipal)).size;
    assert.ok(
      tamanhoBytes < 500 * 1024,
      `Bundle principal (${Math.round(tamanhoBytes / 1024)} kB) deveria estar abaixo de 500 kB`,
    );
  });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarDados } from '../src/validar.js';

const validos = () => ({
  data: '10/11/2026',
  local: 'Câmara fria 2 – Bloco B',
  equipamento: 'Compressor da câmara fria',
  tipo: 'corretiva',
  descricao: 'Alarme de alta temperatura, compressor desarmado.',
});

test('dados completos são válidos e recebem os padrões', () => {
  const r = validarDados(validos());
  assert.equal(r.ok, true);
  assert.deepEqual(r.erros, []);
  assert.equal(r.dados.prioridade, 'media');
  assert.equal(r.dados.status, 'aberta');
});

test('campos obrigatórios ausentes geram erro com o rótulo', () => {
  const d = validos();
  delete d.equipamento;
  d.descricao = '   ';
  const r = validarDados(d);
  assert.equal(r.ok, false);
  assert.ok(r.erros.includes('Campo obrigatório ausente: Equipamento'));
  assert.ok(r.erros.some((e) => e.includes('Descrição do problema')));
});

test('data fora do formato DD/MM/AAAA é rejeitada', () => {
  for (const data of ['ontem', '2026-11-10']) {
    const r = validarDados({ ...validos(), data });
    assert.equal(r.ok, false, data);
    assert.ok(r.erros.some((e) => e.includes('DD/MM/AAAA')), data);
  }
});

test('data inexistente é rejeitada', () => {
  const r = validarDados({ ...validos(), data: '31/02/2026' });
  assert.equal(r.ok, false);
  assert.ok(r.erros.some((e) => e.includes('Data')));
});

test('valores com maiúscula e acento são normalizados', () => {
  const r = validarDados({ ...validos(), tipo: 'Corretiva', prioridade: 'Média', status: 'Concluída' });
  assert.equal(r.ok, true, r.erros.join('; '));
  assert.equal(r.dados.tipo, 'corretiva');
  assert.equal(r.dados.prioridade, 'media');
  assert.equal(r.dados.status, 'concluida');
});

test('valor fora da lista mostra os permitidos', () => {
  const r = validarDados({ ...validos(), tipo: 'emergencial' });
  assert.equal(r.ok, false);
  assert.ok(r.erros.some((e) => e.includes('corretiva, preventiva, preditiva')));
});

test('texto maior que o espaço do PDF é recusado em vez de cortado', () => {
  const r = validarDados({ ...validos(), observacoes: 'x'.repeat(451), local: 'L'.repeat(46) });
  assert.equal(r.ok, false);
  assert.ok(r.erros.some((e) => e.includes('Observações') && e.includes('máximo 450')));
  assert.ok(r.erros.some((e) => e.includes('Local / setor') && e.includes('máximo 45')));
});

test('texto no limite é aceito', () => {
  const r = validarDados({ ...validos(), descricao: 'd'.repeat(900), observacoes: 'o'.repeat(450) });
  assert.equal(r.ok, true, r.erros.join('; '));
});

test('texto de preenchimento não conta como campo obrigatório', () => {
  for (const vazio of ['A definir', 'a definir.', 'Não sei', 'N/A', '?', 'desconhecido', 'Não informado', '-']) {
    const r = validarDados({ ...validos(), local: vazio });
    assert.equal(r.ok, false, vazio);
    assert.ok(r.erros.some((e) => e.includes('Local / setor') && e.includes('não é um valor real')), vazio);
  }
});

test('palavras parecidas dentro de um texto real são aceitas', () => {
  const r = validarDados({ ...validos(), local: 'Sala a definir layout – Bloco C', equipamento: 'Bomba N/A-200' });
  assert.equal(r.ok, true, r.erros.join('; '));
});

test('campo desconhecido gera erro', () => {
  const r = validarDados({ ...validos(), cor: 'azul' });
  assert.equal(r.ok, false);
  assert.ok(r.erros.includes('Campo desconhecido: cor'));
});

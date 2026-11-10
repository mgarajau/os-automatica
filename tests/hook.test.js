import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { avaliarComando } from '../scripts/validar-os.js';

const COMANDO = 'node scripts/preencher-os.js saida/dados.json';
const validos = {
  data: '10/11/2026', local: 'Laboratório de Testes', equipamento: 'Estufa 1',
  tipo: 'preventiva', descricao: 'Limpeza e calibração trimestral.',
};

function projeto(conteudo) {
  const pasta = mkdtempSync(join(tmpdir(), 'hook-'));
  mkdirSync(join(pasta, 'saida'));
  if (conteudo !== undefined) writeFileSync(join(pasta, 'saida', 'dados.json'), conteudo);
  return pasta;
}

test('outros comandos passam direto', () => {
  assert.deepEqual(avaliarComando('npm test', projeto()), { bloquear: false });
});

test('JSON válido passa', () => {
  assert.equal(avaliarComando(COMANDO, projeto(JSON.stringify(validos))).bloquear, false);
});

test('aceita o caminho entre aspas', () => {
  const r = avaliarComando('node scripts/preencher-os.js "saida/dados.json"', projeto(JSON.stringify(validos)));
  assert.equal(r.bloquear, false);
});

test('campo obrigatório faltando bloqueia e manda perguntar ao usuário', () => {
  const { local, ...semLocal } = validos;
  const r = avaliarComando(COMANDO, projeto(JSON.stringify(semLocal)));
  assert.equal(r.bloquear, true);
  assert.ok(r.mensagem.includes('Local'));
  assert.ok(r.mensagem.includes('pergunte ao usuário'));
});

test('arquivo inexistente bloqueia', () => {
  const r = avaliarComando(COMANDO, projeto());
  assert.equal(r.bloquear, true);
  assert.ok(r.mensagem.includes('não encontrado'));
});

test('JSON corrompido bloqueia', () => {
  const r = avaliarComando(COMANDO, projeto('{oi'));
  assert.equal(r.bloquear, true);
  assert.ok(r.mensagem.includes('JSON inválido'));
});

test('executado como hook, sai com código 2 quando bloqueia', () => {
  const pasta = projeto(JSON.stringify({ data: '10/11/2026' }));
  const entrada = JSON.stringify({ tool_name: 'Bash', tool_input: { command: COMANDO }, cwd: pasta });
  const r = spawnSync(process.execPath, ['scripts/validar-os.js'], { input: entrada, encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.ok(r.stderr.includes('Equipamento'));
});

test('executado como hook, sai com código 0 em comando comum', () => {
  const entrada = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: projeto() });
  const r = spawnSync(process.execPath, ['scripts/validar-os.js'], { input: entrada, encoding: 'utf8' });
  assert.equal(r.status, 0);
});

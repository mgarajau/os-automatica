import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { proximoNumero } from '../src/numero-os.js';

const pastaTemp = () => mkdtempSync(join(tmpdir(), 'os-'));

test('pasta vazia começa em 0001', () => {
  assert.equal(proximoNumero(pastaTemp(), 2026), 'OS-2026-0001');
});

test('continua a partir do maior número existente', () => {
  const pasta = pastaTemp();
  writeFileSync(join(pasta, 'OS-2026-0001.pdf'), '');
  writeFileSync(join(pasta, 'OS-2026-0007.pdf'), '');
  writeFileSync(join(pasta, 'OS-2025-0099.pdf'), '');
  writeFileSync(join(pasta, 'dados.json'), '');
  assert.equal(proximoNumero(pasta, 2026), 'OS-2026-0008');
});

test('pasta inexistente começa em 0001', () => {
  assert.equal(proximoNumero(join(pastaTemp(), 'nao-existe'), 2026), 'OS-2026-0001');
});

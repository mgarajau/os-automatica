import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { CAMPOS } from '../src/campos.js';
import { gerarModelo } from '../src/modelo.js';
import { preencherOS } from '../src/preencher.js';

const dados = () => ({
  data: '10/11/2026',
  local: 'Câmara fria 2 – Bloco B',
  equipamento: 'Compressor da câmara fria',
  tipo: 'corretiva',
  descricao: 'Alarme de alta temperatura, compressor desarmado.',
  prioridade: 'alta',
  status: 'concluida',
});

const abrirSemAchatar = async (d) => {
  const modelo = await gerarModelo();
  const bytes = await preencherOS(d, 'OS-2026-0001', modelo, { achatar: false });
  return (await PDFDocument.load(bytes)).getForm();
};

test('o modelo tem o campo numero e todos os campos da OS', async () => {
  const pdf = await PDFDocument.load(await gerarModelo());
  const nomes = pdf.getForm().getFields().map((f) => f.getName());
  for (const nome of ['numero', ...CAMPOS.map((c) => c.nome)]) {
    assert.ok(nomes.includes(nome), `falta o campo ${nome}`);
  }
});

test('o PDF final tem 1 página e o formulário achatado', async () => {
  const bytes = await preencherOS(dados(), 'OS-2026-0001', await gerarModelo());
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.equal(pdf.getForm().getFields().length, 0);
});

test('o PDF achatado não aponta para anotações apagadas', async () => {
  const bytes = await preencherOS(dados(), 'OS-2026-0001', await gerarModelo());
  const pdf = await PDFDocument.load(bytes);
  const annots = pdf.getPage(0).node.Annots();
  const refs = annots ? annots.asArray() : [];
  for (const ref of refs) {
    assert.ok(pdf.context.lookup(ref) !== undefined, `referência quebrada: ${ref}`);
  }
});

test('os valores vão para os campos certos', async () => {
  const form = await abrirSemAchatar(dados());
  assert.equal(form.getTextField('equipamento').getText(), 'Compressor da câmara fria');
  assert.equal(form.getTextField('numero').getText(), 'OS-2026-0001');
});

test('valores de lista aparecem com acento e maiúscula no PDF', async () => {
  const form = await abrirSemAchatar({ ...dados(), prioridade: 'media', status: 'concluida', tipo: 'preditiva' });
  assert.equal(form.getTextField('prioridade').getText(), 'Média');
  assert.equal(form.getTextField('status').getText(), 'Concluída');
  assert.equal(form.getTextField('tipo').getText(), 'Preditiva');
});

test('descrição longa não quebra', async () => {
  const bytes = await preencherOS({ ...dados(), descricao: 'Falha intermitente. '.repeat(45) }, 'OS-2026-0001', await gerarModelo());
  assert.ok(bytes.length > 0);
});

test('caracteres que a fonte não suporta são removidos', async () => {
  const form = await abrirSemAchatar({ ...dados(), descricao: 'temp 4°C, ação ok ✓ 🔧' });
  assert.equal(form.getTextField('descricao').getText(), 'temp 4°C, ação ok');
});

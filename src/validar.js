import { CAMPOS } from './campos.js';

const semAcento = (texto) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Limpa os dados: tira espaços, padroniza listas (minúsculas, sem acento) e aplica valores padrão.
export function normalizar(dados) {
  const resultado = {};
  for (const [chave, valor] of Object.entries(dados ?? {})) {
    resultado[chave] = typeof valor === 'string' ? valor.trim() : valor;
  }
  for (const campo of CAMPOS) {
    const valor = resultado[campo.nome];
    if (campo.valores && typeof valor === 'string' && valor !== '') {
      resultado[campo.nome] = semAcento(valor).toLowerCase();
    }
    if (campo.padrao && (valor === undefined || valor === null || valor === '')) {
      resultado[campo.nome] = campo.padrao;
    }
  }
  return resultado;
}

// Textos que "preenchem" um campo sem informar nada. Só conta se for o valor inteiro.
const PREENCHIMENTOS = new Set([
  'a definir', 'definir', 'nao sei', 'nao informado', 'sem informacao', 'desconhecido',
  'indefinido', 'n/a', 'na', 'nd', 'tbd', 'xxx', '?', '-', '...',
]);

function ehPreenchimento(texto) {
  const limpo = semAcento(texto).toLowerCase().replace(/[.!\s]+$/, '').trim();
  return PREENCHIMENTOS.has(limpo) || /^[?\-.\s]+$/.test(limpo);
}

function dataValida(texto) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) return false;
  const [dia, mes, ano] = partes.slice(1).map(Number);
  const d = new Date(ano, mes - 1, dia);
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
}

export function validarDados(dados) {
  const normalizados = normalizar(dados);
  const erros = [];
  const conhecidos = new Set(CAMPOS.map((c) => c.nome));

  for (const chave of Object.keys(normalizados)) {
    if (!conhecidos.has(chave)) erros.push(`Campo desconhecido: ${chave}`);
  }

  for (const campo of CAMPOS) {
    const valor = normalizados[campo.nome];
    const vazio = valor === undefined || valor === null || valor === '';
    if (vazio) {
      if (campo.obrigatorio) erros.push(`Campo obrigatório ausente: ${campo.rotulo}`);
      continue;
    }
    if (typeof valor !== 'string') {
      erros.push(`${campo.rotulo} deve ser um texto`);
      continue;
    }
    if (campo.valores && !campo.valores.includes(valor)) {
      erros.push(`${campo.rotulo} inválido: "${valor}". Use: ${campo.valores.join(', ')}`);
    }
    if (campo.obrigatorio && ehPreenchimento(valor)) {
      erros.push(`${campo.rotulo}: "${valor}" não é um valor real. Pergunte ao usuário o dado correto`);
    }
    if (campo.maximo && valor.length > campo.maximo) {
      erros.push(`${campo.rotulo} muito longo (${valor.length} caracteres, máximo ${campo.maximo}). Resuma o texto`);
    }
    if (campo.nome === 'data' && !dataValida(valor)) {
      erros.push(`Data inválida: "${valor}". Use o formato DD/MM/AAAA com uma data que exista`);
    }
  }

  return { ok: erros.length === 0, erros, dados: normalizados };
}

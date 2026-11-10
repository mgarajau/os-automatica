// Hook PreToolUse do Claude Code.
// Antes de qualquer comando que rode preencher-os.js, confere o JSON da OS.
// Se faltar algo, bloqueia (código 2) e explica ao Claude o que perguntar ao usuário.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validarDados } from '../src/validar.js';

const PADRAO = /preencher-os\.js(?:\s+(?:"([^"]+)"|'([^']+)'|(\S+)))?/;

export function avaliarComando(comando, cwd) {
  const achado = PADRAO.exec(comando ?? '');
  if (!achado) return { bloquear: false };

  const arquivo = achado[1] ?? achado[2] ?? achado[3];
  if (!arquivo) {
    return { bloquear: true, mensagem: 'Informe o arquivo de dados: node scripts/preencher-os.js saida/dados.json' };
  }

  const caminho = resolve(cwd, arquivo);
  if (!existsSync(caminho)) {
    return { bloquear: true, mensagem: `Arquivo de dados não encontrado: ${arquivo}. Grave o JSON antes de gerar a OS.` };
  }

  let dados;
  try {
    dados = JSON.parse(readFileSync(caminho, 'utf8'));
  } catch (erro) {
    return { bloquear: true, mensagem: `JSON inválido em ${arquivo}: ${erro.message}` };
  }

  const { ok, erros } = validarDados(dados);
  if (ok) return { bloquear: false };
  return {
    bloquear: true,
    mensagem:
      'OS bloqueada pelo hook de validação:\n- ' + erros.join('\n- ') +
      '\nNão invente esses dados: pergunte ao usuário, corrija o JSON e tente de novo.',
  };
}

// Executado pelo Claude Code: lê o evento do hook pela entrada padrão.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let entrada = '';
  for await (const pedaco of process.stdin) entrada += pedaco;
  let evento = {};
  try {
    evento = JSON.parse(entrada);
  } catch {
    process.exit(0); // entrada inesperada: não atrapalha outros comandos
  }
  const { bloquear, mensagem } = avaliarComando(evento.tool_input?.command, evento.cwd ?? process.cwd());
  if (bloquear) {
    process.stderr.write(mensagem + '\n');
    process.exit(2);
  }
  process.exit(0);
}

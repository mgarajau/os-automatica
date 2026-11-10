// Uso: node scripts/preencher-os.js saida/dados.json
// Valida os dados, preenche o modelo e salva saida/OS-AAAA-NNNN.pdf
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { validarDados } from '../src/validar.js';
import { gerarModelo } from '../src/modelo.js';
import { proximoNumero } from '../src/numero-os.js';
import { preencherOS } from '../src/preencher.js';

const MODELO = 'modelo/ordem-de-servico.pdf';
const SAIDA = 'saida';

const caminho = process.argv[2];
if (!caminho) {
  console.error('Uso: node scripts/preencher-os.js <arquivo.json>');
  process.exit(1);
}

let dados;
try {
  dados = JSON.parse(readFileSync(caminho, 'utf8'));
} catch (erro) {
  console.error(`Não consegui ler ${caminho}: ${erro.message}`);
  process.exit(1);
}

const { ok, erros, dados: limpos } = validarDados(dados);
if (!ok) {
  console.error('A OS não foi gerada. Corrija os dados:\n- ' + erros.join('\n- '));
  process.exit(1);
}

const modelo = existsSync(MODELO) ? readFileSync(MODELO) : await gerarModelo();
const numero = proximoNumero(SAIDA);
mkdirSync(SAIDA, { recursive: true });
writeFileSync(`${SAIDA}/${numero}.pdf`, await preencherOS(limpos, numero, modelo));
console.log(`OS gerada: ${SAIDA}/${numero}.pdf`);

// Lista única dos campos da ordem de serviço.
// A validação, o modelo do PDF e a skill usam esta mesma lista.
export const CAMPOS = [
  { nome: 'data', rotulo: 'Data', obrigatorio: true },
  { nome: 'local', rotulo: 'Local / setor', obrigatorio: true, maximo: 45 },
  { nome: 'equipamento', rotulo: 'Equipamento', obrigatorio: true, maximo: 60 },
  { nome: 'tipo', rotulo: 'Tipo de manutenção', obrigatorio: true, valores: ['corretiva', 'preventiva', 'preditiva'] },
  { nome: 'descricao', rotulo: 'Descrição do problema', obrigatorio: true, multilinha: true, maximo: 900 },
  { nome: 'tag', rotulo: 'TAG do equipamento', obrigatorio: false, maximo: 28 },
  { nome: 'prioridade', rotulo: 'Prioridade', obrigatorio: false, valores: ['baixa', 'media', 'alta', 'urgente'], padrao: 'media' },
  { nome: 'servico', rotulo: 'Serviço executado', obrigatorio: false, multilinha: true, maximo: 900 },
  { nome: 'tecnico', rotulo: 'Técnico responsável', obrigatorio: false, maximo: 45 },
  { nome: 'status', rotulo: 'Status', obrigatorio: false, valores: ['aberta', 'em andamento', 'concluida'], padrao: 'aberta' },
  { nome: 'observacoes', rotulo: 'Observações', obrigatorio: false, multilinha: true, maximo: 450 },
];
// "maximo" = quantos caracteres cabem na caixa do PDF sem cortar o texto.

// Como os valores das listas aparecem no PDF.
const EXIBICAO = { media: 'Média', concluida: 'Concluída', 'em andamento': 'Em andamento' };

export function exibirValor(valor) {
  return EXIBICAO[valor] ?? valor.charAt(0).toUpperCase() + valor.slice(1);
}

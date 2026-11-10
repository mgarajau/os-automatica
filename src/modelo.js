import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { CAMPOS } from './campos.js';

const AZUL = rgb(0, 0.2, 0.4);
const CINZA = rgb(0.35, 0.35, 0.35);
const BORDA = rgb(0.7, 0.72, 0.75);

const MARGEM = 40;
const LARGURA = 595 - MARGEM * 2; // A4: 595 x 842 pontos
const ESPACO = 10;

// Posição de cada campo: linhas da página, com a fração da largura e a altura do campo.
const LINHAS = [
  [['data', 1 / 4], ['tipo', 1 / 4], ['prioridade', 1 / 4], ['status', 1 / 4]],
  [['local', 1 / 2], ['tecnico', 1 / 2]],
  [['equipamento', 2 / 3], ['tag', 1 / 3]],
  [['descricao', 1, 130]],
  [['servico', 1, 130]],
  [['observacoes', 1, 80]],
];

// Gera o modelo em branco da ordem de serviço, com campos de formulário de verdade (AcroForm).
export async function gerarModelo() {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Ordem de Serviço');
  const pagina = pdf.addPage([595, 842]);
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);
  const form = pdf.getForm();
  const rotulos = Object.fromEntries(CAMPOS.map((c) => [c.nome, c]));

  // Cabeçalho
  pagina.drawRectangle({ x: MARGEM, y: 762, width: LARGURA, height: 50, color: AZUL });
  pagina.drawText('ORDEM DE SERVIÇO', { x: MARGEM + 14, y: 788, size: 18, font: negrito, color: rgb(1, 1, 1) });
  pagina.drawText('Manutenção', { x: MARGEM + 14, y: 772, size: 9, font: fonte, color: rgb(0.85, 0.9, 1) });
  const numero = form.createTextField('numero');
  numero.addToPage(pagina, {
    x: MARGEM + LARGURA - 150, y: 774, width: 136, height: 26,
    font: negrito, textColor: rgb(1, 1, 1), backgroundColor: AZUL, borderWidth: 0,
  });
  numero.setFontSize(13);

  // Campos
  let y = 735;
  for (const linha of LINHAS) {
    const altura = linha[0][2] ?? 22;
    let x = MARGEM;
    linha.forEach(([nome, fracao], i) => {
      const largura = LARGURA * fracao - (linha.length > 1 ? ESPACO * (linha.length - 1) / linha.length : 0);
      const campo = rotulos[nome];
      const titulo = campo.rotulo.toUpperCase() + (campo.obrigatorio ? ' *' : '');
      pagina.drawText(titulo, { x, y, size: 7.5, font: negrito, color: CINZA });
      const caixa = form.createTextField(nome);
      if (campo.multilinha) caixa.enableMultiline();
      caixa.addToPage(pagina, {
        x, y: y - 4 - altura, width: largura, height: altura,
        font: fonte, borderColor: BORDA, borderWidth: 0.8,
      });
      caixa.setFontSize(campo.multilinha ? 9.5 : 10);
      x += largura + (i < linha.length - 1 ? ESPACO : 0);
    });
    y -= altura + 26;
  }

  // Assinaturas
  const largAss = (LARGURA - 40) / 2;
  for (const [i, texto] of ['Técnico responsável', 'Responsável pelo setor'].entries()) {
    const x = MARGEM + i * (largAss + 40);
    pagina.drawLine({ start: { x, y: 70 }, end: { x: x + largAss, y: 70 }, thickness: 0.8, color: CINZA });
    pagina.drawText(texto, { x, y: 58, size: 8, font: fonte, color: CINZA });
  }
  pagina.drawText('* campo obrigatório', { x: MARGEM, y: 30, size: 7, font: fonte, color: CINZA });

  form.updateFieldAppearances(fonte);
  return pdf.save();
}

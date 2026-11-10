import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib';
import { CAMPOS, exibirValor } from './campos.js';

// Remove os caracteres que a fonte do PDF não consegue desenhar (emoji, símbolos raros).
function limparTexto(texto, fonte) {
  const limpo = [...texto].filter((c) => {
    if (c === '\n' || c === '\r') return true;
    try {
      fonte.encodeText(c);
      return true;
    } catch {
      return false;
    }
  });
  return limpo.join('').replace(/[ \t]+$/gm, '').trim();
}

// Preenche o modelo com os dados (já validados) e o número da OS.
// Por padrão "achata" o formulário: o PDF final fica só com o texto, sem campos editáveis.
export async function preencherOS(dados, numero, modeloBytes, { achatar = true } = {}) {
  const pdf = await PDFDocument.load(modeloBytes);
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();

  form.getTextField('numero').setText(numero);
  for (const campo of CAMPOS) {
    const valor = dados[campo.nome];
    if (typeof valor === 'string' && valor !== '') {
      const texto = campo.valores ? exibirValor(valor) : valor;
      form.getTextField(campo.nome).setText(limparTexto(texto, fonte));
    }
  }

  form.updateFieldAppearances(fonte);
  if (achatar) {
    form.flatten();
    removerAnotacoesApagadas(pdf);
  }
  return pdf.save();
}

// O flatten() do pdf-lib apaga os campos, mas a página continua apontando para eles.
// Alguns leitores de PDF reclamam disso, então limpamos essas referências.
function removerAnotacoesApagadas(pdf) {
  for (const pagina of pdf.getPages()) {
    const annots = pagina.node.Annots();
    if (!annots) continue;
    const validas = annots.asArray().filter((ref) => pdf.context.lookup(ref) !== undefined);
    if (validas.length === 0) {
      pagina.node.delete(PDFName.of('Annots'));
    } else {
      pagina.node.set(PDFName.of('Annots'), pdf.context.obj(validas));
    }
  }
}

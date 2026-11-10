import { existsSync, readdirSync } from 'node:fs';

// Próximo número de OS no formato OS-AAAA-NNNN, olhando os PDFs que já existem na pasta.
export function proximoNumero(dirSaida, ano = new Date().getFullYear()) {
  const arquivos = existsSync(dirSaida) ? readdirSync(dirSaida) : [];
  const padrao = new RegExp(`^OS-${ano}-(\\d{4})\\.pdf$`);
  const maior = arquivos.reduce((max, nome) => {
    const m = padrao.exec(nome);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  return `OS-${ano}-${String(maior + 1).padStart(4, '0')}`;
}

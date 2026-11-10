---
name: preencher-os
description: Transforma o relato informal de um técnico de manutenção (texto livre, mensagem, anotação) em uma ordem de serviço em PDF. Use quando o usuário pedir para abrir, registrar ou preencher uma OS, ou colar um relato de manutenção.
---

# Preencher ordem de serviço

Você recebe um relato de manutenção em texto livre e gera a OS em PDF.

## Passo a passo

1. **Extraia só o que está no texto.** Os campos e os valores aceitos estão em
   `src/campos.js`. Nunca invente local, equipamento, data ou técnico.
2. **Datas:** converta para `DD/MM/AAAA`. Se o texto disser "hoje", "ontem" ou
   "segunda", use a data de hoje para calcular e diga ao usuário qual data usou.
3. **Campos obrigatórios** (data, local, equipamento, tipo, descricao): se algum
   não estiver no texto, pergunte ao usuário, todos de uma vez, antes de seguir.
   O tipo pode ser deduzido: algo quebrou → corretiva; rotina planejada →
   preventiva; análise de vibração, termografia ou tendência → preditiva.
4. **Grave** `saida/dados.json` só com os nomes de campo de `src/campos.js`
   (sem `numero`, que é gerado pelo script). Campos opcionais sem informação ficam fora.
5. **Gere o PDF:** `node scripts/preencher-os.js saida/dados.json`
6. **Se o hook bloquear** o comando, a mensagem diz o que falta ou está errado.
   Pergunte ao usuário, corrija o JSON e rode de novo. Não contorne o hook.
7. **Responda** com o caminho do PDF e um resumo curto da OS
   (número, equipamento, tipo, prioridade, status).

## Exemplo

Relato: "câmara fria 2 do bloco B alarmou alta temp hoje 14h, compressor desarmado,
troquei o contator e rearmei, voltou pra 4°C"

```json
{
  "data": "<hoje em DD/MM/AAAA>",
  "local": "Câmara fria 2 – Bloco B",
  "equipamento": "Compressor da câmara fria",
  "tipo": "corretiva",
  "descricao": "Alarme de alta temperatura às 14h. Compressor encontrado desarmado.",
  "servico": "Substituição do contator e rearme do compressor. Temperatura voltou a 4°C.",
  "status": "concluida"
}
```

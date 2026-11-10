# OS Automática: design

## Por quê

Projeto de portfólio para a vaga de estágio em IA da dti digital. A vaga pede
"automatizar trabalho repetitivo usando IA", "formulários em PDF" e "agentes,
skills e hooks com Claude Code". O projeto mostra exatamente isso, de graça,
usando a assinatura do Claude Code que o Matheus já tem, e conta uma história
real: o preenchimento de ordens de serviço que ele via no trabalho de técnico
de automação.

## O que é

Uma **skill do Claude Code** (`/preencher-os`). O técnico cola um texto livre,
por exemplo "câmara fria 3 do almox. alarmou alta temp às 14h, compressor
desarmado, rearmei e troquei o contator, voltou a 4°C", e recebe uma ordem
de serviço em PDF preenchida.

Fluxo:

1. O usuário chama `/preencher-os` e cola o texto.
2. O Claude extrai os campos e grava `saida/dados-<n>.json`.
3. Se faltar um campo obrigatório, o Claude pergunta antes de seguir.
4. O Claude roda `node scripts/preencher-os.js saida/dados-<n>.json`.
5. **Hook (PreToolUse):** antes desse comando rodar, `scripts/validar-os.js`
   confere o JSON. Se faltar um campo obrigatório ou houver um valor
   inválido, o hook bloqueia o comando e diz o que está faltando. O Claude
   então pergunta ao usuário. É a "rede de segurança" contra a IA inventar dados.
6. O script preenche o modelo e salva `saida/OS-<n>.pdf`.

## Campos da OS

| Campo | Obrigatório |
|---|---|
| Número da OS (gerado automaticamente) | sim |
| Data | sim |
| Local / setor | sim |
| Equipamento | sim |
| Tipo: corretiva / preventiva / preditiva | sim |
| Descrição do problema | sim |
| TAG do equipamento | não |
| Prioridade: baixa / média / alta / urgente | não (padrão: média) |
| Serviço executado | não |
| Técnico responsável | não |
| Status: aberta / em andamento / concluída | não (padrão: aberta) |
| Observações | não |

## Decisões

- **Node.js + pdf-lib**: é JavaScript, a linguagem que o Matheus já sabe. É grátis e não precisa de API.
- **O modelo do PDF é gerado por código** (`scripts/criar-modelo.js`), com campos de formulário de verdade (AcroForm). Quem baixa o repositório consegue gerar tudo do zero.
- **Exemplos fictícios** em `exemplos/` (3 textos: corretiva, preventiva e um com campo faltando, para mostrar o hook agindo).
- **README** com o problema, o fluxo, um print do PDF gerado e "como rodar".

## Fora do escopo (por enquanto)

- Interface web e API do Gemini (possível versão 2).
- Ler fotos ou PDFs escaneados (OCR).
- Banco de dados ou histórico de OS.

## Anti-objetivos

- **Nada de dados reais da FUNED/Engetronic** (nomes, salas, equipamentos reais). Tudo fictício.
- A IA nunca pode inventar um campo obrigatório: na dúvida, ela pergunta.

## Abordagens consideradas

1. **Skill + hook no Claude Code**: a escolhida. Custo zero e casa com o texto da vaga.
2. Página web + API do Gemini (grátis): fica para a v2.
3. Modelo local com Ollama: descartado por enquanto, porque depende do hardware e erra mais em português.

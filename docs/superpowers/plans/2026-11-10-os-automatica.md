# OS Automática Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skill do Claude Code `/preencher-os` que transforma texto livre de um técnico em uma ordem de serviço PDF preenchida, com um hook que bloqueia a geração se faltarem dados obrigatórios.

**Architecture:** Lógica pura em `src/` (lista de campos, validação, numeração, preenchimento) testada com `node:test`. Scripts de linha de comando finos em `scripts/` chamam essa lógica. A skill (`.claude/skills/preencher-os/SKILL.md`) orienta o Claude a extrair os campos para `saida/dados.json` e rodar o script. Um hook PreToolUse (`scripts/validar-os.js`) valida o JSON antes do comando rodar.

**Tech Stack:** Node.js 26 (ESM), pdf-lib, node:test (sem dependência de teste extra).

**Spec:** `docs/specs/2026-11-10-os-automatica-design.md`

## Global Constraints

- Somente dados fictícios em exemplos, testes e prints. Nada de FUNED/Engetronic.
- Textos visíveis ao usuário (mensagens, PDF, README, skill) em português.
- Campos obrigatórios: data, local, equipamento, tipo, descricao. O número da OS é gerado pelo script.
- `tipo` ∈ corretiva | preventiva | preditiva. `prioridade` ∈ baixa | media | alta | urgente (padrão: media). `status` ∈ aberta | em andamento | concluida (padrão: aberta).
- Data no formato `DD/MM/AAAA`.
- Número da OS: `OS-AAAA-NNNN` (ano atual, sequência de 4 dígitos baseada nos PDFs já existentes em `saida/`).
- Única dependência de runtime: `pdf-lib`.
- `saida/` e `node_modules/` ficam no `.gitignore`.
- Ajuste em relação ao design: o Claude grava sempre `saida/dados.json` (sobrescrito a cada OS), e o número vai só no PDF.

## Review Focus

1. Data informal ("ontem", "2026-11-10"): deve ser rejeitada com mensagem clara pedindo DD/MM/AAAA, não aceita silenciosamente. Teste na Task 1.
2. Valores enum com maiúscula/acento ("Corretiva", "Média", "Concluída"): devem ser normalizados, não rejeitados. Teste na Task 1.
3. Caracteres fora do WinAnsi (emoji, "✓") no texto: o preenchimento não pode quebrar; o caractere é removido. Teste na Task 2.
4. Descrição longa (800+ caracteres): campo multilinha com fonte automática, sem erro. Teste na Task 2.
5. Hook recebe um comando Bash qualquer, ou o JSON está ausente/corrompido: comando qualquer passa (exit 0); JSON ausente/corrompido bloqueia com mensagem (exit 2). Teste na Task 3.

---

### Task 1: Projeto, campos e validação

**Files:**
- Create: `package.json`, `.gitignore`, `src/campos.js`, `src/validar.js`
- Test: `tests/validar.test.js`

**Interfaces:**
- Produces:
  - `CAMPOS: Array<{ nome: string, rotulo: string, obrigatorio: boolean, valores?: string[], padrao?: string, multilinha?: boolean }>` em `src/campos.js`, na ordem da tabela do spec (sem o número). Nomes: `data, local, equipamento, tipo, descricao, tag, prioridade, servico, tecnico, status, observacoes`. Multilinha: descricao, servico, observacoes.
  - `normalizar(dados: object): object`: aparas de espaços, enums em minúsculas sem acento, aplica padrões.
  - `validarDados(dados: object): { ok: boolean, erros: string[], dados: object }`: chama `normalizar` e devolve os dados normalizados.

- [ ] **Step 1:** `git init`, `npm init -y`, setar `"type": "module"`, scripts `"test": "node --test tests/"`, `"modelo": "node scripts/criar-modelo.js"`; `npm i pdf-lib`; `.gitignore` com `node_modules/` e `saida/`.
- [ ] **Step 2: Testes que falham** em `tests/validar.test.js`:
  - dados completos válidos → `ok === true`, `erros` vazio, `dados.prioridade === 'media'`, `dados.status === 'aberta'`
  - sem `equipamento` e sem `descricao` → `ok === false`, erros contêm `'equipamento'` e `'descricao'` (mensagens com o rótulo, ex.: `"Campo obrigatório ausente: Equipamento"`)
  - `data: 'ontem'` e `data: '2026-11-10'` → erro contendo `'DD/MM/AAAA'`
  - `data: '31/02/2026'` → erro (data inexistente)
  - `tipo: 'Corretiva'`, `prioridade: 'Média'`, `status: 'Concluída'` → `ok`, normalizados para `corretiva`, `media`, `concluida`
  - `tipo: 'emergencial'` → erro listando os valores permitidos
  - campo desconhecido `cor: 'azul'` → erro `"Campo desconhecido: cor"`
- [ ] **Step 3:** Rodar `npm test` → FAIL (módulos não existem).
- [ ] **Step 4:** Implementar `src/campos.js` e `src/validar.js`. Para remover acento: `str.normalize('NFD').replace(/\p{Diacritic}/gu, '')`.
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6:** Commit `feat: campos da OS e validação`.

### Task 2: Modelo do PDF, numeração e preenchimento

**Files:**
- Create: `src/modelo.js`, `src/numero-os.js`, `src/preencher.js`, `scripts/criar-modelo.js`, `scripts/preencher-os.js`
- Test: `tests/preencher.test.js`, `tests/numero-os.test.js`

**Interfaces:**
- Consumes: `CAMPOS`, `validarDados` (Task 1).
- Produces:
  - `gerarModelo(): Promise<Uint8Array>`: PDF A4 com título "ORDEM DE SERVIÇO", um campo de texto AcroForm `numero` e um por item de `CAMPOS` (nome do campo = `nome`), com rótulo impresso ao lado. Campos multilinha com `enableMultiline()` e `setFontSize(0)` (auto).
  - `proximoNumero(dirSaida: string, ano?: number): string`: lê `OS-<ano>-NNNN.pdf` em `dirSaida` (pasta ausente = vazia) e devolve o próximo; ex.: vazio → `OS-2026-0001`.
  - `preencherOS(dados: object, numero: string, modeloBytes: Uint8Array): Promise<Uint8Array>`: preenche e achata (`form.flatten()`); remove caracteres fora do WinAnsi antes de `setText`.
  - CLI `node scripts/criar-modelo.js` → grava `modelo/ordem-de-servico.pdf`.
  - CLI `node scripts/preencher-os.js <caminho-json>` → valida (exit 1 com os erros se inválido), gera o modelo em memória se `modelo/ordem-de-servico.pdf` não existir, grava `saida/<numero>.pdf` e imprime `OS gerada: saida/<numero>.pdf`.

- [ ] **Step 1: Testes que falham**:
  - `proximoNumero` em pasta temporária vazia → `'OS-2026-0001'` (com `ano = 2026`); com `OS-2026-0001.pdf` e `OS-2026-0007.pdf` → `'OS-2026-0008'`; pasta inexistente → `'OS-2026-0001'`
  - `gerarModelo()` → PDF com `getForm().getFields()` contendo `numero` + todos os nomes de `CAMPOS`
  - `preencherOS` com dados válidos → PDF de 1 página e sem campos de formulário (achatado)
  - `preencherOS(..., { achatar: false })` → `getTextField('equipamento').getText()` e `getTextField('numero').getText()` iguais aos valores enviados
  - `descricao` com 900 caracteres → não lança erro
  - `descricao: 'temp 4°C, ação ok ✓ 🔧'` → não lança erro; o texto lido (com `achatar: false`) é `'temp 4°C, ação ok'` sem os símbolos (aparar espaços finais)
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar. Assinatura final: `preencherOS(dados, numero, modeloBytes, { achatar = true } = {})`. Fonte `StandardFonts.Helvetica`; filtro: manter só caracteres que `font.encodeText` aceita (try/catch por caractere).
- [ ] **Step 4:** `npm test` → PASS. Rodar `npm run modelo` e abrir o PDF para conferir o visual.
- [ ] **Step 5:** Commit `feat: modelo de PDF e preenchimento da OS`.

### Task 3: Hook de validação

**Files:**
- Create: `scripts/validar-os.js`, `.claude/settings.json`
- Test: `tests/hook.test.js`

**Interfaces:**
- Consumes: `validarDados` (Task 1).
- Produces: `avaliarComando(comando: string, cwd: string): { bloquear: boolean, mensagem?: string }` exportada de `scripts/validar-os.js`; quando executado diretamente, lê o JSON do hook no stdin (`tool_input.command`, `cwd`), e se `bloquear` escreve `mensagem` no stderr e sai com código 2; senão sai com 0.
- `.claude/settings.json`: `hooks.PreToolUse` com `matcher: "Bash"` e comando `node scripts/validar-os.js`.

- [ ] **Step 1: Testes que falham** (`avaliarComando` com pasta temporária):
  - `'npm test'` → `{ bloquear: false }`
  - `'node scripts/preencher-os.js saida/dados.json'` com JSON válido → `bloquear: false`
  - mesmo comando com JSON sem `local` → `bloquear: true`, mensagem contém `'Local'` e `'pergunte ao usuário'`
  - JSON inexistente → `bloquear: true`, mensagem contém `'não encontrado'`
  - JSON corrompido (`'{oi'`) → `bloquear: true`, mensagem contém `'JSON inválido'`
  - um teste de integração que executa o script com `spawnSync` passando o JSON do hook no stdin e confere `status === 2` no caso inválido
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar. Caminho do JSON: primeiro argumento após `preencher-os.js` no comando, resolvido a partir de `cwd`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: hook que bloqueia OS com dados faltando`.

### Task 4: Skill, exemplos e README

**Files:**
- Create: `.claude/skills/preencher-os/SKILL.md`, `exemplos/01-corretiva.txt`, `exemplos/02-preventiva.txt`, `exemplos/03-faltando-dados.txt`, `README.md`, `docs/exemplo-os.png`

- [ ] **Step 1:** `SKILL.md` com frontmatter `name: preencher-os` e `description` (quando usar: transformar relato de manutenção em OS PDF). Corpo: (1) extrair só o que está no texto, nunca inventar; (2) converter datas relativas usando a data de hoje para DD/MM/AAAA e mostrar a conversão ao usuário; (3) perguntar pelos obrigatórios faltantes antes de gravar; (4) gravar `saida/dados.json` com os nomes de campo exatos de `src/campos.js`; (5) rodar `node scripts/preencher-os.js saida/dados.json`; (6) se o hook bloquear, perguntar ao usuário o que falta e repetir; (7) responder com o caminho do PDF e um resumo da OS.
- [ ] **Step 2:** Três exemplos fictícios (ex.: "Câmara fria 2 – Bloco B", "Laboratório de Testes"), sendo o 03 sem local nem equipamento.
- [ ] **Step 3: Verificação ponta a ponta:** numa sessão do Claude Code aberta na pasta do projeto, rodar `/preencher-os` com o exemplo 01 → PDF em `saida/`; com o exemplo 03 → o Claude pergunta pelos dados faltantes (ou o hook bloqueia). Gerar `docs/exemplo-os.png` a partir do PDF do exemplo 01.
- [ ] **Step 4:** README em português: o problema, como funciona (skill → JSON → hook → PDF), print, estrutura de pastas, como rodar (`npm install`, `npm test`, abrir o Claude Code na pasta e usar `/preencher-os`), próximos passos (v2 web com Gemini).
- [ ] **Step 5:** `npm test` → PASS. Commit `docs: skill, exemplos e README`.
- [ ] **Step 6:** Publicar: com a confirmação do usuário, `gh repo create mgarajau/os-automatica --public --source . --push`.

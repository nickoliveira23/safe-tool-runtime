# Safe Tool Runtime

> Arquitetura de execução determinística com RBAC, Matriz de Risco e Human-in-the-Loop para chamadas de ferramentas (*tool calling*) por agentes de IA.

Repositório de referência para o artigo técnico: **[Tool Calling Seguro: Blindando Sistemas Críticos contra Agentes de IA](https://nickolas.dev/blog/tool-calling-seguro)**.

---

## 🎯 O Problema: O Delegado Confuso (*Confused Deputy*)

Na maioria das implementações ingênuas de agentes, o despachante de ferramentas conecta o LLM diretamente às operações de banco com as credenciais mestras da aplicação:

```typescript
// ⚠️ Anti-pattern comum: despachante cego
async function naiveDispatcher(toolName: string, args: any) {
  const tool = tools[toolName];
  return await tool(args); // Executa com superpoderes sem checar autoridade
}
```

Se um usuário sem permissão no painel pedir ao assistente: *"Apaga o cliente Carlos Silva pra mim"*, o modelo gerará a chamada `delete_contact({ id: "ct_123" })` e o despachante executará a mutação destrutiva sem questionar.

---

## 🛡️ A Solução: Arquitetura com Guardião de Execução

Este projeto implementa um runtime seguro em TypeScript funcional puro (closures/hooks, sem `this`), onde **toda chamada obrigatoriamente passa por 2 barreiras** antes de encostar no banco:

```
[Prompt do Usuário]
        ↓
  [LLM / Agente]
        ↓
   (Tool Call)
        ↓
┌────────────────────────────────────────┐
│           SAFE ENGINE RUNTIME          │
│                                        │
│  1. Barreira RBAC                      │
│     → O operador tem a permissão?      │
│        [NÃO] → PERMISSION_DENIED 🛑    │
│                                        │
│  2. Barreira de Risco & HITL           │
│     → Risco HIGH ou CRITICAL?          │
│        [SIM & sem confirmação]         │
│        → REQUIRES_CONFIRMATION ⚠️      │
│                                        │
│  3. Execução & Auditoria               │
│     → Registra evento no audit log     │
│     → tool.execute(input) 🚀           │
└────────────────────────────────────────┘
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+ (ou LTS recente)
- npm / yarn / pnpm

### Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/nickoliveira23/safe-tool-runtime.git
cd safe-tool-runtime

# 2. Instale as dependências
npm install

# 3. Execute a simulação dos cenários
npm start
```

---

## 🧪 Cenários Simulados

Ao rodar `npm start`, o runtime simula 3 situações reais:

1. **Cenário 1 (Leitura Inofensiva - LOW Risk):**
   - Atendente júnior consulta um lead com `get_contact`.
   - O risco é `LOW`, a permissão é válida $\rightarrow$ status `EXECUTED`.

2. **Cenário 2 (Tentativa de Exclusão - Ataque de Delegado Confuso):**
   - O mesmo júnior pede para deletar o lead com `delete_contact`.
   - A ferramenta exige `crm:contacts:delete`. Como ele não possui essa role, o motor barra $\rightarrow$ status `PERMISSION_DENIED`.

3. **Cenário 3 (Ação Crítica com Human-in-the-Loop):**
   - A Diretora (admin) pede para deletar o lead.
   - Ela tem a permissão, mas o risco é `HIGH`.
   - O motor suspende a mutação $\rightarrow$ status `REQUIRES_CONFIRMATION`.
   - Assim que o front-end envia a confirmação explícita (`isConfirmedByHuman: true`), o motor executa $\rightarrow$ status `EXECUTED`.

4. **Trilha de Auditoria (Audit Trail):**
   - O terminal exibe o histórico auditável de cada tentativa com autor, timestamp, argumentos e decisão do Guardião.

---

## 📂 Estrutura de Pastas

```
safe-tool-runtime/
├── src/
│   ├── tool.ts             # O contrato da Tool (RiskLevel, RBAC, Schema)
│   ├── engine.ts           # A fábrica do Guardião (closures e regras)
│   ├── index.ts            # Script de simulação dos 3 cenários
│   └── tools/
│       ├── getContact.ts    # Tool de leitura (LOW risk)
│       └── deleteContact.ts # Tool de mutação destrutiva (HIGH risk)
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE).

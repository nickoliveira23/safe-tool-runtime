import { createSafeEngine, UserContext } from "./engine";
import { getContactTool } from "./tools/getContact";
import { deleteContactTool } from "./tools/deleteContact";

async function main() {
    console.log("🚀 === SIMULADOR DO RUNTIME DE AGENTES SEGURO (NODE / TS) ===\n");

    // 1. Inicializamos a engine passando as nossas ferramentas
    const engine = createSafeEngine([getContactTool, deleteContactTool]);

    // 2. Definimos dois usuários com permissões diferentes
    const estagiario: UserContext = {
        userId: "usr_junior_01",
        name: "Lucas (Atendente Júnior)",
        role: "support_tier_1",
        permissions: ["crm:contacts:read"], // Só pode LER!
    };

    const diretora: UserContext = {
        userId: "usr_admin_99",
        name: "Mariana (Diretora de Operações)",
        role: "admin",
        permissions: ["*"], // Pode tudo!
    };

    // -------------------------------------------------------------
    // CENÁRIO 1: Estagiário pede para CONSULTAR um lead
    // -------------------------------------------------------------
    console.log("--------------------------------------------------------------");
    console.log("▶️ [CENÁRIO 1] Lucas (Júnior) pede: 'Busca os dados do cliente ct_123'");
    const resp1 = await engine.execute({
        user: estagiario,
        toolName: "get_contact",
        input: { contact_id: "ct_123" },
    });
    console.log(JSON.stringify(resp1, null, 2));

    // -------------------------------------------------------------
    // CENÁRIO 2: Estagiário tenta DELETAR o lead (Ataque / Delegado Confuso)
    // -------------------------------------------------------------
    console.log("\n--------------------------------------------------------------");
    console.log("▶️ [CENÁRIO 2] Lucas (Júnior) pede: 'Apaga o cliente ct_123 pra mim'");
    const resp2 = await engine.execute({
        user: estagiario,
        toolName: "delete_contact",
        input: { contact_id: "ct_123", reason: "Cliente pediu" },
    });
    console.log(JSON.stringify(resp2, null, 2));

    // -------------------------------------------------------------
    // CENÁRIO 3: Mariana (Admin) pede para DELETAR o lead
    // -------------------------------------------------------------
    console.log("\n--------------------------------------------------------------");
    console.log("▶️ [CENÁRIO 3 - PARTE A] Mariana (Admin) pede: 'Apaga o cliente ct_123'");
    console.log("👉 Ela tem permissão de Admin, mas a ferramenta é HIGH risk...");

    const resp3A = await engine.execute({
        user: diretora,
        toolName: "delete_contact",
        input: { contact_id: "ct_123", reason: "Cancelamento de contrato" },
        isConfirmedByHuman: false,
    });
    console.log(JSON.stringify(resp3A, null, 2));

    console.log("\n👉 O sistema suspendeu a ação e abriu um modal de confirmação para Mariana.");
    console.log("👉 Mariana conferiu os dados e clicou em [Confirmar Exclusão]...");

    const resp3B = await engine.execute({
        user: diretora,
        toolName: "delete_contact",
        input: { contact_id: "ct_123", reason: "Cancelamento de contrato" },
        isConfirmedByHuman: true, // Humano aprovou!
    });
    console.log(JSON.stringify(resp3B, null, 2));

    // 3. Imprime a trilha de auditoria completa
    engine.printAuditLog();
}

main().catch(console.error)
import { Tool, successResult, errorResult } from "../tool";

export interface DeleteContactInput {
    contact_id?: string;
    reason?: string;
}

export const deleteContactTool: Tool<DeleteContactInput> = {
    name: "delete_contact",
    description: "Exclui permanentemente um contato da base de dados do CRM. Ação destrutiva e irreversível.",
    riskLevel: "HIGH", // ⚠️ Ação de alto impacto!
    requiredPermissions: ["crm:contacts:delete"],

    parameterSchema: {
        type: "object",
        properties: {
            contact_id: {
                type: "string",
                description: "O ID do contato a ser removido (ex: 'ct_123')",
            },
            reason: {
                type: "string",
                description: "Motivo da exclusão",
            },
        },
        required: ["contact_id"],
    },

    async execute(input) {
        if (!input.contact_id) {
            return errorResult("O campo 'contact_id' é obrigatório para exclusão.");
        }

        // Simula a deleção no banco de dados
        const deleteData = {
            deleted_contact_id: input.contact_id,
            reason: input.reason || "Não informado",
            status: "permanently_deleted",
            deleted_at: new Date().toISOString(),
        };

        return successResult(deleteData);
    },
};
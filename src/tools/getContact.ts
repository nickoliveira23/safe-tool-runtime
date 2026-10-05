import { Tool, successResult, errorResult } from "../tool";

// 1. O tipo dos argumentos que o LLM vai enviar
export interface GetContactInput {
    contact_id?: string;
}

// 2. A tool/ferramenta como um simples objeto tipado
export const getContactTool: Tool<GetContactInput> = {
    name: "get_contact",
    description: "Consulta os dados cadastrais de um contato no CRM a partir do seu ID.",
    riskLevel: "LOW", // Leitura inofensiva
    requiredPermissions: ["crm:contacts:read"],

    parameterSchema: {
        type: "object",
        properties: {
            contact_id: {
                type: "string",
                description: "O ID único do contato no CRM (ex: 'ct_123')",
            },
        },
        required: ["contact_id"],
    },

    async execute(input) {
        if (!input.contact_id) {
            return errorResult("O campo 'contact_id' é obrigatório.");
        }

        if (input.contact_id === "ct_not_found") {
            return errorResult(`Contato com ID '${input.contact_id}' não foi encontrado.
  `);
        }

        // Mock do banco de dados
        const mockContact = {
            id: input.contact_id,
            name: "Carlos Silva",
            email: "carlos.silva@exemplo.com",
            phone: "+5511999998888",
            status: "lead_qualificado",
        };

        return successResult(mockContact);
    },
};
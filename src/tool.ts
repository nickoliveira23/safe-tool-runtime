// 1. Os níveis de risco possíveis
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// 2. O formato padrão de resposta que a tool devolve para o agente
export interface ExecutionResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// 3. O contrato: o que toda ferramenta precisa ter
export interface Tool<TInput = Record<string, unknown>> { 
    // Nome único que o LLM vai chamar (ex: "get_contact")
    name: string;

    // Descrição em linguagem natural para o LLM saber quando usar
    description: string;

    // Grau de periculosidade da ação
    riskLevel: RiskLevel;

    // Permissões de RBAC que o operador precisa ter (ex: ["crm:contacts:delete"])
    requiredPermissions: string[];

    // O JSON Schema dos parâmetros (para a OpenAI/Anthropic validarem os campos)
    parameterSchema: Record<string, unknown>;

    // A função que roda a regra de negócio de verdade
    execute(input: TInput): Promise<ExecutionResult>;
}

// Funções utilitárias auxiliares para padronizar retorno
// Pra entender, aqui nessa linha primeiro <T> é a tipagem genérica que a função recebe. 
export function successResult<T>(data: T): ExecutionResult<T> { 
    return { success: true, data };
}

export function errorResult(error: string): ExecutionResult {
    return { success: false, error };
}
import { Tool, RiskLevel, ExecutionResult } from "./tool";

// 1. Quem é o usuário logado conversando com o agente?
export interface UserContext {
    userId: string;
    name: string;
    role: string;          // Ex: "support_tier_1", "admin"
    permissions: string[]; // Ex: ["crm:contacts:read"] ou ["*"]
}

// 2. Os três estados possíveis após a avaliação do Guardião
export type ExecutionStatus =
    | "EXECUTED"              // Passou por tudo e rodou com sucesso
    | "PERMISSION_DENIED"     // Barrado pelo RBAC
    | "REQUIRES_CONFIRMATION"; // Barrado pelo nível de risco (Human-in-the-Loop)

// 3. Resposta padronizada do Runtime
export interface RuntimeResponse {
    status: ExecutionStatus;
    toolName: string;
    riskLevel?: RiskLevel;
    message: string;
    result?: ExecutionResult;
}

// 4. Registro de auditoria
export interface AuditEvent {
    timestamp: string;
    userId: string;
    userName: string;
    userRole: string;
    toolName: string;
    riskLevel?: RiskLevel;
    status: ExecutionStatus;
    arguments: unknown;
}

// 5. Função utilitária pura: verifica se o usuário tem a permissão necessária
function hasPermission(user: UserContext, requiredPermission: string): boolean {
    return user.permissions.includes(requiredPermission) || user.permissions.
        includes("*");
}

// 6. A FÁBRICA DO RUNTIME (estilo React Hook / Closure pura)
export function createSafeEngine(initialTools: Tool<any>[] = []) {
    // Estado encapsulado no escopo da função (sem 'this')
    const tools = new Map<string, Tool<any>>(initialTools.map((t) => [t.name, t]));
    const auditLog: AuditEvent[] = [];

    // Registra no log de auditoria
    function recordAudit(event: Omit<AuditEvent, "timestamp">) {
        auditLog.push({
            timestamp: new Date().toISOString(),
            ...event,
        });
    }

    // Função principal de execução
    async function execute(params: {
        user: UserContext;
        toolName: string;
        input: unknown;
        isConfirmedByHuman?: boolean;
    }): Promise<RuntimeResponse> {
        const { user, toolName, input, isConfirmedByHuman = false } = params;

        // 1. A ferramenta existe?
        const tool = tools.get(toolName);
        if (!tool) {
            return {
                status: "PERMISSION_DENIED",
                toolName,
                message: `Ferramenta '${toolName}' não existe no catálogo.`,
            };
        }

        // 2. BARREIRA 1: RBAC (Checa permissão do usuário)
        for (const reqPerm of tool.requiredPermissions) {
            if (!hasPermission(user, reqPerm)) {
                recordAudit({
                    userId: user.userId,
                    userName: user.name,
                    userRole: user.role,
                    toolName,
                    riskLevel: tool.riskLevel,
                    status: "PERMISSION_DENIED",
                    arguments: input,
                });

                return {
                    status: "PERMISSION_DENIED",
                    toolName,
                    riskLevel: tool.riskLevel,
                    message: `Acesso negado: o usuário '${user.name}' (${user.role}) não possui a permissão '${reqPerm}' necessária.`,
                };
            }
        }

        // 3. BARREIRA 2: NÍVEL DE RISCO (Human-in-the-Loop)
        if ((tool.riskLevel === "HIGH" || tool.riskLevel === "CRITICAL") &&
            !isConfirmedByHuman) {
            recordAudit({
                userId: user.userId,
                userName: user.name,
                userRole: user.role,
                toolName,
                riskLevel: tool.riskLevel,
                status: "REQUIRES_CONFIRMATION",
                arguments: input,
            });

            return {
                status: "REQUIRES_CONFIRMATION",
                toolName,
                riskLevel: tool.riskLevel,
                message: `⚠️ AÇÃO SUSPENSA: '${toolName}' possui risco ${tool.riskLevel}. Exige confirmação explícita de um operador humano antes de aplicar as alterações.`,
            };
        }

        // 4. Executa a tool
        const result = await tool.execute(input);

        recordAudit({
            userId: user.userId,
            userName: user.name,
            userRole: user.role,
            toolName,
            riskLevel: tool.riskLevel,
            status: "EXECUTED",
            arguments: input,
        });

        return {
            status: "EXECUTED",
            toolName,
            riskLevel: tool.riskLevel,
            message: "Executado com sucesso.",
            result,
        };
    }

    // Imprime o relatório final
    function printAuditLog() {
        console.log("\n📜 ================= TRILHA DE AUDITORIA (AUDIT TRAIL) =================");
        auditLog.forEach((e, idx) => {
            const badge =
                e.status === "EXECUTED" ? "🟢" : e.status === "PERMISSION_DENIED" ? "🔴" :
                    "🟡";

            console.log(
                `[${idx + 1}] ${badge} ${e.timestamp.substring(11, 23)} | User: ${e.
                    userName} (${e.userRole}) | Tool: ${e.toolName} [${e.riskLevel}] | Status: ${e.
                        status} | Args: ${JSON.stringify(e.arguments)}`
            );
        });
        console.
            log("=========================================================================\n");
    }

    return {
        register: (tool: Tool<any>) => tools.set(tool.name, tool),
        execute,
        printAuditLog,
        getAuditLog: () => [...auditLog],
    };
}
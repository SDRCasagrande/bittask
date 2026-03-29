// All available permissions in the system
export const PERMISSIONS = {
    "dashboard.view":       "Ver Dashboard",
    "cet.use":              "Usar CET",
    "simulator.use":        "Usar Simulador",
    "comparator.use":       "Usar Comparativo",
    "clients.view":         "Ver Clientes",
    "clients.manage":       "Gerenciar Clientes",
    "negotiations.view":    "Ver Negociações",
    "negotiations.manage":  "Gerenciar Negociações",
    "users.view":           "Ver Usuários",
    "users.manage":         "Gerenciar Usuários",
    "roles.manage":         "Gerenciar Cargos",
    "settings.view":        "Ver Configurações",
    "reports.export":       "Exportar Relatórios",
    "tasks.use":            "Usar Tarefas",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

// Default roles with their permissions
export const DEFAULT_ROLES = [
    {
        name: "Admin",
        description: "Acesso total ao sistema",
        permissions: Object.keys(PERMISSIONS) as PermissionKey[],
    },
    {
        name: "Consultor",
        description: "Acesso a ferramentas de simulação e clientes",
        permissions: [
            "dashboard.view", "cet.use", "simulator.use", "comparator.use",
            "clients.view", "clients.manage", "negotiations.view", "negotiations.manage",
            "settings.view", "reports.export", "tasks.use",
        ] as PermissionKey[],
    },
    {
        name: "Visualizador",
        description: "Apenas visualização",
        permissions: [
            "dashboard.view", "cet.use", "simulator.use", "comparator.use",
            "clients.view", "negotiations.view", "tasks.use",
        ] as PermissionKey[],
    },
];

export function hasPermission(userPermissions: string[], permission: PermissionKey): boolean {
    return userPermissions.includes(permission);
}

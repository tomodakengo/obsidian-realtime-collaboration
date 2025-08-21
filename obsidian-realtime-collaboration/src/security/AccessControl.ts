export enum Permission {
    READ = 'read',
    WRITE = 'write',
    SHARE = 'share',
    ADMIN = 'admin',
}

export interface SharedFolder {
    id: string
    name: string
    passwordHash: string
    participants: Set<string>
    permissions: Map<string, Permission[]>
}

export function createSharedFolder(init: {
    id: string
    name: string
    passwordHash: string
    participants?: Iterable<string>
    permissions?: Iterable<[string, Permission[]]>
}): SharedFolder {
    return {
        id: init.id,
        name: init.name,
        passwordHash: init.passwordHash,
        participants: new Set(init.participants ?? []),
        permissions: new Map(init.permissions ?? []),
    }
}


export interface Usuario {
    id: number;
    nome_completo: string;
    nome_usuario: string;
    email: string;
    nivel_acesso: string;
    sala_id: number;
    created_at?: string
}
export type NivelAcesso =
  | 'aluno'
  | 'administrador'
  | 'bibliotecario';

export interface Usuario {
  id: number;
  nome_completo: string;
  nome_usuario: string;
  email: string;
  nivel_acesso: NivelAcesso;
  sala_id: number;
  created_at?: string;
}
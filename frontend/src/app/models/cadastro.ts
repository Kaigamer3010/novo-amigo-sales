export interface CadastroModel {
  nome_completo: string;
  nome_usuario: string;
  senha: string;
  confirmarSenha: string;
  nivel_acesso: 'aluno' | 'administrador' | 'bibliotecario' | '';
  codigo_acesso: string;
}
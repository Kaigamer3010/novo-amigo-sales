import { NivelAcesso } from './usuario';

export interface CadastroModel {
  nome_completo: string;
  nome_usuario: string;
  senha: string;
  confirmarSenha: string;
  nivel_acesso: NivelAcesso | '';
  codigo_acesso: string;
}
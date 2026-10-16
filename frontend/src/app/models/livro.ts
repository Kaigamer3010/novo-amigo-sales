export interface Livro {
  id: number;
  titulo: string;
  autores: string | string[];
  ano_publicacao: string;
  sinopse: string;
  imagem: string;
  isbn: string;
  categoria: string | null;
  disponibilidade: string | null;
  quantidade_exemplares: number;
  localizacoes: string | null;
  generos?: string[];
  quantidade_emprestada?: number;
  quantidade_disponivel?: number;
}

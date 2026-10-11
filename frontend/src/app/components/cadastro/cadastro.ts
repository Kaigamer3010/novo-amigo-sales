import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { LoginComponent } from '../login/login';
import { CadastroModel } from '../../models/cadastro';
import { AuthService } from '../../service/auth';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class CadastroComponent {
  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  cadastro: CadastroModel = {
    nome_completo: '',
    nome_usuario: '',
    senha: '',
    confirmarSenha: '',
    nivel_acesso: '',
    codigo_acesso: ''
  };

  mensagem = '';
  tipoMensagem: 'erro' | 'sucesso' = 'erro';
  carregando = false;

  abrirLogin(): void {
    this.dialog.closeAll();

    this.dialog.open(LoginComponent, {
      width: '400px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'login-dialog'
    });
  }

  cadastrar(): void {
    if (this.carregando) {
      return;
    }

    this.mensagem = '';
    this.tipoMensagem = 'erro';

    // Validar os campos obrigatórios.
    if (
      !this.cadastro.nome_completo.trim() ||
      !this.cadastro.nome_usuario.trim() ||
      !this.cadastro.senha ||
      !this.cadastro.nivel_acesso ||
      !this.cadastro.codigo_acesso.trim() ||
      !this.cadastro.confirmarSenha
    ) {
      this.mensagem = 'Preencha todos os campos.';
      return;
    }

    // Validar o tamanho da senha.
    if (this.cadastro.senha.length < 6) {
      this.mensagem = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    // Confirmar se as senhas são iguais.
    if (this.cadastro.senha !== this.cadastro.confirmarSenha) {
      this.mensagem = 'As senhas não coincidem.';
      return;
    }

    // Preparar os dados enviados ao Laravel.
    const dados = {
      nome_completo: this.cadastro.nome_completo.trim(),
      nome_usuario: this.cadastro.nome_usuario.trim(),
      senha: this.cadastro.senha,
      nivel_acesso: this.cadastro.nivel_acesso,
      codigo_acesso: this.cadastro.codigo_acesso.trim()
    };

    this.carregando = true;

    this.authService.cadastrar(dados)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (resposta) => {
          console.log('Cadastro realizado:', resposta);

          this.tipoMensagem = 'sucesso';
          this.mensagem = 'Cadastro realizado com sucesso!';

          // Limpar os campos sensíveis após o cadastro.
          this.cadastro.senha = '';
          this.cadastro.confirmarSenha = '';
          this.cadastro.codigo_acesso = '';
        },

        error: (erro) => {
          console.error(
            'Erro no cadastro:',
            erro.status,
            erro.error
          );

          this.tipoMensagem = 'erro';

          if (erro.status === 422) {
            const mensagemServidor = erro.error?.erro;
            const errosValidacao = erro.error?.errors;

            if (errosValidacao) {
              const mensagens = Object.values(errosValidacao).flat();
              const textoErros = mensagens
                .map((mensagem) => String(mensagem).toLowerCase());

              // Nome de usuário já cadastrado.
              if (
                textoErros.some((texto) =>
                  texto.includes('already been taken') ||
                  texto.includes('nome_usuario') ||
                  texto.includes('nome de usuário')
                ) ||
                mensagemServidor === 'Usuário já existente'
              ) {
                this.mensagem =
                  'Este nome de usuário já está em uso. Escolha outro.';
              } else {
                this.mensagem = mensagens
                  .map((mensagem) => this.traduzirErro(String(mensagem)))
                  .join(' ');
              }
            } else if (
              mensagemServidor === 'Código de autoridade inválido' ||
              mensagemServidor === 'Código de sala inválido'
            ) {
              this.mensagem =
                'Código de acesso inválido. Confira o código e tente novamente.';
            } else if (mensagemServidor === 'Usuário já existente') {
              this.mensagem =
                'Este nome de usuário já está em uso. Escolha outro.';
            } else {
              this.mensagem = mensagemServidor ||
                'Confira os dados informados e tente novamente.';
            }
          } else if (erro.status === 0) {
            this.mensagem =
              'Não foi possível conectar ao servidor. Verifique se o Laravel está funcionando.';
          } else {
            this.mensagem =
              erro.error?.erro ||
              'Não foi possível realizar o cadastro. Tente novamente.';
          }
        }
      });
  }

  private traduzirErro(erro: string): string {
    const texto = erro.toLowerCase();

    if (texto.includes('already been taken')) {
      return 'Este nome de usuário já está em uso. Escolha outro.';
    }

    if (texto.includes('required')) {
      return 'Preencha todos os campos obrigatórios.';
    }

    if (texto.includes('at least 6 characters')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }

    return erro;
  }
}
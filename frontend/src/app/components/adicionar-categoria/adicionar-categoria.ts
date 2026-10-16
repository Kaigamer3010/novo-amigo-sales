
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef
} from '@angular/material/dialog';

@Component({
    selector: 'app-adicionar-categoria',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './adicionar-categoria.html',
    styleUrl: './adicionar-categoria.css',
})
export class AdicionarCategoria {

    gerenciarCategorias(): void {
        this.dialogRef.close({
            acao: 'gerenciar'
        });
    }

    nomeCategoria = '';
    erro = '';

    private dialogRef = inject(MatDialogRef<AdicionarCategoria>);
    private dialog = inject(MatDialog);

    data = inject<{ categorias: string[] }>(MAT_DIALOG_DATA);

    salvarCategoria(): void {
        const nome = this.nomeCategoria.trim();

        if (!nome) {
            this.erro = 'Digite o nome da categoria.';
            return;
        }

        const jaExiste = this.data.categorias.some(
            categoria => categoria.toLocaleLowerCase() === nome.toLocaleLowerCase()
        );

        if (jaExiste) {
            this.erro = 'Essa categoria já foi cadastrada.';
            return;
        }

        this.dialogRef.close({
            acao: 'adicionar',
            nome
        });
    }

    cancelar(): void {
        this.dialogRef.close();
    }
}

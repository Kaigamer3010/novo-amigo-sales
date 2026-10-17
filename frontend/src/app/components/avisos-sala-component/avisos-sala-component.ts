import { Component, input } from '@angular/core';

@Component({
  selector: 'app-avisos-sala-component',
  imports: [],
  templateUrl: './avisos-sala-component.html',
  styleUrl: './avisos-sala-component.css',
})
export class AvisosSalaComponent {

    titulo = input<string>('');
    descricao = input<string>('');

}

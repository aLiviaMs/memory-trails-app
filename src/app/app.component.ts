// Angular
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Components
import { MenuComponent } from './components/menu/menu.component';

// Models
import { EnumMenuPosition } from './components/menu/models/enums';
import { IMenuConfig, IMenuItem } from './components/menu/models/interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Minha Aplicação';

  // Configuração do menu
  menuConfig: IMenuConfig = {
    title: 'Navegação Principal'
  };

  // Itens do menu
  menuItems: IMenuItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'pi-chart-line'
    },
    {
      label: 'Usuários',
      route: '/usuarios',
      icon: 'pi-users'
    },
    {
      label: 'Produtos',
      route: '/produtos',
      icon: 'pi-box'
    },
    {
      label: 'Relatórios',
      route: '/relatorios',
      icon: 'pi-file-pdf'
    },
    {
      label: 'Configurações',
      route: '/configuracoes',
      icon: 'pi-cog'
    },
    {
      label: 'Perfil',
      route: '/perfil',
      icon: 'pi-user'
    }
  ];

  // Posição do menu
  menuPosition: EnumMenuPosition = EnumMenuPosition.LEFT;
}

// Angular
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

// Libraries
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

// Components
import { MenuComponent } from './components/menu/menu.component';

// Models
import { IMenuItem } from './components/menu/interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit, OnDestroy {
  /**
   * Reference to the menu component
   */
  @ViewChild('menuComponent') public menuComponent!: MenuComponent;

  /**
   * Current page title displayed in header
   */
  public currentPageTitle = 'Diary';

  /**
   * Whether the menu is currently open
   */
  public isMenuOpen = false;

  /**
   * Title displayed in the menu header
   */
  public menuTitle = 'Navigation';

  /**
   * Array of menu items configuration
   */
  public menuItems: IMenuItem[] = [
    {
      label: 'Diary',
      icon: 'pi pi-book',
      route: '/diary',
      isDefault: true
    },
    {
      label: 'Photos',
      icon: 'pi pi-images',
      route: '/photos'
    }
  ];

  /**
   * Subject for component destruction
   */
  private readonly _destroy$ = new Subject<void>();

  constructor(private readonly _router: Router) {}

  public ngAfterViewInit(): void {
    this._setupRouterListener();
    this._updatePageTitle(this._router.url);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Handles menu toggle event
   *
   * @param isOpen - Whether the menu is open
   */
  public onMenuToggled(isOpen: boolean): void {
    this.isMenuOpen = isOpen;
  }

  /**
   * Handles menu item click event
   *
   * @param item - The clicked menu item
   */
  public onMenuItemClicked(item: IMenuItem): void {
    console.log('Menu item clicked', { item: item.label, route: item.route });
  }

  /**
   * Handles menu closed event
   */
  public onMenuClosed(): void {
    console.log('Menu closed');
  }

  /**
   * Toggles menu programmatically
   */
  public toggleMenuProgrammatically(): void {
    if (!this.menuComponent) {
      console.warn('Menu component not available');
      return;
    }

    if (this.menuComponent.isMenuOpen()) {
      this.menuComponent.closeMenu();
    } else {
      this.menuComponent.openMenu();
    }
  }

  /**
   * Opens menu programmatically
   */
  public openMenu(): void {
    if (this.menuComponent) {
      this.menuComponent.openMenu();
    }
  }

  /**
   * Closes menu programmatically
   */
  public closeMenu(): void {
    if (this.menuComponent) {
      this.menuComponent.closeMenu();
    }
  }

  /**
   * Sets up router navigation listener to update page title
   */
  private _setupRouterListener(): void {
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this._updatePageTitle(event.url);
      });
  }

  /**
   * Updates the current page title based on the URL
   *
   * @param url - Current route URL
   */
  private _updatePageTitle(url: string): void {
    const menuItem = this.menuItems.find(item =>
      item.route === url || (url === '/' && item.isDefault)
    );

    this.currentPageTitle = menuItem?.label ?? 'App';
  }
}

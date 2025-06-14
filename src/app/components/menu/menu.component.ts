// Angular
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

// PrimeNG
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';

// Libraries
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

// Models
import { EnumBreakpoint } from '../../common/enums';
import { EnumMenuState } from './enums';
import { IMenuItem } from './interfaces';

/**
 * Reveal Menu Component
 *
 * A responsive sidebar menu component that slides in from the left side
 * with smooth animations and mobile-friendly behavior.
 *
 * @example
 * <app-menu
 *   [menuItems]="items"
 *   [menuTitle]="'Navigation'"
 *   [showFooter]="true"
 *   (menuToggled)="onMenuToggle($event)"
 *   (itemClicked)="onItemClick($event)">
 * </app-menu>
 */
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    MenuModule,
    ButtonModule,
    SidebarModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, OnDestroy {
  /**
   * Array of menu items to display
   */
  @Input() public menuItems: IMenuItem[] = [];

  /**
   * Title displayed in the menu header
   */
  @Input() public menuTitle: string = '';

  /**
   * Icon for the toggle button
   */
  @Input() public toggleIcon: string = 'pi pi-bars';

  /**
   * Whether to show the footer section
   */
  @Input() public showFooter: boolean = false;

  /**
   * Whether the menu should be modal on mobile devices
   */
  @Input() public modalOnMobile: boolean = true;

  /**
   * Whether to auto-close menu after item click on mobile
   */
  @Input() public autoCloseOnMobile: boolean = true;

  /**
   * Emitted when menu visibility changes
   */
  @Output() public menuToggled = new EventEmitter<boolean>();

  /**
   * Emitted when a menu item is clicked
   */
  @Output() public itemClicked = new EventEmitter<IMenuItem>();

  /**
   * Emitted when menu is closed
   */
  @Output() public menuClosed = new EventEmitter<void>();

  /**
   * Current visibility state of the menu
   */
  public isVisible = false;

  /**
   * PrimeNG menu items array
   */
  public primeMenuItems: MenuItem[] = [];

  /**
   * Current menu state
   */
  public menuState: EnumMenuState = EnumMenuState.CLOSED;

  /**
   * Whether the current device is mobile
   */
  protected isMobile = false;

  /**
   * Subject for component destruction
   */
  private readonly _destroy$ = new Subject<void>();

  constructor(private readonly _router: Router) {}

  public ngOnInit(): void {
    this._setupMenuItems();
    this._setupRouterListener();
    this._checkMobileDevice();
    this._setupResizeListener();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Toggles the menu visibility
   */
  public toggleMenu(): void {
    this.isVisible = !this.isVisible;
    this.menuState = this.isVisible ? EnumMenuState.OPEN : EnumMenuState.CLOSED;
    this.menuToggled.emit(this.isVisible);
  }

  /**
   * Opens the menu programmatically
   */
  public openMenu(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.menuState = EnumMenuState.OPEN;
      this.menuToggled.emit(true);
    }
  }

  /**
   * Closes the menu programmatically
   */
  public closeMenu(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.menuState = EnumMenuState.CLOSED;
      this.menuToggled.emit(false);
    }
  }

  /**
   * Returns whether the menu is currently open
   */
  public isMenuOpen(): boolean {
    return this.isVisible;
  }

  /**
   * Handles menu hide event from PrimeNG sidebar
   */
  public onMenuHide(): void {
    this.isVisible = false;
    this.menuState = EnumMenuState.CLOSED;
    this.menuToggled.emit(false);
    this.menuClosed.emit();
  }

  /**
   * Sets up the menu items for PrimeNG menu component
   */
  private _setupMenuItems(): void {
    this.primeMenuItems = this.menuItems.map(item => ({
      label: item.label,
      icon: item.icon,
      routerLink: item.route,
      command: () => this._onItemClick(item),
      styleClass: this._isActiveRoute(item.route) ? 'active-route' : ''
    }));
  }

  /**
   * Sets up router navigation listener
   */
  private _setupRouterListener(): void {
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this._updateActivEnumMenuItem(event.url);
      });
  }

  /**
   * Checks if the current device is mobile
   */
  private _checkMobileDevice(): void {
    this.isMobile = window.innerWidth <= EnumBreakpoint.MOBILE;
  }

  /**
   * Sets up window resize listener
   */
  private _setupResizeListener(): void {
    window.addEventListener('resize', () => {
      this._checkMobileDevice();
    });
  }

  /**
   * Handles menu item click
   */
  private _onItemClick(item: IMenuItem): void {
    this.itemClicked.emit(item);

    if (this.autoCloseOnMobile && this.isMobile) {
      setTimeout(() => {
        this.closeMenu();
      }, 150);
    }
  }

  /**
   * Updates the active menu item based on current route
   */
  private _updateActivEnumMenuItem(url: string): void {
    // Remove active class from all items
    this.primeMenuItems.forEach(item => {
      if (item.styleClass) {
        item.styleClass = item.styleClass.replace('active-route', '').trim();
      }
    });

    // Add active class to current item
    const activeItem = this.primeMenuItems.find(item => {
      const routerLink = Array.isArray(item.routerLink) ? item.routerLink[0] : item.routerLink;
      return routerLink === url || this._isDefaultRoute(url, routerLink);
    });

    if (activeItem) {
      activeItem.styleClass = (activeItem.styleClass ?? '') + ' active-route';
    }
  }

  /**
   * Checks if the given route is currently active
   */
  private _isActiveRoute(route: string): boolean {
    const currentUrl = this._router.url;
    return currentUrl === route || this._isDefaultRoute(currentUrl, route);
  }

  /**
   * Checks if the current URL matches the default route
   */
  private _isDefaultRoute(currentUrl: string, itemRoute: string): boolean {
    const defaultItem = this.menuItems.find(item => item.isDefault);
    return currentUrl === '/' && defaultItem?.route === itemRoute;
  }
}

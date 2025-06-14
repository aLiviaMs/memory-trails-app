export interface IMenuConfig {
  title?: string;
  toggleIcon?: string;
  showFooter?: boolean;
  modalOnMobile?: boolean;
  autoCloseOnMobile?: boolean;
  customStyles?: {
    toggleTop?: string;
    toggleLeft?: string;
    toggleSize?: string;
    menuWidth?: string;
    menuBackground?: string;
  };
}

export type PrinterProtocol = 'ESC_POS';

export type PrinterConnection = 'bluetooth' | 'wifi' | 'usb' | 'lan';

export interface PrinterProfile {
  readonly brand: string;
  readonly model: string;
  readonly paperWidth: 58 | 80;
  readonly charsPerLine: number;
  readonly protocol: PrinterProtocol;
  readonly connection: PrinterConnection;
  readonly supportsCut: boolean;
  readonly supportsDrawer: boolean;
  readonly supportsQr: boolean;
  readonly supportsLogo: boolean;
}

export const BLUEPRINT_BP_ECO58: PrinterProfile = {
  brand: 'Blueprint',
  model: 'BP-ECO58',
  paperWidth: 58,
  charsPerLine: 32,
  protocol: 'ESC_POS',
  connection: 'bluetooth',
  supportsCut: false,
  supportsDrawer: false,
  supportsQr: true,
  supportsLogo: true,
};

export function getPrinterProfile(profileId = 'blueprint-bp-eco58'): PrinterProfile {
  switch (profileId) {
    case 'blueprint-bp-eco58':
    default:
      return BLUEPRINT_BP_ECO58;
  }
}

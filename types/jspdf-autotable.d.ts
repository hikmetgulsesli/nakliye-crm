declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    head?: string[][];
    body?: string[][];
    startY?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    theme?: 'striped' | 'grid' | 'plain';
    styles?: {
      font?: string;
      fontStyle?: string;
      fontSize?: number;
      cellPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
      lineColor?: number[] | string;
      lineWidth?: number;
      lineHeight?: number;
      fillColor?: number[] | string | boolean;
      textColor?: number[] | string;
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
      minCellHeight?: number;
      minCellWidth?: number;
    };
    headStyles?: {
      fillColor?: number[] | string;
      textColor?: number[] | string;
      fontStyle?: string;
      lineWidth?: number;
    };
    bodyStyles?: {
      fillColor?: number[] | string;
      textColor?: number[] | string;
    };
    alternateRowStyles?: {
      fillColor?: number[] | string;
    };
    columnStyles?: {
      [key: string]: {
        cellWidth?: 'auto' | 'wrap' | number;
        minCellWidth?: number;
        halign?: 'left' | 'center' | 'right';
      };
    };
    didDrawPage?: (data: { pageNumber: number; pageCount: number }) => void;
    willDrawCell?: (data: { row: { index: number }; column: { index: number }; cell: { x: number; y: number } }) => void;
  }

  function autoTable(doc: jsPDF, options: AutoTableOptions): void;

  export default autoTable;
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { ExpenseCalculation, TravelInfo, TransportInfo, OtherExpense } from '@/types/expense';

const formatTimeToAMPM = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const getDayLabel = (isFirstDay: boolean, isLastDay: boolean, isFullDay: boolean): string => {
  if (isFirstDay && isLastDay) return 'Einzeltag';
  if (isFirstDay) return 'Anreisetag';
  if (isLastDay) return 'Abreisetag';
  return 'Ganztag';
};

export const generateExpensePDF = (
  calculation: ExpenseCalculation,
  travelInfo: TravelInfo,
  transportInfo: TransportInfo | null,
  otherExpenses: OtherExpense[] = [],
  companyLogo?: string
) => {
  const doc = new jsPDF();
  const { travelerName, purpose, destination, country, departureDate, departureTime, arrivalDate, arrivalTime } = travelInfo;

  // Parse country to get display name and rate info
  const countryParts = country?.split('|') || [''];
  const countryName = countryParts[0] || country || '';

  // Get rate info for header
  const fullDayRate = calculation.dayBreakdown[0]?.basePerDiem || 0;
  const partialRate = fullDayRate / 2; // Approximate partial rate

  let startY = 14;

  // Logo if available (larger size)
  if (companyLogo) {
    try {
      doc.addImage(companyLogo, 'JPEG', 14, 10, 60, 30);
      startY = 45;
    } catch (e) {
      console.error("Error adding logo", e);
    }
  }

  // Title (German only)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Reisekostenabrechnung', 14, startY);

  // Document info (German only)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dokument: ${calculation.documentName}`, 14, startY + 8);
  doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy')}`, 14, startY + 14);

  // Travel Information Section (German only)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Reiseinformationen', 14, startY + 26);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const travelInfoLines = [
    `Reisender: ${travelerName}`,
    `Reisezweck: ${purpose}`,
    `Reiseziel: ${destination}, ${countryName}`,
    `Abfahrt: ${format(departureDate, 'dd.MM.yyyy')} ${formatTimeToAMPM(departureTime)}`,
    `Ankunft: ${format(arrivalDate, 'dd.MM.yyyy')} ${formatTimeToAMPM(arrivalTime)}`,
  ];

  let infoY = startY + 34;
  travelInfoLines.forEach((line) => {
    doc.text(line, 14, infoY);
    infoY += 6;
  });

  // Transport Costs Section (German only)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Fahrtkosten', 14, infoY + 6);

  const transportData: string[][] = [];
  if (transportInfo) {
    if (transportInfo.type === 'car' && transportInfo.kilometers) {
      const routeText = transportInfo.route ? ` (${transportInfo.route})` : '';
      transportData.push([
        `PKW${routeText}`,
        `${transportInfo.kilometers} km × 0,30 €`,
        `${(transportInfo.kilometers * 0.30).toFixed(2)} €`
      ]);
    }
    if (transportInfo.otherCosts && transportInfo.otherCosts > 0) {
      const typeLabels: Record<string, string> = {
        'public': 'ÖPNV',
        'plane': 'Flug',
        'other': 'Sonstige'
      };
      transportData.push([
        typeLabels[transportInfo.type] || 'Sonstige',
        '',
        `${transportInfo.otherCosts.toFixed(2)} €`
      ]);
    }
  }

  if (transportData.length === 0) {
    transportData.push(['Keine Fahrtkosten', '', '0,00 €']);
  }

  autoTable(doc, {
    startY: infoY + 10,
    head: [['Art', 'Berechnung', 'Betrag']],
    body: transportData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [100, 100, 100], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40, halign: 'right' }
    }
  });

  // Other Expenses Section
  let otherExpensesY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Sonstige Kosten', 14, otherExpensesY);

  const expensesData: string[][] = otherExpenses.length > 0
    ? otherExpenses.map(e => [
        e.description,
        e.receiptFileName ? e.receiptFileName : 'Kein Beleg',
        `${e.amount.toFixed(2)} €`
      ])
    : [['Keine sonstigen Kosten', '', '0,00 €']];

  autoTable(doc, {
    startY: otherExpensesY + 4,
    head: [['Beschreibung', 'Beleg', 'Betrag']],
    body: expensesData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [100, 100, 100], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40, halign: 'right' }
    }
  });

  // Other expenses total
  if (otherExpenses.length > 0) {
    const expensesSumY = (doc as any).lastAutoTable.finalY + 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Summe: ${calculation.otherExpensesTotal.toFixed(2)} €`, 14, expensesSumY + 4);
  }

  // Per Diem Section (German only)
  let perDiemY = (doc as any).lastAutoTable.finalY + (otherExpenses.length > 0 ? 14 : 10);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');

  // Get per diem rates for display
  const rates = calculation.dayBreakdown.length > 0 
    ? `${countryName}: ${calculation.dayBreakdown.find(d => d.isFullDay)?.basePerDiem || calculation.dayBreakdown[0]?.basePerDiem || 0}€/${calculation.dayBreakdown[0]?.basePerDiem || 0}€`
    : '';
  doc.text(`Verpflegungsmehraufwand (${rates})`, 14, perDiemY);

  const dailyRows = calculation.dayBreakdown.map((day) => [
    format(day.date, 'dd.MM.yyyy', { locale: de }),
    getDayLabel(day.isFirstDay, day.isLastDay, day.isFullDay),
    `${day.hours}h`,
    `${day.basePerDiem.toFixed(2)} €`,
    day.mealDeduction > 0 ? `- ${day.mealDeduction.toFixed(2)} €` : '-',
    `${day.netPerDiem.toFixed(2)} €`
  ]);

  autoTable(doc, {
    startY: perDiemY + 4,
    head: [['Datum', 'Tag', 'Stunden', 'Tagessatz', 'Kürzung', 'Netto']],
    body: dailyRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' }
    }
  });

  // Summary Section (German only)
  let summaryY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Zusammenfassung', 14, summaryY);

  const summaryLines = [
    `Fahrtkosten: ${calculation.transportCost.toFixed(2)} €`,
    `Sonstige Kosten: ${calculation.otherExpensesTotal.toFixed(2)} €`,
    `Verpflegungsmehraufwand: ${calculation.totalPerDiem.toFixed(2)} €`,
    `Kürzung für Mahlzeiten: - ${calculation.totalMealDeduction.toFixed(2)} €`,
    `Tagegeld (netto): ${calculation.netPerDiem.toFixed(2)} €`,
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  summaryY += 8;
  summaryLines.forEach((line) => {
    doc.text(line, 14, summaryY);
    summaryY += 6;
  });

  // Total Amount (highlighted) - German only
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(12, summaryY, 100, 10, 'F');
  doc.text(`Gesamtbetrag: ${calculation.totalAmount.toFixed(2)} €`, 14, summaryY + 7);

  // Signature Section (German only)
  summaryY += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Unterschrift Reisender:', 14, summaryY);
  doc.line(14, summaryY + 10, 90, summaryY + 10);

  doc.text('Unterschrift Genehmigung:', 110, summaryY);
  doc.line(110, summaryY + 10, 186, summaryY + 10);

  // Footer (German only)
  const footerY = summaryY + 25;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Erstellt gemäß deutschen Reisekostenrichtlinien', 14, footerY);

  // Save the PDF
  doc.save(`${calculation.documentName}.pdf`);
};

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
  if (isFirstDay && isLastDay) return 'Einzeltag / Single Day';
  if (isFirstDay) return 'Anreisetag / Departure';
  if (isLastDay) return 'Abreisetag / Return';
  return 'Ganztag / Full Day';
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

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Reisekostenabrechnung / Travel Expense Report', 14, startY);

  // Document info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dokument / Document: ${calculation.documentName}`, 14, startY + 8);
  doc.text(`Erstellt am / Created on: ${format(new Date(), 'dd.MM.yyyy')}`, 14, startY + 14);

  // Travel Information Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Reiseinformationen / Travel Information', 14, startY + 26);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const travelInfoLines = [
    `Reisender / Traveler: ${travelerName}`,
    `Reisezweck / Purpose: ${purpose}`,
    `Reiseziel / Destination: ${destination}, ${countryName}`,
    `Abfahrt / Departure: ${format(departureDate, 'dd.MM.yyyy')} ${formatTimeToAMPM(departureTime)}`,
    `Ankunft / Arrival: ${format(arrivalDate, 'dd.MM.yyyy')} ${formatTimeToAMPM(arrivalTime)}`,
  ];

  let infoY = startY + 34;
  travelInfoLines.forEach((line) => {
    doc.text(line, 14, infoY);
    infoY += 6;
  });

  // Transport Costs Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Fahrtkosten / Transport Costs', 14, infoY + 6);

  const transportData: string[][] = [];
  if (transportInfo) {
    if (transportInfo.type === 'car' && transportInfo.kilometers) {
      const routeText = transportInfo.route ? ` (${transportInfo.route})` : '';
      transportData.push([
        `PKW / Car${routeText}`,
        `${transportInfo.kilometers} km × 0,30 €`,
        `${(transportInfo.kilometers * 0.30).toFixed(2)} €`
      ]);
    }
    if (transportInfo.otherCosts && transportInfo.otherCosts > 0) {
      const typeLabels: Record<string, string> = {
        'public': 'ÖPNV / Public Transport',
        'plane': 'Flug / Flight',
        'other': 'Sonstige / Other'
      };
      transportData.push([
        typeLabels[transportInfo.type] || 'Sonstige / Other',
        '',
        `${transportInfo.otherCosts.toFixed(2)} €`
      ]);
    }
  }

  if (transportData.length === 0) {
    transportData.push(['Keine Fahrtkosten / No Transport Costs', '', '0,00 €']);
  }

  autoTable(doc, {
    startY: infoY + 10,
    head: [['Art / Type', 'Berechnung / Calculation', 'Betrag / Amount']],
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
  doc.text('Sonstige Kosten / Other Expenses', 14, otherExpensesY);

  const expensesData: string[][] = otherExpenses.length > 0
    ? otherExpenses.map(e => [
        e.description,
        e.receiptFileName ? e.receiptFileName : 'Kein Beleg / No Receipt',
        `${e.amount.toFixed(2)} €`
      ])
    : [['Keine sonstigen Kosten / No Other Expenses', '', '0,00 €']];

  autoTable(doc, {
    startY: otherExpensesY + 4,
    head: [['Beschreibung / Description', 'Beleg / Receipt', 'Betrag / Amount']],
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
    doc.text(`Summe / Total: ${calculation.otherExpensesTotal.toFixed(2)} €`, 14, expensesSumY + 4);
  }

  // Per Diem Section
  let perDiemY = (doc as any).lastAutoTable.finalY + (otherExpenses.length > 0 ? 14 : 10);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');

  // Get per diem rates for display
  const rates = calculation.dayBreakdown.length > 0 
    ? `${countryName}: ${calculation.dayBreakdown.find(d => d.isFullDay)?.basePerDiem || calculation.dayBreakdown[0]?.basePerDiem || 0}€/${calculation.dayBreakdown[0]?.basePerDiem || 0}€`
    : '';
  doc.text(`Verpflegungsmehraufwand / Per Diem (${rates})`, 14, perDiemY);

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
    head: [['Datum / Date', 'Tag / Day', 'Stunden / Hours', 'Tagessatz / Rate', 'Kürzung / Deduction', 'Netto / Net']],
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

  // Summary Section
  let summaryY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Zusammenfassung / Summary', 14, summaryY);

  const summaryLines = [
    `Fahrtkosten / Transport Costs: ${calculation.transportCost.toFixed(2)} €`,
    `Sonstige Kosten / Other Expenses: ${calculation.otherExpensesTotal.toFixed(2)} €`,
    `Verpflegungsmehraufwand / Per Diem: ${calculation.totalPerDiem.toFixed(2)} €`,
    `Kürzung für Mahlzeiten / Meal Deduction: - ${calculation.totalMealDeduction.toFixed(2)} €`,
    `Tagegeld (netto) / Per Diem (net): ${calculation.netPerDiem.toFixed(2)} €`,
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  summaryY += 8;
  summaryLines.forEach((line) => {
    doc.text(line, 14, summaryY);
    summaryY += 6;
  });

  // Total Amount (highlighted)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(12, summaryY, 120, 10, 'F');
  doc.text(`Gesamtbetrag / Total Amount: ${calculation.totalAmount.toFixed(2)} €`, 14, summaryY + 7);

  // Signature Section
  summaryY += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Unterschrift Reisender / Traveler Signature:', 14, summaryY);
  doc.line(14, summaryY + 10, 90, summaryY + 10);

  doc.text('Unterschrift Genehmigung / Approval:', 110, summaryY);
  doc.line(110, summaryY + 10, 186, summaryY + 10);

  // Footer
  const footerY = summaryY + 25;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Erstellt gemäß deutschen Reisekostenrichtlinien / Created according to German travel expense regulations', 14, footerY);

  // Save the PDF
  doc.save(`${calculation.documentName}.pdf`);
};

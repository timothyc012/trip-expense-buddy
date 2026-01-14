import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseCalculation, TravelInfo, TransportInfo, OtherExpense } from '@/types/expense';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getPerDiemRate } from '@/data/perDiemRates';

// Convert 24h time to AM/PM format
const formatTimeAmPm = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const generateExpensePDF = (
  calculation: ExpenseCalculation,
  travelInfo: TravelInfo,
  transportInfo: TransportInfo | null,
  otherExpenses: OtherExpense[] = [],
  companyLogoBase64?: string
): void => {
  const doc = new jsPDF();
  const rate = getPerDiemRate(travelInfo.country);

  let startY = 20;

  // Company Logo (if provided)
  if (companyLogoBase64) {
    try {
      doc.addImage(companyLogoBase64, 'PNG', 15, 10, 60, 30);
      startY = 50;
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  // Title
  doc.setFontSize(18);
  doc.text('Reisekostenabrechnung / Travel Expense Report', 105, startY, { align: 'center' });

  // Document info
  doc.setFontSize(10);
  doc.text(`Dokument / Document: ${calculation.documentName}`, 20, startY + 15);
  doc.text(`Erstellt am / Created on: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 20, startY + 22);

  // Travel information section
  doc.setFontSize(12);
  doc.text('Reiseinformationen / Travel Information', 20, startY + 35);
  
  doc.setFontSize(10);
  const travelInfoData = [
    ['Reisender / Traveler', travelInfo.travelerName],
    ['Reisezweck / Purpose', travelInfo.purpose],
    ['Reiseziel / Destination', `${travelInfo.destination}, ${rate.country}`],
    ['Abfahrt / Departure', `${format(travelInfo.departureDate, 'dd.MM.yyyy', { locale: de })} ${formatTimeAmPm(travelInfo.departureTime)}`],
    ['Ankunft / Arrival', `${format(travelInfo.arrivalDate, 'dd.MM.yyyy', { locale: de })} ${formatTimeAmPm(travelInfo.arrivalTime)}`],
  ];

  autoTable(doc, {
    startY: startY + 40,
    head: [],
    body: travelInfoData,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
  });

  // Transport section
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('Fahrtkosten / Transport Costs', 20, currentY);
  
  const transportData: string[][] = [];
  if (transportInfo?.type === 'car' && transportInfo.kilometers) {
    if (transportInfo.route) {
      transportData.push([
        'Fahrstrecke / Route',
        transportInfo.route,
        '',
      ]);
    }
    transportData.push([
      'PKW-Fahrten / Car Travel',
      `${transportInfo.kilometers} km × 0,30 €/km`,
      `${calculation.transportCost.toFixed(2)} €`,
    ]);
  } else if (transportInfo?.otherCosts) {
    transportData.push([
      'Sonstige Fahrtkosten / Other Transport',
      '',
      `${calculation.transportCost.toFixed(2)} €`,
    ]);
  } else {
    transportData.push(['Keine Fahrtkosten / No Transport Costs', '', '0,00 €']);
  }

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Art / Type', 'Berechnung / Calculation', 'Betrag / Amount']],
    body: transportData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  // Other expenses section (if any)
  if (otherExpenses.length > 0) {
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text('Sonstige Kosten / Other Expenses', 20, currentY);

    const otherExpensesData = otherExpenses.map((expense) => [
      expense.description || 'Ohne Beschreibung / No Description',
      expense.receiptFileName ? `Beleg / Receipt: ${expense.receiptFileName}` : 'Kein Beleg / No Receipt',
      `${expense.amount.toFixed(2)} €`,
    ]);

    // Add total row
    otherExpensesData.push([
      'Summe / Total',
      '',
      `${calculation.otherExpensesTotal.toFixed(2)} €`,
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Beschreibung / Description', 'Beleg / Receipt', 'Betrag / Amount']],
      body: otherExpensesData,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
    });
  }

  // Per diem breakdown
  currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text(`Verpflegungsmehraufwand / Per Diem (${rate.country}: ${rate.fullDay}€/${rate.partialDay}€)`, 20, currentY);

  const perDiemData = calculation.dayBreakdown.map((day) => {
    let dayType = 'Volltag / Full Day';
    if (day.isFirstDay && day.isLastDay) {
      dayType = 'Eintägig / Single Day';
    } else if (day.isFirstDay) {
      dayType = 'Anreisetag / Departure';
    } else if (day.isLastDay) {
      dayType = 'Abreisetag / Return';
    }

    return [
      format(day.date, 'dd.MM.yyyy', { locale: de }),
      dayType,
      `${Math.round(day.hours)}h`,
      `${day.basePerDiem.toFixed(2)} €`,
      `- ${day.mealDeduction.toFixed(2)} €`,
      `${day.netPerDiem.toFixed(2)} €`,
    ];
  });

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Datum / Date', 'Tag / Day', 'Stunden / Hours', 'Tagessatz / Rate', 'Kürzung / Deduction', 'Netto / Net']],
    body: perDiemData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  // Summary
  currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('Zusammenfassung / Summary', 20, currentY);

  const summaryData = [
    ['Fahrtkosten / Transport Costs', `${calculation.transportCost.toFixed(2)} €`],
    ['Sonstige Kosten / Other Expenses', `${calculation.otherExpensesTotal.toFixed(2)} €`],
    ['Verpflegungsmehraufwand / Per Diem', `${calculation.totalPerDiem.toFixed(2)} €`],
    ['Kürzung für Mahlzeiten / Meal Deduction', `- ${calculation.totalMealDeduction.toFixed(2)} €`],
    ['Tagegeld (netto) / Per Diem (net)', `${calculation.netPerDiem.toFixed(2)} €`],
  ];

  autoTable(doc, {
    startY: currentY + 5,
    head: [],
    body: summaryData,
    theme: 'plain',
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'right' },
    },
  });

  // Total
  currentY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gesamtbetrag / Total Amount: ${calculation.totalAmount.toFixed(2)} €`, 20, currentY);

  // Signature line
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Unterschrift Reisender / Traveler Signature:', 20, currentY + 30);
  doc.line(20, currentY + 45, 90, currentY + 45);
  
  doc.text('Unterschrift Genehmigung / Approval:', 110, currentY + 30);
  doc.line(110, currentY + 45, 180, currentY + 45);

  // Footer
  doc.setFontSize(8);
  doc.text('Erstellt gemäß deutschen Reisekostenrichtlinien / Created according to German travel expense regulations', 105, 285, { align: 'center' });

  // Save PDF
  doc.save(`${calculation.documentName}.pdf`);
};

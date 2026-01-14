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
      doc.addImage(companyLogoBase64, 'PNG', 15, 10, 40, 20);
      startY = 40;
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  // Title
  doc.setFontSize(18);
  doc.text('Reisekostenabrechnung', 105, startY, { align: 'center' });

  // Document info
  doc.setFontSize(10);
  doc.text(`Dokument: ${calculation.documentName}`, 20, startY + 15);
  doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`, 20, startY + 22);

  // Travel information section
  doc.setFontSize(12);
  doc.text('Reiseinformationen', 20, startY + 35);
  
  doc.setFontSize(10);
  const travelInfoData = [
    ['Reisender', travelInfo.travelerName],
    ['Reisezweck', travelInfo.purpose],
    ['Reiseziel', `${travelInfo.destination}, ${rate.country}`],
    ['Abfahrt', `${format(travelInfo.departureDate, 'dd.MM.yyyy', { locale: de })} um ${formatTimeAmPm(travelInfo.departureTime)}`],
    ['Ankunft', `${format(travelInfo.arrivalDate, 'dd.MM.yyyy', { locale: de })} um ${formatTimeAmPm(travelInfo.arrivalTime)}`],
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
  doc.text('Fahrtkosten', 20, currentY);
  
  const transportData: string[][] = [];
  if (transportInfo?.type === 'car' && transportInfo.kilometers) {
    if (transportInfo.route) {
      transportData.push([
        'Fahrstrecke',
        transportInfo.route,
        '',
      ]);
    }
    transportData.push([
      'PKW-Fahrten',
      `${transportInfo.kilometers} km × 0,30 €/km`,
      `${calculation.transportCost.toFixed(2)} €`,
    ]);
  } else if (transportInfo?.otherCosts) {
    transportData.push([
      'Sonstige Fahrtkosten',
      '',
      `${calculation.transportCost.toFixed(2)} €`,
    ]);
  } else {
    transportData.push(['Keine Fahrtkosten', '', '0,00 €']);
  }

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Art', 'Berechnung', 'Betrag']],
    body: transportData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  // Other expenses section (if any)
  if (otherExpenses.length > 0) {
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text('Sonstige Kosten', 20, currentY);

    const otherExpensesData = otherExpenses.map((expense) => [
      expense.description || 'Ohne Beschreibung',
      expense.receiptFileName ? `Beleg: ${expense.receiptFileName}` : 'Kein Beleg',
      `${expense.amount.toFixed(2)} €`,
    ]);

    // Add total row
    otherExpensesData.push([
      'Summe',
      '',
      `${calculation.otherExpensesTotal.toFixed(2)} €`,
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Beschreibung', 'Beleg', 'Betrag']],
      body: otherExpensesData,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
    });
  }

  // Per diem breakdown
  currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text(`Verpflegungsmehraufwand (${rate.country}: ${rate.fullDay}€/${rate.partialDay}€)`, 20, currentY);

  const perDiemData = calculation.dayBreakdown.map((day) => {
    let dayType = 'Volltag (24h)';
    if (day.isFirstDay && day.isLastDay) {
      dayType = 'Eintägig';
    } else if (day.isFirstDay) {
      dayType = 'Anreisetag';
    } else if (day.isLastDay) {
      dayType = 'Abreisetag';
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
    head: [['Datum', 'Tag', 'Stunden', 'Tagessatz', 'Kürzung', 'Netto']],
    body: perDiemData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  // Summary
  currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('Zusammenfassung', 20, currentY);

  const summaryData = [
    ['Fahrtkosten', `${calculation.transportCost.toFixed(2)} €`],
    ['Sonstige Kosten', `${calculation.otherExpensesTotal.toFixed(2)} €`],
    ['Verpflegungsmehraufwand', `${calculation.totalPerDiem.toFixed(2)} €`],
    ['Kürzung für Mahlzeiten', `- ${calculation.totalMealDeduction.toFixed(2)} €`],
    ['Tagegeld (netto)', `${calculation.netPerDiem.toFixed(2)} €`],
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
  doc.text(`Gesamtbetrag: ${calculation.totalAmount.toFixed(2)} €`, 20, currentY);

  // Signature line
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Unterschrift Reisender:', 20, currentY + 30);
  doc.line(20, currentY + 45, 90, currentY + 45);
  
  doc.text('Unterschrift Genehmigung:', 110, currentY + 30);
  doc.line(110, currentY + 45, 180, currentY + 45);

  // Footer
  doc.setFontSize(8);
  doc.text('Erstellt gemäß deutschen Reisekostenrichtlinien (Reisekostengesetz)', 105, 285, { align: 'center' });

  // Save PDF
  doc.save(`${calculation.documentName}.pdf`);
};

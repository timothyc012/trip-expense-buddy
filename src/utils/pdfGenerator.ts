import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ExpenseCalculation, TravelInfo, TransportInfo, OtherExpense } from '@/types/expense';

export const generateExpensePDF = (
  calculation: ExpenseCalculation,
  travelInfo: TravelInfo,
  transportInfo: TransportInfo | null,
  otherExpenses: OtherExpense[] = [],
  companyLogo?: string
) => {
  const doc = new jsPDF();
  const { travelerName, purpose, destination, country, departureDate, arrivalDate } = travelInfo;

  // Logo if available
  if (companyLogo) {
    try {
      doc.addImage(companyLogo, 'JPEG', 14, 10, 30, 15);
    } catch (e) {
      console.error("Error adding logo", e);
    }
  }

  // Title
  doc.setFontSize(20);
  doc.text('Reisekostenabrechnung', 14, 30);

  doc.setFontSize(10);
  doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 38);

  // Travel Info Section
  const travelInfoData = [
    ['Name:', travelerName],
    ['Zweck:', purpose],
    ['Ziel:', `${destination}, ${country}`],
    ['Zeitraum:', `${format(departureDate, 'dd.MM.yyyy')} - ${format(arrivalDate, 'dd.MM.yyyy')}`],
  ];

  autoTable(doc, {
    startY: 45,
    head: [['Reiseinformationen', '']],
    body: travelInfoData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
    headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' }
  });

  // Daily Breakdown Table
  const dailyRows = calculation.dayBreakdown.map((day) => [
    format(day.date, 'dd.MM.yyyy', { locale: de }),
    `${day.hours} Std.`,
    `${day.basePerDiem.toFixed(2)} €`,
    day.mealDeduction > 0 ? `-${day.mealDeduction.toFixed(2)} €` : '-',
    `${day.netPerDiem.toFixed(2)} €`
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Datum', 'Dauer', 'Pauschale', 'Kürzung', 'Netto']],
    body: dailyRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
  });

  // Summary Data Builder
  const summaryData = [
    ['Summe Verpflegungsmehraufwand:', `${calculation.totalPerDiem.toFixed(2)} €`],
    ['Summe Kürzungen:', `-${calculation.totalMealDeduction.toFixed(2)} €`],
    ['Netto Verpflegungsmehraufwand:', `${calculation.netPerDiem.toFixed(2)} €`],
  ];

  // Add Transport items if they exist
  if (transportInfo) {
    if (transportInfo.type === 'car' && transportInfo.kilometers) {
      summaryData.push(['Fahrtkosten (PKW):', `${calculation.transportCost.toFixed(2)} €`]);
    } else if (transportInfo.otherCosts) {
      summaryData.push(['Fahrtkosten (ÖPNV/Flug/Bahn):', `${calculation.transportCost.toFixed(2)} €`]);
    }
  }

  // Add Other Expenses if they exist
  if (otherExpenses.length > 0) {
    summaryData.push(['Sonstige Ausgaben:', `${calculation.otherExpensesTotal.toFixed(2)} €`]);
  }

  // Total
  summaryData.push(['Gesamtauszahlung:', `${calculation.totalAmount.toFixed(2)} €`]);

  // Summary Table
  const summaryY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: summaryY,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { halign: 'right' }
    },
    didParseCell: function (data) {
      if (data.row.index === summaryData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [0, 0, 0]; // Black
        data.cell.styles.fillColor = [240, 240, 240]; // Light gray background
      }
    }
  });

  // Detailed Expense List (if needed)
  if (otherExpenses.length > 0) {
    const expensesData = otherExpenses.map(e => [e.description, `${e.amount.toFixed(2)} €`]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Sonstige Ausgaben Details', 'Betrag']],
      body: expensesData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 100, 100] }
    });
  }

  // Save the PDF
  doc.save(`${calculation.documentName}.pdf`);
};

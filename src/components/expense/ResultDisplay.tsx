import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ExpenseCalculation, TravelInfo, TransportInfo, OtherExpense } from '@/types/expense';
import { generateExpensePDF } from '@/utils/pdfGenerator';
import { getRateFromValue } from '@/constants/perDiemData';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { FileDown, Calculator, Car, UtensilsCrossed, Receipt, Upload, Image as ImageIcon } from 'lucide-react';

interface ResultDisplayProps {
  calculation: ExpenseCalculation | null;
  travelInfo: TravelInfo | null;
  transportInfo: TransportInfo | null;
  otherExpenses?: OtherExpense[];
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  calculation,
  travelInfo,
  transportInfo,
  otherExpenses = []
}) => {
  const [companyLogo, setCompanyLogo] = useState<string | undefined>();
  const [logoFileName, setLogoFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!calculation || !travelInfo) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Ergebnis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Bitte füllen Sie die Reiseinformationen aus, um die Berechnung zu sehen.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rate = getRateFromValue(travelInfo.country);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyLogo(event.target?.result as string);
        setLogoFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPDF = () => {
    generateExpensePDF(calculation, travelInfo, transportInfo, otherExpenses, companyLogo);
  };

  const getDayType = (day: typeof calculation.dayBreakdown[0]) => {
    if (day.isFirstDay && day.isLastDay) return 'Eintägig';
    if (day.isFirstDay) return 'Anreisetag';
    if (day.isLastDay) return 'Abreisetag';
    return 'Volltag';
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Zusammenfassung
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {logoFileName ? 'Logo ändern' : 'Logo'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dokument: {calculation.documentName}
          </p>
          {logoFileName && (
            <p className="text-xs text-muted-foreground">
              Logo: {logoFileName}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Car className="h-3 w-3" />
                Fahrtkosten
              </div>
              <div className="text-xl font-semibold">
                {calculation.transportCost.toFixed(2)} €
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Receipt className="h-3 w-3" />
                Sonstige Kosten
              </div>
              <div className="text-xl font-semibold">
                {calculation.otherExpensesTotal.toFixed(2)} €
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Tagegeld
              </div>
              <div className="text-xl font-semibold">
                {calculation.totalPerDiem.toFixed(2)} €
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UtensilsCrossed className="h-3 w-3" />
                Kürzung
              </div>
              <div className="text-xl font-semibold text-destructive">
                -{calculation.totalMealDeduction.toFixed(2)} €
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/10">
            <div className="text-xs font-medium text-primary">
              Gesamtbetrag
            </div>
            <div className="text-2xl font-bold text-primary">
              {calculation.totalAmount.toFixed(2)} €
            </div>
          </div>

          <Button onClick={handleDownloadPDF} className="w-full gap-2 mt-4" size="lg">
            <FileDown className="h-5 w-5" />
            PDF herunterladen
          </Button>
        </CardContent>
      </Card>

      {/* Per Diem Breakdown */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            Verpflegungsmehraufwand ({rate.country}{rate.city !== 'Standard' ? `, ${rate.city}` : ''})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Tagessätze: {rate.fullDay}€ (24h) / {rate.partialDay}€ (8-24h)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6">
            <div className="px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Datum</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead className="text-right">Stunden</TableHead>
                    <TableHead className="text-right">Tagessatz</TableHead>
                    <TableHead className="text-right">Kürzung</TableHead>
                    <TableHead className="text-right">Netto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculation.dayBreakdown.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {format(day.date, 'dd.MM.yyyy', { locale: de })}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {getDayType(day)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round(day.hours)}h
                      </TableCell>
                      <TableCell className="text-right">
                        {day.basePerDiem.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {day.mealDeduction > 0 ? `-${day.mealDeduction.toFixed(2)} €` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {day.netPerDiem.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={3}>Summe</TableCell>
                    <TableCell className="text-right">
                      {calculation.totalPerDiem.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      -{calculation.totalMealDeduction.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right">
                      {calculation.netPerDiem.toFixed(2)} €
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

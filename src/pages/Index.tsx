import React from 'react';
import { useForm } from 'react-hook-form';
import { TravelInfoForm } from '@/components/expense/TravelInfoForm';
import { TransportForm } from '@/components/expense/TransportForm';
import { OtherExpensesForm } from '@/components/expense/OtherExpensesForm';
import { MealDeductionForm } from '@/components/expense/MealDeductionForm';
import { ResultDisplay } from '@/components/expense/ResultDisplay';
import { usePerDiemCalculator } from '@/hooks/usePerDiemCalculator';
import { ExpenseFormData, TravelInfo, TransportInfo } from '@/types/expense';
import { Briefcase } from 'lucide-react';

const Index = () => {
  const form = useForm<ExpenseFormData>({
    defaultValues: {
      travelInfo: {
        travelerName: '',
        purpose: '',
        destination: '',
        country: 'DE',
        departureDate: undefined as any,
        departureTime: '08:00',
        arrivalDate: undefined as any,
        arrivalTime: '18:00',
      },
      transportInfo: {
        type: 'car',
        route: '',
        kilometers: 0,
        otherCosts: 0,
      },
      otherExpenses: [],
      dayMeals: [],
    },
  });

  const watchedValues = form.watch();
  
  const travelInfo: TravelInfo | null = watchedValues.travelInfo?.departureDate && watchedValues.travelInfo?.arrivalDate
    ? {
        ...watchedValues.travelInfo,
        departureDate: new Date(watchedValues.travelInfo.departureDate),
        arrivalDate: new Date(watchedValues.travelInfo.arrivalDate),
      }
    : null;

  const transportInfo: TransportInfo | null = watchedValues.transportInfo || null;

  const calculation = usePerDiemCalculator({
    travelInfo,
    transportInfo,
    otherExpenses: watchedValues.otherExpenses || [],
    dayMeals: watchedValues.dayMeals || [],
  });

  const departureDate = watchedValues.travelInfo?.departureDate 
    ? new Date(watchedValues.travelInfo.departureDate) 
    : null;
  const arrivalDate = watchedValues.travelInfo?.arrivalDate 
    ? new Date(watchedValues.travelInfo.arrivalDate) 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Reisekostenabrechnung</h1>
              <p className="text-sm text-muted-foreground">
                Gemäß deutschem Reisekostenrecht (BMF 2026)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TravelInfoForm form={form} />
            <TransportForm form={form} />
            <OtherExpensesForm form={form} />
            <MealDeductionForm 
              form={form} 
              departureDate={departureDate}
              arrivalDate={arrivalDate}
            />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <ResultDisplay 
              calculation={calculation}
              travelInfo={travelInfo}
              transportInfo={transportInfo}
              otherExpenses={watchedValues.otherExpenses || []}
            />
          </div>
        </div>
      </main>

      <footer className="border-t bg-muted/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Berechnung nach § 9 Abs. 4a EStG und BMF-Schreiben zu Verpflegungsmehraufwendungen
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, Coffee, Sun, Moon } from 'lucide-react';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface MealDeductionFormProps {
  form: UseFormReturn<any>;
  departureDate: Date | null;
  arrivalDate: Date | null;
}

export const MealDeductionForm: React.FC<MealDeductionFormProps> = ({ 
  form, 
  departureDate, 
  arrivalDate 
}) => {
  const { setValue, watch } = form;
  const dayMeals = watch('dayMeals') || [];

  if (!departureDate || !arrivalDate) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UtensilsCrossed className="h-5 w-5" />
            Mahlzeitenkürzung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Bitte geben Sie zuerst die Reisedaten ein, um die Mahlzeitenkürzung zu konfigurieren.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalDays = differenceInCalendarDays(arrivalDate, departureDate) + 1;
  
  const getDayMeal = (index: number) => {
    return dayMeals[index] || { breakfast: false, lunch: false, dinner: false };
  };

  const handleMealChange = (dayIndex: number, meal: 'breakfast' | 'lunch' | 'dinner', checked: boolean) => {
    const updatedMeals = [...dayMeals];
    const currentDate = addDays(new Date(departureDate), dayIndex);
    
    if (!updatedMeals[dayIndex]) {
      updatedMeals[dayIndex] = {
        date: currentDate,
        breakfast: false,
        lunch: false,
        dinner: false,
      };
    }
    
    updatedMeals[dayIndex] = {
      ...updatedMeals[dayIndex],
      date: currentDate,
      [meal]: checked,
    };
    
    setValue('dayMeals', updatedMeals);
  };

  const getDayLabel = (index: number) => {
    if (totalDays === 1) return 'Reisetag';
    if (index === 0) return 'Anreisetag';
    if (index === totalDays - 1) return 'Abreisetag';
    return `Tag ${index + 1}`;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UtensilsCrossed className="h-5 w-5" />
          Mahlzeitenkürzung
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Wählen Sie die vom Arbeitgeber gestellten Mahlzeiten aus (Kürzung: Frühstück 20%, Mittag 40%, Abend 40%)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: totalDays }).map((_, index) => {
            const currentDate = addDays(new Date(departureDate), index);
            const dayMeal = getDayMeal(index);
            
            return (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {format(currentDate, 'EEEE, dd.MM.yyyy', { locale: de })}
                  </div>
                  <div className="text-xs text-muted-foreground">{getDayLabel(index)}</div>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`breakfast-${index}`}
                      checked={dayMeal.breakfast}
                      onCheckedChange={(checked) => 
                        handleMealChange(index, 'breakfast', checked === true)
                      }
                    />
                    <Label 
                      htmlFor={`breakfast-${index}`} 
                      className="flex items-center gap-1 text-sm cursor-pointer"
                    >
                      <Coffee className="h-4 w-4" />
                      <span className="hidden sm:inline">Frühstück</span>
                      <span className="sm:hidden">F</span>
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`lunch-${index}`}
                      checked={dayMeal.lunch}
                      onCheckedChange={(checked) => 
                        handleMealChange(index, 'lunch', checked === true)
                      }
                    />
                    <Label 
                      htmlFor={`lunch-${index}`} 
                      className="flex items-center gap-1 text-sm cursor-pointer"
                    >
                      <Sun className="h-4 w-4" />
                      <span className="hidden sm:inline">Mittag</span>
                      <span className="sm:hidden">M</span>
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`dinner-${index}`}
                      checked={dayMeal.dinner}
                      onCheckedChange={(checked) => 
                        handleMealChange(index, 'dinner', checked === true)
                      }
                    />
                    <Label 
                      htmlFor={`dinner-${index}`} 
                      className="flex items-center gap-1 text-sm cursor-pointer"
                    >
                      <Moon className="h-4 w-4" />
                      <span className="hidden sm:inline">Abendessen</span>
                      <span className="sm:hidden">A</span>
                    </Label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

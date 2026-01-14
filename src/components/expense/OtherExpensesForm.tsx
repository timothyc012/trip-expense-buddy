import React, { useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Upload, FileText, Receipt } from 'lucide-react';
import { OtherExpense } from '@/types/expense';

interface OtherExpensesFormProps {
  form: UseFormReturn<any>;
}

export const OtherExpensesForm: React.FC<OtherExpensesFormProps> = ({ form }) => {
  const { watch, setValue } = form;
  const otherExpenses: OtherExpense[] = watch('otherExpenses') || [];
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addExpense = () => {
    const newExpense: OtherExpense = {
      id: `expense_${Date.now()}`,
      description: '',
      amount: 0,
    };
    setValue('otherExpenses', [...otherExpenses, newExpense]);
  };

  const removeExpense = (id: string) => {
    setValue('otherExpenses', otherExpenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: string, field: keyof OtherExpense, value: any) => {
    setValue('otherExpenses', otherExpenses.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const handleFileUpload = (id: string, file: File | null) => {
    if (file) {
      setValue('otherExpenses', otherExpenses.map(e => 
        e.id === id ? { ...e, receiptFile: file, receiptFileName: file.name } : e
      ));
    }
  };

  const triggerFileInput = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Sonstige Kosten
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExpense}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Hinzufügen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {otherExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Keine sonstigen Kosten. Klicken Sie auf "Hinzufügen", um eine Ausgabe hinzuzufügen.
          </p>
        ) : (
          <div className="space-y-4">
            {otherExpenses.map((expense, index) => (
              <div
                key={expense.id}
                className="p-4 border rounded-lg space-y-3 bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Ausgabe #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExpense(expense.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`description-${expense.id}`}>Beschreibung</Label>
                    <Input
                      id={`description-${expense.id}`}
                      placeholder="z.B. Taxi, Parkgebühr, etc."
                      value={expense.description}
                      onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`amount-${expense.id}`}>Betrag (€)</Label>
                    <div className="relative">
                      <Input
                        id={`amount-${expense.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={expense.amount || ''}
                        onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        €
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Beleg hochladen</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[expense.id] = el; }}
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(expense.id, e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => triggerFileInput(expense.id)}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {expense.receiptFileName ? 'Ändern' : 'Hochladen'}
                    </Button>
                    {expense.receiptFileName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">{expense.receiptFileName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {otherExpenses.length > 0 && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-medium">Summe sonstige Kosten:</span>
            <span className="text-lg font-semibold">
              {otherExpenses.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)} €
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

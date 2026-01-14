import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Car, Train, Plane, HelpCircle, Route } from 'lucide-react';

interface TransportFormProps {
  form: UseFormReturn<any>;
}

export const TransportForm: React.FC<TransportFormProps> = ({ form }) => {
  const { register, setValue, watch } = form;
  const transportType = watch('transportInfo.type');

  const transportOptions = [
    { value: 'car', label: 'PKW', icon: Car, description: '0,30 €/km' },
    { value: 'public', label: 'ÖPNV', icon: Train, description: 'Tickets' },
    { value: 'plane', label: 'Flug', icon: Plane, description: 'Tickets' },
    { value: 'other', label: 'Sonstige', icon: HelpCircle, description: 'Andere' },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5" />
          Fahrtkosten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Verkehrsmittel</Label>
          <RadioGroup
            value={transportType}
            onValueChange={(value) => setValue('transportInfo.type', value)}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {transportOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = transportType === option.value;
              return (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={`transport-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`transport-${option.value}`}
                    className={`
                      flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer
                      transition-all duration-200
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {transportType === 'car' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <Label htmlFor="route" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Fahrstrecke
              </Label>
              <Textarea
                id="route"
                placeholder="z.B. München - Stuttgart - München"
                {...register('transportInfo.route')}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kilometers" className="flex items-center gap-2">
                Gefahrene Kilometer
                <span className="text-xs text-muted-foreground">(× 0,30 €/km)</span>
              </Label>
              <div className="relative">
                <Input
                  id="kilometers"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  {...register('transportInfo.kilometers', { valueAsNumber: true })}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  km
                </span>
              </div>
            </div>
          </div>
        )}

        {(transportType === 'public' || transportType === 'plane' || transportType === 'other') && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label htmlFor="otherCosts">Kosten (€)</Label>
            <div className="relative">
              <Input
                id="otherCosts"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register('transportInfo.otherCosts', { valueAsNumber: true })}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                €
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

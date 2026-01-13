import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCountryOptions } from '@/data/perDiemRates';
import { User, MapPin, Calendar, Clock, Plane } from 'lucide-react';

interface TravelInfoFormProps {
  form: UseFormReturn<any>;
}

export const TravelInfoForm: React.FC<TravelInfoFormProps> = ({ form }) => {
  const countryOptions = getCountryOptions();
  const { register, setValue, watch } = form;
  const selectedCountry = watch('travelInfo.country');

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plane className="h-5 w-5" />
          Reiseinformationen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Traveler Name */}
        <div className="space-y-2">
          <Label htmlFor="travelerName" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Name des Reisenden
          </Label>
          <Input
            id="travelerName"
            placeholder="Max Mustermann"
            {...register('travelInfo.travelerName')}
          />
        </div>

        {/* Purpose */}
        <div className="space-y-2">
          <Label htmlFor="purpose">Reisezweck</Label>
          <Input
            id="purpose"
            placeholder="Kundentermin, Konferenz, etc."
            {...register('travelInfo.purpose')}
          />
        </div>

        {/* Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Reiseziel (Stadt)
            </Label>
            <Input
              id="destination"
              placeholder="Amsterdam"
              {...register('travelInfo.destination')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => setValue('travelInfo.country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Land auswählen" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({option.fullDay}€/{option.partialDay}€)
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Departure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departureDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Abfahrtsdatum
            </Label>
            <Input
              id="departureDate"
              type="date"
              {...register('travelInfo.departureDate')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departureTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Abfahrtszeit
            </Label>
            <Input
              id="departureTime"
              type="time"
              {...register('travelInfo.departureTime')}
            />
          </div>
        </div>

        {/* Arrival */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="arrivalDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rückkehrdatum
            </Label>
            <Input
              id="arrivalDate"
              type="date"
              {...register('travelInfo.arrivalDate')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrivalTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Rückkehrzeit
            </Label>
            <Input
              id="arrivalTime"
              type="time"
              {...register('travelInfo.arrivalTime')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

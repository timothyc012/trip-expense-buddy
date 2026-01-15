import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PER_DIEM_DATA } from '@/constants/perDiemData';
import { User, MapPin, Calendar, Clock, Plane, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TravelInfoFormProps {
  form: UseFormReturn<any>;
}

// Generate time options in AM/PM format
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
      options.push({ value, label });
    }
  }
  options.push({ value: '24:00', label: '24:00 (Mitternacht)' });
  return options;
};

const timeOptions = generateTimeOptions();

export const TravelInfoForm: React.FC<TravelInfoFormProps> = ({ form }) => {
  const [open, setOpen] = useState(false);
  const { register, setValue, watch } = form;
  const selectedCountry = watch('travelInfo.country');
  const departureTime = watch('travelInfo.departureTime');
  const arrivalTime = watch('travelInfo.arrivalTime');

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
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isExpat"
              onCheckedChange={(checked) => setValue('travelInfo.isExpat', checked)}
              checked={watch('travelInfo.isExpat')}
            />
            <Label htmlFor="isExpat" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Expat (Zusätzlicher Abzug Mo-Fr)
            </Label>
          </div>
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedCountry ? (
                    (() => {
                      const parts = selectedCountry.split('|');
                      const cName = parts[0];
                      const cCity = parts[1];
                      return cCity && cCity !== 'Standard'
                        ? `${cName} - ${cCity}`
                        : cName;
                    })()
                  ) : (
                    "Land auswählen..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Land suchen..." />
                  <CommandList>
                    <CommandEmpty>Kein Land gefunden.</CommandEmpty>
                    <CommandGroup>
                      {PER_DIEM_DATA.map((data) => {
                        const value = `${data.country}|${data.city}`;
                        const label = data.city !== 'Standard'
                          ? `${data.country} - ${data.city}`
                          : data.country;
                        return (
                          <CommandItem
                            key={value}
                            value={label} // Search by label content
                            onSelect={() => {
                              setValue('travelInfo.country', value);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCountry === value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground">
                                {data.fullDay}€ / {data.partialDay}€
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            <Select
              value={departureTime}
              onValueChange={(value) => setValue('travelInfo.departureTime', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Zeit auswählen" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select
              value={arrivalTime}
              onValueChange={(value) => setValue('travelInfo.arrivalTime', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Zeit auswählen" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

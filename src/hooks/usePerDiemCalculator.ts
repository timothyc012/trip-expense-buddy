import { useMemo } from 'react';
import { 
  TravelInfo, 
  TransportInfo, 
  DayMeals, 
  ExpenseCalculation, 
  DayCalculation 
} from '@/types/expense';
import { getPerDiemRate } from '@/data/perDiemRates';
import { 
  differenceInCalendarDays, 
  differenceInHours, 
  addDays, 
  format, 
  setHours, 
  setMinutes
} from 'date-fns';

const MILEAGE_RATE = 0.30; // €/km

// Meal deduction rates based on German tax law
const MEAL_DEDUCTION_RATES = {
  breakfast: 0.20, // 20% of full day rate
  lunch: 0.40,     // 40% of full day rate
  dinner: 0.40,    // 40% of full day rate
};

interface UsePerDiemCalculatorProps {
  travelInfo: TravelInfo | null;
  transportInfo: TransportInfo | null;
  dayMeals: DayMeals[];
}

const parseTime = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
};

const getDateTimeFromDateAndTime = (date: Date, timeString: string): Date => {
  const { hours, minutes } = parseTime(timeString);
  return setMinutes(setHours(new Date(date), hours), minutes);
};

export const usePerDiemCalculator = ({
  travelInfo,
  transportInfo,
  dayMeals,
}: UsePerDiemCalculatorProps): ExpenseCalculation | null => {
  return useMemo(() => {
    if (!travelInfo || !travelInfo.departureDate || !travelInfo.arrivalDate) {
      return null;
    }

    const { country, departureDate, departureTime, arrivalDate, arrivalTime, travelerName } = travelInfo;
    const rate = getPerDiemRate(country);
    
    const departureDateTime = getDateTimeFromDateAndTime(departureDate, departureTime || '00:00');
    const arrivalDateTime = getDateTimeFromDateAndTime(arrivalDate, arrivalTime || '23:59');
    
    const totalDays = differenceInCalendarDays(arrivalDate, departureDate) + 1;
    
    if (totalDays < 1) {
      return null;
    }

    const dayBreakdown: DayCalculation[] = [];
    let totalPerDiem = 0;
    let totalMealDeduction = 0;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(new Date(departureDate), i);
      const isFirstDay = i === 0;
      const isLastDay = i === totalDays - 1;
      const isOnlyDay = totalDays === 1;
      const isFullDay = !isFirstDay && !isLastDay;

      let hoursOnThisDay: number;

      if (isOnlyDay) {
        // Single day trip: calculate hours between departure and arrival
        hoursOnThisDay = differenceInHours(arrivalDateTime, departureDateTime);
      } else if (isFirstDay) {
        // First day: from departure time until midnight
        const endOfDay = setMinutes(setHours(new Date(currentDate), 23), 59);
        hoursOnThisDay = differenceInHours(endOfDay, departureDateTime);
      } else if (isLastDay) {
        // Last day: from midnight until arrival time
        const startOfDay = setMinutes(setHours(new Date(currentDate), 0), 0);
        hoursOnThisDay = differenceInHours(arrivalDateTime, startOfDay);
      } else {
        // Full day in between
        hoursOnThisDay = 24;
      }

      // Ensure non-negative hours
      hoursOnThisDay = Math.max(0, hoursOnThisDay);

      // Calculate base per diem based on hours
      let basePerDiem = 0;
      if (hoursOnThisDay >= 24) {
        basePerDiem = rate.fullDay;
      } else if (hoursOnThisDay >= 8) {
        basePerDiem = rate.partialDay;
      } else {
        basePerDiem = 0; // Less than 8 hours = no per diem
      }

      // Calculate meal deductions based on full day rate
      // Find meal data by index (more reliable than date comparison)
      const dayMeal = dayMeals[i];
      let mealDeduction = 0;

      if (dayMeal && basePerDiem > 0) {
        // Deductions are calculated based on the FULL DAY rate, not the actual per diem
        if (dayMeal.breakfast) {
          mealDeduction += rate.fullDay * MEAL_DEDUCTION_RATES.breakfast;
        }
        if (dayMeal.lunch) {
          mealDeduction += rate.fullDay * MEAL_DEDUCTION_RATES.lunch;
        }
        if (dayMeal.dinner) {
          mealDeduction += rate.fullDay * MEAL_DEDUCTION_RATES.dinner;
        }
      }

      // Net per diem cannot be negative
      const netPerDiem = Math.max(0, basePerDiem - mealDeduction);

      dayBreakdown.push({
        date: currentDate,
        hours: hoursOnThisDay,
        basePerDiem,
        mealDeduction,
        netPerDiem,
        isFirstDay,
        isLastDay,
        isFullDay,
      });

      totalPerDiem += basePerDiem;
      totalMealDeduction += mealDeduction;
    }

    // Calculate transport costs
    let transportCost = 0;
    if (transportInfo) {
      if (transportInfo.type === 'car' && transportInfo.kilometers) {
        transportCost = transportInfo.kilometers * MILEAGE_RATE;
      }
      if (transportInfo.otherCosts) {
        transportCost += transportInfo.otherCosts;
      }
    }

    const netPerDiem = Math.max(0, totalPerDiem - totalMealDeduction);
    const totalAmount = transportCost + netPerDiem;

    // Generate document name: ter_[name]_[date]
    const formattedDate = format(departureDate, 'yyyy-MM-dd');
    const sanitizedName = travelerName.replace(/\s+/g, '_').toLowerCase();
    const documentName = `ter_${sanitizedName}_${formattedDate}`;

    return {
      transportCost,
      totalPerDiem,
      totalMealDeduction,
      netPerDiem,
      totalAmount,
      dayBreakdown,
      documentName,
    };
  }, [travelInfo, transportInfo, dayMeals]);
};

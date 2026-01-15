export interface TravelInfo {
  travelerName: string;
  purpose: string;
  destination: string;
  country: string;
  departureDate: Date;
  departureTime: string;
  arrivalDate: Date;
  arrivalTime: string;
  isExpat?: boolean;
}

export interface TransportInfo {
  type: 'car' | 'public' | 'plane' | 'other';
  route?: string; // Route description for car travel
  kilometers?: number;
  otherCosts?: number;
}

export interface OtherExpense {
  id: string;
  description: string;
  amount: number;
  receiptFile?: File;
  receiptFileName?: string;
}

export interface DayMeals {
  date: Date;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface PerDiemRate {
  country: string;
  countryCode: string;
  fullDay: number; // 24h rate
  partialDay: number; // 8-24h rate
}

export interface DayCalculation {
  date: Date;
  hours: number;
  basePerDiem: number;
  mealDeduction: number;
  netPerDiem: number;
  isFirstDay: boolean;
  isLastDay: boolean;
  isFullDay: boolean;
}

export interface ExpenseCalculation {
  transportCost: number;
  otherExpensesTotal: number;
  totalPerDiem: number;
  totalMealDeduction: number;
  netPerDiem: number;
  totalAmount: number;
  dayBreakdown: DayCalculation[];
  documentName: string;
}

export interface ExpenseFormData {
  travelInfo: TravelInfo;
  transportInfo: TransportInfo;
  otherExpenses: OtherExpense[];
  dayMeals: DayMeals[];
}

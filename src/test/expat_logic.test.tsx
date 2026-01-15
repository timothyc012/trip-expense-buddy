import { renderHook } from '@testing-library/react';
import { usePerDiemCalculator } from '../hooks/usePerDiemCalculator';
import { describe, it, expect, vi } from 'vitest';

// Mocks removed as we use real data for Germany (28/14 matches test expectations)

describe('Expat Deduction Logic', () => {
    const defaultTransport = { type: 'car' as const, kilometers: 0 };
    const defaultOtherExpenses = [];

    // Weekday: Thursday 2023-10-05
    it('applies 15€ deduction on weekdays when Expat is checked', () => {
        const travelInfo = {
            travelerName: 'Expat User',
            purpose: 'Work',
            destination: 'Berlin',
            country: 'Germany',
            departureDate: new Date('2023-10-05'), // Thursday
            departureTime: '08:00',
            arrivalDate: new Date('2023-10-05'),
            arrivalTime: '20:00', // 12h -> 14€ base
            isExpat: true
        };

        const { result } = renderHook(() =>
            usePerDiemCalculator({
                travelInfo,
                transportInfo: defaultTransport,
                otherExpenses: defaultOtherExpenses,
                dayMeals: [{ date: new Date('2023-10-05'), breakfast: false, lunch: false, dinner: false }]
            })
        );

        const day = result.current?.dayBreakdown[0];
        expect(day).toBeDefined();
        // Base: 14€
        expect(day?.basePerDiem).toBe(14);
        // Expat Deduction: 15€
        // Total Deduction: 15€
        // Net: 14 - 15 = -1 -> clamped to 0
        expect(day?.mealDeduction).toBe(15);
        expect(day?.netPerDiem).toBe(0);
    });

    // Weekend: Saturday 2023-10-07
    it('does NOT apply deduction on weekends even if Expat is checked', () => {
        const travelInfo = {
            travelerName: 'Expat User',
            purpose: 'Work',
            destination: 'Berlin',
            country: 'Germany',
            departureDate: new Date('2023-10-07'), // Saturday
            departureTime: '08:00',
            arrivalDate: new Date('2023-10-07'),
            arrivalTime: '20:00', // 12h -> 14€ base
            isExpat: true
        };

        const { result } = renderHook(() =>
            usePerDiemCalculator({
                travelInfo,
                transportInfo: defaultTransport,
                otherExpenses: defaultOtherExpenses,
                dayMeals: [{ date: new Date('2023-10-07'), breakfast: false, lunch: false, dinner: false }]
            })
        );

        const day = result.current?.dayBreakdown[0];
        expect(day).toBeDefined();
        expect(day?.basePerDiem).toBe(14);
        expect(day?.mealDeduction).toBe(0); // No deduction for weekend
        expect(day?.netPerDiem).toBe(14);
    });

    // Combined: Weekday with Meal
    it('combines meal deduction and expat deduction, clamping to 0', () => {
        const travelInfo = {
            travelerName: 'Expat User',
            purpose: 'Work',
            destination: 'Berlin',
            country: 'Germany',
            departureDate: new Date('2023-10-06'), // Friday
            departureTime: '00:00',
            arrivalDate: new Date('2023-10-06'),
            arrivalTime: '24:00', // 24h -> 28€ base
            isExpat: true
        };

        const { result } = renderHook(() =>
            usePerDiemCalculator({
                travelInfo,
                transportInfo: defaultTransport,
                otherExpenses: defaultOtherExpenses,
                dayMeals: [{
                    date: new Date('2023-10-06'),
                    breakfast: true, // 20% of 28 = 5.6
                    lunch: false,
                    dinner: false
                }]
            })
        );

        const day = result.current?.dayBreakdown[0];
        expect(day).toBeDefined();
        expect(day?.basePerDiem).toBe(28);

        // Deduction: 5.6 (Breakfast) + 15 (Expat) = 20.6
        expect(day?.mealDeduction).toBe(20.6);

        // Net: 28 - 20.6 = 7.4
        expect(day?.netPerDiem).toBeCloseTo(7.4);
    });
});

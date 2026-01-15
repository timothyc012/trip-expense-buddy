import { renderHook } from '@testing-library/react';
import { usePerDiemCalculator } from '../hooks/usePerDiemCalculator';
import { describe, it, expect, vi } from 'vitest';
import { perDiemRates } from '../data/perDiemRates';

// Mock getPerDiemRate to actually use the real list for this test, 
// or simply assume we want to test the hook's integration with the data.
// Since we want to verify the DATA matches the LOGIC, we'll forego mocking the data module strictly 
// and instead mock the hook's dependency if needed. But actually, `usePerDiemCalculator` imports `getPerDiemRate`.
// We should test that `usePerDiemCalculator` correctly picks up the rates for given country codes.

describe('Country Rate Logic', () => {
    const defaultTransport = { type: 'car' as const, kilometers: 0 };
    const defaultOtherExpenses = [];

    // Helper to run hook
    const runCalc = (country: string, isExpat: boolean = false) => {
        const departureDate = new Date('2026-05-20'); // Wed (Weekday)
        const arrivalDate = new Date('2026-05-20');
        const travelInfo = {
            travelerName: 'Test',
            purpose: 'Test',
            destination: 'Test',
            country: country, // Country Code
            departureDate,
            departureTime: '00:00',
            arrivalDate,
            arrivalTime: '24:00', // Full 24h
            isExpat
        };

        return renderHook(() =>
            usePerDiemCalculator({
                travelInfo,
                transportInfo: defaultTransport,
                otherExpenses: defaultOtherExpenses,
                dayMeals: [{ date: departureDate, breakfast: false, lunch: false, dinner: false }]
            })
        );
    };

    it('uses correct rate for South Korea (KR)', () => {
        const { result } = runCalc('South Korea|Standard');
        const day = result.current?.dayBreakdown[0];
        // BMF 2026: 62€ Full Day (User provided)
        expect(day?.basePerDiem).toBe(62);
    });

    it('uses correct rate for USA (US) generic', () => {
        const { result } = runCalc('USA|Standard');
        const day = result.current?.dayBreakdown[0];
        // BMF 2026: 59€ Full Day
        expect(day?.basePerDiem).toBe(59);
    });

    it('uses correct rate for USA - New York City (US-NYC)', () => {
        const { result } = runCalc('USA|New York');
        const day = result.current?.dayBreakdown[0];
        // BMF 2026: 73€ Full Day (User provided)
        expect(day?.basePerDiem).toBe(73);
    });

    it('uses correct rate for Norway (NO)', () => {
        const { result } = runCalc('Norway|Standard');
        const day = result.current?.dayBreakdown[0];
        // BMF 2026: 55€ Full Day (User provided)
        expect(day?.basePerDiem).toBe(55);
    });

    it('applies Expat deduction correctly to new countries', () => {
        // Norway example: 55€ - 15€ = 40€
        const { result } = runCalc('Norway|Standard', true);
        const day = result.current?.dayBreakdown[0];
        expect(day?.basePerDiem).toBe(55);
        expect(day?.mealDeduction).toBe(15);
        expect(day?.netPerDiem).toBe(40);
    });
});

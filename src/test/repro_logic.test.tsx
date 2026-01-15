import { renderHook } from '@testing-library/react';
import { usePerDiemCalculator } from '../hooks/usePerDiemCalculator';
import { describe, it, expect, vi } from 'vitest';

// Mocks removed as we use real data for Germany (28/14 matches test expectations)

describe('usePerDiemCalculator Logic Check', () => {
    const defaultTransport = { type: 'car' as const, kilometers: 0 };
    const defaultOtherExpenses = [];
    const defaultDayMeals = [];

    it('calculates 8 hours for 16:00 departure and 24:00 availability (next day 00:00)', () => {
        const travelInfo1 = {
            travelerName: 'Test',
            purpose: 'Test',
            destination: 'Test',
            country: 'Germany',
            departureDate: new Date('2023-10-01'),
            departureTime: '16:00',
            arrivalDate: new Date('2023-10-02'),
            arrivalTime: '00:00',
        };

        const { result: result1 } = renderHook(() =>
            usePerDiemCalculator({
                travelInfo: travelInfo1,
                transportInfo: defaultTransport,
                otherExpenses: defaultOtherExpenses,
                dayMeals: [
                    { date: new Date('2023-10-01'), breakfast: false, lunch: false, dinner: false },
                    { date: new Date('2023-10-02'), breakfast: false, lunch: false, dinner: false }
                ],
            })
        );

        const breakdown1 = result1.current?.dayBreakdown;
        expect(breakdown1).toBeDefined();
        expect(breakdown1?.[0].hours).toBe(8);
        expect(breakdown1?.[0].basePerDiem).toBe(14);
    });

    it('handles same date 16:00 to 23:59 (approx 8 hours)', () => {
        const travelInfo = {
            travelerName: 'Test',
            purpose: 'Test',
            destination: 'Test',
            country: 'Germany',
            departureDate: new Date('2023-10-01'),
            departureTime: '16:00',
            arrivalDate: new Date('2023-10-01'),
            arrivalTime: '23:59',
        };

        const { result } = renderHook(() =>
            usePerDiemCalculator({
                travelInfo: travelInfo,
                transportInfo: defaultTransport,
                otherExpenses: defaultOtherExpenses,
                dayMeals: [{ date: new Date('2023-10-01'), breakfast: false, lunch: false, dinner: false }],
            })
        );

        const breakdown = result.current?.dayBreakdown;
        expect(breakdown?.[0].hours).toBe(7);
        expect(breakdown?.[0].basePerDiem).toBe(0);
    });

    it('calculates 8 hours when 24:00 is selected for arrival on same day', () => {
        const travelInfo = {
            travelerName: 'Test',
            purpose: 'Test',
            destination: 'Test',
            country: 'Germany',
            departureDate: new Date('2023-10-01'),
            departureTime: '16:00',
            arrivalDate: new Date('2023-10-01'),
            arrivalTime: '24:00',
        };

        const { result } = renderHook(() =>
            usePerDiemCalculator({
                travelInfo: travelInfo,
                transportInfo: defaultTransport,
                otherExpenses: defaultOtherExpenses,
                dayMeals: [{ date: new Date('2023-10-01'), breakfast: false, lunch: false, dinner: false }],
            })
        );

        const breakdown = result.current?.dayBreakdown;
        expect(breakdown).toBeDefined();
        expect(breakdown?.[0].hours).toBe(8);
        expect(breakdown?.[0].basePerDiem).toBe(14);
    });

    it('calculates meal deductions correctly (20% breakfast, 40% lunch/dinner of FULL rate)', () => {
        // Full rate is 28, so Breakfast = 5.6, Lunch = 11.2, Dinner = 11.2
        const travelInfo = {
            travelerName: 'Test',
            purpose: 'Test',
            destination: 'Test',
            country: 'Germany',
            departureDate: new Date('2023-10-01'),
            departureTime: '08:00',
            arrivalDate: new Date('2023-10-01'),
            arrivalTime: '20:00', // 12 hours -> partial rate (14)
        };

        const { result } = renderHook(() =>
            usePerDiemCalculator({
                travelInfo: travelInfo,
                transportInfo: defaultTransport,
                otherExpenses: defaultOtherExpenses,
                dayMeals: [{
                    date: new Date('2023-10-01'),
                    breakfast: true,  // -5.6
                    lunch: true,      // -11.2
                    dinner: false
                }],
            })
        );

        const breakdown = result.current?.dayBreakdown;
        expect(breakdown).toBeDefined();
        expect(breakdown?.[0].basePerDiem).toBe(14); // Partial rate

        // Deduction: 5.6 + 11.2 = 16.8
        // Net: 14 - 16.8 = -2.8 -> should be clamped to 0
        expect(breakdown?.[0].mealDeduction).toBeCloseTo(16.8);
        expect(breakdown?.[0].netPerDiem).toBe(0);
    });
});

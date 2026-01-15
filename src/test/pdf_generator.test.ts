import { describe, it, expect, vi } from 'vitest';
import { generateExpensePDF } from '../utils/pdfGenerator';
import { ExpenseCalculation, TravelInfo, TransportInfo, OtherExpense } from '@/types/expense';

// Mock jsPDF
const mockSave = vi.fn();
const mockText = vi.fn();
const mockSetFontSize = vi.fn();
const mockAddImage = vi.fn();

vi.mock('jspdf', () => {
    return {
        default: class {
            save = mockSave;
            text = mockText;
            setFontSize = mockSetFontSize;
            addImage = mockAddImage;
            lastAutoTable = { finalY: 100 };
        }
    };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
    default: vi.fn(),
}));

describe('generateExpensePDF', () => {
    const mockCalculation: ExpenseCalculation = {
        transportCost: 100,
        otherExpensesTotal: 50,
        totalPerDiem: 28,
        totalMealDeduction: 0,
        netPerDiem: 28,
        totalAmount: 178,
        dayBreakdown: [],
        documentName: 'ter_test_2023-10-01',
    };

    const mockTravelInfo: TravelInfo = {
        travelerName: 'Test User',
        purpose: 'Conference',
        destination: 'Berlin',
        country: 'Germany',
        departureDate: new Date(),
        departureTime: '10:00',
        arrivalDate: new Date(),
        arrivalTime: '18:00',
    };

    const mockTransportInfo: TransportInfo = {
        type: 'car',
        kilometers: 300,
    };

    it('should generate a PDF and call save with correct filename', () => {
        generateExpensePDF(mockCalculation, mockTravelInfo, mockTransportInfo, []);

        expect(mockSave).toHaveBeenCalledWith('ter_test_2023-10-01.pdf');
        expect(mockText).toHaveBeenCalledWith('Reisekostenabrechnung', 14, 30);
    });
});

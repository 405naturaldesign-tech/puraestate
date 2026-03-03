import FinancialCalculations from '../utils/calculations';

describe('FinancialCalculations', () => {
  describe('calculateCapRate', () => {
    it('should calculate cap rate correctly', () => {
      const capRate = FinancialCalculations.calculateCapRate(30000, 500000);
      expect(capRate).toBeCloseTo(6.0, 1);
    });

    it('should return 0 for zero property price', () => {
      const capRate = FinancialCalculations.calculateCapRate(30000, 0);
      expect(capRate).toBe(0);
    });

    it('should handle high income', () => {
      const capRate = FinancialCalculations.calculateCapRate(100000, 500000);
      expect(capRate).toBeCloseTo(20.0, 1);
    });
  });

  describe('calculateCashOnCash', () => {
    it('should calculate cash on cash return correctly', () => {
      const cashOnCash = FinancialCalculations.calculateCashOnCash(12000, 100000);
      expect(cashOnCash).toBeCloseTo(12.0, 1);
    });

    it('should return 0 for zero down payment', () => {
      const cashOnCash = FinancialCalculations.calculateCashOnCash(12000, 0);
      expect(cashOnCash).toBe(0);
    });
  });

  describe('calculateNOI', () => {
    it('should calculate NOI correctly', () => {
      const noi = FinancialCalculations.calculateNOI(2000, 90, 8000);
      expect(noi).toBeCloseTo(28000, 0);
    });

    it('should account for occupancy rate', () => {
      const noi1 = FinancialCalculations.calculateNOI(2000, 100, 8000);
      const noi2 = FinancialCalculations.calculateNOI(2000, 90, 8000);
      expect(noi1).toBeGreaterThan(noi2);
    });

    it('should subtract expenses correctly', () => {
      const noi = FinancialCalculations.calculateNOI(2000, 100, 5000);
      expect(noi).toBeCloseTo(19000, 0);
    });
  });

  describe('calculateBuyToRentRatio', () => {
    it('should calculate buy to rent ratio correctly', () => {
      const ratio = FinancialCalculations.calculateBuyToRentRatio(300000, 1500);
      expect(ratio).toBeCloseTo(16.67, 1);
    });

    it('should return 0 for zero rent', () => {
      const ratio = FinancialCalculations.calculateBuyToRentRatio(300000, 0);
      expect(ratio).toBe(0);
    });

    it('should identify good investments (< 20)', () => {
      const ratio = FinancialCalculations.calculateBuyToRentRatio(300000, 1500);
      expect(ratio).toBeLessThan(20);
    });
  });

  describe('calculateDSCR', () => {
    it('should calculate DSCR correctly', () => {
      const dscr = FinancialCalculations.calculateDSCR(36000, 2000);
      expect(dscr).toBeCloseTo(1.5, 1);
    });

    it('should return 0 for zero debt payment', () => {
      const dscr = FinancialCalculations.calculateDSCR(36000, 0);
      expect(dscr).toBe(0);
    });

    it('should identify good loans (> 1.25)', () => {
      const dscr = FinancialCalculations.calculateDSCR(36000, 2000);
      expect(dscr).toBeGreaterThan(1.25);
    });

    it('should identify risky loans (< 1.25)', () => {
      const dscr = FinancialCalculations.calculateDSCR(24000, 2000);
      expect(dscr).toBeLessThan(1.25);
    });
  });

  describe('calculateMonthlyPayment', () => {
    it('should calculate monthly payment correctly', () => {
      // $300,000 at 6% for 360 months (30 years)
      const payment = FinancialCalculations.calculateMonthlyPayment(300000, 6, 360);
      expect(payment).toBeCloseTo(1799, 0);
    });

    it('should handle zero interest', () => {
      const payment = FinancialCalculations.calculateMonthlyPayment(300000, 0, 360);
      expect(payment).toBeCloseTo(833.33, 0);
    });

    it('should increase with higher interest rates', () => {
      const payment6 = FinancialCalculations.calculateMonthlyPayment(300000, 6, 360);
      const payment8 = FinancialCalculations.calculateMonthlyPayment(300000, 8, 360);
      expect(payment8).toBeGreaterThan(payment6);
    });

    it('should increase with shorter loan term', () => {
      const payment30yr = FinancialCalculations.calculateMonthlyPayment(300000, 6, 360);
      const payment15yr = FinancialCalculations.calculateMonthlyPayment(300000, 6, 180);
      expect(payment15yr).toBeGreaterThan(payment30yr);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate correct number of payments', () => {
      const schedule = FinancialCalculations.generateAmortizationSchedule(
        100000,
        6,
        120
      );
      expect(schedule).toHaveLength(120);
    });

    it('should have decreasing interest payments', () => {
      const schedule = FinancialCalculations.generateAmortizationSchedule(
        100000,
        6,
        120
      );
      expect(schedule[0].interest).toBeGreaterThan(schedule[119].interest);
    });

    it('should have increasing principal payments', () => {
      const schedule = FinancialCalculations.generateAmortizationSchedule(
        100000,
        6,
        120
      );
      expect(schedule[0].principal).toBeLessThan(schedule[119].principal);
    });

    it('should end with zero balance', () => {
      const schedule = FinancialCalculations.generateAmortizationSchedule(
        100000,
        6,
        120
      );
      expect(schedule[119].balance).toBeCloseTo(0, 2);
    });

    it('should have consistent payment amount', () => {
      const schedule = FinancialCalculations.generateAmortizationSchedule(
        100000,
        6,
        120
      );
      for (let i = 0; i < schedule.length - 1; i++) {
        expect(schedule[i].payment).toBeCloseTo(schedule[i + 1].payment, 0);
      }
    });
  });

  describe('calculateClosingCosts', () => {
    it('should calculate closing costs for residential', () => {
      const costs = FinancialCalculations.calculateClosingCosts(300000, 'residential');
      expect(costs.total).toBeGreaterThan(0);
      expect(costs.transferTax).toBeCloseTo(4500, 0); // 1.5%
    });

    it('should calculate correct tax percentages', () => {
      const costs = FinancialCalculations.calculateClosingCosts(300000, 'residential');
      expect(costs.transferTax).toBeCloseTo(300000 * 0.015, 0);
      expect(costs.notaryFees).toBeCloseTo(300000 * 0.0075, 0);
    });

    it('should sum all components', () => {
      const costs = FinancialCalculations.calculateClosingCosts(300000, 'residential');
      const sum =
        costs.transferTax +
        costs.notaryFees +
        costs.registryFees +
        costs.legalFees +
        costs.inspectionFees +
        costs.insuranceFees;
      expect(costs.total).toBeCloseTo(sum, 0);
    });
  });

  describe('calculateROI', () => {
    it('should calculate ROI correctly', () => {
      const roi = FinancialCalculations.calculateROI(50000, 100000);
      expect(roi).toBeCloseTo(50, 1);
    });

    it('should return 0 for zero investment', () => {
      const roi = FinancialCalculations.calculateROI(50000, 0);
      expect(roi).toBe(0);
    });

    it('should handle negative returns', () => {
      const roi = FinancialCalculations.calculateROI(-10000, 100000);
      expect(roi).toBeCloseTo(-10, 1);
    });
  });

  describe('projectRentalIncome', () => {
    it('should project for correct number of years', () => {
      const projections = FinancialCalculations.projectRentalIncome(1000, 3, 5);
      expect(projections).toHaveLength(5);
    });

    it('should increase with growth rate', () => {
      const projections = FinancialCalculations.projectRentalIncome(1000, 3, 5);
      for (let i = 0; i < projections.length - 1; i++) {
        expect(projections[i + 1]).toBeGreaterThan(projections[i]);
      }
    });

    it('should start with base amount', () => {
      const projections = FinancialCalculations.projectRentalIncome(1000, 3, 5);
      expect(projections[0]).toBeCloseTo(1000, 0);
    });

    it('should compound correctly', () => {
      const projections = FinancialCalculations.projectRentalIncome(1000, 3, 3);
      expect(projections[1]).toBeCloseTo(1030, 0); // 1000 * 1.03
      expect(projections[2]).toBeCloseTo(1060.9, 0); // 1000 * 1.03^2
    });
  });
});

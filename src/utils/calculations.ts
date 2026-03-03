import Decimal from 'decimal.js';

Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

export class FinancialCalculations {
  /**
   * Calculate Cap Rate (Capitalization Rate)
   * Cap Rate = Net Operating Income / Property Value
   */
  static calculateCapRate(
    annualNetIncome: number,
    propertyPrice: number
  ): number {
    if (propertyPrice === 0) return 0;
    const result = new Decimal(annualNetIncome)
      .div(new Decimal(propertyPrice))
      .mul(100);
    return result.toNumber();
  }

  /**
   * Calculate Cash-on-Cash Return
   * Cash-on-Cash = Annual Cash Flow / Initial Cash Investment
   */
  static calculateCashOnCash(
    annualCashFlow: number,
    downPayment: number
  ): number {
    if (downPayment === 0) return 0;
    const result = new Decimal(annualCashFlow)
      .div(new Decimal(downPayment))
      .mul(100);
    return result.toNumber();
  }

  /**
   * Calculate Net Operating Income
   * NOI = Gross Rental Income - Operating Expenses
   */
  static calculateNOI(
    monthlyRent: number,
    occupancyRate: number,
    annualExpenses: number
  ): number {
    const grossAnnualIncome = new Decimal(monthlyRent)
      .mul(12)
      .mul(new Decimal(occupancyRate).div(100));
    return grossAnnualIncome.minus(annualExpenses).toNumber();
  }

  /**
   * Calculate Buy-to-Rent Ratio
   * Lower is better (typically < 20 is good)
   */
  static calculateBuyToRentRatio(propertyPrice: number, monthlyRent: number): number {
    if (monthlyRent === 0) return 0;
    const result = new Decimal(propertyPrice)
      .div(new Decimal(monthlyRent).mul(12));
    return result.toNumber();
  }

  /**
   * Calculate Debt Service Coverage Ratio
   * DSCR = NOI / Debt Service
   * (DSCR > 1.25 is typically required for loans)
   */
  static calculateDSCR(noi: number, monthlyDebtPayment: number): number {
    const annualDebtService = new Decimal(monthlyDebtPayment).mul(12);
    if (annualDebtService.toNumber() === 0) return 0;
    const result = new Decimal(noi).div(annualDebtService);
    return result.toNumber();
  }

  /**
   * Calculate monthly mortgage payment
   * P = L[c(1 + c)^n]/[(1 + c)^n - 1]
   * Where: L = loan amount, c = monthly interest rate, n = number of payments
   */
  static calculateMonthlyPayment(
    loanAmount: number,
    annualInterestRate: number,
    loanTermMonths: number
  ): number {
    const principal = new Decimal(loanAmount);
    const monthlyRate = new Decimal(annualInterestRate)
      .div(100)
      .div(12);
    const numPayments = new Decimal(loanTermMonths);

    if (monthlyRate.toNumber() === 0) {
      // Simple division if no interest
      return principal.div(numPayments).toNumber();
    }

    const numerator = monthlyRate.mul(
      monthlyRate.plus(1).pow(loanTermMonths)
    );
    const denominator = monthlyRate.plus(1).pow(loanTermMonths).minus(1);
    const payment = principal.mul(numerator.div(denominator));

    return payment.toNumber();
  }

  /**
   * Generate amortization schedule
   */
  static generateAmortizationSchedule(
    loanAmount: number,
    annualInterestRate: number,
    loanTermMonths: number
  ): Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }> {
    const monthlyPayment = this.calculateMonthlyPayment(
      loanAmount,
      annualInterestRate,
      loanTermMonths
    );
    const monthlyRate = new Decimal(annualInterestRate).div(100).div(12);
    let balance = new Decimal(loanAmount);
    const schedule = [];

    for (let i = 1; i <= loanTermMonths; i++) {
      const interestPayment = balance.mul(monthlyRate);
      const principalPayment = new Decimal(monthlyPayment).minus(interestPayment);
      balance = balance.minus(principalPayment);

      schedule.push({
        month: i,
        payment: monthlyPayment,
        principal: principalPayment.toNumber(),
        interest: interestPayment.toNumber(),
        balance: Math.max(0, balance.toNumber()), // Prevent negative due to rounding
      });
    }

    return schedule;
  }

  /**
   * Calculate closing costs for Costa Rica
   */
  static calculateClosingCosts(
    propertyPrice: number,
    propertyType: 'residential' | 'commercial' | 'land'
  ): {
    transferTax: number;
    notaryFees: number;
    registryFees: number;
    legalFees: number;
    inspectionFees: number;
    insuranceFees: number;
    total: number;
  } {
    const price = new Decimal(propertyPrice);

    // Transfer tax (impuesto de traspaso) - typically 1.5%
    const transferTax = price.mul(0.015);

    // Notary fees - typically 0.5-1%
    const notaryFees = price.mul(0.0075);

    // Registry fees - typically 0.5%
    const registryFees = price.mul(0.005);

    // Legal fees (fixed or % based)
    const legalFees = price.mul(0.01);

    // Property inspection - fixed amount
    const inspectionFees = new Decimal(200); // Approximate USD

    // Insurance (title or other) - 0.5%
    const insuranceFees = price.mul(0.005);

    const total = transferTax
      .plus(notaryFees)
      .plus(registryFees)
      .plus(legalFees)
      .plus(inspectionFees)
      .plus(insuranceFees);

    return {
      transferTax: transferTax.toNumber(),
      notaryFees: notaryFees.toNumber(),
      registryFees: registryFees.toNumber(),
      legalFees: legalFees.toNumber(),
      inspectionFees: inspectionFees.toNumber(),
      insuranceFees: insuranceFees.toNumber(),
      total: total.toNumber(),
    };
  }

  /**
   * Calculate ROI
   * ROI = (Net Profit / Initial Investment) * 100
   */
  static calculateROI(netProfit: number, initialInvestment: number): number {
    if (initialInvestment === 0) return 0;
    const result = new Decimal(netProfit)
      .div(initialInvestment)
      .mul(100);
    return result.toNumber();
  }

  /**
   * Calculate annualized return
   */
  static calculateAnnualizedReturn(
    totalReturn: number,
    yearsHeld: number
  ): number {
    if (yearsHeld <= 0) return 0;
    const result = Math.pow(1 + totalReturn / 100, 1 / yearsHeld) - 1;
    return result * 100;
  }

  /**
   * Compound calculation for rental growth
   */
  static projectRentalIncome(
    monthlyRent: number,
    annualGrowthRate: number,
    years: number
  ): number[] {
    const projections: number[] = [];
    let rent = new Decimal(monthlyRent);
    const growthMultiplier = new Decimal(1).plus(
      new Decimal(annualGrowthRate).div(100)
    );

    for (let i = 0; i < years; i++) {
      projections.push(rent.toNumber());
      rent = rent.mul(growthMultiplier);
    }

    return projections;
  }
}

export default FinancialCalculations;

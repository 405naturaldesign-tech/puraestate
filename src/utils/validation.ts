import Decimal from 'decimal.js';

export interface ValidationError {
  field: string;
  message: string;
}

export class Validator {
  static isPositiveNumber(value: any, fieldName: string): ValidationError | null {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return {
        field: fieldName,
        message: `${fieldName} must be a positive number`,
      };
    }
    return null;
  }

  static isNonNegativeNumber(value: any, fieldName: string): ValidationError | null {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return {
        field: fieldName,
        message: `${fieldName} must be a non-negative number`,
      };
    }
    return null;
  }

  static isValidPercentage(value: any, fieldName: string): ValidationError | null {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) {
      return {
        field: fieldName,
        message: `${fieldName} must be between 0 and 100`,
      };
    }
    return null;
  }

  static isValidEmail(value: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        field: 'email',
        message: 'Invalid email format',
      };
    }
    return null;
  }

  static isNotEmpty(value: any, fieldName: string): ValidationError | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
      };
    }
    return null;
  }

  static isValidDate(value: string, fieldName: string): ValidationError | null {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid date`,
      };
    }
    return null;
  }

  static isValidPhoneNumber(value: string, countryCode: string = 'CR'): ValidationError | null {
    const phoneRegex: Record<string, RegExp> = {
      CR: /^(\+506)?[\s]?[0-9]{4}[-\s]?[0-9]{4}$/,
      US: /^(\+1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
    };

    const regex = phoneRegex[countryCode] || phoneRegex.CR;
    if (!regex.test(value)) {
      return {
        field: 'phone',
        message: `Invalid ${countryCode} phone number`,
      };
    }
    return null;
  }

  static validateROIInputs(inputs: {
    propertyPrice: number;
    downPayment: number;
    monthlyRent: number;
    annualExpenses: number;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    const priceError = this.isPositiveNumber(inputs.propertyPrice, 'Property Price');
    if (priceError) errors.push(priceError);

    const downPaymentError = this.isNonNegativeNumber(inputs.downPayment, 'Down Payment');
    if (downPaymentError) errors.push(downPaymentError);

    if (inputs.downPayment > inputs.propertyPrice) {
      errors.push({
        field: 'downPayment',
        message: 'Down payment cannot exceed property price',
      });
    }

    const rentError = this.isNonNegativeNumber(inputs.monthlyRent, 'Monthly Rent');
    if (rentError) errors.push(rentError);

    const expensesError = this.isNonNegativeNumber(inputs.annualExpenses, 'Annual Expenses');
    if (expensesError) errors.push(expensesError);

    return errors;
  }

  static validateMortgageInputs(inputs: {
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    const loanError = this.isPositiveNumber(inputs.loanAmount, 'Loan Amount');
    if (loanError) errors.push(loanError);

    const rateError = this.isValidPercentage(inputs.interestRate, 'Interest Rate');
    if (rateError) errors.push(rateError);

    const termError = this.isPositiveNumber(inputs.loanTerm, 'Loan Term');
    if (termError) errors.push(termError);

    if (inputs.loanTerm > 360) {
      errors.push({
        field: 'loanTerm',
        message: 'Loan term should not exceed 30 years (360 months)',
      });
    }

    return errors;
  }
}

export default Validator;

import Validator from '../utils/validation';

describe('Validator', () => {
  describe('isPositiveNumber', () => {
    it('should accept positive numbers', () => {
      const error = Validator.isPositiveNumber(100, 'test');
      expect(error).toBeNull();
    });

    it('should reject zero', () => {
      const error = Validator.isPositiveNumber(0, 'test');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('positive');
    });

    it('should reject negative numbers', () => {
      const error = Validator.isPositiveNumber(-100, 'test');
      expect(error).not.toBeNull();
    });

    it('should reject non-numbers', () => {
      const error = Validator.isPositiveNumber('abc', 'test');
      expect(error).not.toBeNull();
    });

    it('should handle string numbers', () => {
      const error = Validator.isPositiveNumber('100', 'test');
      expect(error).toBeNull();
    });
  });

  describe('isNonNegativeNumber', () => {
    it('should accept positive numbers', () => {
      const error = Validator.isNonNegativeNumber(100, 'test');
      expect(error).toBeNull();
    });

    it('should accept zero', () => {
      const error = Validator.isNonNegativeNumber(0, 'test');
      expect(error).toBeNull();
    });

    it('should reject negative numbers', () => {
      const error = Validator.isNonNegativeNumber(-1, 'test');
      expect(error).not.toBeNull();
    });
  });

  describe('isValidPercentage', () => {
    it('should accept valid percentages', () => {
      expect(Validator.isValidPercentage(0, 'test')).toBeNull();
      expect(Validator.isValidPercentage(50, 'test')).toBeNull();
      expect(Validator.isValidPercentage(100, 'test')).toBeNull();
    });

    it('should reject values > 100', () => {
      const error = Validator.isValidPercentage(101, 'test');
      expect(error).not.toBeNull();
    });

    it('should reject negative values', () => {
      const error = Validator.isValidPercentage(-1, 'test');
      expect(error).not.toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(Validator.isValidEmail('test@example.com')).toBeNull();
      expect(Validator.isValidEmail('user.name@domain.co.uk')).toBeNull();
    });

    it('should reject invalid emails', () => {
      expect(Validator.isValidEmail('invalid')).not.toBeNull();
      expect(Validator.isValidEmail('invalid@')).not.toBeNull();
      expect(Validator.isValidEmail('@invalid.com')).not.toBeNull();
    });
  });

  describe('isNotEmpty', () => {
    it('should accept non-empty strings', () => {
      const error = Validator.isNotEmpty('hello', 'test');
      expect(error).toBeNull();
    });

    it('should reject empty strings', () => {
      const error = Validator.isNotEmpty('', 'test');
      expect(error).not.toBeNull();
    });

    it('should reject whitespace', () => {
      const error = Validator.isNotEmpty('   ', 'test');
      expect(error).not.toBeNull();
    });

    it('should reject null/undefined', () => {
      expect(Validator.isNotEmpty(null, 'test')).not.toBeNull();
      expect(Validator.isNotEmpty(undefined, 'test')).not.toBeNull();
    });
  });

  describe('isValidDate', () => {
    it('should accept valid dates', () => {
      expect(Validator.isValidDate('2024-01-15', 'test')).toBeNull();
      expect(Validator.isValidDate(new Date().toISOString(), 'test')).toBeNull();
    });

    it('should reject invalid dates', () => {
      const error = Validator.isValidDate('invalid-date', 'test');
      expect(error).not.toBeNull();
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should accept valid Costa Rica numbers', () => {
      expect(Validator.isValidPhoneNumber('2225-5555', 'CR')).toBeNull();
      expect(Validator.isValidPhoneNumber('+506 2225-5555', 'CR')).toBeNull();
    });

    it('should accept valid US numbers', () => {
      expect(Validator.isValidPhoneNumber('(555) 123-4567', 'US')).toBeNull();
      expect(Validator.isValidPhoneNumber('+1 555-123-4567', 'US')).toBeNull();
    });

    it('should reject invalid phone numbers', () => {
      expect(Validator.isValidPhoneNumber('123', 'CR')).not.toBeNull();
      expect(Validator.isValidPhoneNumber('invalid', 'CR')).not.toBeNull();
    });
  });

  describe('validateROIInputs', () => {
    it('should accept valid ROI inputs', () => {
      const errors = Validator.validateROIInputs({
        propertyPrice: 300000,
        downPayment: 100000,
        monthlyRent: 2000,
        annualExpenses: 8000,
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject zero property price', () => {
      const errors = Validator.validateROIInputs({
        propertyPrice: 0,
        downPayment: 100000,
        monthlyRent: 2000,
        annualExpenses: 8000,
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject down payment > property price', () => {
      const errors = Validator.validateROIInputs({
        propertyPrice: 300000,
        downPayment: 400000,
        monthlyRent: 2000,
        annualExpenses: 8000,
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should catch multiple errors', () => {
      const errors = Validator.validateROIInputs({
        propertyPrice: -100,
        downPayment: -50,
        monthlyRent: -1000,
        annualExpenses: -5000,
      });
      expect(errors.length).toBeGreaterThan(2);
    });
  });

  describe('validateMortgageInputs', () => {
    it('should accept valid mortgage inputs', () => {
      const errors = Validator.validateMortgageInputs({
        loanAmount: 300000,
        interestRate: 6.5,
        loanTerm: 360,
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid interest rate', () => {
      const errors = Validator.validateMortgageInputs({
        loanAmount: 300000,
        interestRate: 150,
        loanTerm: 360,
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should warn about very long loan terms', () => {
      const errors = Validator.validateMortgageInputs({
        loanAmount: 300000,
        interestRate: 6.5,
        loanTerm: 500,
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject zero loan amount', () => {
      const errors = Validator.validateMortgageInputs({
        loanAmount: 0,
        interestRate: 6.5,
        loanTerm: 360,
      });
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

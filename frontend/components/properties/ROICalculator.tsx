'use client';

import { useState } from 'react';

import { Calculator, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { calculateROI, formatCurrency } from '@/lib/utils';

interface ROICalculatorProps {
  propertyPrice?: number;
}

export function ROICalculator({ propertyPrice }: ROICalculatorProps) {
  const [inputs, setInputs] = useState({
    purchasePrice: propertyPrice || 500000,
    downPaymentPercent: 20,
    interestRate: 7.0,
    loanTermYears: 30,
    monthlyRent: 3000,
    monthlyExpenses: 500,
    annualAppreciation: 4,
    holdYears: 10,
  });

  const [showResults, setShowResults] = useState(false);

  const results = calculateROI(inputs);

  const updateInput = (field: keyof typeof inputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const metrics = [
    { label: 'Down Payment', value: formatCurrency(results.downPayment) },
    { label: 'Monthly Mortgage', value: formatCurrency(results.monthlyMortgage) },
    { label: 'Monthly Cash Flow', value: formatCurrency(results.monthlyCashFlow), highlight: results.monthlyCashFlow > 0 },
    { label: 'Annual Cash Flow', value: formatCurrency(results.annualCashFlow), highlight: results.annualCashFlow > 0 },
    { label: 'Cash-on-Cash Return', value: `${results.cashOnCashReturn.toFixed(2)}%`, highlight: results.cashOnCashReturn > 0 },
    { label: 'Cap Rate', value: `${results.capRate.toFixed(2)}%`, highlight: results.capRate > 0 },
    { label: `Future Value (${inputs.holdYears}yr)`, value: formatCurrency(results.futureValue) },
    { label: `Total ROI (${inputs.holdYears}yr)`, value: `${results.roi.toFixed(1)}%`, highlight: results.roi > 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-600" />
          ROI Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Input
            label="Purchase Price"
            type="number"
            value={inputs.purchasePrice}
            onChange={(e) => updateInput('purchasePrice', Number(e.target.value))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Down Payment %"
              type="number"
              min="0"
              max="100"
              value={inputs.downPaymentPercent}
              onChange={(e) => updateInput('downPaymentPercent', Number(e.target.value))}
            />
            <Input
              label="Interest Rate %"
              type="number"
              step="0.1"
              value={inputs.interestRate}
              onChange={(e) => updateInput('interestRate', Number(e.target.value))}
            />
            <Input
              label="Monthly Rent"
              type="number"
              value={inputs.monthlyRent}
              onChange={(e) => updateInput('monthlyRent', Number(e.target.value))}
            />
            <Input
              label="Monthly Expenses"
              type="number"
              value={inputs.monthlyExpenses}
              onChange={(e) => updateInput('monthlyExpenses', Number(e.target.value))}
            />
            <Input
              label="Appreciation %/yr"
              type="number"
              step="0.5"
              value={inputs.annualAppreciation}
              onChange={(e) => updateInput('annualAppreciation', Number(e.target.value))}
            />
            <Input
              label="Hold Period (years)"
              type="number"
              value={inputs.holdYears}
              onChange={(e) => updateInput('holdYears', Number(e.target.value))}
            />
          </div>

          <Button
            fullWidth
            onClick={() => setShowResults(!showResults)}
            leftIcon={<TrendingUp className="h-4 w-4" />}
          >
            {showResults ? 'Update' : 'Calculate ROI'}
          </Button>

          {showResults && (
            <div className="mt-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
              <h4 className="mb-3 font-semibold text-neutral-900 dark:text-white">
                Investment Analysis
              </h4>
              <div className="space-y-2">
                {metrics.map(({ label, value, highlight }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
                    <span
                      className={`text-sm font-semibold ${
                        highlight !== undefined
                          ? highlight
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400'
                          : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

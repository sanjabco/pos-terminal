const moment: typeof import('moment') = require('moment-jalaali');
import type {CashBack, CashBackDto, TransactionResult} from '../services/api';

export function getPurchaseCashback(
  results: TransactionResult[],
  purchases: CashBackDto[],
  plans: CashBack[],
): number {
  const now = moment();
  return results.reduce((total, result, index) => {
    const purchase = purchases[index];
    if (!purchase) {
      return total;
    }
    const hasActivePlan = plans.some(plan => {
      if (
        Number(plan.lineId) !== Number(purchase.lineId) ||
        !(Number(plan.cashBackPercentage) > 0)
      ) {
        return false;
      }
      if (typeof plan.isActive === 'boolean') {
        return plan.isActive;
      }
      const from = moment(plan.fromDate, 'jYYYY/jMM/jDD', true);
      const to = moment(plan.toDate, 'jYYYY/jMM/jDD', true);
      return (
        from.isValid() &&
        to.isValid() &&
        now.isBetween(from, to.endOf('day'), undefined, '[]')
      );
    });
    const amount = Number(result.payBackAmount);
    const price = Number(purchase.price);
    if (
      !hasActivePlan ||
      !Number.isFinite(amount) ||
      !Number.isFinite(price) ||
      amount <= 0 ||
      amount > price
    ) {
      return total;
    }
    return total + amount;
  }, 0);
}

import {describe, expect, it} from '@jest/globals';
import {getPurchaseCashback} from '../application/utils/purchaseCashback';

const purchase = {lineId: 1, price: '100000'} as any;
const plan = {lineId: 1, cashBackPercentage: 10, isActive: true} as any;
const result = (amount: unknown) => ({payBackAmount: amount} as any);

describe('purchase cashback display', () => {
  it('returns zero without an active plan even if the API returns a huge amount', () => {
    expect(getPurchaseCashback([result(70000000000000)], [purchase], [])).toBe(
      0,
    );
    expect(
      getPurchaseCashback(
        [result(1000)],
        [purchase],
        [{...plan, isActive: false}],
      ),
    ).toBe(0);
  });

  it('requires an active plan for the purchased line', () => {
    expect(
      getPurchaseCashback([result(1000)], [purchase], [{...plan, lineId: 2}]),
    ).toBe(0);
  });

  it.each([70000000000000, Infinity, NaN, -1, 'invalid'])(
    'rejects invalid cashback %s',
    amount => {
      expect(getPurchaseCashback([result(amount)], [purchase], [plan])).toBe(0);
    },
  );

  it('sums actual cashback from all purchased lines', () => {
    expect(
      getPurchaseCashback(
        [result('1000'), result(2000)],
        [purchase, {...purchase, lineId: 2}],
        [plan, {...plan, lineId: 2}],
      ),
    ).toBe(3000);
  });

  it('accepts a legacy plan within its Jalali date range', () => {
    expect(
      getPurchaseCashback(
        [result(1000)],
        [purchase],
        [
          {
            ...plan,
            isActive: undefined,
            fromDate: '1400/01/01',
            toDate: '1450/01/01',
          },
        ],
      ),
    ).toBe(1000);
  });
});

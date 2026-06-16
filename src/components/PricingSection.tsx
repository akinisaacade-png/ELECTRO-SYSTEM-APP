import React, { useState } from 'react';
import { checkout, PRICE_IDS } from './stripePayments';

export const PricingSection: React.FC = () => {
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);

  const handlePayment = async (priceId: string) => {
    setLoadingPrice(priceId);
    await checkout(priceId);
    setLoadingPrice(null);
  };

  return (
    <div className="space-y-4">
      {/* Monthly Checkout Button */}
      <button
        onClick={() => handlePayment(PRICE_IDS.MONTHLY)}
        disabled={loadingPrice !== null}
        className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-medium rounded-md transition-colors"
      >
        {loadingPrice === PRICE_IDS.MONTHLY ? 'Connecting to Stripe...' : 'Secure Stripe Checkout (Monthly)'}
      </button>

      {/* Yearly Checkout Button */}
      <button
        onClick={() => handlePayment(PRICE_IDS.YEARLY)}
        disabled={loadingPrice !== null}
        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-medium rounded-md transition-colors"
      >
        {loadingPrice === PRICE_IDS.YEARLY ? 'Connecting to Stripe...' : 'Secure Stripe Checkout (Annual)'}
      </button>
    </div>
  );
};

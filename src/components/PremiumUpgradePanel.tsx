import React, { useState } from 'react';
import { checkout, PRICE_IDS } from '../firebase';

export const PremiumUpgradePanel: React.FC = () => {
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoadingPrice(priceId);
    await checkout(priceId);
    setLoadingPrice(null);
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-md mx-auto text-white shadow-xl">
      <h3 className="text-xl font-bold mb-2 text-amber-400 flex items-center gap-2">
        <span>★</span> Unlock High-Thinking Cores
      </h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        Upgrade to a premium license to activate complete rulebases for BS 7671, NEC NFPA, and advanced engineering modules.
      </p>

      <div className="space-y-4">
        {/* Monthly Card */}
        <div className="p-4 border border-slate-700 bg-slate-800/50 rounded-lg flex justify-between items-center transition hover:border-slate-650">
          <div>
            <h4 className="font-semibold text-slate-200">Premium Monthly</h4>
            <span className="text-xs text-slate-400">$29.99 / month</span>
          </div>
          <button
            onClick={() => handleSubscribe(PRICE_IDS.MONTHLY)}
            disabled={loadingPrice !== null}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-slate-950 font-medium rounded-md text-sm transition-colors cursor-pointer"
          >
            {loadingPrice === PRICE_IDS.MONTHLY ? 'Loading...' : 'Select'}
          </button>
        </div>

        {/* Yearly Card */}
        <div className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-lg flex justify-between items-center transition hover:border-amber-500/50">
          <div>
            <h4 className="font-semibold text-amber-300">Premium Yearly (Save ~16%)</h4>
            <span className="text-xs text-slate-400">$299.99 / year</span>
          </div>
          <button
            onClick={() => handleSubscribe(PRICE_IDS.YEARLY)}
            disabled={loadingPrice !== null}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-slate-950 font-medium rounded-md text-sm transition-colors cursor-pointer animate-pulse"
          >
            {loadingPrice === PRICE_IDS.YEARLY ? 'Loading...' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
};

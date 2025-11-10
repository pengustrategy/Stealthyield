'use client';

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { useTopMilkers } from '@/hooks/useHolders';
import { config } from '@/lib/config';

export default function MilkerPage() {
  useEffect(() => {
    document.title = 'Holders - Stealthyield Protocol';
  }, []);
  const { milkers, totalHeld, loading } = useTopMilkers(config.tokenMint, 500);
  
  // Summary stats
  const stats = {
    currentThreshold: 500,
    totalMilkers: milkers.length,
    totalStydHeld: totalHeld / 1000, // Convert to K
    dailyEmission: 250_000,
  };
  
  return (
    <div className="min-h-screen font-crimson flex">
      <Header />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Holders</h1>
          <p className="text-gray-500 text-sm">Passive Income Through Holding</p>
        </div>
        
        {/* About */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">Hold & Earn Automatically</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            Token holders maintaining a minimum of <span className="text-silver-400 font-semibold">{stats.currentThreshold} STYD</span> receive 
            automatic emissions distributed every 10 minutes. No staking required — simply hold in your wallet.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            The protocol inflates {(stats.dailyEmission / 1000).toFixed(0)}K STYD daily, allocating 50% to holders 
            proportionally. Larger holdings earn proportionally larger shares of the inflation pool.
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-gray-400 text-xs mb-2">Minimum Balance</div>
            <div className="text-3xl font-bold text-white mb-1">{stats.currentThreshold}</div>
            <div className="text-gray-500 text-xs">STYD required</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-gray-400 text-xs mb-2">Eligible Holders</div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalMilkers}</div>
            <div className="text-gray-500 text-xs">Receiving emissions</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-gray-400 text-xs mb-2">Total Holdings</div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalStydHeld.toFixed(2)}K</div>
            <div className="text-gray-500 text-xs">Collectively held</div>
          </div>
        </div>
        
        {/* Top Holders Rankings */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Top Holders</h2>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-white/10 text-xs text-gray-400 font-semibold">
              <div>Address</div>
              <div className="text-right">Balance</div>
              <div className="text-right">Pool Share</div>
              <div className="text-right">Daily Earnings</div>
              <div className="text-center">Last Distribution</div>
            </div>
            
            {/* Table Body */}
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Loading holders...
              </div>
            ) : milkers.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No eligible holders found
              </div>
            ) : (
              milkers.map((milker, index) => (
              <div
                key={milker.address}
                className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors text-sm"
              >
                {/* Address - Clickable */}
                <div className="flex items-center">
                  <a
                    href={`https://explorer.solana.com/address/${milker.fullAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-mono hover:text-silver-400 transition-colors"
                  >
                    {milker.address}
                  </a>
                </div>
                
                {/* STYD Holdings */}
                <div className="flex items-center justify-end">
                  <span className="text-white font-semibold">{milker.balance.toLocaleString()}</span>
                </div>
                
                {/* Share % */}
                <div className="flex items-center justify-end">
                  <span className="text-silver-400 font-semibold">{milker.share.toFixed(4)}%</span>
                </div>
                
                {/* STYD Per Day */}
                <div className="flex items-center justify-end">
                  <span className="text-silver-400 font-semibold">{(milker.stydPerDay / 1000).toFixed(2)}K</span>
                </div>
                
                {/* Last Reward Transaction */}
                <div className="flex items-center justify-center">
                  {milker.lastTx ? (
                    <a
                      href={`https://explorer.solana.com/tx/${milker.lastTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-silver-400 hover:text-white text-xs underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-gray-600 text-xs">-</span>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { useBreederRankings } from '@/hooks/useHolders';
import { useMotherWombBalance } from '@/hooks/useRealtimeData';
import { config } from '@/lib/config';

export default function BreederPage() {
  useEffect(() => {
    document.title = 'Liquidity Providers - Stealthyield Protocol';
  }, []);
  const { breeders, totalStydHeld, totalLP, loading } = useBreederRankings(
    config.tokenMint, 
    config.raydiumPool, 
    1000
  );
  const { balance: motherWombBalance } = useMotherWombBalance(config.motherWombAddress);
  
  // Summary stats
  const stats = {
    motherWombBalance,
    totalBreeders: breeders.length,
    totalSoreHeld: totalStydHeld / 1000, // Convert to K
    totalLPTokens: totalLP,
    totalLPValue: totalLP * 1000, // Rough estimate
  };
  
  return (
    <div className="min-h-screen font-crimson flex">
      <Header />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Liquidity Providers</h1>
          <p className="text-gray-500 text-sm">Dual-Reward LP Staking</p>
        </div>
        
        {/* About */}
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">Earn While You Provide</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            LP providers who hold minimum <span className="text-silver-400 font-semibold">1,000 STYD</span> and 
            contribute liquidity unlock dual earnings: <span className="text-silver-400 font-semibold">STYD emissions</span> from 
            network inflation plus <span className="text-silver-400 font-semibold">SOL rewards</span> converted from 
            transaction fees. All distributions occur automatically every 10 minutes, proportional to your LP share.
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-gray-400 text-xs mb-2">Reward Pool Balance</div>
            <div className="text-3xl font-bold text-white mb-1">{stats.motherWombBalance.toFixed(2)}</div>
            <div className="text-gray-500 text-xs">SOL ready to distribute</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-gray-400 text-xs mb-2">Active Providers</div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalBreeders}</div>
            <div className="text-gray-500 text-xs">LP stakers</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-gray-400 text-xs mb-2">Staked STYD</div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalSoreHeld.toFixed(2)}K</div>
            <div className="text-gray-500 text-xs">By all providers</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-5">
            <div className="text-gray-400 text-xs mb-2">LP Position Value</div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalLPTokens.toFixed(2)}</div>
            <div className="text-gray-500 text-xs">${(stats.totalLPValue / 1000).toFixed(2)}K TVL</div>
          </div>
        </div>
        
        {/* LP Provider Rankings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Top LP Providers</h2>
            <a
              href="https://raydium.io/liquidity/increase/?mode=add&pool_id=BeNW14fnU2uJKkvCmtKDRejmFFHM66kW65oAkaUwKYbK"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-silver-400 hover:bg-silver-500 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add LP
            </a>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 px-4 py-3 border-b border-white/10 text-xs text-gray-400 font-semibold">
              <div>Address</div>
              <div className="text-right">STYD Balance</div>
              <div className="text-right">LP Tokens</div>
              <div className="text-right">Pool Share</div>
              <div className="text-right">STYD Daily</div>
              <div className="text-right">SOL Daily</div>
              <div className="text-center">Last Distribution</div>
            </div>
            
            {/* Table Body */}
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Loading LP providers...
              </div>
            ) : breeders.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No LP providers found
              </div>
            ) : (
              breeders.map((breeder, index) => (
              <div
                key={breeder.address}
                className="grid grid-cols-7 gap-4 px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors text-sm"
              >
                {/* Address - Clickable */}
                <div className="flex items-center">
                  <a
                    href={`https://explorer.solana.com/address/${breeder.fullAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-mono hover:text-silver-400 transition-colors"
                  >
                    {breeder.address}
                  </a>
                </div>
                
                {/* STYD Holdings */}
                <div className="flex flex-col items-end justify-center">
                  <span className="text-white font-semibold">{breeder.balance.toLocaleString()}</span>
                </div>
                
                {/* LP Holdings */}
                <div className="flex flex-col items-end justify-center">
                  <span className="text-white font-semibold">{breeder.lpAmount.toFixed(3)}</span>
                  <span className="text-gray-500 text-xs">${(breeder.lpValue / 1000).toFixed(2)}K</span>
                </div>
                
                {/* Breeding Power */}
                <div className="flex items-center justify-end">
                  <span className="text-silver-400 font-semibold">{breeder.share.toFixed(4)}%</span>
                </div>
                
                {/* STYD Per Day */}
                <div className="flex flex-col items-end justify-center">
                  <span className="text-silver-400 font-semibold">{(breeder.stydPerDay / 1000).toFixed(2)}K</span>
                </div>
                
                {/* SOL Per Day */}
                <div className="flex flex-col items-end justify-center">
                  <span className="text-silver-400 font-semibold">{breeder.solPerDay.toFixed(4)}</span>
                </div>
                
                {/* Last Reward Transaction */}
                <div className="flex items-center justify-center">
                  {breeder.lastTx ? (
                    <a
                      href={`https://explorer.solana.com/tx/${breeder.lastTx}`}
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

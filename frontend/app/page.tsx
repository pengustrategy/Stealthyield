'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { GrowthChart } from '@/components/GrowthChart';
import { useRealtimeMints, useRealtimeBurns, useMotherWombBalance, useNetworkStats } from '@/hooks/useRealtimeData';
import { formatSignature } from '@/lib/api';
import { config } from '@/lib/config';

export default function DashboardPage() {
  useEffect(() => {
    document.title = 'Dashboard - Stealthyield Protocol';
  }, []);
  const [chartData, setChartData] = useState<{ date: string; supply: number }[]>([]);
  
  // Real-time data hooks
  const DEPLOYER_ADDRESS = 'GzV4DVTaZJuPXjJS5o57m85PEJRKDaFubFw2pYCPqWPY';
  const MOTHERWOMB_ADDRESS = config.motherWombAddress || DEPLOYER_ADDRESS;
  
  const { mints, loading: mintsLoading } = useRealtimeMints(DEPLOYER_ADDRESS);
  const { burns, loading: burnsLoading } = useRealtimeBurns(DEPLOYER_ADDRESS);
  const { balance: motherWombBalance } = useMotherWombBalance(MOTHERWOMB_ADDRESS);
  const { stats } = useNetworkStats(config.tokenMint);
  
  useEffect(() => {
    const data = [];
    const today = new Date();
    let supply = 1000000; // Initial supply
    
    // Generate data points every 4-5 days for the next 180 days
    for (let i = 0; i <= 180; i += 4) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Simulate supply growth with halving
      const daysElapsed = i;
      let dailyRate = 500000; // Initial rate
      
      // Simple halving simulation
      if (supply >= 10000000) dailyRate = 31250;
      else if (supply >= 7500000) dailyRate = 62500;
      else if (supply >= 5000000) dailyRate = 125000;
      else if (supply >= 2500000) dailyRate = 250000;
      
      supply += dailyRate * 4; // 4 days of growth
      
      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        supply: Math.floor(supply),
      });
    }
    
    setChartData(data);
  }, []);
  
  return (
    <div className="min-h-screen font-crimson flex">
      <Header />
      
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
        
        {/* Network Overview - 4 stats per row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-4 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Initial Supply</div>
            <div className="text-2xl font-bold text-white mb-1">{(stats.initialSupply / 1000000).toFixed(2)}M</div>
            <div className="text-gray-500 text-xs">Genesis allocation</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-4 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Total Burn</div>
            <div className="text-2xl font-bold text-white mb-1">{(stats.totalBurned / 1000).toFixed(2)}K</div>
            <div className="text-gray-500 text-xs">Cumulative culled</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-4 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Current Supply</div>
            <div className="text-2xl font-bold text-white mb-1">{(stats.currentSupply / 1000000).toFixed(2)}M</div>
            <div className="text-silver-400 text-xs">In circulation</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-4 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Total Mined</div>
            <div className="text-2xl font-bold text-white mb-1">{(stats.totalMined / 1000000).toFixed(2)}M</div>
            <div className="text-gray-500 text-xs">Cumulative produced</div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-4 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Current Mining Rate</div>
            <div className="text-2xl font-bold text-white mb-1">500K/Day</div>
            <div className="text-gray-500 text-xs">Constant emission rate</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-4 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Emission Interval</div>
            <div className="text-2xl font-bold text-white mb-1">10 min</div>
            <div className="text-gray-500 text-xs">3.47K STYD per interval</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-4 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Next Halving</div>
            <div className="text-2xl font-bold text-white mb-1">2.5M Supply</div>
            <div className="text-gray-500 text-xs">Emission reduction event</div>
          </div>
          
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg p-4 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Reward Treasury</div>
            <div className="text-2xl font-bold text-white mb-1">{motherWombBalance.toFixed(2)} SOL</div>
            <div className="text-gray-500 text-xs">LP reward pool</div>
          </div>
        </div>
        
        {/* Growth Chart */}
        <div className="mb-8">
          <GrowthChart data={chartData} />
        </div>
        
        {/* Recent Transactions - Two columns side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emissions: Recent distribution transactions */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Emissions</h2>
            <p className="text-gray-500 text-sm mb-4">Recent distribution transactions</p>
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-white/10 text-xs text-gray-400 font-semibold">
                <div>Signature</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Time</div>
              </div>
              
              {mintsLoading ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  Loading transactions...
                </div>
              ) : mints.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No mint transactions yet
                </div>
              ) : (
                mints.slice(0, 100).map((tx) => (
                  <div
                    key={tx.signature}
                    className="grid grid-cols-3 gap-4 px-4 py-2.5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors text-sm"
                  >
                    <div>
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-mono hover:text-silver-400 transition-colors text-xs"
                      >
                        {formatSignature(tx.signature)}
                      </a>
                    </div>
                    <div className="text-right text-silver-400 font-semibold">
                      {tx.amount.toFixed(2)}
                    </div>
                    <div className="text-right text-gray-500 text-xs">
                      {tx.timeAgo}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Deflationary Burns - Recent burn transactions */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Deflation</h2>
            <p className="text-gray-500 text-sm mb-4">Recent burn transactions</p>
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-white/10 text-xs text-gray-400 font-semibold">
                <div>Signature</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Time</div>
              </div>
              
              {burnsLoading ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  Loading transactions...
                </div>
              ) : burns.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No burn transactions yet
                </div>
              ) : (
                burns.slice(0, 100).map((tx) => (
                  <div
                    key={tx.signature}
                    className="grid grid-cols-3 gap-4 px-4 py-2.5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors text-sm"
                  >
                    <div>
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-mono hover:text-silver-400 transition-colors text-xs"
                      >
                        {formatSignature(tx.signature)}
                      </a>
                    </div>
                    <div className="text-right text-silver-400 font-semibold">
                      {tx.amount.toFixed(2)}
                    </div>
                    <div className="text-right text-gray-500 text-xs">
                      {tx.timeAgo}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

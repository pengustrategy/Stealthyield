import { useState, useEffect } from 'react';
import { 
  getRecentTransactions, 
  parseMintTransactions, 
  parseBurnTransactions,
  getMotherWombBalance,
  formatSignature
} from '@/lib/api';

/**
 * Hook for real-time mint transactions
 */
export function useRealtimeMints(deployerAddress: string) {
  const [mints, setMints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!deployerAddress) {
      setLoading(false);
      return;
    }
    
    async function fetchMints() {
      setLoading(true);
      const transactions = await getRecentTransactions(deployerAddress, 200); // Fetch more to ensure 100 mint txs
      const mintTxs = parseMintTransactions(transactions);
      setMints(mintTxs);
      setLoading(false);
    }
    
    // Initial fetch
    fetchMints();
    
    // Poll every 30 seconds for new data
    const interval = setInterval(fetchMints, 30000);
    
    return () => clearInterval(interval);
  }, [deployerAddress]);
  
  return { mints, loading };
}

/**
 * Hook for real-time burn transactions
 */
export function useRealtimeBurns(deployerAddress: string) {
  const [burns, setBurns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!deployerAddress) {
      setLoading(false);
      return;
    }
    
    async function fetchBurns() {
      setLoading(true);
      const transactions = await getRecentTransactions(deployerAddress, 200); // Fetch more to ensure 100 burn txs
      const burnTxs = parseBurnTransactions(transactions);
      setBurns(burnTxs);
      setLoading(false);
    }
    
    // Initial fetch
    fetchBurns();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchBurns, 30000);
    
    return () => clearInterval(interval);
  }, [deployerAddress]);
  
  return { burns, loading };
}

/**
 * Hook for MotherWomb balance
 */
export function useMotherWombBalance(motherWombAddress: string) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!motherWombAddress) return;
    
    async function fetchBalance() {
      const bal = await getMotherWombBalance(motherWombAddress);
      setBalance(bal);
      setLoading(false);
    }
    
    // Initial fetch
    fetchBalance();
    
    // Update every minute
    const interval = setInterval(fetchBalance, 60000);
    
    return () => clearInterval(interval);
  }, [motherWombAddress]);
  
  return { balance, loading };
}

/**
 * Hook for network stats (supply, burned, etc.)
 */
export function useNetworkStats(tokenMint: string) {
  const [stats, setStats] = useState({
    initialSupply: 1_000_000,
    totalBurned: 0,
    currentSupply: 1_000_000,
    totalMined: 0,
    currentMiningRate: 500_000,
    nextHalving: 2_500_000,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!tokenMint) {
      setLoading(false);
      return;
    }
    
    async function fetchStats() {
      try {
        // Read from state.json via API endpoint
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
    
    // Update every minute
    const interval = setInterval(fetchStats, 60000);
    
    return () => clearInterval(interval);
  }, [tokenMint]);
  
  return { stats, loading };
}


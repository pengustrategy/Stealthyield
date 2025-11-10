import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '@/lib/config';

const connection = new Connection(config.rpcEndpoint, 'confirmed');

interface Holder {
  address: string;
  fullAddress: string;
  balance: number;
  share: number;
  stydPerDay: number;
  lastTx?: string;
}

interface Breeder extends Holder {
  lpAmount: number;
  lpValue: number;
  solPerDay: number;
}

/**
 * Fetch all token holders from chain
 */
async function fetchTokenHolders(mint: string) {
  try {
    // For now, return empty array until token is created
    // In production, implement proper holder querying
    return [];
  } catch (error) {
    console.error('Error fetching holders:', error);
    return [];
  }
}

/**
 * Fallback method using getProgramAccounts
 */
async function fetchHoldersViaRPC(mint: string) {
  try {
    const TOKEN_PROGRAM = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
    const mintPubkey = new PublicKey(mint);
    
    const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM, {
      filters: [
        { dataSize: 165 },
        {
          memcmp: {
            offset: 0,
            bytes: mintPubkey.toBase58(),
          },
        },
      ],
    });
    
    return accounts.map(({ pubkey, account }) => ({
      address: pubkey.toString(),
      // Parse account data for balance
    }));
  } catch (error) {
    console.error('RPC fallback failed:', error);
    return [];
  }
}

/**
 * Hook for Top Milkers (real-time)
 */
export function useTopMilkers(tokenMint: string, threshold: number = 500) {
  const [milkers, setMilkers] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(false); // Default false until token created
  const [totalHeld, setTotalHeld] = useState(0);
  
  useEffect(() => {
    if (!tokenMint) {
      setLoading(false);
      return;
    }
    
    async function fetchMilkers() {
      try {
        setLoading(true);
        
        // Fetch all holders
        const holders = await fetchTokenHolders(tokenMint);
        
        // Filter Milkers (≥ threshold, exclude LP providers)
        const milkerHolders = (holders as any[])
          .filter((h: any) => {
            const balance = (h.amount || 0) / 1e9;
            return balance >= threshold;
          })
          .map((h: any) => {
            const balance = (h.amount || 0) / 1e9;
            return {
              address: h.owner.slice(0, 4) + '...' + h.owner.slice(-4),
              fullAddress: h.owner,
              balance: balance,
              share: 0, // Will calculate below
              stydPerDay: 0,
              lastTx: h.lastTransaction || '',
            };
          });
        
        // Calculate total held by Milkers
        const total = milkerHolders.reduce((sum, m) => sum + m.balance, 0);
        setTotalHeld(total);
        
        // Calculate share and daily rewards
        const dailyEmission = 250_000; // 50% of 500K goes to Milkers
        
        milkerHolders.forEach(m => {
          m.share = (m.balance / total) * 100;
          m.stydPerDay = (m.balance / total) * dailyEmission;
        });
        
        // Sort by balance descending
        milkerHolders.sort((a, b) => b.balance - a.balance);
        
        setMilkers(milkerHolders.slice(0, 100)); // Top 100
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Milkers:', error);
        setLoading(false);
      }
    }
    
    fetchMilkers();
    
    // Update every 2 minutes
    const interval = setInterval(fetchMilkers, 120000);
    
    return () => clearInterval(interval);
  }, [tokenMint, threshold]);
  
  return { milkers, totalHeld, loading };
}

/**
 * Hook for Breeder Rankings (real-time)
 */
export function useBreederRankings(tokenMint: string, lpMint: string, threshold: number = 1000) {
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [loading, setLoading] = useState(false); // Default false until token created
  const [totalStydHeld, setTotalStydHeld] = useState(0);
  const [totalLP, setTotalLP] = useState(0);
  
  useEffect(() => {
    if (!tokenMint || !lpMint) {
      setLoading(false);
      return;
    }
    
    async function fetchBreeders() {
      try {
        setLoading(true);
        
        // Fetch STYD holders
        const stydHolders = await fetchTokenHolders(tokenMint);
        
        // Fetch LP holders
        const lpHolders = await fetchTokenHolders(lpMint);
        
        // Match holders who have both STYD ≥ threshold AND LP
        const breederList: Breeder[] = [];
        
        for (const lpHolder of lpHolders as any[]) {
          const lpAmount = (lpHolder.amount || 0) / 1e9;
          if (lpAmount === 0) continue;
          
          // Find corresponding STYD balance
          const stydHolder = (stydHolders as any[]).find((h: any) => h.owner === lpHolder.owner);
          const stydBalance = stydHolder ? ((stydHolder.amount as number) || 0) / 1e9 : 0;
          
          if (stydBalance >= threshold) {
            breederList.push({
              address: lpHolder.owner.slice(0, 4) + '...' + lpHolder.owner.slice(-4),
              fullAddress: lpHolder.owner,
              balance: stydBalance,
              lpAmount: lpAmount,
              lpValue: lpAmount * 1000, // Rough estimate, needs price data
              share: 0,
              stydPerDay: 0,
              solPerDay: 0,
              lastTx: lpHolder.lastTransaction || '',
            });
          }
        }
        
        // Calculate totals
        const totalStyd = breederList.reduce((sum, b) => sum + b.balance, 0);
        const totalLpTokens = breederList.reduce((sum, b) => sum + b.lpAmount, 0);
        
        setTotalStydHeld(totalStyd);
        setTotalLP(totalLpTokens);
        
        // Calculate rewards
        const dailyStydEmission = 250_000; // 50% of 500K
        const currentPhase = 0; // TODO: Get from state
        const solPercentage = [0, 5, 15, 50][currentPhase] / 100;
        const dailySOL = 10; // Estimated daily SOL pool
        
        breederList.forEach(b => {
          b.share = (b.lpAmount / totalLpTokens) * 100;
          b.stydPerDay = (b.lpAmount / totalLpTokens) * dailyStydEmission;
          b.solPerDay = (b.lpAmount / totalLpTokens) * dailySOL * solPercentage;
        });
        
        // Sort by LP amount descending
        breederList.sort((a, b) => b.lpAmount - a.lpAmount);
        
        setBreeders(breederList.slice(0, 100)); // Top 100
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Breeders:', error);
        setLoading(false);
      }
    }
    
    fetchBreeders();
    
    // Update every 2 minutes
    const interval = setInterval(fetchBreeders, 120000);
    
    return () => clearInterval(interval);
  }, [tokenMint, lpMint, threshold]);
  
  return { breeders, totalStydHeld, totalLP, loading };
}


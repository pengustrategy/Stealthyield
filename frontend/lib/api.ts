import { Connection, PublicKey } from '@solana/web3.js';
import { config } from './config';

const connection = new Connection(config.rpcEndpoint, 'confirmed');

/**
 * Fetch recent transactions for an address
 */
export async function getRecentTransactions(address: string, limit: number = 100) {
  if (!address || address === '') {
    return [];
  }
  
  try {
    const pubkey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
    
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
          return {
            signature: sig.signature,
            blockTime: sig.blockTime,
            slot: sig.slot,
            tx,
          };
        } catch (err) {
          return null;
        }
      })
    );
    
    return transactions.filter(t => t !== null && t.tx !== null);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * Parse mint transactions (STYD distribution)
 */
export function parseMintTransactions(transactions: any[]) {
  return transactions
    .filter(({ tx }) => {
      // Check if transaction contains MintTo instruction
      const logs = tx?.meta?.logMessages || [];
      return logs.some((log: string) => log.includes('MintTo') || log.includes('mint'));
    })
    .map(({ signature, blockTime, tx }) => {
      // Extract amount from transaction
      const postBalances = tx?.meta?.postTokenBalances || [];
      const preBalances = tx?.meta?.preTokenBalances || [];
      
      let amount = 0;
      if (postBalances.length > 0 && preBalances.length > 0) {
        const post = postBalances[0]?.uiTokenAmount?.uiAmount || 0;
        const pre = preBalances[0]?.uiTokenAmount?.uiAmount || 0;
        amount = post - pre;
      }
      
      return {
        signature,
        amount: Math.abs(amount),
        time: blockTime ? new Date(blockTime * 1000).toISOString() : 'Unknown',
        timeAgo: getTimeAgo(blockTime),
      };
    })
    .filter(t => t.amount > 0);
}

/**
 * Parse burn transactions (STYD destruction)
 */
export function parseBurnTransactions(transactions: any[]) {
  return transactions
    .filter(({ tx }) => {
      const logs = tx?.meta?.logMessages || [];
      return logs.some((log: string) => log.includes('Burn'));
    })
    .map(({ signature, blockTime, tx }) => {
      // Extract burn amount
      const preBalances = tx?.meta?.preTokenBalances || [];
      const postBalances = tx?.meta?.postTokenBalances || [];
      
      let amount = 0;
      if (preBalances.length > 0 && postBalances.length > 0) {
        const pre = preBalances[0]?.uiTokenAmount?.uiAmount || 0;
        const post = postBalances[0]?.uiTokenAmount?.uiAmount || 0;
        amount = pre - post;
      }
      
      return {
        signature,
        amount: Math.abs(amount),
        time: blockTime ? new Date(blockTime * 1000).toISOString() : 'Unknown',
        timeAgo: getTimeAgo(blockTime),
      };
    })
    .filter(t => t.amount > 0);
}

/**
 * Get MotherWomb balance
 */
export async function getMotherWombBalance(address: string): Promise<number> {
  if (!address || address === '') {
    return 0;
  }
  
  try {
    const balance = await connection.getBalance(new PublicKey(address));
    return balance / 1e9;
  } catch (error) {
    console.error('Error fetching MotherWomb balance:', error);
    return 0;
  }
}

/**
 * Get all token holders
 */
export async function getTokenHolders(mint: string) {
  try {
    // This requires an indexer or getProgramAccounts
    // For now, return mock data
    // In production, use Helius API or similar
    return [];
  } catch (error) {
    console.error('Error fetching holders:', error);
    return [];
  }
}

/**
 * Calculate time ago
 */
function getTimeAgo(timestamp: number | null): string {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Format transaction signature for display
 */
export function formatSignature(signature: string): string {
  return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
}


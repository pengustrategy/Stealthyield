import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read state.json from project root
    const statePath = path.join(process.cwd(), '../../state.json');
    
    let stats;
    if (fs.existsSync(statePath)) {
      const stateData = fs.readFileSync(statePath, 'utf-8');
      stats = JSON.parse(stateData);
    } else {
      // Default stats if file doesn't exist
      stats = {
        initialSupply: 1_000_000,
        totalBurned: 0,
        currentSupply: 1_000_000,
        totalMined: 0,
        currentMiningRate: 500_000,
        nextHalving: 2_500_000,
        halvingCount: 0,
        rewardPhase: 0,
        motherWombSOL: 0,
        lastEmission: Date.now(),
      };
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error reading stats:', error);
    
    // Return default stats on error
    return NextResponse.json({
      initialSupply: 1_000_000,
      totalBurned: 0,
      currentSupply: 1_000_000,
      totalMined: 0,
      currentMiningRate: 500_000,
      nextHalving: 2_500_000,
    });
  }
}


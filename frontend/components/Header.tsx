'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-gray-800/50 bg-black/20 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800/50">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image 
            src="/styd-logo.png" 
            alt="STYD" 
            width={24} 
            height={24}
            className="brightness-0 invert"
          />
          <span className="text-base font-bold text-silver-400">
            Stealthyield
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          <Link 
            href="/" 
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
              isActive('/') 
                ? 'bg-silver-400/10 text-silver-400' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <Link 
            href="/milker" 
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
              isActive('/milker') 
                ? 'bg-silver-400/10 text-silver-400' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Holders
          </Link>
          <Link 
            href="/breeder" 
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
              isActive('/breeder') 
                ? 'bg-silver-400/10 text-silver-400' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Liquidity
          </Link>
        </div>
      </nav>
      
      {/* Social Link */}
      <div className="p-4 border-t border-gray-800/50">
        <a
          href="https://x.com/Stealthyield"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span className="text-sm">Follow on X</span>
        </a>
      </div>
    </div>
  );
}


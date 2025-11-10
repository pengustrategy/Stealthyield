interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-black/40 border border-gray-800 rounded-lg p-6 hover:border-gold-500/30 transition-colors">
      <div className="text-gray-400 text-sm mb-3">{label}</div>
      <div className="text-white text-4xl font-semibold mb-2">{value}</div>
      {subtitle && <div className="text-gray-500 text-sm">{subtitle}</div>}
    </div>
  );
}


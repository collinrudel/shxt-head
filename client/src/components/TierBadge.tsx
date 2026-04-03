import { getTier } from '@/utils/tiers';

export default function TierBadge({ trophies }: { trophies: number }) {
  const tier = getTier(trophies);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${tier.color} ${tier.textColor}`}>
      {tier.name}
    </span>
  );
}

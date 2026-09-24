import {
  Bus,
  Coffee,
  Film,
  Heart,
  Laptop,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Zap,
  Tag,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  wallet: Wallet,
  laptop: Laptop,
  trending: TrendingUp,
  cart: ShoppingCart,
  bus: Bus,
  bolt: Zap,
  film: Film,
  heart: Heart,
  coffee: Coffee,
  bag: ShoppingBag,
};

export function CategoryIcon({
  name,
  size = 18,
}: {
  name: string;
  size?: number;
}) {
  const Icon = map[name] ?? Tag;
  return <Icon size={size} strokeWidth={2.2} />;
}

export const ICON_OPTIONS = Object.keys(map);

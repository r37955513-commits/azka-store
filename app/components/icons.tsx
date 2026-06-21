import {
  Gamepad2,
  Smartphone,
  CreditCard,
  Package,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  "gamepad-2": Gamepad2,
  smartphone: Smartphone,
  "credit-card": CreditCard,
  package: Package,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = MAP[name] ?? Package;
  return <Icon className={className} />;
}

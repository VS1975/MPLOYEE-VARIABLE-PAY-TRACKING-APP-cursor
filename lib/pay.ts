import type { PayConfig } from "@/lib/types";

export function computePayForRacks(
  rackCount: number,
  config: Pick<
    PayConfig,
    "normal_pay_per_rack" | "bonus_threshold_racks" | "bonus_pay_per_rack"
  >
): { amount: number; label: string } {
  const threshold = config.bonus_threshold_racks;
  const useBonus = rackCount >= threshold;
  const rate = useBonus
    ? Number(config.bonus_pay_per_rack)
    : Number(config.normal_pay_per_rack);
  const amount = Math.round(rackCount * rate * 100) / 100;
  return {
    amount,
    label: useBonus
      ? `Bonus rate (₹${rate}/rack, racks >= ${threshold})`
      : `Standard rate (₹${rate}/rack)`,
  };
}

export function aggregatePayForSubmissions<
  T extends { rack_count: number },
>(rows: T[], config: PayConfig): number {
  return Math.round(
    rows.reduce((sum, row) => {
      const { amount } = computePayForRacks(row.rack_count, config);
      return sum + amount;
    }, 0) * 100
  ) / 100;
}

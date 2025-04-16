import {
  Home,
  ArrowRightLeft,
  Wallet,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Bitcoin,
  Car,
  House,
  BadgeDollarSign
} from "lucide-react";

// Central definition for account types
export const accountTypes = [
  // Types previously in selector
  { value: "savings",    labelKey: "Savings",    icon: PiggyBank },
  { value: "credit",     labelKey: "Credit",     icon: CreditCard },
  { value: "checking",   labelKey: "Checking",   icon: Wallet },
  { value: "investment", labelKey: "Investment", icon: TrendingUp },
  { value: "crypto",     labelKey: "Crypto",     icon: Bitcoin },
  { value: "mortgage",   labelKey: "Mortgage",   icon: Home }, // Corrected spelling

  // Types previously only in AccountIcon
  { value: "transaction", labelKey: "Transaction", icon: ArrowRightLeft },
  { value: "car",         labelKey: "Car Loan",    icon: Car },          // More specific label
  { value: "property",    labelKey: "Property",    icon: House },
  { value: "debt",        labelKey: "Debt",        icon: BadgeDollarSign }
];

// Optional: Export a map for direct icon lookup if needed elsewhere,
// otherwise AccountIcon can build it internally.
export const accountTypeIconMap = accountTypes.reduce((acc, type) => {
  acc[type.value] = type.icon;
  return acc;
}, {}); 
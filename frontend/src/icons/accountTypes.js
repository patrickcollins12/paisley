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

// Define a color palette
const iconColors = [
  '#22c55e', // Emerald 500 (Savings)
  '#f43f5e', // Rose 500 (Credit)
  '#0ea5e9', // Sky 500 (Checking)
  '#f59e0b', // Amber 500 (Investment)
  '#8b5cf6', // Violet 500 (Crypto)
  '#ca8a04', // Yellow 600 (Mortgage)
  '#14b8a6', // Teal 500 (Transaction)
  '#6366f1', // Indigo 500 (Car Loan)
  '#84cc16', // Lime 500 (Property)
  '#ec4899', // Pink 500 (Debt)
];

// Central definition for account types
export const accountTypes = [
  // Types previously in selector
  { value: "savings",    labelKey: "Savings",    icon: PiggyBank,    color: iconColors[0] },
  { value: "credit",     labelKey: "Credit",     icon: CreditCard,   color: iconColors[1] },
  { value: "checking",   labelKey: "Checking",   icon: Wallet,       color: iconColors[2] },
  { value: "investment", labelKey: "Investment", icon: TrendingUp,   color: iconColors[3] },
  { value: "crypto",     labelKey: "Crypto",     icon: Bitcoin,      color: iconColors[4] },
  { value: "mortgage",   labelKey: "Mortgage",   icon: Home,         color: iconColors[5] }, // Corrected spelling

  // Types previously only in AccountIcon
  { value: "transaction", labelKey: "Transaction", icon: ArrowRightLeft, color: iconColors[6] },
  { value: "car",         labelKey: "Car Loan",    icon: Car,          color: iconColors[7] }, // More specific label
  { value: "property",    labelKey: "Property",    icon: House,        color: iconColors[8] },
  { value: "debt",        labelKey: "Debt",        icon: BadgeDollarSign, color: iconColors[9] }
];

// Optional: Export a map for direct icon lookup if needed elsewhere,
// otherwise AccountIcon can build it internally.
// Renamed from accountTypeIconMap to accountTypeDetailsMap
export const accountTypeDetailsMap = accountTypes.reduce((acc, type) => {
  acc[type.value] = { icon: type.icon, color: type.color }; // Store icon and color
  return acc;
}, {}); 
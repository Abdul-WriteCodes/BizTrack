export type CountryData = {
  code: string;
  currencyCode: string;
  currencySymbol: string;
  dialCode: string;
};

export const SUPPORTED_COUNTRIES: Record<string, CountryData> = {
  // Tier 1: Africa
  Nigeria: { code: "NG", currencyCode: "NGN", currencySymbol: "₦", dialCode: "+234" },
  Ghana: { code: "GH", currencyCode: "GHS", currencySymbol: "GH₵", dialCode: "+233" },
  Kenya: { code: "KE", currencyCode: "KES", currencySymbol: "KSh", dialCode: "+254" },
  "South Africa": { code: "ZA", currencyCode: "ZAR", currencySymbol: "R", dialCode: "+27" },
  Tanzania: { code: "TZ", currencyCode: "TZS", currencySymbol: "TSh", dialCode: "+255" },
  Uganda: { code: "UG", currencyCode: "UGX", currencySymbol: "USh", dialCode: "+256" },
  Rwanda: { code: "RW", currencyCode: "RWF", currencySymbol: "FRw", dialCode: "+250" },
  Zambia: { code: "ZM", currencyCode: "ZMW", currencySymbol: "ZK", dialCode: "+260" },
  Cameroon: { code: "CM", currencyCode: "XAF", currencySymbol: "FCFA", dialCode: "+237" },
  Senegal: { code: "SN", currencyCode: "XOF", currencySymbol: "CFA", dialCode: "+221" },
  Ethiopia: { code: "ET", currencyCode: "ETB", currencySymbol: "Br", dialCode: "+251" },
  Egypt: { code: "EG", currencyCode: "EGP", currencySymbol: "E£", dialCode: "+20" },
  // Tier 2: English-speaking west
  "United Kingdom": { code: "GB", currencyCode: "GBP", currencySymbol: "£", dialCode: "+44" },
  "United States": { code: "US", currencyCode: "USD", currencySymbol: "$", dialCode: "+1" },
  Canada: { code: "CA", currencyCode: "CAD", currencySymbol: "CA$", dialCode: "+1" },
  Australia: { code: "AU", currencyCode: "AUD", currencySymbol: "A$", dialCode: "+61" },
  Ireland: { code: "IE", currencyCode: "EUR", currencySymbol: "€", dialCode: "+353" },
  // Tier 3: Opportunistic
  UAE: { code: "AE", currencyCode: "AED", currencySymbol: "AED", dialCode: "+971" },
  India: { code: "IN", currencyCode: "INR", currencySymbol: "₹", dialCode: "+91" },
  Germany: { code: "DE", currencyCode: "EUR", currencySymbol: "€", dialCode: "+49" },
  France: { code: "FR", currencyCode: "EUR", currencySymbol: "€", dialCode: "+33" },
  Netherlands: { code: "NL", currencyCode: "EUR", currencySymbol: "€", dialCode: "+31" },
  "Saudi Arabia": { code: "SA", currencyCode: "SAR", currencySymbol: "SAR", dialCode: "+966" },
  Pakistan: { code: "PK", currencyCode: "PKR", currencySymbol: "₨", dialCode: "+92" },
  Brazil: { code: "BR", currencyCode: "BRL", currencySymbol: "R$", dialCode: "+55" },
};

export const TRIAL_DAYS = 7;

export const PAYMENT_DETAILS = {
  NG: {
    monthlyPrice: 1500,
    yearlyPrice: 15000,
    currencyLabel: "₦",
    flutterwaveMonthly: "https://flutterwave.com/pay/e2jsc3ckyfya",
    flutterwaveYearly: "https://flutterwave.com/pay/ztzprecyyhg2",
  },
  GLOBAL: {
    monthlyPrice: 3,
    yearlyPrice: 25,
    currencyLabel: "$",
    flutterwaveMonthly: "https://flutterwave.com/pay/trp1jdz0emrg",
    flutterwaveYearly: "https://flutterwave.com/pay/l8gbytdsx359",
  },
} as const;

export function getPaymentPlan(countryCode?: string) {
  return countryCode === "NG" ? PAYMENT_DETAILS.NG : PAYMENT_DETAILS.GLOBAL;
}

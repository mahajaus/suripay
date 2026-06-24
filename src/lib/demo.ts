// Demo-data voor de niet-gebackte SuriPay-schermen (mockup-vision).
// Alles hier is fictief en alleen voor de prototype-flows.

export const RATES = { USD: 0.028, EUR: 0.026, BRL: 0.14, GYD: 5.85, TTD: 0.19 };

export const BANKS = [
  { id: "hakrin", n: "Hakrinbank", ab: "HKB", c: "#0066B3" },
  { id: "dsb", n: "De Surinaamsche Bank", ab: "DSB", c: "#C41E3A" },
  { id: "fina", n: "Finabank", ab: "FIN", c: "#00843D" },
  { id: "republic", n: "Republic Bank", ab: "RBS", c: "#1B3A5C" },
  { id: "vcb", n: "Volkscredietbank", ab: "VCB", c: "#FF8C00" },
];

export const SCRATCH: Record<string, { a: number }> = {
  "4821-7390-5516-2847": { a: 25 },
  "9937-1154-6028-3391": { a: 50 },
  "6612-8843-2207-5590": { a: 100 },
  "3305-7721-9488-1123": { a: 250 },
  "1189-4456-3302-7765": { a: 500 },
};

export const SP_AGENTS = [
  { id: "ag1", n: "MiniMarkt Saramaccastraat", loc: "Paramaribo", type: "Winkel" },
  { id: "ag2", n: "Shell Tankstation Indira Gandhiweg", loc: "Paramaribo", type: "Tankstation" },
  { id: "ag3", n: "Phone House Maagdenstraat", loc: "Paramaribo", type: "Phone Shop" },
  { id: "ag4", n: "Cambio De Goede Hoop", loc: "Paramaribo", type: "Wisselkantoor" },
  { id: "ag5", n: "Chung Fa Supermarkt", loc: "Wanica", type: "Supermarkt" },
];

export const SP_VOUCHERS: Record<string, { a: number; agent: string }> = {
  "SP-0050-8821-KWTR": { a: 50, agent: "ag1" },
  "SP-0100-3347-PMXN": { a: 100, agent: "ag2" },
  "SP-0250-7714-RSGK": { a: 250, agent: "ag3" },
  "SP-0500-2298-VBJL": { a: 500, agent: "ag5" },
  "SP-1000-6653-DWFH": { a: 1000, agent: "ag4" },
};

export const SURIBET: Record<string, { a: number; s: string }> = {
  "SB-100-7742-AXKP": { a: 100, s: "Kwattaweg" },
  "SB-250-3318-BRMN": { a: 250, s: "Latour" },
  "SB-500-9951-CDWQ": { a: 500, s: "Hermitage Mall" },
  "SB-1000-5527-EFHL": { a: 1000, s: "Paramaribo Noord" },
  "SB-50-2204-GJKR": { a: 50, s: "Wanica" },
};

export const CONTACTS = [
  { id: 1, n: "Rajesh Jhinkoe", ph: "+597 8712345", av: "RJ" },
  { id: 2, n: "Mariska Chin", ph: "+597 8734567", av: "MC" },
  { id: 3, n: "Donovan Pinas", ph: "+597 8756789", av: "DP" },
  { id: 4, n: "Shanti Ramlal", ph: "+597 8778901", av: "SR" },
  { id: 5, n: "Kevin Wijngaarde", ph: "+597 8790123", av: "KW" },
];

export const COINS = [
  { id: "usdt", n: "Tether", sy: "USDT", c: "#26A17B", ic: "₮", r: 35.71, net: "TRC-20" },
  { id: "usdc", n: "USD Coin", sy: "USDC", c: "#2775CA", ic: "$", r: 35.71, net: "Polygon" },
  { id: "dai", n: "DAI", sy: "DAI", c: "#F5AC37", ic: "◈", r: 35.68, net: "Ethereum" },
] as const;

export const BILLS = [
  { id: "ebs", n: "EBS Stroom", ic: "⚡", c: "#F59E0B", ph: "Klantnummer" },
  { id: "swm", n: "SWM Water", ic: "💧", c: "#3B82F6", ph: "Contractnummer" },
  { id: "telesur", n: "Telesur Beltegoed", ic: "📡", c: "#10B981", ph: "Telefoonnummer" },
  { id: "digicel", n: "Digicel Beltegoed", ic: "📱", c: "#E11D48", ph: "Telefoonnummer" },
];

export const INSURANCE = [
  { id: "health", n: "Zorgverzekering", ic: "🏥", c: "#E11D48", price: 25, desc: "Basiszorg dekking per maand" },
  { id: "phone", n: "Telefoon Bescherming", ic: "📱", c: "#3B82F6", price: 5, desc: "Schade & diefstal dekking" },
  { id: "crop", n: "Oogstverzekering", ic: "🌾", c: "#10B981", price: 15, desc: "Landbouw oogstbescherming" },
  { id: "life", n: "Levensverzekering", ic: "❤️", c: "#a855f7", price: 20, desc: "Basisdekking voor nabestaanden" },
];

export const MARKETPLACE_ITEMS = [
  { id: 1, seller: "A. Krosol", title: "Samsung Galaxy A15", price: 850, cat: "Elektronica", img: "📱" },
  { id: 2, seller: "R. Moensi", title: "Honda Wave 110cc", price: 4500, cat: "Voertuigen", img: "🏍️" },
  { id: 3, seller: "Farm Nickerie", title: "Rijst 25kg", price: 85, cat: "Landbouw", img: "🌾" },
  { id: 4, seller: "D. Pinas", title: "Gouden Ring 18K", price: 2200, cat: "Goud", img: "💍" },
  { id: 5, seller: "M. Tjon", title: "Airco Samsung 12000BTU", price: 1950, cat: "Elektronica", img: "❄️" },
  { id: 6, seller: "K. Ramlal", title: "Verse Garnalen 1kg", price: 120, cat: "Voeding", img: "🦐" },
];

export const GOV_SERVICES = [
  { id: "tax", n: "Belasting Betalen", ic: "🏛️", c: "#1B3A5C", desc: "Inkomstenbelasting & OB" },
  { id: "license", n: "Rijbewijs Verlenging", ic: "🪪", c: "#F59E0B", desc: "Aanvraag & betaling" },
  { id: "permit", n: "Vergunningen", ic: "📋", c: "#10B981", desc: "Bouw- & handelsvergunningen" },
  { id: "fine", n: "Boetes Betalen", ic: "⚖️", c: "#E11D48", desc: "Verkeers- & overheidsboetes" },
];

export const AGRI = [
  { id: "gold", n: "Goud Verkoop", ic: "🪙", c: "#E6B800", desc: "Goud verkopen & betaling ontvangen" },
  { id: "rice", n: "Rijst Handel", ic: "🌾", c: "#10B981", desc: "Rijst afname & betaling" },
  { id: "timber", n: "Hout Export", ic: "🪵", c: "#92400E", desc: "Houtkap betalingen" },
  { id: "fish", n: "Visserij", ic: "🐟", c: "#3B82F6", desc: "Vis verkoop & export" },
];

export const GOLD_USD_PER_GRAM = 85.5;

// Iconen per transactietype.
export const TXI: Record<string, string> = {
  topup: "💳", send: "↑", receive: "↓", suribet: "🎰", agent: "🏪",
  bill: "🧾", crypto: "🪙", qr: "📱", cashout: "🏧", remit: "🌍",
  savings: "🐷", loan: "🏦", payroll: "💼", cashback: "🎁",
  insurance: "🛡️", market: "🛒", gov: "🏛️", agri: "🌾", gold: "🥇",
};

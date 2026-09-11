/**
 * promptEnhancer.js
 * Smart Prompt Enhancer Middleware for AetherCraft Engine.
 *
 * 1. Provides production-grade, multi-component architectural prompt specifications
 *    for curated homepage examples (Fintech, Architecture Studio, Luxury Real Estate).
 * 2. Provides dynamic prompt augmentation middleware for user-submitted prompts in Studio,
 *    automatically injecting layout hierarchy, state management, rich mock data, and
 *    Lucide icons so output quality is consistently exceptional.
 * 3. Enforces strict file generation ordering: src/App.jsx MUST ALWAYS be emitted first.
 */

export const CURATED_EXAMPLE_PROMPTS = {
  'a modern fintech app with interactive portfolio charts': "Build a complete, production-ready Modern Fintech & Wealth Management SPA in React 18 with Tailwind CSS and Lucide icons.\n\nPRIMARY REQUIREMENTS:\n1. OUTPUT ORDER: Output <<<FILE:src/App.jsx>>> FIRST before any other file.\n2. Complete working code with full interactivity, zero placeholder comments or TODOs.\n\nKEY FEATURES & ARCHITECTURE:\n- Executive Portfolio Header:\n  * Total Net Worth ($142,850.20) with 24h gain indicator (+$4,320.50 / +3.12% in emerald green).\n  * Quick Action toolbar: \"Send\", \"Receive\", \"Trade\", \"Deposit\", \"Analytics\" with Lucide icons.\n  * Time interval selectors: [1D, 1W, 1M, 1Y, ALL] with active state.\n- Interactive Portfolio Performance Chart:\n  * SVG area/line chart with gradient fill and dynamic path based on the active time interval.\n  * Interactive hover cursor displaying simulated price and timestamp.\n- Asset Allocation Visualizer:\n  * Proportional multi-color progress bar: Crypto (52%), US Equities (32%), Cash/Bonds (16%).\n- Live Watchlist & Holdings Table:\n  * 5+ assets: Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Nvidia (NVDA), Apple (AAPL).\n  * Real-time simulated price ticks with green/red flash indicators.\n  * Holdings quantity, total valuation, and 24h P&L.\n  * Action button on each row opening the Buy/Sell Trade Modal.\n- Quick Trade / Transfer Modal:\n  * Tab toggle: \"Buy\", \"Sell\", \"Transfer\".\n  * Amount input with percentage presets (25%, 50%, 75%, MAX).\n  * Instant simulated execution updating the portfolio balance and adding a record to the transaction ledger in localStorage.\n- Recent Transactions Ledger:\n  * Search filter by asset or transaction type.\n  * Badges for Completed, Pending, and Transfer.\n  * Export CSV simulation button.\n\nSTYLING & DESIGN:\n- Deep obsidian dark background (#090a0f) with border-zinc-800 cards and subtle indigo/emerald glows.\n- Crisp typography, responsive grid layout for desktop, tablet, and mobile.\n- Use Lucide icons: Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, PieChart, ShieldCheck, RefreshCw, Send, Plus.",
  'a minimalist architecture studio portfolio with image gallery': "Build a complete, production-ready Minimalist Architecture Studio Portfolio SPA in React 18 with Tailwind CSS and Lucide icons.\n\nPRIMARY REQUIREMENTS:\n1. OUTPUT ORDER: Output <<<FILE:src/App.jsx>>> FIRST before any other file.\n2. Complete working code with full interactivity, zero placeholder comments or TODOs.\n\nKEY FEATURES & ARCHITECTURE:\n- Studio Identity & Navigation:\n  * Editorial typography: \"KRONOS ARCHITECTS // TOKYO · ZURICH · BERLIN\".\n  * Coordinates, local time indicator (JST / CET), and status badge: \"Available for Q3/Q4 Commissions\".\n  * Navigation links: Works, Philosophy, Publications, Studio, Contact.\n- Hero Exhibition Showcase:\n  * High-impact featured project banner with title, location (\"Kyoto Forest Pavilion\"), and completion year.\n  * Key studio metrics: 34 Built Projects, 12 International Design Awards, 48,000 m² Designed.\n- Filterable Architectural Works Grid:\n  * Filter categories: \"All Works\", \"Residential\", \"Cultural\", \"Commercial\", \"Interior\".\n  * 6+ rich architectural project cards featuring high-end architectural Unsplash imagery.\n  * Hover overlay revealing blueprints, area (m²), structural materials (Cast Concrete, Glulam Timber, Fluted Glass), and completion year.\n  * Interactive \"View Blueprint & Details\" button on each card.\n- Interactive Project Detail Drawer / Modal:\n  * Full gallery slider / thumbnail preview of high-res elevation drawings and photos.\n  * Architectural concept narrative and material specification sheet.\n  * Interactive blueprint zoom/pan toggle simulation.\n- Commission Inquiry & Project Cost Estimator:\n  * Interactive project scope configurator: Typology selector, Gross Floor Area slider (100 m² to 2,500 m²).\n  * Estimated timeline and preliminary architectural fee estimation.\n  * Interactive submission form with confirmation toast.\n\nSTYLING & DESIGN:\n- Refined Japanese/Swiss minimalist aesthetic: deep obsidian (#090a0f), zinc-100 text, hairline borders (#27272a), monospace labels.\n- Fluid transitions, micro-interactions, responsive grid.\n- Use Lucide icons: Compass, Grid, Layers, Eye, ArrowUpRight, Calendar, MapPin, Maximize2, Sliders, CheckCircle2, Mail.",
  'a luxury real estate showcase with a mortgage estimator': "Build a complete, production-ready Luxury Real Estate Showcase with Interactive Mortgage Estimator SPA in React 18 with Tailwind CSS and Lucide icons.\n\nPRIMARY REQUIREMENTS:\n1. OUTPUT ORDER: Output <<<FILE:src/App.jsx>>> FIRST before any other file.\n2. Complete working code with full interactivity, zero placeholder comments or TODOs.\n\nKEY FEATURES & ARCHITECTURE:\n- Luxury Brand Header & Navigation:\n  * Prestige brand header: \"AVALON ESTATES // MONACO · ASPEN · BEL AIR · DUBROVNIK\".\n  * Currency switcher (USD $, EUR €, GBP £) and VIP Concierge Hotline.\n  * Navigation: \"Exclusive Listings\", \"Mortgage & Finance\", \"Private Islands\", \"Saved Properties\", \"Schedule Tour\".\n- Curated Estate Search & Filter Bar:\n  * Search by location or keyword (e.g., \"Waterfront\", \"Penthouse\", \"Infinity Pool\").\n  * Filter dropdowns: Property Type (Villa, Penthouse, Chalet, Private Estate), Price Range ($2M - $50M+), Min Bedrooms (3+, 4+, 5+).\n  * Sort options: Price (High to Low), Square Footage, Newly Listed.\n- Prestige Property Gallery:\n  * 6+ ultra-luxury properties with high-resolution Unsplash architectural photography.\n  * Details: Price, Location, Sq Ft, Bedrooms, Bathrooms, Private Amenities tags (Helipad, Wine Cellar, Private Dock).\n  * Interactive \"Save to Favorites\" heart button with localStorage persistence and favorite count badge in header.\n  * \"Calculate Mortgage\" button on each card that pre-fills the mortgage estimator with that property's price!\n- Comprehensive Interactive Mortgage & Financing Estimator Widget:\n  * Interactive sliders and number inputs:\n    - Home Price: $1,000,000 to $30,000,000.\n    - Down Payment: slider for percentage (10% to 50%) with automatic dollar calculation.\n    - Loan Term: toggle buttons for [15 Years] and [30 Years].\n    - Interest Rate: slider/input (3.5% to 9.0%, default ~6.5%).\n    - Property Tax Rate (default 1.25%/yr) and Annual Homeowners Insurance.\n  * Real-Time Monthly Payment Output:\n    - Bold total monthly payment display (e.g., \"$14,820/mo\").\n    - Proportional color-coded breakdown bar:\n      * Principal & Interest (Cyan)\n      * Property Tax (Indigo)\n      * Homeowners Insurance (Emerald)\n      * HOA / Private Security Dues (Amber)\n    - Itemized monthly cost table with exact dollar amounts.\n    - Amortization summary toggle showing total loan cost over time.\n- Schedule Private VIP Viewing Modal:\n  * Select property, preferred tour date & time, in-person vs private drone virtual walkthrough.\n  * Concierge contact confirmation with booking reference code.\n\nSTYLING & DESIGN:\n- Opulent dark obsidian (#090a0f) aesthetic with subtle gold/amber and cyan highlights, glassmorphism cards (bg-zinc-900/60 border border-zinc-800).\n- High responsiveness across mobile, tablet, and widescreen viewports.\n- Use Lucide icons: Home, DollarSign, Calculator, Heart, MapPin, Bed, Bath, Maximize, Calendar, ShieldCheck, Phone, CheckCircle2, ChevronRight."
};

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getCuratedExampleSpec(rawPrompt) {
  const norm = normalizeText(rawPrompt);
  if (norm.includes('fintech') || (norm.includes('portfolio') && norm.includes('chart'))) {
    return CURATED_EXAMPLE_PROMPTS['a modern fintech app with interactive portfolio charts'];
  }
  if (norm.includes('architecture') || (norm.includes('architect') && norm.includes('gallery'))) {
    return CURATED_EXAMPLE_PROMPTS['a minimalist architecture studio portfolio with image gallery'];
  }
  if (norm.includes('real estate') || norm.includes('mortgage') || norm.includes('luxury real estate')) {
    return CURATED_EXAMPLE_PROMPTS['a luxury real estate showcase with a mortgage estimator'];
  }
  for (const [key, spec] of Object.entries(CURATED_EXAMPLE_PROMPTS)) {
    if (normalizeText(key) === norm) {
      return spec;
    }
  }
  return null;
}

export function enhanceUserPrompt(rawPrompt, options = {}) {
  if (!rawPrompt || typeof rawPrompt !== 'string') return '';
  const trimmed = rawPrompt.trim();

  const curated = getCuratedExampleSpec(trimmed);
  if (curated) return curated;

  if (options.isCuratedOnly) {
    return trimmed;
  }

  if (trimmed.length > 400 && trimmed.includes('App.jsx') && trimmed.includes('Tailwind')) {
    return trimmed;
  }

  return `You are building a production-grade React 18 single-page application with Tailwind CSS and Lucide icons based on this user specification:
"${trimmed}"

ARCHITECTURAL SPECIFICATION & MANDATORY REQUIREMENTS:
1. OUTPUT ORDER (CRITICAL):
   - You MUST output <<<FILE:src/App.jsx>>> as the VERY FIRST file.
   - Do NOT emit styles or other files before src/App.jsx.
   - Optional sub-components go inside <<<FILE:src/components/...>>>.
   - Custom styling goes inside <<<FILE:src/index.css>>>.

2. COMPONENT ARCHITECTURE & STATE:
   - Primary component must be default-exported in src/App.jsx.
   - Implement complete, working state management using React useState, useEffect, and localStorage persistence for all user actions (create, edit, delete, filter, toggle).
   - Initialize all state with 4 to 8 realistic, rich domain mock items (never empty lists or single items).

3. INTERACTIVE FEATURES:
   - Search bar and category filter tabs with real-time filtering.
   - Interactive modals / slide-overs for creating and editing records.
   - Dynamic interactive visual widgets (e.g., metric stats cards with percentage change badges, interactive charts or progress bars, calculators).
   - Empty states and confirmation feedback toasts.

4. UI & DESIGN SYSTEM:
   - Modern obsidian dark aesthetic (#090a0f background, zinc-900 cards, zinc-800 borders, zinc-100 text).
   - Crisp hover micro-interactions, active state indicators, and responsive flex/grid layout across mobile and desktop.
   - Use Lucide icons throughout (import from 'lucide-react').

5. ZERO PLACEHOLDERS:
   - Write 100% complete, executable code without any TODO comments or unfinished functions.`;
}

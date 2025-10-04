import React from "react";
import clsx from "clsx";

const Item = ({ label, value }) => (
  <div>
    <div className="text-gray-500">{label}</div>
    <div className="font-medium">{value}</div>
  </div>
);

function Th({ children }) {
  return <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={clsx("px-4 py-3 align-top", className)}>{children}</td>;
}

/* ============ Pump Events ============ */
const PumpEventsTable = () => {
  const rows = [
    {
      event: "Favourable Government Policy",
      rationale:
        "Policy tailwinds can expand market size, margins, or funding—driving re-ratings.",
      examples: [
        "AI: Netweb, E2E Networks rallied after India's foundation-model push",
        "Data Centers: Anant Raj, Black Box after DC policy cues",
        "Rare Earth Minerals: GMDC keep pumping due to Rare earth push by government",
        "Fertilisers: Moves after subsidy/price support",
        "Ethanol/Sugar: Blending mandates boost realizations",
        "Solar Stocks: Solar Stocks became stars due to government push, but now lagging due to oversupply",
        "EV Push in Public Transport: Olectra Greentech boom due to EV push",
        "Defense Stocks: Defense Stocks increased due to government focus on indigenous supply",
      ],
      caveat:
        "Policy timelines & execution risk; initial pops can fade if benefits are delayed.",
    },
    {
      event: "Stock Split Announcement",
      rationale:
        "Improves perceived affordability & liquidity; can attract retail flows.",
      examples: [
        "Godfrey Phillips saw strength into/around split timeline",
      ],
      caveat:
        "No change in intrinsic value; euphoria can reverse if earnings don’t follow.",
    },
    {
      event: "Subsidiary IPO",
      rationale:
        "Unlocks value, improves transparency, and may bring cash to parent/holding co.",
      examples: [
        "Tata Investment jumped ~35% on Tata Capital IPO news",
      ],
      caveat:
        "IPO pricing/allocations & post-listing performance matter; one-offs.",
    },
    {
      event: "Large Strategic Stake by FII/DII/Well Established Investor",
      rationale:
        "Signals strong institutional conviction & funding runway for turnarounds.",
      examples: [
        "IHC's ~43.5% in Samaa(n) Capital saw ~25% up-move",
        "Both Cartrade and Nazara tech went up after Nikhil Kamath Investment",
      ],
      caveat:
        "If due diligence concerns emerge later, momentum can unwind quickly.",
    },
    {
      event: "Successful Large FPO / Rights / OFS",
      rationale:
        "Deleveraging or growth capital without new debt reduces risk; boosts confidence.",
      examples: [
        "Vodafone Idea rallied post a successful FPO",
      ],
      caveat:
        "Dilution math matters; if use-of-proceeds underwhelms, gains may fade.",
    },
    {
      event: "Mergers",
      rationale:
        "Synergies, scale, and cross-sell potential can re-rate the combined entity.",
      examples: [
        "Zee moved on Zee–Sony merger buzz (later failed; stock fell back)",
      ],
      caveat:
        "Deal closure risk (regulatory/terms). Rumors can cause whipsaws.",
    },
    {
      event: "Demergers / Value Unlock",
      rationale:
        "Separates high-growth or asset-heavy units; clearer narratives attract capital.",
      examples: [
        "Raymond demerger value unlock; BEML & BEML Land Assets split",
      ],
      caveat:
        "Listing ratios & final structures matter; sometimes value takes time to surface.",
    },
    {
      event: "Large Volume Spike at lower level",
      rationale:
        "Sudden 5-10x volume can flag accumulation or new information in the market.",
      examples: [
        "10x delivery-backed spikes often precede trends",
      ],
      caveat:
        "HFT/prop churn can fake signals; always check delivery % and source of flow.",
    },
    {
      event: "News Events",
      rationale:
        "Many News events may pump or dump stock prices temporarily",
      examples: [
        "During Indo-Pak War all defense stock pumped",
        "Due to rumours that SEBI will cancel all weekly expiry options all brokerage stocks went down",
        "Due to News about stricter regulation on gold loans all gold loan stocks went down",
        "Due to government ban on real money gaming both Nazara and deltacorp went down",
      ],
      caveat:
        "Trading News is double edge sword, sometimes it can go against",
    },
    {
      event: "Global Parallels",
      rationale:
        "Moves in global peers or platforms spill over to local analogs.",
      examples: [
        "DeepSeek shock hit some Indian IT; Oracle's surge lifted OFSS read-across",
        "Hyundai Korea pumped due to listing of Hyundai India",
      ],
      caveat:
        "Correlations change; ensure business models are truly comparable.",
    },
    {
      event: "Quality at Lows / Mean Reversion",
      rationale:
        "Solid businesses at depressed valuations can bounce on small positive triggers.",
      examples: [
        "Laxmi Dental spiked ~20% from ~₹300 levels on interest revival",
      ],
      caveat:
        "“Cheap” can stay cheap; confirm fundamentals/improving data points.",
    },
    {
      event: "Cyclical Turns",
      rationale:
        "Capital-intensive/commodity/credit cycles create multi-quarter trends.",
      examples: [
        "Even top names swing with cycles (cement, metals, lenders)",
      ],
      caveat:
        "Timing is hard; misreading cycle length causes drawdowns.",
    },
    {
      event: "Index Inclusion / Weight Increase",
      rationale: "Inclusion (Nifty/MSCI/FTSE) brings forced passive inflows.",
      examples: [
        "Stocks rerate on MSCI inclusion news"
      ],
      caveat: "Event-day selling as active funds book gains."
    },
    {
      event: "Earnings Beat / Guidance Upgrade",
      rationale: "Better-than-expected results or higher guidance lift confidence.",
      examples: [
        "Strong quarterly beats re-rate midcaps quickly"
      ],
      caveat: "One-offs (asset sale, tax credit) can mislead."
    },
    {
      event: "Buybacks / Special Dividends",
      rationale: "Signal promoter confidence; improves EPS and ratios.",
      examples: [
        "Buyback price often anchors near-term stock"
      ],
      caveat: "Debt-funded or small buybacks are weak signals."
    },
    {
      event: "Capacity Addition / Capex Commissioning",
      rationale: "New plants and capacity ramping boost volumes and margins.",
      examples: [
        "Cement/steel/utilities stocks rerate on commissioning"
      ],
      caveat: "Delays or demand mismatch hurt ROI."
    },
    {
      event: "Debt Refinance / Rating Upgrade",
      rationale: "Lower borrowing costs and improved perception support valuations.",
      examples: [
        "Rating upgrades spark re-ratings in NBFCs"
      ],
      caveat: "Macro shocks can override credit signals."
    },
    {
      event: "Promoter Stake Actions",
      rationale: "Stake increases or pledge reduction build investor confidence.",
      examples: [
        "Promoter buying after sell-off often sparks rebounds"
      ],
      caveat: "Token buys/pledge re-creation can backfire."
    },
    {
      event: "Sectoral Approvals / Clearances",
      rationale: "Approvals (mining, PLI, spectrum, ethanol) create catalysts.",
      examples: [
        "Pharma rallies on USFDA clearance"
      ],
      caveat: "Regulatory risks and timelines can slip."
    },
    {
      event: "Global activities on commodities and currencies and policies",
      rationale: "Falling input costs, INR stability, policy shifts benefit sectors.",
      examples: [
        "Crude falls boost FMCG; steel rallies on price hikes",
        "Rate-sensitive banks/NBFCs rally on cut expectations",
        "Lift on export ban on certain products from India can improve exports"
      ],
      caveat: "Regulatory risks and timelines can slip."
    },
  ];

  return (
    <section className="w-full">
      <h2 className="text-xl md:text-2xl font-semibold mb-3">Events That Can Pump Stock Prices</h2>

      {/* Mobile: Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4 bg-white">
            <div className="text-base font-semibold">{r.event}</div>
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-medium">Why:</span> {r.rationale}
            </p>
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-600">Examples</div>
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 space-y-0.5">
                {r.examples.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              <span className="font-medium">Caveat:</span> {r.caveat}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <Th>Event</Th>
              <Th>Why it can move prices</Th>
              <Th>Examples</Th>
              <Th>Caveats / Risks</Th>
            </tr>
          </thead>
        <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                <Td className="font-semibold">{r.event}</Td>
                <Td>{r.rationale}</Td>
                <Td>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {r.examples.map((e, idx) => <li key={idx}>{e}</li>)}
                  </ul>
                </Td>
                <Td className="text-amber-700">{r.caveat}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/* ============ Dump Events ============ */
const DumpEventsTable = () => {
  const rows = [
    {
      event: "Change in Government Policy",
      rationale:
        "Sometimes hostile government policy can destroy entire stock, taboo stocks are always under government scrutiny",
      examples: [
        "Real Money Gaming Apps: Gaming app like Nazara and Deltacorp had sharp fall after government curbs",
        "Tobacco stocks: tobacco stocks faces always faces constant tax hike, which impacts the revenue of companies",
        "Alcohol Stocks: alcohol stocks faces constant threats of government regulation even ban in some states, keep watching if any compny is dominant in a particular state and if election is coming up",
        "Stock Brokers: Lot of stock brokerage stock went down duty hike in LTCG and STCG, and SEBI's sticker rules on option trading",
        "Removal of anti dumping duties: Domestic Solar stocks ofter face issue when government removes anti dumping duty on China supply",
        "Gold Finance Stocks: Due to RBI's strict regulation on gold loan approvals gold stocks went down",
      ],
      caveat:
        "",
    },
    {
      event: "Large Stack Sale by FII/DII/Promoter",
      rationale:
        "Signals that there might be something wrong with company, also inject lot of free float in market",
      examples: [
        "Himadry chemical stock went down due to stake sale by Bain capital in 2021",
        "Indigo went down after promoter stack sale",
      ],
      caveat:
        "It can be just temporary down trade, stock might be fundamentally strong",
    },
    {
      event: "Sale by early investors during IPO",
      rationale:
        "There are lot of early investors who wants exit through IPO, so newly listed companies can go down for brief period of time",
      examples: [
        "Zomato, Paytm went down huge after IPO before recovering",
        "Laxmi Dental Went down after IPO despite being decent company",
      ],
      caveat:
        "It can be just temporary down trade, stock might be fundamentally strong",
    },
    {
      event: "Unsuccessful Large FPO / Rights / OFS",
      rationale:
        "Any unsuccessful FPO can be huge blow to credibility of company and can impact heavily",
      examples: [
        "Due to failed FPO of Adani stock due to hindenburg issue, stock went free fall",
        "Due to failed IPO of Wework USA, it's full valuation got destroyed",
      ],
      caveat:
        "Dilution math matters; if use-of-proceeds underwhelms, gains may fade.",
    },
    {
      event: "Unsuccessful Mergers and acquisitions",
      rationale:
        "Failure to do mergers can negatively impact stock price",
      examples: [
        "Failure of Zee-Sony merger",
        "Failure of Future retail acquisition by Reliance destroyed future retail",
      ],
      caveat:
        "Deal closure risk (regulatory/terms). Rumors can cause whipsaws.",
    },
    {
      event: "Large Volume Spike on High Levels",
      rationale:
        "Sudden 5-10x volume spike at stock high might suggest selling.",
      examples: [
        "10x delivery-backed spikes often precede trends",
      ],
      caveat:
        "HFT/prop churn can fake signals; always check delivery % and source of flow.",
    },
    {
      event: "whistleblowers and Short Sellers",
      rationale:
        "Many stock that might hide some internal issues can go down if whistleblowers or short Sellers report come out",
      examples: [
        "UPL stock went down after whistleblowers report",
        "Adani Stock down after Hindenburg report",
      ],
      caveat:
        "Many times whistleblowers might be biased or some kind of vendetta",
    },
    {
      event: "Corporate Governance Issue",
      rationale:
        "Market takes corporate governance issues very seriously, it is better to be very careful with this companies",
      examples: [
        "Easemytrip stock seen large fall due to no clear direction by management and frequent changes",
        "PC Jewellers remains beaten down due to corporate governance issues",
        "Rajesh Export went down due to corporate governance issues",
      ],
      caveat:
        "Many times whistleblowers might be biased or some kind of vendetta",
    },
    {
      event: "Pledging Shares or high interest loans",
      rationale:
        "If company has to pledge the share to raise capital that proves company is not able to get capital from other mediums",
      examples: [
        "In 2019, Zee Entertainment's stock plummeted after news surfaced that its promoters had pledged a significant portion of their shares to lenders",
        "Under Anil Ambani, the Reliance ADA Group lost control of multiple companies, largely due to a combination of heavy debt and excessive share pledging."
      ],
      caveat:
        "If pledging go beyond control, turnaround if mostly impossible. But in some cases restructuring can happen example cafe coffee day  or suzlon, but this can take very long time",
    },
    {
      event: "News Events",
      rationale:
        "Any announcement like US election, tariffs, war can impact Indian stocks",
      examples: [
        "Trump's tariffs impacted Indian Rice, Shrimp, Textile and Pharma stocks",
      ],
      caveat:
        "Trading News is double edge sword, sometimes it can go against",
    },
    {
      event: "Cyclical Down Cycles",
      rationale:
        "Capital-intensive/commodity/credit cycles create multi-quarter trends.",
      examples: [
        "Even top names swing with cycles (cement, metals, lenders)",
      ],
      caveat:
        "Timing is hard; misreading cycle length causes drawdowns.",
    },
  ];

  return (
    <section className="w-full">
      <h2 className="text-xl md:text-2xl font-semibold mb-3">Events That Can Dump Stock Prices</h2>

      {/* Mobile: Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4 bg-white">
            <div className="text-base font-semibold">{r.event}</div>
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-medium">Why:</span> {r.rationale}
            </p>
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-600">Examples</div>
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 space-y-0.5">
                {r.examples.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              <span className="font-medium">Caveat:</span> {r.caveat}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <Th>Event</Th>
              <Th>Why it can move prices</Th>
              <Th>Examples</Th>
              <Th>Caveats / Risks</Th>
            </tr>
          </thead>
        <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                <Td className="font-semibold">{r.event}</Td>
                <Td>{r.rationale}</Td>
                <Td>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {r.examples.map((e, idx) => <li key={idx}>{e}</li>)}
                  </ul>
                </Td>
                <Td className="text-amber-700">{r.caveat}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/* ============ Company Model ============ */
const CompanyModelsTable = () => {
  const rows = [
    {
      type: "Product Companies (FMCG, Auto, Pharma, Steel, Chemicals)",
      input: "Raw materials (domestic & imported), Utilities, energy",
      expenses:
        "Manufacturing (plant, machinery, depreciation), Logistics & distribution, Advertising & sales promotion",
      tax: "GST on domestic sales, Customs duty on imported inputs, Export duties/incentives on output",
      revenue:
        "Domestic sales (B2B/B2C), Export sales (forex risk, duties), Government export incentives",
    },
    {
      type: "Service Companies (IT/ITES, Consulting, Finance, Hospitality)",
      input: "Skilled human resources, Tech infra (servers, cloud, software tools)",
      expenses:
        "Salaries, hiring & retention, Offices/delivery centers, Tech infra, Sales & marketing / customer acquisition",
      tax: "GST on services, Corporate tax on profits, Limited import/export duties (e.g. infra, licenses)",
      revenue:
        "Contracts (time & material, fixed price), Subscriptions (SaaS/fintech), Advisory & consulting exports (foreign clients, forex inflows)",
    },
    {
      type: "Holding / Investment Companies",
      input: "Minimal operating inputs",
      expenses: "Administrative costs, Compliance, Audit & Legal",
      tax: "Dividend distribution tax (if applicable), Capital gains tax on share sales",
      revenue:
        "Dividends from subsidiaries, Capital gains from investments, Rental/interest income",
    },
  ];

  return (
    <div className="w-full mt-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-4">
        How Companies Operate ?
      </h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm md:text-base">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left font-semibold border">Type of Companies</th>
              <th className="p-3 text-left font-semibold border">Input Cost</th>
              <th className="p-3 text-left font-semibold border">Major Expenses</th>
              <th className="p-3 text-left font-semibold border">Tax & Duty</th>
              <th className="p-3 text-left font-semibold border">Revenue Streams</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="p-3 border align-top font-medium">{row.type}</td>
                <td className="p-3 border align-top">{row.input}</td>
                <td className="p-3 border align-top">{row.expenses}</td>
                <td className="p-3 border align-top">{row.tax}</td>
                <td className="p-3 border align-top">{row.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============ CapitalRaisingTable ============ */
const CapitalRaisingTable = ({ className = "" }) => {
  const methods = [
    { method: "Rights Issue", whoCanBuy: "Existing shareholders (in a set ratio)", moneyGoesTo: "Company", typicalUse: "Raise capital from current owners at a discount", dilution: true,  notes: "Share count increases if rights are subscribed; non-participation dilutes holding %." },
    { method: "Preferential Issue", whoCanBuy: "Selected investors (promoters, PE, FPIs, etc.)", moneyGoesTo: "Company", typicalUse: "Quick fundraising from a specific group", dilution: true, notes: "New shares are issued to a select group; existing % holding gets diluted." },
    { method: "QIP", whoCanBuy: "Qualified Institutional Buyers (QIBs)", moneyGoesTo: "Company", typicalUse: "Large, faster raise from institutions", dilution: true, notes: "Fresh equity issued to QIBs causes dilution." },
    { method: "FPO (Follow-on Public Offer)", whoCanBuy: "Public (already-listed company)", moneyGoesTo: "Company", typicalUse: "Substantial capital raising post listing", dilution: true, notes: "Fresh issue expands share base; EPS may drop initially." },
    { method: "OFS (Offer for Sale)", whoCanBuy: "Public via exchanges (with retail quota)", moneyGoesTo: "Selling shareholder", typicalUse: "Stake sale without new shares", dilution: false, notes: "No new shares created; ownership changes hands." },
    { method: "ESOP/ESPS Allotment", whoCanBuy: "Employees", moneyGoesTo: "Company", typicalUse: "Talent retention & alignment", dilution: true, notes: "Exercise/issue increases outstanding shares." },
    { method: "Buyback", whoCanBuy: "Company buys from shareholders", moneyGoesTo: "Shareholders", typicalUse: "Return excess cash, improve ratios", dilution: false, notes: "Anti-dilutive: share count decreases; EPS may improve." },
  ];

  const Pill = ({ yes }) => (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1",
        yes ? "bg-red-50 text-red-700 ring-red-200" : "bg-green-50 text-green-700 ring-green-200"
      )}
      title={yes ? "Dilutive" : "Not dilutive"}
    >
      {yes ? "Dilutive" : "Not dilutive"}
    </span>
  );

  return (
    <>
    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Capital-Raising Methods After IPO</h2>
    <section className={clsx("w-full p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm", className)}>
      <p className="mt-2 text-sm md:text-base text-gray-600">
        Quick reference comparing Rights Issue, Preferential Issue, QIP, FPO, OFS, ESOP/ESPS, and Buyback — and whether they
        <span className="font-semibold"> dilute shareholding</span>.
      </p>

      {/* Card view (mobile) */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
        {methods.map((m) => (
          <div key={m.method} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold">{m.method}</h3>
              <Pill yes={m.dilution} />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <Item label="Who can buy" value={m.whoCanBuy} />
              <Item label="Money goes to" value={m.moneyGoesTo} />
              <Item label="Typical use case" value={m.typicalUse} />
              <Item label="Notes" value={m.notes} />
            </div>
          </div>
        ))}
      </div>

      {/* Table view (tablet/desktop) */}
      <div className="mt-6 hidden md:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full whitespace-pre-wrap text-left text-sm md:text-base">
          <thead className="bg-gray-50">
            <tr>
              <Th>Method</Th>
              <Th>Who can buy</Th>
              <Th>Money goes to</Th>
              <Th>Typical use case</Th>
              <Th>Dilution</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {methods.map((m) => (
              <tr key={m.method} className="hover:bg-gray-50/80">
                <Td className="font-semibold">{m.method}</Td>
                <Td>{m.whoCanBuy}</Td>
                <Td>{m.moneyGoesTo}</Td>
                <Td>{m.typicalUse}</Td>
                <Td><Pill yes={m.dilution} /></Td>
                <Td className="text-gray-700">{m.notes}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8">
        <h4 className="text-xl font-semibold">When does shareholding get diluted?</h4>
        <ul className="mt-3 list-disc pl-5 text-sm md:text-base text-gray-700 space-y-1">
          <li><span className="font-medium">Dilutive</span>: new shares are issued (Rights, Preferential, QIP, FPO, ESOP/ESPS).</li>
          <li><span className="font-medium">Not dilutive</span>: no new shares (OFS).</li>
          <li><span className="font-medium">Anti-dilutive</span>: Buyback reduces share count.</li>
        </ul>
      </section>
    </section>
    </>
  );
};

/* ============ AdvertisingMediums ============ */
const AdvertisingMediums = ({ className = "" }) => {
  const mediums = [
    { title: "Television (DTH & Cable)", examples: "Star Plus, Sony, Colors, Zee TV" },
    { title: "FM & Radio", examples: "Red FM, Big FM" },
    { title: "Digital & Social Media", examples: "Meta (Facebook, Instagram), Google (YouTube, Search, Display), X (Twitter), LinkedIn, ShareChat, Moj, DailyHunt" },
    { title: "Newspapers", examples: "Times of India, Hindustan Times, The Hindu, Dainik Jagran, Eenadu, Gujarat Samachar" },
    { title: "Outdoor (OOH & Transit)", examples: "Billboards, metro/train ads, bus wraps, airport ads, digital hoardings" },
    { title: "Cinema Advertising", examples: "Ads before movies in multiplexes (PVR, INOX, Cinepolis) and single screens" },
    { title: "OTT / Streaming", examples: "Disney+ Hotstar, JioCinema, SonyLIV, Zee5 – growing rapidly with cricket & IPL ads" },
    { title: "Influencer Marketing", examples: "YouTube, Instagram Reels, Telegram groups – strong in fashion, food, fintech" },
    { title: "E-commerce Ads", examples: "Amazon, Flipkart, Meesho – product search ads with high conversion intent" },
    { title: "In-App Ads", examples: "Gaming (Ludo King, Dream11), fintech, and regional content apps" },
  ];

  return (
    <>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Advertising Mediums in India</h2>
    <section className={clsx("w-full p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm", className)}>

      <div className="space-y-3">
        {mediums.map((item, idx) => (
          <p key={idx} className="text-sm md:text-base">
            <span className="font-semibold text-gray-900">{item.title}</span>
            <span className="text-gray-400 px-1">•</span>
            <span className="text-gray-700">{item.examples}</span>
          </p>
        ))}
      </div>
    </section>
    </>
  );
};

/* ============ Alternate data stream ============ */
const AlternateDataTable = () => {
  const rows = [
    {
      stream: "Payments & Transaction Data",
      insight:
        "UPI, credit card, POS payments reveal consumer behavior trends and demand shifts.",
      examples: [
        "Useful for FMCG, e-commerce, retail products.",
        "Rising UPI/CC spend suggests strong consumer demand."
      ],
      caveat: "Data may be aggregated or lagged; access can be restricted."
    },
    {
      stream: "New Job Openings",
      insight:
        "Sudden hiring surges can indicate new projects or business expansion.",
      examples: [
        "Aeva Technologies stock jumped 10x after a surge in LinkedIn job postings.",
        "Moschip pumped after sudden job opening spikes.",
        "IT companies' post-COVID hiring preceded stock rallies."
      ],
      caveat: "Not all roles are growth-related (could be attrition backfill)."
    },
    {
      stream: "Advertising Data",
      insight:
        "Higher ad spending signals aggressive customer acquisition or product push.",
      examples: [
        "Jeena Sheekho stock 10x after heavy ad campaigns across platforms."
      ],
      caveat: "Overspending without conversion may hurt margins."
    },
    {
      stream: "Footfall Tracking",
      insight:
        "Store visits at restaurants, retail chains, hotels, parks indicate real demand.",
      examples: [
        "Domino's crowded outlets coincided with stock rallies.",
        "D-Mart stores packed on weekends aligned with strong stock performance."
      ],
      caveat: "Foot traffic ≠ sales value; seasonal spikes may mislead."
    },
    {
      stream: "Online Visits, App Downloads & Reviews",
      insight:
        "Tracking app installs, traffic, and reviews can forecast user growth trends.",
      examples: [
        "Zomato, Swiggy, Ixigo, IndiaMart show visible traction via app store data."
      ],
      caveat: "Download spikes may include promos/freebies; sentiment analysis tricky."
    },
    {
      stream: "Social & Web Noise",
      insight:
        "Public sentiment and chatter can provide early alternate views.",
      examples: [
        "Social media buzz often precedes mainstream media coverage."
      ],
      caveat: "Noise vs signal; requires careful filtering."
    },
    {
      stream: "Satellite, Aircraft & Shipping Traffic",
      insight:
        "Satellite images, port/aircraft traffic reveal commodity flows and demand.",
      examples: [
        "Oil tanker routes help anticipate crude imports/exports.",
        "Shipping data predicts trade flows."
      ],
      caveat: "Data access expensive; interpretation needs domain expertise."
    },
    {
      stream: "Import & Export Data",
      insight:
        "Customs/port data reveal supply chain activity and demand for products.",
      examples: [
        "Export surge in chemicals or IT hardware often aligns with rallies."
      ],
      caveat: "Lagged reporting; requires aggregation."
    },
    {
      stream: "R&D, IP & Events",
      insight:
        "Patent filings, trademarks, and participation in expos reveal innovation and pipeline.",
      examples: [
        "Biotech/pharma patent filings are strong leading indicators."
      ],
      caveat: "Not every filing creates commercial success."
    }
  ];

  return (
    <section className="w-full">
      <h2 className="text-xl md:text-2xl font-semibold mb-3">
        Alternate Data Streams for Stock Insights
      </h2>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4 bg-white">
            <div className="text-base font-semibold">{r.stream}</div>
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-medium">Insight:</span> {r.insight}
            </p>
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-600">Examples</div>
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 space-y-0.5">
                {r.examples.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              <span className="font-medium">Caveat:</span> {r.caveat}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <Th>Data Stream</Th>
              <Th>Insight</Th>
              <Th>Examples</Th>
              <Th>Caveats</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                <Td className="font-semibold">{r.stream}</Td>
                <Td>{r.insight}</Td>
                <Td>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {r.examples.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </Td>
                <Td className="text-amber-700">{r.caveat}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};


/* ============ Page Layout ============ */
function Learning() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <CompanyModelsTable />
      <PumpEventsTable />
      <DumpEventsTable />
      <AlternateDataTable />
      <CapitalRaisingTable />
      <AdvertisingMediums />
    </div>
  );
}

export default Learning;

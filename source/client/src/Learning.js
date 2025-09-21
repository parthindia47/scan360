import React from "react";

/**
 * CapitalRaisingTable
 * - Responsive React + Tailwind component
 * - Shows Primary/Secondary market methods with dilution notes
 * - Table view on md+; card view on small screens
 */
const CapitalRaisingTable = () => {
  const methods = [
    {
      method: "Rights Issue",
      whoCanBuy: "Existing shareholders (in a set ratio)",
      moneyGoesTo: "Company",
      typicalUse: "Raise capital from current owners at a discount",
      dilution: true,
      notes: "Share count increases if rights are subscribed; non-participation dilutes holding %."
    },
    {
      method: "Preferential Issue",
      whoCanBuy: "Selected investors (promoters, PE, FPIs, etc.)",
      moneyGoesTo: "Company",
      typicalUse: "Quick fundraising from a specific group",
      dilution: true,
      notes: "New shares are issued to a select group; existing % holding gets diluted."
    },
    {
      method: "QIP",
      whoCanBuy: "Qualified Institutional Buyers (QIBs)",
      moneyGoesTo: "Company",
      typicalUse: "Large, faster raise from institutions",
      dilution: true,
      notes: "Fresh equity issued to QIBs causes dilution."
    },
    {
      method: "FPO (Follow-on Public Offer)",
      whoCanBuy: "Public (like an IPO, but already-listed company)",
      moneyGoesTo: "Company",
      typicalUse: "Substantial capital raising post listing",
      dilution: true,
      notes: "Fresh issue expands share base; EPS may drop initially."
    },
    {
      method: "OFS (Offer for Sale)",
      whoCanBuy: "Public via exchanges (with retail quota)",
      moneyGoesTo: "Selling shareholder (promoter/government)",
      typicalUse: "Stake sale / promoter dilution without issuing new shares",
      dilution: false,
      notes: "No new shares created; only ownership changes hands."
    },
    {
      method: "ESOP/ESPS Allotment",
      whoCanBuy: "Employees",
      moneyGoesTo: "Company",
      typicalUse: "Talent retention & alignment",
      dilution: true,
      notes: "Exercise/issue of shares to employees increases outstanding shares."
    },
    {
      method: "Buyback",
      whoCanBuy: "Company buys from existing shareholders",
      moneyGoesTo: "Shareholders tendering shares",
      typicalUse: "Return excess cash, improve ratios",
      dilution: false,
      notes: "Anti-dilutive: share count decreases; EPS may improve."
    }
  ];

  const Pill = ({ yes }) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        yes ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-green-50 text-green-700 ring-1 ring-green-200"
      }`}
      title={yes ? "Dilutive" : "Not dilutive"}
    >
      {yes ? "Dilutive" : "Not dilutive"}
    </span>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Equity & Related Capital-Raising Methods</h2>
      <p className="mt-2 text-sm md:text-base text-gray-600">
        Quick reference comparing Rights Issue, Preferential Issue, QIP, FPO, OFS, ESOP/ESPS, and Buyback — and whether they
        <span className="font-semibold"> dilute shareholding</span>.
      </p>

      {/* Card view (mobile) */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
        {methods.map((m) => (
          <div key={m.method} className="rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold">{m.method}</h3>
              <Pill yes={m.dilution} />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <div className="text-gray-500">Who can buy</div>
                <div className="font-medium">{m.whoCanBuy}</div>
              </div>
              <div>
                <div className="text-gray-500">Money goes to</div>
                <div className="font-medium">{m.moneyGoesTo}</div>
              </div>
              <div>
                <div className="text-gray-500">Typical use case</div>
                <div className="font-medium">{m.typicalUse}</div>
              </div>
              <div>
                <div className="text-gray-500">Notes</div>
                <div className="font-medium">{m.notes}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table view (tablet/desktop) */}
      <div className="mt-6 hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
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
                <Td>
                  <Pill yes={m.dilution} />
                </Td>
                <Td className="text-gray-700">{m.notes}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dilution rules / explainer */}
      <section className="mt-8">
        <h4 className="text-xl font-semibold">When does shareholding get diluted?</h4>
        <ul className="mt-3 list-disc pl-5 text-sm md:text-base text-gray-700 space-y-1">
          <li>
            <span className="font-medium">Dilutive</span>: Any method where the <span className="font-medium">company issues new shares</span> —
            Rights Issue, Preferential Issue, QIP, FPO, ESOP/ESPS. Total outstanding shares increase, so existing % ownership decreases unless you participate proportionally.
          </li>
          <li>
            <span className="font-medium">Not dilutive</span>: Methods where <span className="font-medium">no new shares are created</span> — OFS (promoter/government selling existing shares).
          </li>
          <li>
            <span className="font-medium">Anti‑dilutive</span>: <span className="font-medium">Buyback</span> reduces shares outstanding and can improve EPS (all else equal).
          </li>
        </ul>
      </section>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">{children}</th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function Learning() {
  return (
    <div className="p-4 mb-6">
      <CapitalRaisingTable/>
    </div>
  )
}

export default Learning;
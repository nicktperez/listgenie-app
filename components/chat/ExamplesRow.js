import React from "react";

const examples = [
  {
    label: "3BR Craftsman in Midtown",
    text:
      "3 bed, 2 bath Craftsman in Midtown. 1,650 sqft, updated kitchen, quartz counters, oak floors, detached garage, walkable to cafés and parks.",
  },
  {
    label: "Modern Condo DTLA",
    text:
      "1 bed, 1 bath modern condo, 780 sqft with skyline views, floor-to-ceiling windows, pool, gym, 24/7 security, near transit.",
  },
  {
    label: "Luxury Estate",
    text:
      "5 bed, 6 bath estate on 2 acres, 6,200 sqft, chef's kitchen, wine cellar, home theater, infinity pool, smart home, gated entry.",
  },
];

export default function ExamplesRow({ onSelect }) {
  return (
    <div className="examples-section compact">
      <div className="examples-header">
        <h3 className="examples-title">Quick Examples</h3>
      </div>
      <div className="examples-grid">
        {examples.map((ex, i) => (
          <button key={i} className="example-btn" onClick={() => onSelect(ex.text)}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

export function ChartGradients() {
  return (
    <defs>
      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#22D3EE" />
      </linearGradient>
    </defs>
  );
}

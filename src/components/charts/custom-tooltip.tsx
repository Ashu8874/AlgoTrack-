"use client";

interface TooltipPayload {
  name?: string;
  value?: number | string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#0D0D1A",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {label && (
        <p style={{ color: "#A78BFA", fontSize: 11, marginBottom: 6 }}>{label}</p>
      )}
      {payload.map((p) => (
        <p
          key={p.name}
          style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 600 }}
        >
          <span style={{ color: p.color, marginRight: 6 }}>●</span>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

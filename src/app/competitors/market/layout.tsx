// Since we have a unified competitors layout, we don't need a separate layout for the market section.
// Keep this file minimal with just a simple passthrough of children.
export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 
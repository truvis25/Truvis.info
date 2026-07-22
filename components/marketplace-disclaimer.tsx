// Mandatory on every marketplace surface (PRD MKT-7, BRD §8).
export function MarketplaceDisclaimer() {
  return (
    <p className="rounded-xl border border-border bg-muted p-4 text-xs leading-5 text-muted-foreground">
      Truvis.info is an introduction service only. Listing content is provided
      by the listing organization and is not verified, endorsed, or recommended
      by Truvis. Truvis does not provide investment advice, broker
      transactions, or hold client funds. Conduct your own due diligence and
      obtain independent professional advice before entering any transaction.
    </p>
  );
}

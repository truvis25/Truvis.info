// Mandatory on every marketplace surface (PRD MKT-7, BRD §8).
export function MarketplaceDisclaimer() {
  return (
    <p className="rounded-xl border border-black/10 bg-black/[0.03] p-4 text-xs leading-5 text-gray-600 dark:border-white/15 dark:bg-white/5 dark:text-gray-400">
      Truvis.info is an introduction service only. Listing content is provided
      by the listing organization and is not verified, endorsed, or recommended
      by Truvis. Truvis does not provide investment advice, broker
      transactions, or hold client funds. Conduct your own due diligence and
      obtain independent professional advice before entering any transaction.
    </p>
  );
}

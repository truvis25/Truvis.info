// Size derivatives of the artwork supplied in Founder House print materials.zip.
export function HouseMark({
  className = "",
  tone = "green",
  sizes = "160px",
  eager = false,
}: {
  className?: string;
  tone?: "green" | "white";
  sizes?: string;
  eager?: boolean;
}) {
  const base = `/assets/brand/house-mark-${tone}`;
  return (
    <img
      className={"house-mark " + className}
      src={base + "-256.webp"}
      srcSet={`${base}-128.webp 128w, ${base}-256.webp 256w, ${base}-512.webp 512w`}
      sizes={sizes}
      alt=""
      aria-hidden="true"
      width="256"
      height="245"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

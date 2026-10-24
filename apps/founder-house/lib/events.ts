export type PublicEvent = {
  id: string;
  title: string;
  format: string;
  description: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  area: string;
  status: string;
};
export const HOUSE_ORIGIN = "https://house.truvis.info";
export function eventDate(value: string) {
  return (
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Dubai",
    }).format(new Date(value)) + " GST"
  );
}

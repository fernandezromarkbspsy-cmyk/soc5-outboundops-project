/**
 * Outbound icon sourced online from the Iconify CDN (Material Design Icons set).
 * https://api.iconify.design/mdi:truck-fast-outline.svg
 */
export default function OutboundIcon({
  className = "h-6 w-6",
  color = "%23ffffff",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <img
      src={`https://api.iconify.design/mdi:truck-fast-outline.svg?color=${color}`}
      alt=""
      aria-hidden
      className={className}
      loading="eager"
      draggable={false}
    />
  );
}

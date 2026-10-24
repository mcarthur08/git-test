import { ICON } from "@/lib/icons.js";

export function Icon({ k, fill }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={fill ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON[k] }}
    />
  );
}

// Raw SVG strings (avatars, map pieces) are rendered through a contents-only wrapper so they lay out as direct children.
export function Svg({ html }) {
  return <span className="svg-host" dangerouslySetInnerHTML={{ __html: html }} />;
}

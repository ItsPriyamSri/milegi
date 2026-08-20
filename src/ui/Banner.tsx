import { BANNER } from "@/lib/i18n";

/** Required on every route, including errors and the simulator. */
export function Banner() {
  return (
    <div className="banner" role="note">
      <span lang="hi">{BANNER.hi}</span>
      <span aria-hidden="true"> · </span>
      <span lang="en">{BANNER.en}</span>
    </div>
  );
}

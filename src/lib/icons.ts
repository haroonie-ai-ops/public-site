// Service icon registry.
//
// The SVGs under src/icons/ are byte-identical to the set supplied by the
// owner (E17 item (e)). They are imported raw and inlined by
// components/ServiceIcon.astro, which is where the accessibility handling
// lives — nothing is edited on disk, so the files stay comparable against
// the delivered set.
//
// Importing with `?raw` rather than reading from public/ is deliberate: it
// makes an unresolvable icon a BUILD failure rather than a 404 discovered by
// a visitor, and it keeps the files out of the served asset surface, since
// their only use is inline.
//
// The keys here are the single source of truth for which icons exist. The
// `icon` field in the services collection schema (src/content.config.ts) is
// a z.enum over exactly these names, so a content file naming an icon that
// does not exist fails `astro check` instead of rendering an empty box.
import lightbulb from '../icons/lightbulb.svg?raw';
import barChart from '../icons/bar-chart.svg?raw';
import cloud from '../icons/cloud.svg?raw';

export const ICONS = {
	lightbulb,
	'bar-chart': barChart,
	cloud,
} as const;

export type IconName = keyof typeof ICONS;

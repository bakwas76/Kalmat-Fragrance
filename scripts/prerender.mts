/**
 * Static SEO prerender step.
 *
 * This app is a client-side rendered React SPA (Vite + React Router). Real
 * users get the full interactive experience via JavaScript, but any crawler
 * that does NOT execute JavaScript (many AI crawlers — GPTBot, PerplexityBot,
 * ClaudeBot, etc. — plus some fallback social-media link previews) only ever
 * sees the raw dist/index.html shell, which has a generic placeholder title
 * and no per-page meta description, canonical link, or JSON-LD schema.
 *
 * This script runs after `vite build` (see the "postbuild" npm script) and
 * writes a small static index.html per marketing route with the correct
 * <title>, meta description/OG/Twitter tags, canonical link, and JSON-LD
 * schema baked directly into the HTML — no headless browser required.
 *
 * The title/description/schema values below are imported directly from the
 * same page components that render them for real users, so this file can
 * never silently drift out of sync with the live SEO content.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BASE_TITLE, BASE_DESC } from '../src/components/Seo';
import { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA, BREADCRUMB_SCHEMA } from '../src/pages/Home';
import {
  SHOP_SEO_TITLE,
  SHOP_SEO_DESCRIPTION,
  SHOP_ORGANIZATION_SCHEMA,
  SHOP_WEBPAGE_SCHEMA,
  SHOP_FAQ_SCHEMA,
} from '../src/pages/Shop';
import {
  COLLECTIONS_SEO_TITLE,
  COLLECTIONS_SEO_DESCRIPTION,
  COLLECTIONS_ORGANIZATION_SCHEMA,
  COLLECTIONS_WEBPAGE_SCHEMA,
  COLLECTIONS_FAQ_SCHEMA,
} from '../src/pages/Collections';
import {
  ABOUT_SEO_TITLE,
  ABOUT_SEO_DESCRIPTION,
  ABOUT_ORGANIZATION_SCHEMA,
  ABOUT_WEBPAGE_SCHEMA,
  ABOUT_FAQ_SCHEMA,
} from '../src/pages/About';
import {
  CONTACT_SEO_TITLE,
  CONTACT_SEO_DESCRIPTION,
  CONTACT_ORGANIZATION_SCHEMA,
  CONTACT_WEBPAGE_SCHEMA,
} from '../src/pages/Contact';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const SITE_URL = 'https://www.kalmatfragrance.store';

interface RouteConfig {
  route: string; // e.g. '/', '/shop'
  title: string; // full <title> text, suffix already applied by the caller
  description: string;
  schemas: object[];
}

function fullTitle(pageTitle: string) {
  return `${pageTitle} | Kalmat Fragrance`;
}

const routes: RouteConfig[] = [
  {
    route: '/',
    title: BASE_TITLE,
    description: BASE_DESC,
    schemas: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA, BREADCRUMB_SCHEMA],
  },
  {
    route: '/shop',
    title: fullTitle(SHOP_SEO_TITLE),
    description: SHOP_SEO_DESCRIPTION,
    schemas: [SHOP_ORGANIZATION_SCHEMA, SHOP_WEBPAGE_SCHEMA, SHOP_FAQ_SCHEMA],
  },
  {
    route: '/collections',
    title: fullTitle(COLLECTIONS_SEO_TITLE),
    description: COLLECTIONS_SEO_DESCRIPTION,
    schemas: [COLLECTIONS_ORGANIZATION_SCHEMA, COLLECTIONS_WEBPAGE_SCHEMA, COLLECTIONS_FAQ_SCHEMA],
  },
  {
    route: '/about',
    title: fullTitle(ABOUT_SEO_TITLE),
    description: ABOUT_SEO_DESCRIPTION,
    schemas: [ABOUT_ORGANIZATION_SCHEMA, ABOUT_WEBPAGE_SCHEMA, ABOUT_FAQ_SCHEMA],
  },
  {
    route: '/contact',
    title: fullTitle(CONTACT_SEO_TITLE),
    description: CONTACT_SEO_DESCRIPTION,
    schemas: [CONTACT_ORGANIZATION_SCHEMA, CONTACT_WEBPAGE_SCHEMA],
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHead(template: string, config: RouteConfig): string {
  let html = template;

  // Swap the generic Bolt placeholder title for the real per-page title.
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(config.title)}</title>`);

  const canonicalHref = `${SITE_URL}${config.route}`;
  const metaTags = [
    `<meta name="description" content="${escapeHtml(config.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(config.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(config.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonicalHref}" />`,
    `<meta name="twitter:title" content="${escapeHtml(config.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(config.description)}" />`,
    `<link rel="canonical" href="${canonicalHref}" />`,
  ].join('\n    ');

  const schemaTags = config.schemas
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n    ');

  // Insert the new tags right before </head>, after the existing static tags.
  html = html.replace('</head>', `    ${metaTags}\n    ${schemaTags}\n  </head>`);

  return html;
}

function run() {
  const templatePath = join(DIST_DIR, 'index.html');
  let template: string;
  try {
    template = readFileSync(templatePath, 'utf-8');
  } catch {
    console.error(`[prerender] Could not read ${templatePath}. Run "vite build" first.`);
    process.exit(1);
  }

  for (const config of routes) {
    const html = buildHead(template, config);

    if (config.route === '/') {
      writeFileSync(templatePath, html, 'utf-8');
      console.log(`[prerender] Wrote dist/index.html`);
      continue;
    }

    const routeDir = join(DIST_DIR, config.route.replace(/^\//, ''));
    mkdirSync(routeDir, { recursive: true });
    const outPath = join(routeDir, 'index.html');
    writeFileSync(outPath, html, 'utf-8');
    console.log(`[prerender] Wrote dist${config.route}/index.html`);
  }
}

run();

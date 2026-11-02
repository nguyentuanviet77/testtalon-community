import fs from 'node:fs';
import path from 'node:path';
import type { BrowserContext } from '@packages/web/lib/base-test';

/** The folder that holds the sample applications the tests open locally: sample-app/<application-name>/. */
export const SAMPLE_APP_ROOT = path.resolve('sample-app');

/**
 * Serves one sample application from `sample-app/<app>/` at a made-up `origin` for every page of the browser context, so a test
 * needs no web server, network or account. Open it with `page.goto(`${origin}/alerts`)`.
 *
 * A request for `/name` is answered with `name.html` (or the file `name` itself, for scripts and styles), and `/` with `index.html`.
 * Anything else, or a path outside the application's folder, gets a 404. Relative links and iframe sources inside the pages
 * (`/frame`, `/popup`) resolve against the same origin, so they are served too.
 *
 * @param context - The browser context of the test (`page.context()`).
 * @param app - The folder name below sample-app, for example `alerts-frames-windows`.
 * @param origin - Any origin that is not a real site, for example `https://fixtures.example.test`.
 */
export async function serveSampleApp(context: BrowserContext, app: string, origin: string): Promise<void> {
    const root = path.resolve(SAMPLE_APP_ROOT, app);
    if (!root.startsWith(SAMPLE_APP_ROOT + path.sep)) throw new Error(`Sample application "${app}" must be a folder name below ${SAMPLE_APP_ROOT}.`);
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`Sample application "${app}" not found: ${root} does not exist.`);

    await context.route(`${origin}/**`, route => {
        const requested = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, '') || 'index';
        const candidates = path.extname(requested) ? [requested] : [`${requested}.html`, requested];
        for (const candidate of candidates) {
            const file = path.resolve(root, candidate);
            if (file.startsWith(root + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) return route.fulfill({ path: file });
        }
        return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    });
}

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { test, expect } from '@core/lib/BaseTest';
import { harFixture } from '@objectRepositories/GUI/harFixtureGUI.json';

// A HAR file records the network traffic of a page so that it can be replayed later without the network.
// This demonstration records a small local page, then replays it while the real server answers differently, so the replay can
// only come from the HAR. Nothing leaves the machine: the server is a few lines of Node's built-in http module on 127.0.0.1.
const pageHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>HAR fixture page</title></head>
<body>
  <h1 id="har-heading">HAR fixture page</h1>
  <p id="har-message">Loading...</p>
  <script>
    fetch('/api/message').then(response => response.json()).then(data => { document.querySelector('#har-message').textContent = data.message; });
  </script>
</body>
</html>`;

/** Starts the fixture server. Every request to /api/message gets a new number, so a live answer and a replayed answer differ. */
async function startFixtureServer(): Promise<{ url: string; close: () => Promise<void> }> {
    let call = 0;
    const server = http.createServer((request, response) => {
        if (request.url === '/api/message') {
            call += 1;
            response.writeHead(200, { 'content-type': 'application/json' });
            response.end(JSON.stringify({ message: `Hello from the server (answer ${call})` }));
        } else {
            response.writeHead(200, { 'content-type': 'text/html' });
            response.end(pageHtml);
        }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${port}/`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}

test('Generate a HAR file for a local page and replay it instead of the live server', { tag: ['@GUI', '@UnitTest', '@Offline'] }, async ({ browser }, testInfo) => {
    const server = await startFixtureServer();
    const harFile = testInfo.outputPath('local-page.har');
    try {
        await test.step('Record the page and its API call into a HAR file', async () => {
            const recording = await browser.newContext();
            const page = await recording.newPage();
            await page.routeFromHAR(harFile, { update: true });
            await page.goto(server.url);
            await expect(page.locator(harFixture.heading)).toHaveText('HAR fixture page');
            await expect(page.locator(harFixture.message)).toHaveText('Hello from the server (answer 1)');
            await recording.close(); // the HAR file is written when the context closes
        });

        await test.step('Replay the HAR file: the live server would now answer differently', async () => {
            const replay = await browser.newContext();
            const page = await replay.newPage();
            await page.routeFromHAR(harFile, { update: false, notFound: 'abort' });
            await page.goto(server.url);
            await expect(page.locator(harFixture.heading)).toHaveText('HAR fixture page');
            await expect(page.locator(harFixture.message)).toHaveText('Hello from the server (answer 1)');
            await replay.close();
        });
    } finally {
        await server.close();
    }
});

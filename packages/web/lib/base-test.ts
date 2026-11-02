import { createProfileTest } from '@packages/core/lib/base-test';
import { webFixtures, type WebFixtures } from './fixtures';

export * from '@packages/core/lib/base-test';
export const test = createProfileTest({ optional: true }).extend<WebFixtures>(webFixtures);

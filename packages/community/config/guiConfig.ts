import { runtimeEnvDefaults } from '../../../config/loadProfileData';

/** Shared GUI owner, used by both editions; no premium imports. */
export const guiConfig = runtimeEnvDefaults({
    GUI_TIMEOUT: 30000,
    HIGHLIGHT_TEST_OBJECT_ENABLED: false,
});

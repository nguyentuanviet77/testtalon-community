export const globalVariables = {
    get GUI_TIMEOUT(): number { return Number(process.env.GUI_TIMEOUT ?? '30000'); },
    get HIGHLIGHT_TEST_OBJECT_ENABLED(): boolean {
        return process.env.HIGHLIGHT_TEST_OBJECT_ENABLED === 'true';
    },
};

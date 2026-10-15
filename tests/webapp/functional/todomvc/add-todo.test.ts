import { test, expect } from '@core/lib/BaseTest';
import { todoMvc } from '@objectRepositories/GUI/todoMvcGUI.json';

test('a new todo appears in the list', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
    const appUrl = process.env.GUI_BASE_URL ?? '';
    test.skip(!appUrl, 'Set GUI_BASE_URL in the project profile, for example config/.env.qa.');
    await page.goto(appUrl);
    await webActions.waitForPageLoad();
    await webActions.highlightAndFill(page.locator(todoMvc.newTodoInput), 'Buy groceries');
    await page.keyboard.press('Enter');
    await expect(page.locator(todoMvc.todoItem)).toHaveText(['Buy groceries']);
});

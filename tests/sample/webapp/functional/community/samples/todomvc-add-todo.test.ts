import { test, expect } from '@packages/web/lib/base-test';
import { todoMvc } from '@objectRepositories/gui/todo-mvc-gui.json';

// Adds a todo on the public TodoMVC demo and checks that it appears in the list. The address is part of the test, so the project's
// baseURL and the qa profile do not affect it: it always opens the public site below.
const TODOMVC_URL = 'https://demo.playwright.dev/todomvc/#/';

test('a new todo appears in the list', { tag: ['@GUI', '@Online'] }, async ({ page, webActions }) => {
    await page.goto(TODOMVC_URL);
    await webActions.waitForPageLoad();
    await webActions.highlightAndFill(page.locator(todoMvc.newTodoInput), 'Buy groceries');
    await page.keyboard.press('Enter');
    await expect(page.locator(todoMvc.todoItem)).toHaveText(['Buy groceries']);
});

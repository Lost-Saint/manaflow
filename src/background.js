/**
 * Background script for the ManaFlow extension
 *
 * Handles browser action (toolbar button) clicks and sends messages to content scripts
 */

/**
 * Listens for browser action clicks and sends a message to the active tab
 *
 * When the user clicks the extension icon in the toolbar, this event triggers
 * and sends a message to the content script running in the active tab.
 */
browser.browserAction.onClicked.addListener(tab => {
  if (tab.id !== undefined) {
    browser.tabs.sendMessage(tab.id, { message: 'clicked_browser_action' });
  }
});

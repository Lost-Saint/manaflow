browser.browserAction.onClicked.addListener(tab => {
  if (tab.id !== undefined) {
    browser.tabs.sendMessage(tab.id, { message: 'clicked_browser_action' });
  }
});

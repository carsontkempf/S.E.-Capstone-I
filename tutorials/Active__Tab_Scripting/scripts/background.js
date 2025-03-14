chrome.runtime.onInstalled.addEventListener(() => {
    chrome.action.setBadgeText({
        text: "OFF",
    });
});
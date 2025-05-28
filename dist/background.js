"use strict";

const AUDIO_ACTIVE = "audioActive";
const SHOW_NOTIFICATION = "showNotification";
const AUDIO = "audio";
const COUNTER = "counter";
const ICON_URL = 'imgs/logo.png';
const TITLE = 'Prolific Studies';
const MESSAGE = 'A new study has been posted on Prolific!';

let lastTitle = {};

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        await setInitialValues();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await chrome.browserAction.setBadgeText({ text: "1" });
        await chrome.tabs.create({ url: "https://spin311.github.io/ProlificStudiesGoogle/", active: true });
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.status === "complete" && tab.url && tab.url.includes("app.prolific.com/")) {
        if (changeInfo.title && changeInfo.title !== lastTitle[tabId]) {
            lastTitle[tabId] = changeInfo.title;  // Update the last title
            console.log("Title changed. Doing stuff...");
            await sendNotification();
            await playAudioMessage(tabId);
            await updateCounter();
        }
    }
});

async function setInitialValues() {
    await Promise.all([
        chrome.storage.sync.set({ [AUDIO_ACTIVE]: true }),
        chrome.storage.sync.set({ [AUDIO]: "alert1.mp3" }),
        chrome.storage.sync.set({ [SHOW_NOTIFICATION]: true })
    ]);
}

async function sendNotification() {
    const result = await new Promise(resolve => chrome.storage.sync.get(SHOW_NOTIFICATION, resolve));
    if (!result[SHOW_NOTIFICATION]) {
        return;
    }
    console.log("sendNotification");
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL(ICON_URL),
        title: TITLE,
        message: MESSAGE
    }, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.log(`Notification Error: ${chrome.runtime.lastError.message}`);
        } else {
            console.log(`Notification created with ID: ${notificationId}`);
        }
    });
}

async function playAudioMessage(tabId) {
    const result = await new Promise(resolve => chrome.storage.sync.get(AUDIO_ACTIVE, resolve));
    if (result[AUDIO_ACTIVE]) {
        console.log("playAudioMessage");
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ["dist/playAlert.js"]
            });
        } catch (e) {
            console.log(e);
        }
    } else {
        console.log("audio is not active");
    }
}

async function updateBadge(counter) {
    await chrome.browserAction.setBadgeText({ text: counter.toString() });
    await chrome.browserAction.setBadgeBackgroundColor({ color: "#FF0000" });
}

async function updateCounter() {
    const result = await new Promise(resolve => chrome.storage.sync.get(COUNTER, resolve));
    let counter = result[COUNTER];
    if (counter === undefined) {
        counter = 1;
    } else {
        counter++;
    }
    await chrome.storage.sync.set({ [COUNTER]: counter });
    await updateBadge(counter);
}

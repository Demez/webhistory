// import { DB_VERSION, OnUpgradeNeeded } from "./core.js";


var DB_VERSION = 4;

// Set up the database tables if this has not already been done
function OnUpgradeNeeded(openRequest, e) {
    console.log('DEMEZ HISTORY: Database upgrade start');
    // Grab a reference to the opened database
    // let db = e.target.result;
    let db = openRequest.result;

    var oldData;

    if (e.oldVersion < DB_VERSION) {
        // doesn't work
        // oldData = GetAllHistory(openRequest, db);

        // const transaction = db.transaction(['demez_history_os'], 'readonly');
        db.deleteObjectStore("demez_history_os");
    }

    // Create an objectStore to store our notes in (basically like a single table)
    // including a auto-incrementing key
    const objectStore = db.createObjectStore('demez_history_os', { keyPath: 'id', autoIncrement: true });

    // Define what data items the objectStore will contain
    objectStore.createIndex('date', 'date', { unique: true });
    objectStore.createIndex('title', 'title', { unique: false });
    objectStore.createIndex('url', 'url', { unique: false });
    // objectStore.createIndex('favicon', 'favicon', { unique: false });

    // migrate old data over
    for (var i in oldData) {
        objectStore.add(oldData[i]);
    }

    console.log('DEMEZ HISTORY: Database setup complete');
}



// Adds a button to the toolbar to open the history viewer
browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({ "url": "/history.html" });
});


window.addEventListener('load', (event) => {
    console.log('page is fully loaded');
});


window.onload = function () {
    console.log('page is fully loaded - window.onload');
};


function AddItemToDatabase(db, historyItem) {
    console.log("DEMEZ HISTORY: background AddItemToDatabase");

    const newItem = {
        date: historyItem.timeStamp,  // TODO: convert to UTC or something
        title: historyItem.pageTitle,
        url: historyItem.address,
        favIcon: historyItem.favIcon,
    };

    // open a read/write db transaction, ready for adding the data
    const transaction = db.transaction(['demez_history_os'], 'readwrite');

    // call an object store that's already been added to the database
    const objectStore = transaction.objectStore('demez_history_os');

    // Make a request to add our newItem object to the object store
    const addRequest = objectStore.add(newItem);

    addRequest.addEventListener('success', () => {
        // Clear the form, ready for adding the next entry
        // titleInput.value = '';
        // urlInput.value = '';
        // timeInput.value = 0;
    });

    // Report on the success of the transaction completing, when everything is done
    transaction.addEventListener('complete', () => {
        console.log('Transaction completed: database modification finished.');

        // update the display of data to show the newly added item, by running displayData() again.
        // displayData();
    });

    transaction.addEventListener('error', () => console.log('Transaction not opened due to error'));
}


function TempPrintHistory(db) {
    console.log("DEMEZ HISTORY: AddItemToDatabaseShared");

    // open a read/write db transaction, ready for adding the data
    const transaction = db.transaction(['demez_history_os'], 'readonly');

    // call an object store that's already been added to the database
    const objectStore = transaction.objectStore('demez_history_os');

    const getAll = objectStore.getAll();

    getAll.addEventListener('success', () => {
        console.log("DEMEZ HISTORY: getAll.result.length: " + getAll.result.length);
        for (let i = 0; i < getAll.result.length; i++) {
            const record = getAll.result[i];

            console.log("DEMEZ HISTORY: id: " + record.id + " record: " + record.title);
        }
    });

    // Report on the success of the transaction completing, when everything is done
    transaction.addEventListener('complete', () => {
        console.log('Transaction completed: database read finished.');

        // update the display of data to show the newly added item, by running displayData() again.
        // displayData();
    });

    transaction.addEventListener('error', () => console.log('Transaction not opened due to error'));
}


function AddHistoryItem(historyItem) {
    console.log("DEMEZ HISTORY: Updating History File.....");

    // Create an instance of a db object for us to store the open database in
    let db;

    // Open our database; it is created if it doesn't already exist
    // (see the upgradeneeded handler below)
    // const openRequest = window.indexedDB.open('demez_history_db', 2);
    const openRequest = indexedDB.open('demez_history_db', DB_VERSION);

    console.log("DEMEZ HISTORY: got file storage");

    // error handler signifies that the database didn't open successfully
    openRequest.addEventListener('error', () => console.error('DEMEZ HISTORY: Database failed to open'));

    // success handler signifies that the database opened successfully
    openRequest.addEventListener('success', () => {
        console.log('DEMEZ HISTORY: Database opened successfully');

        // Store the opened database object in the db variable. This is used a lot below
        db = openRequest.result;

        AddItemToDatabase(db, historyItem);

        // TempPrintHistory(db);

        // Run the displayData() function to display the notes already in the IDB
        // displayData();
    });

    // Set up the database tables if this has not already been done
    openRequest.addEventListener('upgradeneeded', e => {
        // Grab a reference to the opened database
        db = e.target.result;
        
        OnUpgradeNeeded(openRequest, e);
    });

    // openRequest.addEventListener('submit', AddItemToDatabase);

    console.log("DEMEZ HISTORY: Updated History File");
}


async function OnWebNavCompleted(urlData) {
    console.log("DEMEZ HISTORY: OnWebNavCompleted");

    try {
        let tabInfo = await browser.tabs.get(urlData.tabId);
        console.log(tabInfo);

        let historyItem = {
            timeStamp: urlData.timeStamp,
            address: urlData.url.toString(),
            pageTitle: tabInfo.title,
            favIcon: tabInfo.favIconUrl,
        }
        
        AddHistoryItem(historyItem);
    }
    catch (error) {
        console.error(error);

        let historyItem = {
            timeStamp: urlData.timeStamp,
            address: urlData.url.toString(),
            pageTitle: urlData.url.toString(),
            favIcon: "",
        }
        
        AddHistoryItem(historyItem);
    }
}


browser.webNavigation.onCompleted.addListener(
    OnWebNavCompleted,
    { url: [{ schemes: ["http", "https"] }] }
);


function OnTabUpdated(tabId, changeInfo, tabInfo) {
    console.log("DEMEZ HISTORY: OnTabUpdated");
    
    console.log("Updated tab: " + tabId);
    console.log("Changed attributes: ");
    console.log(changeInfo);
    console.log("New tab Info: ");
    console.log(tabInfo);

    // AddHistoryItem(Date.now(), tabInfo.url, tabInfo.title);
}


// probably better to use this, so you can check if we just refreshed the page
// might not want those to be added to the history
// browser.tabs.onUpdated.addListener(OnTabUpdated);


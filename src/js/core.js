export var DB_VERSION = 4;


function GetAllHistory(openRequest, db) {
    const transaction = openRequest.transaction;

    // call an object store that's already been added to the database
    const objectStore = transaction.objectStore('demez_history_os');

    // Get everything in the store; request.result will be an array of all data in store
    const getAll = objectStore.getAll();

    // Create a table of items from the data previously read in from the database
    getAll.addEventListener('success', () => {
        return getAll.result;
    });

    // Report on the success of the transaction completing, when everything is done
    transaction.addEventListener('complete', () => {
        console.log('Transaction completed: database reading finished.');
    });

    transaction.addEventListener('error', () => console.log('Transaction not opened due to error'));
}


// Set up the database tables if this has not already been done
export function OnUpgradeNeeded(openRequest, e) {
    console.log('DEMEZ HISTORY: Database upgrade start');
    // Grab a reference to the opened database
    // let db = e.target.result;
    let db = openRequest.result;

    var oldData;

    if (e.oldVersion < DB_VERSION) {
        // doesn't work
        // oldData = GetAllHistory(openRequest, db);
        
        // const transaction = db.transaction(['demez_history_os'], 'readonly');
        // db.deleteObjectStore("demez_history_os");
    }

    // Create an objectStore to store our notes in (basically like a single table)
    // including a auto-incrementing key
    const objectStore = db.createObjectStore('demez_history_os', { keyPath: 'id', autoIncrement: true });

    // Define what data items the objectStore will contain
    objectStore.createIndex('date',    'date',    { unique: true });
    objectStore.createIndex('title',   'title',   { unique: false });
    objectStore.createIndex('url',     'url',     { unique: false });
    // objectStore.createIndex('favicon', 'favicon', { unique: false });

    // migrate old data over
    for (var i in oldData) {
        objectStore.add(oldData[i]);
    }
    
    console.log('DEMEZ HISTORY: Database setup complete');
}


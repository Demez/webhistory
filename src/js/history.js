import { DB_VERSION, OnUpgradeNeeded } from "./core.js";


function FormatTime(s) {
    // FORMAT: yyyy-MM-dd HH:MM:SS
    return (new Date(s)).toLocaleString("se-SE");
}


// TODO:
// - import button
// - export button
// - search box
// - pages
// - vivaldi style layout options


function PopulateTable(tableElem, result) {
    // Clear the table contents before populating it with our new data
    tableElem.innerHTML = '';

    const columnCount = 3;

    // create a header row
    const header = document.createElement('tr');
    header.innerHTML = '<th>URL</th><th>Title</th><th>Date</th>';
    tableElem.appendChild(header);

    // create a row for each record in the data
    // for (let i = 0; i < .result.length; i++) {
    for (let i = result.length - 1; i > -1; i--) {
        const record = result[i];

        const row = document.createElement('tr');
        /*row.innerHTML = `
<td>${FormatTime(record.date)}</td>
<td>${record.title}</td>
<td>${record.url}</td>

<td><img src="${record.favIcon}" />${record.title}</td>
`;*/

        // NOTE: url is first because it breaks if it's not first due to the css
        // eventually look into how to fix this
        const temp = `
        <td><a class="break-all" href="${record.url}" target="_blank">${record.url}</a></td>
        <td>${record.title}</td>
        <td>${FormatTime(record.date)}</td>
        `;

        var cell0 = row.insertCell(0);
        cell0.innerHTML = `<a class="break-all" href="${record.url}" target="_blank">${record.url}</a>`;

        var cell1 = row.insertCell(1);
        cell1.innerHTML = record.title;

        var cell2 = row.insertCell(2);
        cell2.innerHTML = FormatTime(record.date);

        const tableURL = '<td><a class="break-all" href="${record.url}" target="_blank">${record.url}</a></td>';
        const tableTitle = '<td>${record.title}</td>';
        const tableDate = '<td>${FormatTime(record.date)}</td>';

        // const parser = new DOMParser()
//
        // const parsed = parser.parseFromString(tableURL, `text/html`)
        // const tags = parsed.getElementsByTagName(`body`)

        // row.innerHTML = ``
        // row.innerHTML = ``
        // for (const tag of tags) {
        //     row.appendChild(tag)
        // }

        tableElem.appendChild(row);
    }
}


function LoadHistoryTableSuccess(db) {
    console.log("DEMEZ HISTORY: CreateTable");

    const tableElem = document.getElementById("history");

    // open a read/write db transaction, ready for adding the data
    const transaction = db.transaction(['demez_history_os'], 'readonly');

    // call an object store that's already been added to the database
    const objectStore = transaction.objectStore('demez_history_os');

    // Get everything in the store; request.result will be an array of all data in store
    const getAll = objectStore.getAll();

    // Create a table of items from the data previously read in from the database
    getAll.addEventListener('success', () => {
        console.log("DEMEZ HISTORY: getAll.result.length: " + getAll.result.length);
        PopulateTable(tableElem, getAll.result);
    });

    // Report on the success of the transaction completing, when everything is done
    transaction.addEventListener('complete', () => {
        console.log('Transaction completed: database modification finished.');
    });

    transaction.addEventListener('error', () => console.log('Transaction not opened due to error'));
}


function LoadHistoryTable()
{
    console.log("DEMEZ HISTORY: Loading History Table...");

    // Create an instance of a db object for us to store the open database in
    let db;
    
    // Open our database; it is created if it doesn't already exist
    // (see the upgradeneeded handler below)
    // const openRequest = window.indexedDB.open('demez_history_db', 2);
    const openRequest = indexedDB.open('demez_history_db', DB_VERSION);
    
    console.log("DEMEZ HISTORY: got file storage");

    // error handler signifies that the database didn't open successfully
    openRequest.addEventListener('error', () => console.error('DEMEZ HISTORY: Database failed to open'));
    
    openRequest.addEventListener('blocked', () => console.error('DEMEZ HISTORY: Database blocked'));

    // success handler signifies that the database opened successfully
    openRequest.addEventListener('success', () => {
        console.log('DEMEZ HISTORY: Database opened successfully');

        // Store the opened database object in the db variable. This is used a lot below
        db = openRequest.result;

        LoadHistoryTableSuccess(db);

        // Run the displayData() function to display the notes already in the IDB
        // displayData();
    });

    openRequest.addEventListener('submit', () => {
        console.log('DEMEZ HISTORY: Database opened successfully');

        // Store the opened database object in the db variable. This is used a lot below
        db = openRequest.result;

        CreateTable(db);

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
    
    console.log("DEMEZ HISTORY: uh");
}


LoadHistoryTable();



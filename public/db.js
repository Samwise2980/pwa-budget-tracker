
// TODO: open  indexedDB
const indexedDB =
window.indexedDB ||
window.mozIndexedDB ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.shimIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

// TODO: create an object store in the open db
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pending", {
    keyPath: "listID", autoIncrement: true
  });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

// TODO: log any indexedDB errors
request.onerror = function (event) {
  console.log(event);
};

// TODO: add code to saveRecord so that it accepts a record object for a
// transaction and saves it in the db. This function is called in index.js
// when the user creates a transaction while offline.
function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite");
    const pendingStore = transaction.objectStore("pending");
    pendingStore.add(record);
}

// TODO: add code so that any transactions stored in the db
// are sent to the backend if/when the user goes online
// Hint: learn about "navigator.onLine" and the "online" window event.
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readonly");
  const pendingStore = transaction.objectStore("pending");
  const getAll = pendingStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          const transaction = db.transaction(["pending"], "readwrite");
          const pendingStore = transaction.objectStore("pending");
          pendingStore.clear()
        });
    }
  };
}

window.addEventListener("online", checkDatabase);

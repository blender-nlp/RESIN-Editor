import { openDB } from "idb";

let db;

async function initializeDB() {
    db = await openDB("provenance-db", 1, {
        upgrade(db) {
            db.createObjectStore("images");
            db.createObjectStore("texts");
        },
    });
}

initializeDB().then(() => {
    console.log("Database is initialized!");
});
async function addImage(key, value) {
    if (!db) {
        await initializeDB();
    }
    await db.put("images", value, key);
}

async function getImage(key) {
    if (!db) {
        await initializeDB();
    }
    const blob = await db.get("images", key);
    console.log("blob: ", blob);

    if (blob !== undefined) {
        const url = URL.createObjectURL(blob);
        console.log("url: ", url);
        return url;
    }
    return null;
}

async function addText(key, value) {
    if (!db) {
        await initializeDB();
    }
    await db.put("texts", value, key);
}

async function getText(key) {
    if (!db) {
        await initializeDB();
    }
    return await db.get("texts", key);
}

export { addImage, getImage, addText, getText };

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://gatitoz:Lrdsc.01@cluster0.em4e3sg.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function saveSession(session) {
    try {
        await client.connect();
        const db = client.db("myApp");
        const collection = db.collection("sessions");
        await collection.updateOne({ id: "whatsappSession" }, { $set: { session } }, { upsert: true });
        console.log("Sessão do WhatsApp salva no banco de dados.");
    } finally {
        await client.close();
    }
}

async function loadSession() {
    try {
        await client.connect();
        const db = client.db("myApp");
        const collection = db.collection("sessions");
        const doc = await collection.findOne({ id: "whatsappSession" });
        return doc ? doc.session : null;
    } finally {
        await client.close();
    }
}

module.exports = { saveSession, loadSession };

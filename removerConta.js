const fs = require('fs');
const path = require('path');

const SESSIONS_FILE = path.join(__dirname, 'whatsapp-sessions.json');

function loadSessions() {
    if (fs.existsSync(SESSIONS_FILE)) {
        const sessionsJson = fs.readFileSync(SESSIONS_FILE);
        return JSON.parse(sessionsJson);
    }
    return {};
}

function saveSessions(sessions) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function removeWhatsAppAccount(accountName) {
    if (!accountName) {
        console.log("Por favor, insira o nome da conta como argumento.");
        process.exit(1);
    }

    let sessions = loadSessions();
    if (!sessions[accountName]) {
        console.log(`A conta ${accountName} não existe.`);
        process.exit(1);
    }

    delete sessions[accountName];
    saveSessions(sessions);
    console.log(`Conta ${accountName} removida com sucesso.`);
}

const accountName = process.argv[2]; // Pega o nome da conta a partir da linha de comando
removeWhatsAppAccount(accountName);

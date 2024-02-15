const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

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

async function addWhatsAppAccount(accountName) {
    if (!accountName) {
        console.log("Por favor, insira o nome da conta como argumento.");
        process.exit(1);
    }

    let sessions = loadSessions();
    if (sessions[accountName]) {
        console.log(`A conta ${accountName} já existe.`);
        return;
    }

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: accountName,
            dataPath: "./whatsapp-sessions"
        }),
        puppeteer: { headless: true },
    });

    client.on('qr', qr => {
        console.log(`QR Code para ${accountName}:`);
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log(`Cliente do WhatsApp para ${accountName} está pronto!`);
        sessions[accountName] = { ready: true };
        saveSessions(sessions);
        process.exit(0);
    });

    await client.initialize().catch(error => {
        console.error('Erro ao inicializar o cliente do WhatsApp:', error);
        process.exit(1);
    });
}

const accountName = process.argv[2]; // Pega o nome da conta a partir da linha de comando
addWhatsAppAccount(accountName);

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log("Iniciando script...");

const SESSIONS_FILE = path.join(__dirname, 'whatsapp-sessions.json');

function loadSessions() {
    console.log("Carregando sessões...");
    if (fs.existsSync(SESSIONS_FILE)) {
        console.log("Arquivo de sessões encontrado. Carregando...");
        const sessionsJson = fs.readFileSync(SESSIONS_FILE);
        const sessions = JSON.parse(sessionsJson);
        console.log("Sessões carregadas:", JSON.stringify(sessions, null, 2));
        return sessions;
    }
    console.log("Arquivo de sessões não encontrado. Retornando objeto vazio.");
    return {};
}

function saveSessions(sessions) {
    console.log("Salvando sessões...", JSON.stringify(sessions, null, 2));
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    console.log("Sessões salvas com sucesso.");
}

async function addWhatsAppAccount(accountName) {
    console.log("Adicionando conta do WhatsApp:", accountName);
    if (!accountName) {
        console.log("Por favor, insira o nome da conta como argumento.");
        return; // Alterado de process.exit(1) para return para evitar saída abrupta.
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
    });

    client.on('authenticated', () => {
        console.log(`Cliente do WhatsApp para ${accountName} autenticado.`);
    });

    client.on('auth_failure', msg => {
        console.error(`Falha na autenticação para ${accountName}:`, msg);
        process.exit(1);
    });

    console.log(`Iniciando a inicialização do cliente do WhatsApp para ${accountName}...`);
    try {
        await client.initialize();
        console.log(`Cliente do WhatsApp para ${accountName} inicializado com sucesso.`);
    } catch (error) {
        console.error('Erro ao inicializar o cliente do WhatsApp:', error);
        process.exit(1);
    }
}

const accountName = process.argv[2];
console.log("Nome da conta recebido na linha de comando:", accountName);

if (!accountName) {
    console.log("Nenhum nome de conta fornecido. Encerrando.");
    process.exit(1);
} else {
    addWhatsAppAccount(accountName).catch(error => {
        console.error('Erro durante a adição da conta do WhatsApp:', error);
        process.exit(1);
    });
}

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { createPipedriveActivity } = require('./pipedriveManager');
const processarMensagem = require('./mainHandler');

const SESSIONS_FILE = path.join(__dirname, 'whatsapp-sessions.json');
let whatsappClients = {};

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

async function initializeWhatsAppClient(accountName) {
    let sessions = loadSessions();

    const whatsappClient = new Client({
        authStrategy: new LocalAuth({
            clientId: accountName, // Isso garante que cada sessão seja única
            dataPath: "./whatsapp-sessions" // As sessões serão salvas em subdiretórios dentro deste diretório
        }),
        puppeteer: { headless: true },
    });
    whatsappClient.on('authenticated', () => {
        console.log(`Autenticação bem-sucedida para a conta ${accountName}.`);
    });
    
    whatsappClient.on('qr', qr => {
        qrcode.generate(qr, {small: true});
    });

    whatsappClient.on('ready', () => {
        console.log(`WhatsApp client for ${accountName} is ready!`);
        sessions[accountName] = { ready: true };
        saveSessions(sessions);
    });

    whatsappClient.on('message', async message => {
        console.log(`mensagem de ${message.from} para ${message.to}`);
        await processarMensagem.recebe(message, accountName);
    });

    whatsappClient.on('message_ack', async (message, ack) => {
        console.log(`mensagem de ${message.from} para ${message.to}`);
        console.log(message)
        //await processarMensagem.envia(message, accountName, ack);
    });

    await whatsappClient.initialize().catch(console.error);
    whatsappClients[accountName] = whatsappClient;
}

// Função para iniciar todos os clientes baseado nas sessões salvas
async function initializeAllWhatsAppClients() {
    const sessions = loadSessions();
    for (const accountName of Object.keys(sessions)) {
        await initializeWhatsAppClient(accountName);
    }
}

// Inicializa todos os clientes do WhatsApp ao iniciar o script
initializeAllWhatsAppClients().catch(console.error);

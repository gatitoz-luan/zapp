
const { createPipedriveActivity, uploadFileToPipedrive,findContactByPhone } = require('./pipedriveManager');
const fs = require('fs');
const path = require('path');


// Certifique-se de que o diretório 'media' exista ou crie-o com fs.mkdirSync('media', { recursive: true });

async function saveMedia(message) {
    if (!message.hasMedia) return null;

    const media = await message.downloadMedia();
    let extension;

    // Define um mimetype padrão para mensagens de voz ou extrai a extensão com base no mimetype
    if (message.type === 'ptt') {
        extension = 'ogg';
    } else if (media.mimetype) {
        extension = media.mimetype.split('/')[1];
    } else {
        throw new Error('Mimetype não disponível.');
    }

    // Verifica e cria o diretório 'media' se não existir
    const mediaDir = path.join(__dirname, 'media');
    if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
    }

    const filename = `media_${Date.now()}.${extension}`;
    const filepath = path.join(mediaDir, filename);
    fs.writeFileSync(filepath, Buffer.from(media.data, 'base64'));
    return filepath;
}


// Função principal para processar mensagens recebidas
async function recebe(message, accountName) {
    if (message.from.endsWith('@g.us')) {
        console.log('Mensagem de grupo ignorada.');
        return; // Ignora mensagens de grupo
    }

    const phoneNumber = message.from.replace(/\D/g, '');
    const contact = await message.getContact();
    const contactName = contact.pushname || contact.name || phoneNumber;
    const person = await findContactByPhone(phoneNumber);
    if (!person){
        return;
    }
    const person_id = person.id
    console.log('preson_id: ',person_id)

    if (message.type === 'chat') {
        console.log(`[${accountName}] Mensagem de texto recebida de ${contactName} (${phoneNumber}): ${message.body}`);
        await createPipedriveActivity(person_id,contactName, phoneNumber, message.body, accountName);
    } else if (message.hasMedia) {
        console.log(`[${accountName}] anexo de ${contactName} (${phoneNumber}): ${message.body}`);
        const filepath = await saveMedia(message);
        const fileUrl = await uploadFileToPipedrive(filepath, message.mimetype, person_id);
        await createPipedriveActivity(person_id,contactName, phoneNumber, `anexo: ${fileUrl.name} "${message.body}"`, accountName);
        fs.unlinkSync(filepath); // Remove o arquivo temporário
    }
}
// Função principal para processar mensagens recebidas
async function envia(message, accountName,ack) {
    if (message.from.endsWith('@g.us')) {
        console.log('Mensagem de grupo ignorada.');
        return; // Sai da função se for uma mensagem de grupo
    }
    if (ack > 2) {
        const phoneNumber = message.to.replace(/\D/g, '');
        console.log(`Mensagem enviada para ${phoneNumber} com status ack: ${ack}`);
        return;
    }
    if (ack==2){
        // Extrai apenas os números do identificador do remetente
        const phoneNumber = message.to.replace(/\D/g, '');

        // Obtém informações do contato
        const contact = await message.getContact();
        const contactName = contact.pushname || contact.name || message.from.replace(/\D/g, ''); // Usa pushname, se disponível, senão nome, ou "Desconhecido"
        const person = await findContactByPhone(phoneNumber);
        if (!person){
            return;
        }
        const person_id = person.id
        console.log('preson_id: ',person_id)


        // Aqui você pode integrar com Pipedrive ou realizar outras ações necessárias
        const noteContent = message.body.trim();
        
        if (message.type === 'chat') {
            console.log(`[${accountName}] Mensagem recebida de ${contactName} (${phoneNumber}): ${message.body}`);        await createPipedriveActivity(person_id,contactName, phoneNumber, message.body, accountName);
        } else if (message.hasMedia) {
            console.log(`[${accountName}] anexo de ${contactName} (${phoneNumber}): ${message.body}`);
            const filepath = await saveMedia(message);
            const fileUrl = await uploadFileToPipedrive(filepath, message.mimetype, person_id);
            await createPipedriveActivity(person_id,contactName, phoneNumber, `anexo: ${fileUrl.name} "${message.body}"`, accountName);
            fs.unlinkSync(filepath); // Remove o arquivo temporário
        }
}};


module.exports = { envia, recebe };

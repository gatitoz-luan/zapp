const axios = require('axios');
const PIPEDRIVE_API_TOKEN = '864e9967b09b7524c51a5de83cc3928ae7c1a88d'; // Use variáveis de ambiente
const FormData = require('form-data');
const fs = require('fs');

async function uploadFileToPipedrive(filepath, fileName, personId) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filepath), fileName);
    // Inclui o person_id na requisição
    if (personId) {
        formData.append('person_id', personId);
    }

    try {
        const response = await axios.post(
            `https://ligapi.pipedrive.com/api/v1/files?api_token=${PIPEDRIVE_API_TOKEN}`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    // O Content-Length pode ser necessário dependendo da implementação do server
                    // 'Content-Length': formData.getLengthSync()
                }
            }
        );
        if (response.data && response.data.data) {
            return response.data.data; // Retorna o objeto de dados da resposta
        }
    } catch (error) {
        console.error("Erro ao fazer upload do arquivo para o Pipedrive:", error);
        return null;
    }
}



async function findContactByPhone(phone) {
    try {
        const response = await axios.get(`https://ligapi.pipedrive.com/api/v1/persons/search?term=${phone}&fields=phone&api_token=${PIPEDRIVE_API_TOKEN}`);
        if (response.data.data.items.length > 0) {
            // Retorna o primeiro contato encontrado
            return response.data.data.items[0].item;
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar contato no Pipedrive:", error);
        return null;
    }
}


async function findTodaysWhatsAppActivity(personId) {
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    try {
        var url= `https://ligapi.pipedrive.com/api/v1/activities?api_token=${PIPEDRIVE_API_TOKEN}&type=whatsapp_&person_id=${personId}&add_time=${today}`
        const response = await axios.get(url);
        console.log(today,url,response)
        if (response.data.data && response.data.data.length > 0) {
            // Retorna a primeira atividade encontrada para simplicidade
            return response.data.data[0];
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar atividades WhatsApp no Pipedrive:", error);
        return null;
    }
}
async function createPipedriveActivity(person_id, contactName, phone, content, accountName, filePath = null) {
    
    if (!person_id) {
        console.log("Contato não encontrado no Pipedrive para o número:", phone);
        return;
    }



    // Obtém a data e o horário atuais
    const now = new Date();
    // Formata a data e o horário. Exemplo: '2024-02-15 12:34:56'
    // Ajuste o formato conforme necessário
    const formattedDateTime = now.toISOString().replace('T', ' ').substring(10, 19);

    const noteContent = `${formattedDateTime}->${contactName}: ${content}.`; 
    const activity = await findTodaysWhatsAppActivity(person_id);
    if (activity) {
        try {
            await axios.put(`https://ligapi.pipedrive.com/api/v1/activities/${activity.id}?api_token=${PIPEDRIVE_API_TOKEN}`, {
                note: `${activity.note}<br>${noteContent}`
            });
            console.log("Atividade WhatsApp atualizada no Pipedrive.");
        } catch (error) {
            console.error("Erro ao atualizar a atividade no Pipedrive:", error);
        }
    } else {
        try {
            await axios.post(`https://ligapi.pipedrive.com/api/v1/activities?api_token=${PIPEDRIVE_API_TOKEN}`, {
                subject: 'WhatsApp',
                type: 'whatsapp_',
                note: noteContent,
                person_id: person_id,
                done: 1
            });
            console.log("Nova atividade WhatsApp criada no Pipedrive.");
        } catch (error) {
            console.error("Erro ao criar nova atividade no Pipedrive:", error);
        }
    }
}
module.exports = { createPipedriveActivity, uploadFileToPipedrive, findContactByPhone };

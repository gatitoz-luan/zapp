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
        const lastEightDigits = phone.slice(-8);
        console.log('phone: ',lastEightDigits)
        const response = await axios.get(`https://ligapi.pipedrive.com/api/v1/persons/search?term=${lastEightDigits}&fields=phone&api_token=${PIPEDRIVE_API_TOKEN}`);
        if (response.data.data.items.length > 0) {
            return response.data.data.items[0].item;
        }console.log('não encontrou o contato ')
        return null;
    } catch (error) {
        console.error("Erro ao buscar contato no Pipedrive:", error);
        return null;
    }
}


async function findTodaysWhatsAppActivity(personId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ajusta para meia-noite
    const todayFormatted = today.toISOString().replace('T', ' ').substring(0, 19);

    const urlBase = `https://ligapi.pipedrive.com/api/v1/activities`;
    // Corrigindo a URL para usar & para concatenar parâmetros após o primeiro
    var url = `${urlBase}/collection?api_token=${PIPEDRIVE_API_TOKEN}&limit=500&type=whatsapp_&since=${todayFormatted}`;

    try {
        const response = await axios.get(url);
        console.log(todayFormatted, url);
        
        // Verifica se há dados e se são não vazios
        if (response.data.data && response.data.data.length > 0) {
            // Procura por uma atividade que corresponda ao person_id
            const activity = response.data.data.find(activity => activity.person_id === personId);
            
            if (activity) {
                // Se encontrar uma atividade com o mesmo person_id, retorna esta atividade
                return activity;
            } 
        } 
        return null; 

    } catch (error) {
        console.error("Erro ao buscar ou criar atividades WhatsApp no Pipedrive:", error);
        return null;
    }
}

async function createPipedriveActivity(person_id, contactName, phone, content, accountName, filePath = null) {
    
    if (!person_id) {
        console.log("Contato não encontrado no Pipedrive para o número:", phone);
        return;
    }
    // Obtém a data e hora atuais
    const now = new Date();

    // Ajusta para o fuso horário desejado (-3 horas)
    // Nota: getTime retorna milissegundos, então você precisa converter 3 horas em milissegundos (3 * 60 * 60 * 1000)
    const timezoneOffset = 3 * 60 * 60 * 1000;
    const adjustedTime = new Date(now.getTime() - timezoneOffset);

    // Formata a data e hora ajustada para o formato desejado
    // A substring estava incorretamente começando do índice 10; ajustado para começar do início
    const formattedDateTime = adjustedTime.toISOString().replace('T', ' ').substring(10, 19);

    const noteContent = `${formattedDateTime} -> ${contactName}: ${content}.`;
    const activity = await findTodaysWhatsAppActivity(person_id);
    if (activity) {
        try {
            const getActivityResponse = await axios.get(`https://ligapi.pipedrive.com/api/v1/activities/${activity.id}?api_token=${PIPEDRIVE_API_TOKEN}`);
            const dataActivity = getActivityResponse.data.data;
            const updatedNoteContent = dataActivity.note ? `${dataActivity.note}<br><p>${noteContent}</p>` : noteContent;

            await axios.put(`https://ligapi.pipedrive.com/api/v1/activities/${dataActivity.id}?api_token=${PIPEDRIVE_API_TOKEN}`, {
                note: updatedNoteContent
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

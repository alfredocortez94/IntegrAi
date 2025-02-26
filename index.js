const venom = require('venom-bot');
const axios = require('axios');

const startTime = Date.now();

venom.create({
  session: 'my-session',
  headless: true,
  useChrome: true,
  debug: false,
  logQR: true,
  waitForLogin: true,
  waitForLoginTimeout: 60000,
  autoClose: false,
  disableSpins: true,
  browserArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-blink-features=AutomationControlled',
  ],
})
  .then((client) => {
    const loadTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Bot iniciado em ${loadTime} segundos.`);
    start(client);
  })
  .catch((err) => console.error('❌ Erro ao iniciar o Venom-Bot:', err));

function start(client) {
  console.log('🚀 Bot está rodando!');

  // Fluxo único do onMessage
  client.onMessage(async (message) => {
    console.log('📩 Mensagem recebida:', message.body);  // Aqui você já tem um log da mensagem
    
    // Enviar para o n8n (se necessário)
    try {
      await axios.post('http://localhost:5678/webhook-test/eff6b1ee-e5e0-4e39-9af5-784b77c94552', {
        sender: message.from,
        message: message.body,
      });
      console.log('✅ Mensagem enviada para o n8n com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem para o n8n:', error.message);
    }

    // Processamento de mensagens
    const text = message.body.trim().toLowerCase();  // Garantir que a comparação seja consistente
    console.log("📩 Comando recebido:", text);  // Log do comando recebido

    // Respostas padrão
    if (['olá', 'oi', 'boa noite', 'bom dia', 'boa tarde'].includes(text)) {
      console.log('✅ Resposta enviada para: ', message.from);
      client.sendText(message.from, 'Olá! Como posso ajudá-lo hoje?');
    } else if (text.includes('criar reunião')) {
      const reply = '📅 Claro! Para agendar uma reunião, forneça as seguintes informações:\n\n📆 Data:\n📍 Local:\n⏰ Horário:\n📝 Assunto:';
      client.sendText(message.from, reply);
      console.log('✅ Comando "Criar reunião" reconhecido');
    } else if (text.includes('listar reuniões')) {
      client.sendText(message.from, '🔍 Buscando reuniões agendadas... Aguarde!');
      console.log('✅ Comando "Listar reuniões" reconhecido');
      await axios.post('http://localhost:5678/webhook/listar-reunioes', { sender: message.from });
    } else if (text.startsWith('cancelar reunião')) {
      const id = text.split(' ')[2];
      if (id) {
        client.sendText(message.from, `⏳ Cancelando reunião ${id}...`);
        console.log(`✅ Comando "Cancelar reunião" reconhecido para ID: ${id}`);
        await axios.post('http://localhost:5678/webhook/cancelar-reuniao', { id });
      } else {
        client.sendText(message.from, '❌ Por favor, informe o ID da reunião a ser cancelada.');
      }
    } else if (text.startsWith('editar reunião')) {
      const id = text.split(' ')[2];
      if (id) {
        client.sendText(message.from, `✏️ Para editar reunião ${id}, envie os novos detalhes.`);
        console.log(`✅ Comando "Editar reunião" reconhecido para ID: ${id}`);
      } else {
        client.sendText(message.from, '❌ Informe o ID da reunião que deseja editar.');
      }
    } else if (text.includes('status')) {
      client.sendText(message.from, '✅ O bot está ativo e conectado ao WhatsApp!');
      console.log('✅ Comando "Status" reconhecido');
    }

    // Enviar mensagem de teste para o número fixo
    if (message.body.toLowerCase().includes('enviar teste')) {
      console.log('📩 Enviando mensagem de teste...');
      client.sendText('5586994214736', 'Mensagem de teste enviada do bot!')
        .then(response => {
          console.log('Mensagem enviada com sucesso:', response);
        })
        .catch(error => {
          console.error('Erro ao enviar mensagem:', error);
        });
    }
  });

  setInterval(async () => {
    console.log('🔄 Verificando conexão com WhatsApp Web...');
    const isConnected = await client.isConnected();
    if (!isConnected) {
      console.log('⚠️ Conexão perdida. Tentando reconectar...');
      await client.refresh();
    }
  }, 60000);
}

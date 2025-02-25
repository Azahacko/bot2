const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

// Chargement des règles
let rules = [];
try {
    const data = fs.readFileSync('rules.json', 'utf8');
    rules = JSON.parse(data).rules;
} catch (error) {
    console.error("⚠️ Erreur lors du chargement des règles :", error);
}

// ID du groupe
const groupId = "120363282443673237@g.us"; // Ton ID de groupe

client.on('qr', (qr) => {
    console.log("📌 Scan ce QR Code avec WhatsApp Web :");
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ Bot connecté avec succès !');

    try {
        const group = await client.getChatById(groupId);
        console.log(`🔹 Surveillance activée pour le groupe : ${group.name}`);

        // Récupérer la liste des membres du groupe
        const participants = await group.participants;
        
        // Saluer chaque membre du groupe
        participants.forEach(participant => {
            group.sendMessage(`Salut @${participant.id.user}, bienvenue dans le groupe !`);
        });
    } catch (err) {
        console.error("❌ Erreur : Impossible de récupérer le groupe. Vérifie l'ID !");
    }
});

client.on('message', async (message) => {
    // Vérifier si le message vient du groupe spécifié
    if (message.from === groupId) {
        console.log(`📩 Message reçu dans le groupe ${message.from} de ${message.author || message.from} : ${message.body}`);

        // Vérification si le message est une commande admin (ex: !add-rule mot_interdit)
        if (message.body.startsWith('!add-rule ')) {
            const newRule = message.body.replace('!add-rule ', '').trim();
            if (newRule) {
                rules.push(newRule);
                fs.writeFileSync('rules.json', JSON.stringify({ rules }, null, 2));
                message.reply(`✅ Nouvelle règle ajoutée : ${newRule}`);
                console.log(`📜 Nouvelle règle ajoutée : ${newRule}`);
            }
            return;
        }

        // Vérifier si le message contient une règle interdite
        const violatedRule = rules.find(rule => message.body.toLowerCase().includes(rule.toLowerCase()));

        if (violatedRule) {
            console.log(`🚨 Règle violée : ${violatedRule}`);

            try {
                const group = await client.getChatById(groupId);
                const participants = await group.participants;

                // Vérifier si l'expéditeur est un admin
                const sender = participants.find(p => p.id._serialized === message.author);
                if (sender && sender.isAdmin) {
                    console.log("⚠️ Un admin a enfreint une règle, mais il ne sera pas banni.");
                    return;
                }

                await group.removeParticipants([message.author]);
                console.log(`❌ ${message.author} a été banni pour non-respect des règles.`);
            } catch (err) {
                console.error("⚠️ Erreur lors de la suppression du membre :", err);
            }
        }
    }
});

client.initialize();

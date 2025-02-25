const nomCmds = 'other-command';
const desc = 'Description de la commande autre.';
const alias = ['!autre-commande'];

const execute = async (client, message, args) => {
    await message.reply('Voici une réponse à votre commande autre.');
};

module.exports = { nomCmds, desc, alias, execute };


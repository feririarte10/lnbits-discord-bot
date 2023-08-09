const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);
const { formatter } = require("../utils/helperFormatter.js");

/*
This command will show the balance of the mentioned user
*/

class Balance extends Command {
  constructor() {
    super();
    this.name = `balance`;
    this.description = `Devuelve el saldo de tu billetera.`;
    this.options = [];
  }

  async execute(Interaction) {
    await Interaction.deferReply({ ephemeral: true });
    const um = new UserManager();
    try {
      const userWallet = await um.getUserWallet(Interaction.user.id);
      if (userWallet.adminkey) {
        const uw = new UserWallet(userWallet.adminkey);
        try {
          const userWalletDetails = await uw.getWalletDetails();

          const walletUrl = `${process.env.LNBITS_HOST}/wallet?usr=${userWallet.user}`;

          const sats = userWalletDetails.balance / 1000;
          // const btc = (sats / 100000000).toFixed(8).replace(/\.?0+$/, ``);

          const row = new Discord.MessageActionRow().addComponents([
            new Discord.MessageButton({
              label: `Ir a mi billetera`,
              emoji: { name: `💰` },
              style: `LINK`,
              url: `${walletUrl}`,
            }),
          ]);

          Interaction.editReply({
            content: `Balance: ${formatter(0, 2).format(sats)} satoshis`,
            ephemeral: true,
            components: [row],
          });
        } catch (err) {
          console.log(err);
        }
      } else {
        Interaction.editReply({
          content: `No tienes una billetera`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Balance;

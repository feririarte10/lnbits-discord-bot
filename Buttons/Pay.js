const Discord = require(`discord.js`);
const Button = require(`./Button.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require("../lnbitsAPI/User.js");

/*
This command will pay a LNurl
*/

class Pay extends Button {
  constructor() {
    super();
    this.name = `pay`;
    this.description = `Pay invoice.`;
    this.options = [];
  }

  async execute(Interaction) {
    console.log(`button click by ${Interaction.user.id}`);

    try {
      const payUrl = Interaction.message.embeds[0].fields.find(
        (field) => field.name === "Solicitud de pago"
      );

      const amountOnSats = Interaction.message.embeds[0].fields.find(
        (field) => field.name === "monto (sats)"
      );

      if (payUrl) {
        const u = new UserManager();
        const user = await u.getOrCreateWallet(
          Interaction.user.username,
          Interaction.user.id
        );

        const uw = new UserWallet(user.adminkey);

        const userWalletDetails = await uw.getWalletDetails();
        const satsBalance = userWalletDetails.balance / 1000;

        if (satsBalance < amountOnSats.value) {
          Interaction.reply({
            content: `No tienes balance suficiente para pagar esta factura. \nTu balance: ${satsBalance} - Requerido: ${amountOnSats.value}`,
            ephemeral: true,
          });
        } else {
          const payment = await uw.payInvoice(payUrl.value);

          if (payment) {
            const row = new Discord.MessageActionRow().addComponents([
              new Discord.MessageButton({
                custom_id: `pay`,
                label: `Pagada por @${Interaction.user.username}`,
                emoji: { name: `💸` },
                style: `SECONDARY`,
                disabled: true,
              }),
            ]);

            Interaction.update({ components: [row] });
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Pay;

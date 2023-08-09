const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);

/*
This command will show the balance of the mentioned user
*/

class Donate extends Command {
  constructor() {
    super();
    this.name = `donate`;
    this.description = `Realiza donaciones al pozo de la crypta.`;
    this.options = [
      {
        name: `amount`,
        type: `INTEGER`,
        description: `La cantidad de satoshis a donar`,
        required: true,
      },
    ];
  }

  async execute(Interaction) {
    await Interaction.deferReply();
    const um = new UserManager();
    try {
      const userWallet = await um.getUserWallet(Interaction.user.id);
      if (userWallet.adminkey) {
        const uw = new UserWallet(userWallet.adminkey);
        try {
          const userWalletDetails = await uw.getWalletDetails();
          const satsBalance = userWalletDetails.balance / 1000;

          const amount = Interaction.options.get(`amount`);

          if (amount.value <= 0) {
            Interaction.editReply({
              content: `No puedes usar números negativos`,
              ephemeral: true,
            });
            return;
          }

          if (satsBalance < amount.value) {
            Interaction.editReply({
              content: `No tienes balance suficiente para pagar esta factura. \nTu balance: ${satsBalance} - Requerido: ${amount.value}`,
              ephemeral: true,
            });
            return;
          }

          try {
            const outgoingInvoice = await uw.createOutgoingInvoice(
              process.env.POOL_ADDRESS,
              amount.value
            );

            if (outgoingInvoice && outgoingInvoice.invoice) {
              const payment = await uw.payInvoice(outgoingInvoice.invoice);

              if (payment) {
                Interaction.editReply({
                  content: `@${Interaction.user.username} ha donado ${amount.value} satoshis al pozo!`,
                });
                return;
              }
            }
          } catch (err) {
            console.log(err);
            Interaction.editReply({
              content: `Ocurrió un error`,
              ephemeral: true,
            });
            return;
          }
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

module.exports = Donate;

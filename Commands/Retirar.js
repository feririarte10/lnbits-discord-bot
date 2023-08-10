const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);

class Retirar extends Command {
  constructor() {
    super();
    this.name = `retirar`;
    this.description = `Retira satoshis a una cuenta externa a discord`;
    this.options = [
      {
        name: `address`,
        type: `STRING`,
        description: `dirección de lightning network`,
        required: true,
      },
      {
        name: `monto`,
        type: `INTEGER`,
        description: `El monto en satoshis que deseas enviar`,
        required: true,
      },
    ];
  }

  async execute(Interaction) {
    await Interaction.deferReply({ ephemeral: true });
    const um = new UserManager();

    try {
      const userWallet = await um.getUserWallet(Interaction.user.id);

      if (userWallet.adminkey) {
        const uw = new UserWallet(userWallet.adminkey);
        try {
          const address = Interaction.options.get(`address`).value;
          const amount = Number(Interaction.options.get(`monto`).value);

          if (amount <= 0) {
            Interaction.reply({
              content: `No puedes usar números negativos`,
              ephemeral: true,
            });
            return;
          }

          const senderWalletDetails = await uw.getWalletDetails();
          if (senderWalletDetails.balance / 1000 - amount < 0) {
            Interaction.editReply({
              content: `No tienes suficiente balance en tu billetera.`,
              ephemeral: true,
            });
            return;
          }

          const invoice = await uw.createOutgoingInvoice(address, amount);
          if (invoice && invoice.invoice) {
            const payment = await uw.payInvoice(invoice.invoice);

            if (payment) {
              Interaction.editReply({
                content: `Enviaste ${amount} satoshis a ${address} desde tu billetera`,
                ephemeral: true,
              });
            }
          }
        } catch (err) {
          Interaction.editReply({
            content: `Ocurrió un error`,
            ephemeral: true,
          });
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
      Interaction.editReply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
    }
  }
}

module.exports = Retirar;

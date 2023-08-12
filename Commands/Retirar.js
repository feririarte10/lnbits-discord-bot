const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);
const { validateAmountAndBalance } = require("../utils/helperFunctions.js");

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
    const um = new UserManager();

    try {
      const userWallet = await um.getUserWallet(Interaction.user.id);

      if (userWallet.adminkey) {
        const uw = new UserWallet(userWallet.adminkey);
        const address = Interaction.options.get(`address`).value;
        const amount = Number(Interaction.options.get(`monto`).value);
        const senderWalletDetails = await uw.getWalletDetails();

        const isValidAmount = validateAmountAndBalance(
          Interaction,
          amount,
          senderWalletDetails.balance
        );

        try {
          if (isValidAmount) {
            const invoice = await uw.createOutgoingInvoice(address, amount);
            if (invoice && invoice.invoice) {
              const payment = await uw.payInvoice(invoice.invoice);

              if (payment) {
                Interaction.reply({
                  content: `Enviaste ${amount} satoshis a ${address} desde tu billetera`,
                  ephemeral: true,
                });
              }
            }
          }
        } catch (err) {
          Interaction.reply({
            content: `Ocurrió un error`,
            ephemeral: true,
          });
          console.log(err);
        }
      } else {
        Interaction.reply({
          content: `No tienes una billetera`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.log(err);
      Interaction.reply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
    }
  }
}

module.exports = Retirar;

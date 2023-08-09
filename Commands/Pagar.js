const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);

class Pagar extends Command {
  constructor() {
    super();
    this.name = `pagar`;
    this.description = `Paga una factura de lightning network`;
    this.options = [
      {
        name: `lnurl`,
        type: `STRING`,
        description: `LNURL de la factura que quieres pagar`,
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
          const payUrl = Interaction.options.get(`lnurl`).value;

          if (payUrl) {
            const payment = await uw.payInvoice(payUrl);

            if (payment)
              Interaction.editReply({
                content: `Pagaste la factura ${payUrl}`,
                ephemeral: true,
              });
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

module.exports = Pagar;

const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);
const { updateUserRank } = require("../database/DonateRank.js");
const { validateAmountAndBalance } = require("../utils/helperFunctions.js");

class Zap extends Command {
  constructor() {
    super();
    this.name = `zap`;
    this.description = `Regala sats a un usuario en discord`;
    this.options = [
      {
        name: `user`,
        type: `USER`,
        description: `Usuario a zappear`,
        required: true,
      },
      {
        name: `monto`,
        type: `INTEGER`,
        description: `La cantidad de satoshis a transferir`,
        required: true,
      },
      {
        name: `message`,
        type: `STRING`,
        description: `Un mensaje de la transferencia.`,
        required: false,
      },
    ];
  }

  async execute(Interaction) {
    const sender = Interaction;
    const receiver = Interaction.options.get(`user`);
    const amount = Interaction.options.get(`monto`);
    const message = Interaction.options.get(`message`)
      ? Interaction.options.get(`message`)
      : { value: `Envío de sats vía La Crypta` };

    if (amount.value <= 0) {
      Interaction.reply({
        content: `No se permiten saldos negativos`,
        ephemeral: true,
      });
      return;
    }

    const sats = amount.value;
    const senderData = await Interaction.guild.members.fetch(sender.user.id);
    const receiverData = await Interaction.guild.members.fetch(
      receiver.user.id
    );

    const _ = new UserManager();
    const senderWalletData = await _.getOrCreateWallet(
      sender.user.username,
      sender.user.id
    );
    const receiverWalletData = await _.getOrCreateWallet(
      receiverData.user.username,
      receiver.user.id
    );

    if (!senderWalletData.id) {
      Interaction.reply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
      return;
    }
    const senderWallet = new UserWallet(senderWalletData.adminkey);
    const senderWalletDetails = await senderWallet.getWalletDetails();
    const receiverWallet = new UserWallet(receiverWalletData.adminkey);

    const isValidAmount = validateAmountAndBalance(
      Interaction,
      Number(sats),
      senderWalletDetails.balance
    );

    if (isValidAmount) {
      try {
        // await Interaction.deferReply();
        const invoiceDetails = await receiverWallet.createInvote(
          sats,
          message.value
        );

        const invoicePaymentDetails = await senderWallet.payInvoice(
          invoiceDetails.payment_request
        );

        if (invoicePaymentDetails) {
          await updateUserRank(Interaction.user.id, "comunidad", sats);

          await Interaction.reply({
            content: `${senderData.toString()} envió ${sats} satoshis a ${receiverData.toString()}`,
          });
        }
      } catch (err) {
        console.log(err);
        await Interaction.reply({
          content: `Ocurrió un error`,
          ephemeral: true,
        });
      }
    }
  }
}

module.exports = Zap;

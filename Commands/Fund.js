const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);
const QRCode = require(`qrcode`);

/*
This command will create an invoice for a user. 
Provides an embed for QR scanning
*/

class Fund extends Command {
  constructor() {
    super();
    this.name = `fund`;
    this.description = `Fondea tu cuenta de lightning network.`;
    this.options = [
      {
        name: `amount`,
        type: `INTEGER`,
        description: `La cantidad de satoshis a pagar en la factura.`,
        required: true,
      },
    ];
  }

  async execute(Interaction) {
    await Interaction.deferReply({ ephemeral: true });
    const amount = Interaction.options.get(`amount`);
    let member;

    if (amount.value <= 0) {
      Interaction.reply({
        content: `No se permiten saldos negativos`,
        ephemeral: true,
      });
      return;
    }

    try {
      member = await Interaction.guild.members.fetch(Interaction.user.id);
    } catch (err) {
      console.log(err);
    }

    try {
      const um = new UserManager();
      const userWallet = await um.getUserWallet(member.user.id);

      const uw = new UserWallet(userWallet.adminkey);
      const invoiceDetails = await uw.createInvote(
        amount.value,
        `Recargar ${amount.value} sats a la billetera de discord del usuario ${member.user.username}`
      );

      const qrData = await QRCode.toDataURL(invoiceDetails.payment_request);
      const buffer = new Buffer.from(qrData.split(`,`)[1], `base64`);
      const file = new Discord.MessageAttachment(buffer, `image.png`);
      const embed = new Discord.MessageEmbed()
        .setImage(`attachment://image.png`)
        .addField(`Payment Request`, `${invoiceDetails.payment_request}`, true)
        .addField(`amount`, `${amount.value}`, false);

      Interaction.editReply({
        embeds: [embed],
        files: [file],
        ephemeral: true,
      });
    } catch (err) {
      console.log(err);
      Interaction.reply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
      return;
    }
  }
}

module.exports = Fund;

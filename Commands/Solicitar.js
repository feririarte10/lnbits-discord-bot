const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);
const QRCode = require(`qrcode`);
const { AuthorConfig } = require("../utils/helperConfig.js");

/*
This command will create an invoice for a user. 
Provides an embed for QR scanning
*/

class Solicitar extends Command {
  constructor() {
    super();
    this.name = `solicitar`;
    this.description = `Solicitar que te paguen una factura`;
    this.options = [
      {
        name: `monto`,
        type: `INTEGER`,
        description: `La cantidad de satoshis a pagar en la factura`,
        required: true,
      },
      {
        name: `descripcion`,
        type: `STRING`,
        description: `La descripción de la factura`,
        required: false,
      },
    ];
  }

  async execute(Interaction) {
    const amount = Interaction.options.get(`monto`);
    const description = Interaction.options.get(`descripcion`);
    let member;

    if (amount.value <= 0) {
      Interaction.reply({
        content: `No se permiten saldos negativos`,
        ephemeral: true,
      });
      return;
    }

    await Interaction.deferReply();
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
        description ? description.value : ""
      );

      const embed = new Discord.MessageEmbed()
        .setAuthor(AuthorConfig)
        .addField(
          `Solicitud de pago`,
          `${invoiceDetails.payment_request}`,
          true
        )
        .addField(`monto (sats)`, `${amount.value}`, false);

      const row = new Discord.MessageActionRow().addComponents([
        new Discord.MessageButton({
          custom_id: `pay`,
          label: `Pagar factura`,
          emoji: { name: `💸` },
          style: `SECONDARY`,
        }),
      ]);

      Interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Solicitar;

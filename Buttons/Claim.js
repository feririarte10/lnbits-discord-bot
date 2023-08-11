const Discord = require(`discord.js`);
const Button = require(`./Button.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const LNURL = require(`../lnbitsAPI/LNURLw`);
const { updateUserRank } = require("../database/DonateRank.js");

/*
This command will claim a LNurl
*/

class Claim extends Button {
  constructor() {
    super();
    this.name = `claim`;
    this.description = `Claims a LNURL.`;
    this.options = [];
  }

  async execute(Interaction) {
    const content = Interaction.message.content;
    console.log(`button click by ${Interaction.user.id}`);
    console.log(`want to pay ${content}`);

    const subStr = content.indexOf(">");
    let senderUserId = subStr !== -1 ? content.substring(2, subStr) : "";

    if (senderUserId === Interaction.user.id) {
      Interaction.reply({
        content: "No puedes reclamar tu propia factura",
        ephemeral: true,
      });

      return;
    }

    const payUrl = content.split(`LNURL: `)[1].replace(/`/g, ``);

    const u = new UserManager();
    const user = await u.getOrCreateWallet(
      Interaction.user.username,
      Interaction.user.id
    );
    const lnurl = new LNURL(user.adminkey);
    const lnurlParts = await lnurl.scanLNURL(payUrl);
    const redeemInvoice = await lnurl.doCallback(lnurlParts);

    const row = new Discord.MessageActionRow().addComponents([
      new Discord.MessageButton({
        custom_id: `claim`,
        label: `Reclamado por @${Interaction.user.username}`,
        emoji: { name: `💸` },
        style: `SECONDARY`,
        disabled: true,
      }),
    ]);

    if (lnurlParts) {
      const sats = lnurlParts.maxWithdrawable / 1000;
      if (senderUserId && sats)
        await updateUserRank(senderUserId, "comunidad", sats);
    }

    await Interaction.update({ components: [row] });
  }
}

module.exports = Claim;

const Discord = require(`discord.js`);
const Button = require(`./Button.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const LNURL = require(`../lnbitsAPI/LNURLw`);
const { updateUserRank } = require("../database/DonateRank.js");
const { getFaucet, updateFaucet } = require("../database/FaucetService.js");
const LNURLw = require("../lnbitsAPI/LNURLw");
const { AuthorConfig } = require("../utils/helperConfig.js");

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
    const footerContent = Interaction.message.embeds[0]?.footer?.text;
    const faucetSubStr = footerContent ? footerContent.indexOf(" ") : -1;

    const faucetId =
      faucetSubStr !== -1
        ? footerContent.substring(faucetSubStr + 1, footerContent.length)
        : false;

    console.log(`button click by ${Interaction.user.id}`);
    console.log(`want to pay ${faucetId}`);

    if (faucetId) {
      const faucet = await getFaucet(faucetId);

      if (faucet && faucet.discord_id === Interaction.user.id) {
        Interaction.reply({
          content: "No puedes reclamar tu propio faucet",
          ephemeral: true,
        });
        return;
      } else {
        if (faucet && !faucet.claimers_ids.includes(Interaction.user.id)) {
          try {
            const um = new UserManager();
            const userWallet = await um.getOrCreateWallet(
              Interaction.user.username,
              Interaction.user.id
            );

            const lnurlw = new LNURLw(userWallet.adminkey);
            const withdrawLink = await lnurlw.getWithdrawLink(
              faucet.withdraw_id,
              faucet.discord_id
            );

            if (withdrawLink && withdrawLink.uses > withdrawLink.used) {
              const lnurl = new LNURL(userWallet.adminkey);
              const lnurlParts = await lnurl.scanLNURL(withdrawLink.lnurl);
              const redeemInvoice = await lnurl.doCallback(lnurlParts);

              if (lnurlParts) {
                const sats = lnurlParts.maxWithdrawable / 1000;
                const content = Interaction.message.embeds[0].fields[0].value;

                const subStr = content.indexOf(">");

                let senderUserId =
                  subStr !== -1 ? content.substring(2, subStr) : "";

                if (senderUserId && sats)
                  await updateUserRank(senderUserId, "comunidad", sats);
              }

              if (redeemInvoice) {
                const fieldInfo = Interaction.message.embeds[0].fields[0];
                const newUsed = withdrawLink.used + 1;

                await updateFaucet(faucetId, Interaction.user.id);

                const embed = new Discord.MessageEmbed()
                  .setAuthor(AuthorConfig)
                  .addFields([
                    fieldInfo,
                    {
                      name: `Restantes: ${
                        withdrawLink.max_withdrawable *
                        (withdrawLink.uses - newUsed)
                      }/${
                        withdrawLink.max_withdrawable * withdrawLink.uses
                      } sats`,
                      value: `${":white_check_mark:".repeat(newUsed)}${
                        withdrawLink.uses - newUsed > 0
                          ? ":x:".repeat(withdrawLink.uses - newUsed)
                          : ""
                      } \n\n`,
                    },
                  ])
                  .setFooter({
                    text: `Identificador: ${faucetId}`,
                  });

                const disabledFaucet = withdrawLink.uses <= newUsed;
                const row = new Discord.MessageActionRow().addComponents([
                  new Discord.MessageButton({
                    custom_id: `claim`,
                    label: `Reclamar`,
                    emoji: { name: `💸` },
                    style: `SECONDARY`,
                    disabled: disabledFaucet,
                  }),
                ]);

                Interaction.update({
                  embeds: [embed],
                  components: [row],
                });
              }
            } else {
              Interaction.reply({
                content: "El faucet ya fue reclamado en su totalidad.",
                ephemeral: true,
              });
              return;
            }
          } catch (err) {
            Interaction.reply({
              content:
                "Ocurrió un error al reclamar la factura. \nEl faucet fue reclamado en su totalidad o el usuario que está regalando los fondos se ha quedado sin saldo suficiente para entregarte el premio.",
              ephemeral: true,
            });
            console.log(err);
          }
        } else {
          Interaction.reply({
            content: "Solo puedes reclamar el premio una vez",
            ephemeral: true,
          });
          return;
        }
      }
    }
  }
}

module.exports = Claim;

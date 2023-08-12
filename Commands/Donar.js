const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const UserWallet = require(`../lnbitsAPI/User.js`);
const { formatter } = require("../utils/helperFormatter.js");
const { updateUserRank } = require("../database/DonateRank.js");
const { AuthorConfig } = require("../utils/helperConfig.js");
const { validateAmountAndBalance } = require("../utils/helperFunctions.js");

/*
This command will show the balance of the mentioned user
*/

class Donar extends Command {
  constructor() {
    super();
    this.name = `donar`;
    this.description = `Realiza donaciones al pozo de la crypta.`;
    this.options = [
      {
        name: `monto`,
        type: `INTEGER`,
        description: `La cantidad de satoshis a donar`,
        required: true,
      },
    ];
  }

  async execute(Interaction) {
    const um = new UserManager();
    try {
      const senderData = await Interaction.guild.members.fetch(
        Interaction.user.id
      );
      const userWallet = await um.getUserWallet(Interaction.user.id);

      if (userWallet.adminkey) {
        const uw = new UserWallet(userWallet.adminkey);
        try {
          const userWalletDetails = await uw.getWalletDetails();
          const amount = Interaction.options.get(`monto`);

          const isValidAmount = validateAmountAndBalance(
            Interaction,
            Number(amount?.value),
            userWalletDetails.balance
          );

          if (isValidAmount) {
            await Interaction.deferReply();

            try {
              const outgoingInvoice = await uw.createOutgoingInvoice(
                process.env.POOL_ADDRESS,
                amount.value
              );

              if (outgoingInvoice && outgoingInvoice.invoice) {
                const payment = await uw.payInvoice(outgoingInvoice.invoice);

                if (payment) {
                  const updatedRank = await updateUserRank(
                    Interaction.user.id,
                    "pozo",
                    amount.value
                  );

                  const embed = new Discord.MessageEmbed()
                    .setColor(`#0099ff`)
                    .setAuthor(AuthorConfig)
                    .setURL(`https://wallet.lacrypta.ar`)
                    .addFields(
                      {
                        name: `Donación a ${process.env.POOL_ADDRESS}`,
                        value: `${senderData.toString()} ha donado ${formatter(
                          0,
                          2
                        ).format(amount.value)} satoshis al pozo!`,
                      },
                      {
                        name: "Total donado",
                        value:
                          updatedRank && updatedRank.amount
                            ? `${updatedRank.amount}`
                            : "0",
                      }
                    );

                  Interaction.editReply({ embeds: [embed] });
                  return;
                }
              }
            } catch (err) {
              console.log(err);
              Interaction.editReply({
                content: `Ocurrió un error`,
              });
              return;
            }
          }
        } catch (err) {
          console.log(err);
          Interaction.editReply({
            content: `Ocurrió un error.`,
          });
        }
      } else {
        Interaction.editReply({
          content: `No tienes una billetera`,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = Donar;

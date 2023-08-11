const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const {
  getTopRanking,
  getSumOfDonationAmounts,
} = require("../database/DonateRank.js");
const dedent = require("dedent-js");
const { formatter } = require("../utils/helperFormatter.js");
const { AuthorConfig } = require("../utils/helperConfig.js");

/*
This command will show the balance of the mentioned user
*/

const availableTypes = ["pozo", "comunidad"];

class Top extends Command {
  constructor() {
    super();
    this.name = `top`;
    this.description = `Devuelve el ranking TOP 10 usuarios que enviaron sats`;
    this.options = [
      {
        name: `tipo`,
        type: `STRING`,
        description: `Solicita un ranking específico (parametros: pozo o comunidad)`,
        required: false,
      },
    ];
  }

  async execute(Interaction) {
    await Interaction.deferReply();

    try {
      const typeParam = Interaction.options.get(`tipo`);

      const cleanedType =
        typeParam?.value && availableTypes.includes(typeParam.value)
          ? typeParam.value
          : "pozo";

      const isPool = cleanedType === "pozo";

      const topUsers = await getTopRanking(cleanedType);

      let rankOutput = ``;
      if (topUsers && topUsers.length) {
        topUsers.map((user, index) => {
          const trophy =
            index === 0
              ? ":first_place:"
              : index === 1
              ? ":second_place:"
              : index === 2
              ? ":third_place:"
              : ":medal:";

          rankOutput += `
          ${trophy} <@${user.discord_id}>  •  \`${formatter(0, 0).format(
            user.amount
          )} sats\`
            `;

          rankOutput = dedent(rankOutput);
        });

        const title = isPool
          ? "TOP 10 • donadores al pozo"
          : "TOP 10 • usuarios que regalaron sats";

        const informationText = isPool
          ? "Puedes realizar donaciones utilizando el comando /donar <monto>"
          : "Puedes regalar sats con los comandos /zap y /regalar";

        const totalDonated = await getSumOfDonationAmounts(
          isPool ? "pozo" : "comunidad"
        );

        const embed = new Discord.MessageEmbed()
          .setColor(`#0099ff`)
          .setAuthor(AuthorConfig)
          .setURL(`https://wallet.lacrypta.ar`)
          .addFields(
            { name: title, value: rankOutput },
            {
              name: isPool ? "Total donado" : "Total enviado",
              value: `${formatter(0, 0).format(totalDonated)}`,
            },
            {
              name: `Información`,
              value: informationText,
            }
          );

        Interaction.editReply({ embeds: [embed] });
      } else {
        const content = isPool
          ? `Aún no hay usuarios que hayan donado al pozo.`
          : `Aún no hay usuarios que hayan enviado sats.`;

        Interaction.editReply({
          content,
        });
      }
    } catch (err) {
      console.log(err);
      Interaction.editReply({
        content: `Ocurrió un error al obtener el ranking`,
      });
    }
  }
}

module.exports = Top;

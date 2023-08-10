const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const { getTopRanking } = require("../database/DonateRank.js");
const dedent = require("dedent-js");

/*
This command will show the balance of the mentioned user
*/

class Top extends Command {
  constructor() {
    super();
    this.name = `top`;
    this.description = `Devuelve el ranking TOP 10 donadores al pozo.`;
    this.options = [];
  }

  async execute(Interaction) {
    await Interaction.deferReply();

    try {
      const topUsers = await getTopRanking();

      let rankOutput = ``;
      if (topUsers && topUsers.length) {
        topUsers.map((user, index) => {
          rankOutput += `
                - ${index + 1}. <@${user.discord_id}>: \`${user.amount} sats\`
            `;

          rankOutput = dedent(rankOutput);
        });

        const embed = new Discord.MessageEmbed()
          .setColor(`#0099ff`)
          .setAuthor({
            name: "LNBot",
            iconURL:
              "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Lightning_Network.svg/2048px-Lightning_Network.svg.png",
          })
          .setURL(`https://wallet.lacrypta.ar`)
          .addFields(
            { name: `Ranking TOP 10 donadores`, value: rankOutput },
            {
              name: `Información`,
              value: `Puedes realizar donaciones utilizando el comando /donar <monto>`,
            }
          );

        Interaction.editReply({ embeds: [embed] });
      } else {
        Interaction.editReply({
          content: `Aún no hay usuarios que hayan donado al pozo.`,
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

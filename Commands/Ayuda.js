const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const dedent = require(`dedent-js`);
const { AuthorConfig } = require("../utils/helperConfig.js");

/*
This command will show the help message
*/

class Ayuda extends Command {
  constructor() {
    super();
    this.name = `ayuda`;
    this.description = `Obtener ayuda sobre los comandos.`;
    this.options = [];
  }

  async execute(Interaction, commands) {
    let cmdOutput = ``;
    commands.forEach(async (cmd) => {
      if (cmd.name != `ayuda`) {
        let params = ``;
        cmd.options.forEach(async (opt) => {
          params += `${opt.name}: <${opt.type}> `;
        });
        cmdOutput += `
          - ${cmd.name}: ${cmd.description} \`/${cmd.name} ${params}\`
        `;
      }
      cmdOutput = dedent(cmdOutput);
    });

    const embed = new Discord.MessageEmbed()
      .setColor(`#0099ff`)
      .setAuthor(AuthorConfig)
      .setURL(`https://wallet.lacrypta.ar`)
      .setDescription(
        dedent(`
    Este bot le permite interactuar con otros usuarios utilizando el poder de la red lightning. Ya tienes una billetera asociada a tu usuario, puedes utilizarla con los comandos que se definen a continuación:
    `)
      )
      .addFields(
        { name: `\u200B`, value: `\u200B` },
        {
          name: `INFORMACIÓN IMPORTANTE`,
          value: `¡Este es un servicio de custodia, no controlas tu dinero hasta que lo retiras!`,
        },
        { name: `\u200B`, value: `\u200B` },
        { name: `Comandos`, value: cmdOutput }
      );

    Interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = Ayuda;

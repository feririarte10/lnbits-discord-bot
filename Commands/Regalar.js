const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const Extensions = require(`../lnbitsAPI/Extensions.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const LNURLw = require(`../lnbitsAPI/LNURLw.js`);
const dedent = require(`dedent-js`);
const { AuthorConfig } = require("../utils/helperConfig.js");
const { createFaucet } = require("../database/FaucetService.js");

/*
This command will create an invoice for a user allowing anyone to claim it.
*/

class Regalar extends Command {
  constructor() {
    super();
    this.name = `regalar`;
    this.description = `Crea una factura abierta que cualquier usuario puede reclamar (se descontará de tu saldo)`;
    this.options = [
      {
        name: `monto`,
        type: `INTEGER`,
        description: `La cantidad de satoshis a regalar en total`,
        required: true,
      },
      {
        name: `usos`,
        type: `INTEGER`,
        description: `Cantidad de usuarios que pueden reclamar (cada uno recibe: total sats / users)`,
        required: true,
      },
    ];
  }

  async execute(Interaction) {
    const amount = Interaction.options.get(`monto`);
    const uses = Interaction.options.get(`usos`);

    let member;

    if (!amount || !uses || amount.value <= 0 || uses.value <= 0) {
      Interaction.reply({
        content: `No puedes usar números negativos`,
        ephemeral: true,
      });
      return;
    }

    const satsForUser = Number((amount.value / uses.value).toFixed(0));

    if (satsForUser < 1) {
      Interaction.reply({
        content: `Ocurrió un error en la división cantidad de sats / usuarios`,
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
      console.log(`userWallet`, userWallet);

      const ext = new Extensions(userWallet.user);
      await ext.enable(`withdraw`);

      const lnurlw = new LNURLw(userWallet.adminkey);
      const withdrawlLink = await lnurlw.createWithdrawlLink(
        `Regalo de ${amount.value} sats de ${Interaction.user.username}`,
        satsForUser,
        uses.value
      );

      if (withdrawlLink) {
        const addedFaucet = await createFaucet(
          member.user.id,
          withdrawlLink.id
        );

        const embed = new Discord.MessageEmbed()
          .setAuthor(AuthorConfig)
          .addFields([
            {
              name: `Faucet disponible:`,
              value: `${member.toString()} está regalando ${satsForUser} sats a ${
                uses.value === 1
                  ? "1 persona"
                  : `${uses.value} personas \nPresiona reclamar para obtener tu premio. \n\n`
              }`,
            },
            {
              name: `Restantes: ${amount.value}/${amount.value} sats`,
              value: `${":x:".repeat(uses.value)} \n\n`,
            },
          ])
          .setFooter({
            text: `Identificador: ${addedFaucet._id}`,
          });

        const row = new Discord.MessageActionRow().addComponents([
          new Discord.MessageButton({
            custom_id: `claim`,
            label: `Reclamar`,
            emoji: { name: `💸` },
            style: `SECONDARY`,
          }),
        ]);

        Interaction.editReply({
          embeds: [embed],
          components: [row],
        });
      }
    } catch (err) {
      console.log(err);
      Interaction.editReply({
        content: `Ocurrió un error`,
      });
    }
  }
}

module.exports = Regalar;

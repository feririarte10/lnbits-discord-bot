const Discord = require(`discord.js`);
const Command = require(`./Command.js`);
const Extensions = require(`../lnbitsAPI/Extensions.js`);
const UserManager = require(`../lnbitsAPI/UserManager.js`);
const LNURLw = require(`../lnbitsAPI/LNURLw.js`);
const dedent = require(`dedent-js`);

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
        name: `amount`,
        type: `INTEGER`,
        description: `La cantidad de satoshis a regalar en la factura`,
        required: true,
      },
    ];
  }

  async execute(Interaction) {
    const description = Interaction.options.get(`description`)
      ? Interaction.options.get(`description`)
      : {
          value: `${Interaction.user.username}[${
            Interaction.guild.name
          }] - ${new Date()}`,
        };
    const amount = Interaction.options.get(`amount`);
    let member;

    if (amount.value <= 0) {
      Interaction.reply({
        content: `No puedes usar números negativos`,
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
        `Retiro de ${amount.value} sats - ${Interaction.user.username}`,
        amount.value
      );

      const row = new Discord.MessageActionRow().addComponents([
        new Discord.MessageButton({
          custom_id: `claim`,
          label: `Reclamar satoshis`,
          emoji: { name: `💸` },
          style: `SECONDARY`,
        }),
      ]);

      const msgContent = dedent(`
        ${Interaction.user.username} está regalando ${amount.value} satoshis!
        LNURL: \`${withdrawlLink.lnurl}\`
        `);

      Interaction.editReply({ content: msgContent, components: [row] });
    } catch (err) {
      console.log(err);
      Interaction.editReply({
        content: `Ocurrió un error`,
      });
    }
  }
}

module.exports = Regalar;

const Api = require(`./LnbitsApi.js`);
const lnurl = require("lnurl-pay");

class UserWallet extends Api {
  constructor(walletAdminKey) {
    super();
    this.headers = { "X-Api-Key": `${walletAdminKey}` };
    this.urlPath = `/api/v1`;
  }

  getWalletDetails() {
    return this.externalApi
      .url(`${this.urlPath}/wallet`)
      .headers(this.headers)
      .get()
      .json();
  }

  createInvote(amount, description) {
    return this.externalApi
      .url(`${this.urlPath}/payments`)
      .headers(this.headers)
      .json({
        out: false,
        amount: amount,
        memo: description,
      })
      .post()
      .json();
  }

  payInvoice(bolt11) {
    return this.externalApi
      .url(`${this.urlPath}/payments`)
      .headers(this.headers)
      .json({
        out: true,
        bolt11: bolt11,
      })
      .post()
      .json();
  }

  checkInvoice(paymentHash) {
    return this.externalApi
      .url(`${this.urlPath}/payments/${paymentHash}`)
      .headers(this.headers)
      .get();
  }

  createOutgoingInvoice(lnUrlOrAddress, sats, comment) {
    return lnurl
      .requestInvoice({
        lnUrlOrAddress,
        tokens: sats,
      })
      .then((invoice) => {
        return invoice;
      });
  }
}

module.exports = UserWallet;

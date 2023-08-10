const RankingModel = require("./models/RankDonations.js");

const createDonationRank = async (discord_id, amount) => {
  try {
    const newUserRank = new RankingModel({ discord_id, amount });
    const result = newUserRank.save();

    return result;
  } catch (err) {
    return null;
  }
};

const getDonationRank = async (discord_id) => {
  if (!discord_id) return null;

  try {
    const user_rank = await RankingModel.findOne({ discord_id });
    if (user_rank) return user_rank;
  } catch (err) {
    return null;
  }

  return null;
};

const updateUserRank = async (discord_id, new_amount) => {
  try {
    const userRank = await getDonationRank(discord_id);

    if (userRank) {
      userRank.amount = userRank.amount + new_amount;
      await userRank.save();

      return userRank;
    } else {
      const new_rank = await createDonationRank(discord_id, new_amount);

      return new_rank;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getTopRanking = async () => {
  try {
    const topUsers = await RankingModel.find({}).sort({ amount: -1 }).limit(10);

    return topUsers;
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = {
  updateUserRank,
  getTopRanking,
};

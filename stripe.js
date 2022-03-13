const { get } = require("lodash");
const { getMetadataProduct, getImageProduct } = require("./products");
const stripe = require("stripe")(
  "sk_test_51KQCr8Evk7QqcYLkQ3zj2bLMder2CwEeDg4aJrNLSoM8jF7mBFCSY7S8OJb0bqCOsod5N3Uk4HlBLnv00scsRRvf00iI6EhoEy"
);
const secretAccessKey = process.env.STRIPE_ENDPOINT_SECRET;

const createStripeSession = async (totalImages, metadataFormat, orderID) => {
  const imageProduct = getImageProduct('Ethereum');
  const metadataProduct = getMetadataProduct('Ethereum');

  const session = await stripe.checkout.sessions.create({
    line_items: [imageProduct, metadataProduct],
    client_reference_id: orderID,
    mode: "payment",
    success_url: "https://123-nft.io",
    cancel_url: "https://123-nft.io",
    // expire,
  });
  return session;
};

module.exports = {
  createStripeSession,
};

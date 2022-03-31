const { get } = require("lodash");
const { getMetadataProduct, getImageProduct } = require("./products");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createStripeSession = async (totalImages, metadataFormat, orderID) => {
  const imageProduct = getImageProduct(String(totalImages));
  const metadataProduct = getMetadataProduct(metadataFormat);

  const session = await stripe.checkout.sessions.create({
    line_items: [imageProduct, metadataProduct],
    client_reference_id: orderID,
    mode: "payment",
    success_url: "https://123-nft.io",
    cancel_url: "https://123-nft.io",
    discounts: [
      {
        coupon: "{{pZQHU44A}}",
      },
    ],
    // expire,
  });
  return session;
};

module.exports = {
  createStripeSession,
};

const dotenv = require("dotenv");
const { getMetadataProduct, getImageProduct } = require("./products");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createStripeSession = async (totalImages, metadataFormat, orderID) => {
  const imageProduct = getImageProduct(String(totalImages));
  const metadataProduct = getMetadataProduct(metadataFormat);
  console.log(imageProduct, metadataProduct);
  const session = await stripe.checkout.sessions.create({
    line_items: [imageProduct, metadataProduct],
    client_reference_id: orderID,
    mode: "payment",
    success_url: "https://123-nft.io",
    cancel_url: "https://123-nft.io",
    discounts: [
      {
        coupon: "xiq8xOOp",
      },
    ],
    // expire,
  });
  console.log(session);
  return session;
};

module.exports = {
  createStripeSession,
};

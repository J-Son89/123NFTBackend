const { get } = require("lodash");
const metadataProducts = {
  Ethereum: {
    currency: "USD",
    attributes: [],
    description: "Ethereum",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX3Rlc3RfRm1DUm9yOGJncERUMUZIYTEzbWtva2NJ007LBpgW65",
    ],
    metadata: {},
    amount: 500,
    name: "Prepare Ethereum Metadata",
    quantity: 1,
  },
};

const getMetadataProduct = (key) => get(metadataProducts, [key]);

const imagesProducts = {
  Ethereum: {
    currency: "USD",
    attributes: [],
    description: "Ethereum",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX3Rlc3RfRm1DUm9yOGJncERUMUZIYTEzbWtva2NJ007LBpgW65",
    ],
    metadata: {},
    amount: 500,
    name: "Prepare Ethereum Metadata",
    quantity: 1,
  },
};

const getImageProduct = (key) => get(imagesProducts, [key]);

module.exports = {
  getMetadataProduct,
  getImageProduct,
};

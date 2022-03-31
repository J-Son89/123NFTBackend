const { get } = require("lodash");
const metadataProductsDev = {
  Ethereum: {
    currency: "USD",
    attributes: [],
    description:
      "You will be provided with the basic JSON metadata and will be able to use this to upload your collection for any blockchain.",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX3Rlc3RfRm1DUm9yOGJncERUMUZIYTEzbWtva2NJ007LBpgW65",
    ],
    metadata: {},
    amount: 500,
    name: "Prepare Ethereum Metadata",
    quantity: 1,
  },
};

const metadataProducts = {
  Json: {
    currency: "USD",
    attributes: [],
    metadata: {},
    amount: 0,
    quantity: 1,
    name: "Prepare JSON Metadata",
    description:
      "You will be provided with the basic JSON metadata and will be able to use this to upload your collection for any blockchain.",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX2xpdmVfV1BKeEpaeHBXeklKemdJSk4zWUFzcDRT00n5FRb4F8",
    ],
  },
  Ethereum: {
    currency: "USD",
    attributes: [],
    metadata: {},
    amount: 0,
    quantity: 500,
    name: "Prepare Ethereum Metadata",
    description: "Prepare NFT Metadata collection for Ethereum Blockchain.",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX2xpdmVfeE1WVkRLSnhVRXJnNzRaTndiT1BHc0tU00Vjup6ETk",
    ],
  },
  Cardano: {
    currency: "USD",
    attributes: [],
    metadata: {},
    amount: 0,
    quantity: 500,
    name: "Prepare Cardano Metadata",
    description: "Prepare NFT Metadata collection for Cardano Blockchain.",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX2xpdmVfaXVYaFUxTHY1dXpVNkJOZ3VUN01hdkVi00CHe09sQi",
    ],
  },
};

const getMetadataProduct = (key) =>
  get(
    process.env.NODE_ENV === "production"
      ? metadataProducts
      : metadataProductsDev,
    [key]
  );

const imagesProductsDev = {
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

const imagesProducts = {
  1000: {
    currency: "USD",
    attributes: [],
    description: "NFT collection of 1,000 images",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX2xpdmVfQTFKTmsyRFVPSFdmMEJtd0pwSUNGdTZF00OibkKl8Q",
    ],
    metadata: {},
    amount: 2999,
    name: "One Thousand Images",
    quantity: 1,
  },
  2000: {
    currency: "USD",
    attributes: [],
    description: "NFT collection of 2,000 images",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX2xpdmVfNkQzMkZOQTRBbkEyVG9oNUxxVmJ5Z3hi00aPA4GQEg",
    ],
    metadata: {},
    amount: 3999,
    name: "Two Thousand Images",
    quantity: 1,
  },
  5000: {
    currency: "USD",
    attributes: [],
    description: "NFT collection of 5,000 images",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX2xpdmVfVEtoUkgwdXhpU0E2V0NrdHM0SE1uWVdq00MItxBru2",
    ],
    metadata: {},
    amount: 4999,
    name: "Five Thousand Images",
    quantity: 1,
  },
  10000: {
    currency: "USD",
    attributes: [],
    description: "NFT collection of 10,000 images",
    images: [
      "https://files.stripe.com/links/MDB8YWNjdF8xS1FDcjhFdms3UXFjWUxrfGZsX2xpdmVfdkU2cm1vU3hGMDE0amJDUnpick53QTRz00pz2BVURF",
    ],
    metadata: {},
    amount: 2999,
    name: "One Thousand Images",
    quantity: 1,
  },
};

const getImageProduct = (key) =>
  get(
    process.env.NODE_ENV === "production" ? imagesProducts : imagesProductsDev,
    [key]
  );

module.exports = {
  getMetadataProduct,
  getImageProduct,
};

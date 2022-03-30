const getGeneratorEndpoint = () =>
  process.env.NODE_ENV === "production"
    ? "https://generator123nft.herokuapp.com"
    : "http://localhost:8000";

module.exports = {
  getGeneratorEndpoint,
};

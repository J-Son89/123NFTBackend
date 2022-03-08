const aws = require("aws-sdk");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { promisify } = require("util");
const randomBytes = promisify(crypto.randomBytes);
dotenv.config();

const region = "us-west-2";
const bucketName = "123nft";
const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: "v4",
});

const getURLPrefix = async () => {
  const rawBytes = await randomBytes(16);
  return rawBytes.toString("hex");
};

const generateUploadURL = async (fileName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 300,
  };
  const uploadURL = await s3.getSignedUrlPromise("putObject", params);
  return uploadURL;
};

module.exports = {
  generateUploadURL,
  getURLPrefix,
};

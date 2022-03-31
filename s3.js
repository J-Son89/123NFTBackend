const aws = require("aws-sdk");
const crypto = require("crypto");
const dotenv = require("dotenv");

const { promisify } = require("util");
const randomBytes = promisify(crypto.randomBytes);

dotenv.config();

const region = "us-west-2";
const bucketName = "123nft";
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

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

const generateDownloadURL = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: 7 * 24 * 60 * 60,
  };
  const uploadURL = await s3.getSignedUrlPromise("getObject", params);
  return uploadURL;
};

module.exports = {
  generateUploadURL,
  getURLPrefix,
  generateDownloadURL,
};

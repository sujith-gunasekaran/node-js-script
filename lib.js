const { S3_BUCKET } = require("./config");
const { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

/**
 * Get list of objects in the given bucket.
 * Maxkeys - This will return batch by batch based on the given value. maxValue is 1000.
 * Example for Maxkeys - I have given 10 So, this will return 10, 10 objects from the bucket.
 * 
 * StartAfter - Basically this will return the objects after the given file path. use it when we needed.
 * @returns 
*/
function getListObjectsV2CommandAws() {
  const command = new ListObjectsV2Command({
    Bucket: S3_BUCKET,
    MaxKeys: 10,
    // StartAfter: ''
  });
  return command;
}

/**
 * Get file from the bucket.
 * @param {String} path - file path 
 * @returns 
*/
function getObjectCommandAws(path) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: path
  });
  return command;
}

/**
 * Upload the modified file in the bucket.
 * @param {String} path - file path
 * @param {String} body - modified file content
 * @param {String} contentType - file content type   
 * @returns 
*/
function putObjectCommandAws(path, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: path,
    Body: body,
    ContentType: contentType,
  });
  return command;
}

module.exports = {
  getListObjectsV2CommandAws,
  getObjectCommandAws,
  putObjectCommandAws,
};

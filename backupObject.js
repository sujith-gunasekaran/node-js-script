const { S3Client } = require("@aws-sdk/client-s3");
const async = require("async");
const cheerio = require("cheerio");
const dotenv = require("dotenv");

const configs = require("./lib");
const { AWS_REGION } = require("./config");
const backupList = require('./backupFileList');

dotenv.config();

let batch = 1;
let lastSuccessfullFilePath = "";

const client = new S3Client({
  region: AWS_REGION
});


/**
 * This is used to upload the modified file in the s3 bucket.
 * @param {String} path 
 * @param {String} fileContent 
 * @param {String} contentType 
*/
const putObject = async (path, fileContent, contentType) => {
  try {
    const putObjectCommand = configs.putObjectCommandAws(path, fileContent, contentType);
    const putResponse = await client.send(putObjectCommand);
    if(putResponse.$metadata.httpStatusCode === 200) {
      console.log(`**** Successfully Upload the content in the path: ${path} ****`);
    }
  }
  catch(error) {
    console.log(`**** Error while uploading the file: ${path} ****`);
    throw new Error(error);
  }
}


const getObject = async (Contents) => {
  return new Promise((resolve, reject) => {
    async.each(Contents, async (content) => {
      
      const backupPath = content.backupPath;
      const originalPath = content.originalPath;

      lastSuccessfullFilePath = originalPath;

      try {
        const getBackupObjectCommand = configs.getObjectCommandAws(backupPath);
        const getOriginalObjectCommand = configs.getObjectCommandAws(originalPath);

        if(path.endsWith(".html")) {
          // get the backup file
          const backupHtmlFile = await client.send(getBackupObjectCommand);

          // get the original file
          const originalHtmlFile = await client.send(getOriginalObjectCommand);

          const contentType = originalHtmlFile.ContentType;

          const backupContent = await backupHtmlFile.Body.transformToString("utf-8");
          const $ = cheerio.load(backupContent);
          const backupHtmlContent = $.html();

          // Uploading the backup content in the original path.
          await putObject(originalPath, backupHtmlContent, contentType);
        }
        if(path.endsWith(".js")) {

          // get the backup file
          const backupJsFile = await client.send(getBackupObjectCommand);

          // get the original file
          const originalJsFile = await client.send(getOriginalObjectCommand);

          const contentType = originalJsFile.ContentType;

          const backupJsContent = await backupJsFile.Body.transformToString("utf-8");

          // Uploading the backup content in the original path.
          await putObject(originalPath, backupJsContent, contentType);
        }
      }
      catch(error) {
        console.log(`**** Error in objectCommand filePath: ${originalPath} ****`, error);
        throw new Error(error);
      }
    }, function(error) {
      if(error) {
        console.log("**** Error in async.each function ****", error);
        console.log(`**** Last successfull path: ${lastSuccessfullFilePath} ****`);
        reject(error);
      } else {
        console.log(`**** Batch: ${batch} completed successfully ****`);
        console.log(`**** Last successfull path: ${lastSuccessfullFilePath} ****`);
        batch += 1;
        resolve("Success");
      }
    });
  });
}

async function initiate() {
  await getObject(backupList);
  console.log(`**** Successfully uploaded the all the files last successfull path is: ${lastSuccessfullFilePath}`);
}

initiate();

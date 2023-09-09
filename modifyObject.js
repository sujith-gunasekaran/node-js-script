const { S3Client } = require("@aws-sdk/client-s3");
const async = require("async");
const cheerio = require("cheerio");
const dotenv = require("dotenv");

const configs = require("./lib");
const { AWS_REGION } = require("./config");
const { crayonsLink } = require("./contents");
const objectList = require("./fileList");

dotenv.config();

let batch = 1;
let lastSuccessfullFilePath = "";
const modifiedFilePath = [];
const modifiedBackupPath = [];

const client = new S3Client({
  region: AWS_REGION
});


/**
 * This will find and replace the CDN links in js files.
 * @param {String} content 
 * @param {String} path 
 * @returns 
*/
const handleJsFile = (content, path) => {
  let fileModified = false;
  let modifiedContent = content;
  Object.entries(crayonsLink).forEach(([key, value]) => {
    if(content.includes(key)) {
      fileModified = true;
      modifiedContent = modifiedContent.replace(new RegExp(key, "g"), value);
    }
  });
  if(fileModified) {
    modifiedFilePath.push(path);
  }
  return { jsContent: modifiedContent, fileModified };
}


/**
 * This will check and update the CDN link in the HTML file
 * @param {String} html 
 * @param {String} path 
 * @returns 
*/
const handleHtmlFile = (html, path) => {
  const $ = cheerio.load(html);
  let fileModified = false;
  const scriptElements = $("script");
  const linkElements = $("link");
  scriptElements.each(function() {
    const element = $(this);
    const attribute = element.attr();
    if (attribute.src && crayonsLink[attribute.src]) {
      $(this).attr("src", crayonsLink[attribute.src]);
      fileModified = true;
    }
  });
  linkElements.each(function() {
    const element = $(this);
    const attribute = element.attr();
    if (attribute.href && crayonsLink[attribute.href]) {
      $(this).attr("href", crayonsLink[attribute.href]);
      fileModified = true;
    }
  });
  if(fileModified) {
    modifiedFilePath.push(path);
  }
  return { htmlContent: $.html(), fileModified };
}

/**
 * This is used to upload the modified file in the s3 bucket.
 * @param {String} path 
 * @param {String} fileContent 
 * @param {String} contentType 
*/
const putObject = async (path, fileContent, contentType, backup = false) => {
  const message = backup ? `Successfully uploaded the original content in backup file path: ${path}` : `Successfully uploaded the modified file in the path: ${path}`;
  try {
    const putObjectCommand = configs.putObjectCommandAws(path, fileContent, contentType);
    const putResponse = await client.send(putObjectCommand);
    if(putResponse.$metadata.httpStatusCode === 200) {
      console.log(`**** ${message} ****`);
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

      const path = content;
      lastSuccessfullFilePath = path;

      if(path.startsWith("app-assets")) {
        try {
          const getObjectCommand = configs.getObjectCommandAws(path);

          if(path.endsWith(".html")) {
            // Get file from the s3 bucket.
            const file = await client.send(getObjectCommand);
            const contentType = file.ContentType;

            const originalContent = await file.Body.transformToString("utf-8");
            const $ = cheerio.load(originalContent);
            const originalHtmlContent = $.html();

            const { htmlContent: modifiedHtmlContent, fileModified } = handleHtmlFile(originalContent, path);

            const pathArr = path.split("/");
            pathArr.splice(0, 1);
            const backupFilePath = pathArr.join("/");
            const backupPath = `backup/${backupFilePath}`;

            modifiedBackupPath.push({
              backupPath: backupPath,
              originalPath: path
            });

            if(fileModified) {
              console.log(`**** Verified the HTML file Path: ${path} and modified the crayons link Successfully ****`);

              // Uploading the original content in the backup folder. 
              await putObject(backupPath, originalHtmlContent, contentType, true);

              // Uploading the modified content in the original path.
              await putObject(path, modifiedHtmlContent, contentType);
            }
          }
          if(path.endsWith(".js")) {
            // Get file from S3 object.
            const file = await client.send(getObjectCommand);
            const contentType = file.ContentType;

            const originalJsContent = await file.Body.transformToString("utf-8");

            const { jsContent: modifiedJsContent, fileModified } = handleJsFile(originalJsContent, path);

            const pathArr = path.split("/");
            pathArr.splice(0, 1);
            const backupFilePath = pathArr.join("/");
            const backupPath = `backup/${backupFilePath}`;

            modifiedBackupPath.push({
              backupPath: backupPath,
              originalPath: path
            });

            if(fileModified) {
              console.log(`**** Verified the JS file Path: ${path} and modified the crayons link Successfully ****`);
              
              // Uploading the original content in the backup folder.
              await putObject(backupPath, originalJsContent, contentType, true);
              
              // Uploading the modified content. 
              await putObject(path, modifiedJsContent, contentType);
            }
          }
        }
        catch(error) {
          console.log(`**** Error in objectCommand filePath: ${path} ****`, error);
          throw new Error(error);
        }
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

const printFinalList = () => {
  for(let i = 0; i < modifiedBackupPath.length; i++) {
    console.log(`${modifiedBackupPath[i]},`);
  }
  console.log("**** length ****", modifiedBackupPath.length);
}

async function initiate() {
  await getObject(objectList);
  printFinalList();
}

initiate();

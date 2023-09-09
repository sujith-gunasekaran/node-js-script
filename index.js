const { S3Client } = require("@aws-sdk/client-s3");
const async = require("async");
const cheerio = require("cheerio");
const dotenv = require("dotenv");

const configs = require("./lib");
const { AWS_REGION } = require("./config");
const { crayonsLink } = require("./contents");

dotenv.config();

let batch = 1;
let lastSuccessfullFilePath = "";
const modifiedFilePath = [];

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
      fileModified = true;
    }
  });
  linkElements.each(function() {
    const element = $(this);
    const attribute = element.attr();
    if (attribute.href && crayonsLink[attribute.href]) {
      fileModified = true;
    }
  });
  if(fileModified) {
    modifiedFilePath.push(path);
  }
  return { htmlContent: $.html(), fileModified };
}


const getObject = async (Contents) => {
  return new Promise((resolve, reject) => {
    async.each(Contents, async (content) => {
      const path = content.Key;
      lastSuccessfullFilePath = path;
      if(path.startsWith("app-assets")) {
        try {
          const getObjectCommand = configs.getObjectCommandAws(path);
          if(path.endsWith(".html")) {
            const file = await client.send(getObjectCommand);
            const contentType = file.ContentType;
            const fileContent = await file.Body.transformToString();
            handleHtmlFile(fileContent, path);
          }
          if(
              (path.endsWith(".js") || path.endsWith(".jsx") || path.endsWith(".ts") || path.endsWith(".tsx") || path.endsWith(".vue")) &&
              (!path.endsWith(".bundle.js") || !path.endsWith(".test.js"))
            ) {
            const file = await client.send(getObjectCommand);
            const contentType = file.ContentType;
            const fileContent = await file.Body.transformToString();
            handleJsFile(fileContent, path);
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
  })
}

const printModifiedList = () => {
  for(let i = 0; i < modifiedFilePath.length; i++) {
    console.log(`"${modifiedFilePath[i]}",`);
  }
}

/**
 * This will get list of objects in the bucket.
 * while loop will run until we finish reading all the objects from the bucket. 
 * This will run in batch based on the given input. Please check lib.js file. 
*/
const getS3ObjectsInBucket = async () => {
  try {
    const listObjectsV2Command = configs.getListObjectsV2CommandAws();
    let isTruncated = true;
    while(isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } = await client.send(listObjectsV2Command);
      await getObject(Contents);
      isTruncated = IsTruncated;
      listObjectsV2Command.input.ContinuationToken = NextContinuationToken;
    }
    console.log(`**** ${batch} batches has been successfully completed ****`);
    console.log("**** Here are the list of modified paths ****");
    printModifiedList();
    console.log("**** Length of modified paths ****", modifiedFilePath.length);
  }
  catch(error) {
    console.log("**** Error in getS3ObjectInBucket function ****", error);
    console.log("**** Here are the list of modified file paths ****");
    printModifiedList();
    console.log("**** Length of modified paths ****", modifiedFilePath.length);
  }
}

getS3ObjectsInBucket();

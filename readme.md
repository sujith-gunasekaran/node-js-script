
# Update crayons CDN link

### Script to update crayons CDN link 

This script will fetch list of objects from the bucket and will check HTML and JS file to see if the file has old crayons CDN link. If the file as old crayons CDN link then this will be replaced with the new CDN link and will upload the modified file to the S3 bucket. 

To Install the package

```
yarn install
```


This will fetch all the objects from the bucket and will read the file to check if unpackage crayons CDN link is present or not. 

This will give us the list of files path that has unpackage crayons CDN link. 

Important: Keep the copy of the output.txt file. With the help of this only we can able to run the next command.

```
Output format

"app-assets/<UUID>/<filePath>",
"app-assets/<UUID>/<filePath>",

```

##### Command

```
node index.js > output.txt
```

This will update from unpackage crayons CDN link to jsDeliver crayons CDN link for the given list of paths. By running the above command we will get list of files. We need to paste those list of files path in the file `fileList.js`. 

Basically this will upload the modified content in the original path and then will create a `backup` folder in the bucket and will store all the original content (In case if any problem comens we can reupload the original content).

Important: Keep the copy of the output.txt file. With the help of this only we can able to run the next command.

```
Ouput format

{
  backupPath: "backup/<UUID>/<filePath>",
  originalPath: "app-assets/<UUID>/<filePath>"
}

```

##### Command

```
node modifyObject.js > output.txt
```

In case if we face any problem after updating the crayons CDN link. We can run this command to re-upload the original content. We will be having the `backupPath` and `originalPath` for every file ( refere previous command ). We need to paste the list in file `backupFileList.js`

##### Command

```
node modifyObject.js > output.txt
```


- If we want to get more than 10 results go to `lib.js` file and modify the `MaxKeys` value.  
- If we want to fetch next 10 objects i.e where we left. Then go to `lib.js` file and add the file path in `StartAfter`. We can able to get the last viewed file path from the `output.txt` file. 

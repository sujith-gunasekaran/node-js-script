
# Update crayons CDN link

### Script to update crayons CDN link 

This script will fetch a list of objects from the bucket and will check the HTML and JS file to see if the file has old crayon CDN links. If the file has an old crayon CDN link then this will be replaced with the new CDN link and will upload the modified file to the S3 bucket. 

To Install the package

```
yarn install
```

Follow the below steps: 

#### To get the list of apps that have unpkg crayons CDN link

```
node index.js > output.txt
```

#### To modify the crayons CDN from unpkg to jsdelivr

This will update from the unpkg crayons CDN link to jsdelivr crayons CDN link for the given list of paths. Basically, this will upload the modified content in the original path and then will create a `backup` folder in the bucket and will store all the original content.

We should provide input in `fileList.js`. Please check the input format below.

```
Input format

[
  "app-asset/<UUID>/<filePath>",
  "app-assets/<UUID>/<filePath>"
]

```

##### Command

```
node modifyObject.js > output.txt
```

#### Rollback it to the original content

In case we face any problem after updating the crayons CDN link. This script will get the original content from the backup folder and will replace it with the original path.

We should provide input in `backupFileList.js`. Please check the input format below.

```
Input format

[
  {
    backupPath: "backup/<UUID>/<filePath>",
    originalPath: "app-assets/<UUID>/<filePath>"
  }
]

```

##### Command

```
node modifyObject.js > output.txt
```


#### Configuration

- If we want to get more than 10 results go to `lib.js` file and modify the `MaxKeys` value.  


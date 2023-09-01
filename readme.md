
# Update crayons CDN link

### Script to update crayons CDN link 

This script will fetch list of objects from the bucket and will check HTML and JS file to see if the file has old crayons CDN link. If the file as old crayons CDN link then this will be replaced with the new CDN link and will upload the modified file to the S3 bucket. 


This will fetch all the objects from the bucket.

```
node index.js > output.txt
```

This will fetch first 10 objects from the bucket.
```
node batch_run.js > output.txt
```

- If we want to get more than 10 results go to `lib.js` file and modify the `MaxKeys` value.  
- If we want to fetch next 10 objects i.e where we left. Then go to `lib.js` file and add the file path in `StartAfter`. We can able to get the last viewed file path from the `output.txt` file. 

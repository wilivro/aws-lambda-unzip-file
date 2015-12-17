var aws = require('aws-sdk');
var s3 = new aws.S3();
var mime = require('mime-types');
var async = require('async');
var JSZip = require('jszip');
var fs = require("fs");

fs.readFile('index.zip', function(err, data) {
  if(err) {
    throw err; // or handle err
  }

    var zip = new JSZip(data);
  async.forEach(zip.files, function (zippedFile) {
        var f = zippedFile;
        console.log("filename:" + f.name);
        var mimetype = mime.lookup(f.name);

        if (mimetype == false) {
            mimetype = 'application/octet-stream';
        }
        console.log("mimetype:" + mimetype);
        var test = new Buffer(f.asBinary(), "binary");

        // s3.putObject({
        //         Bucket: unzipBucket,
        //         Key: 'scorm/'+key.split('.')[0]+"/"+f.name,
        //         Body: new Buffer(f.asBinary(), "binary"),
        //         ContentType: mimetype,
        //         CacheControl: 'no-cache',
        //         Expires: 0
        //     }, function(err, data) {
        //         if (err) {
        //             context.fail(err, "unzip error");
        //         }
        //         console.log("success to unzip:" + f.name);
        //     }
        // );
    }, function (err) {
        if (err) {
            context.fail(err, "async forEach error");
        }
        console.log('all finish!');
        context.succeed();
    });
});



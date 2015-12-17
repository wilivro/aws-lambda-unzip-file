var aws = require('aws-sdk');
var ep = new aws.Endpoint('s3.amazonaws.com');
var s3 = new aws.S3({endpoint: ep});
var mime = require('mime-types');
var async = require('async');
var JSZip = require('jszip');

var unzipBucket = 'cursos3.wiquadro.com.br';

exports.handler = function(event, context) {
  console.log('Node:' + JSON.stringify(process.versions));
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Get the object from the event and show its content type
  var bucket = event.Records[0].s3.bucket.name;
  var key = event.Records[0].s3.object.key;
  
  s3.getObject({Bucket:bucket, Key:key},
    function(err,data) {
      if (err) {
      
        console.log('Error getting object ' + key + ' from bucket ' + bucket +
        '. Make sure they exist and your bucket is in the same region as this function.');
        context.fail('Error', 'Error getting file: ' + err);
        return;
      
      }
      
      if (data.ContentType != 'application/zip') {
      
        console.log('not zip!:' + data.ContentType);
        context.succeed();
        return;
      
      }
    
      var zip = new JSZip(data.Body);
      
      async.forEach(zip.files, function (zippedFile) {
      
      var f = zippedFile;
      var mimetype = mime.lookup(f.name);
      
      if (mimetype == false) {
        mimetype = 'application/octet-stream';
      }
    
      var fbuffer = new Buffer(f.asBinary(), 'binary');
      //verify all javascript files and change domain to wiquadro.com.br
      if(mimetype === 'application/javascript') {
        fbuffer = Buffer.concat([fbuffer, new Buffer('\ndocument.domain = \'wiquadro.com.br\';')]);
      }
    
      s3.putObject({
        Bucket: unzipBucket,
        Key: 'scorm/'+key.split('.')[0]+'/'+f.name,
        Body: fbuffer,
        ContentType: mimetype,
        CacheControl: 'no-cache',
        Expires: 0
        }, function(err, data) {
          if (err) {
            context.fail(err, 'unzip error');
          }
          console.log('success to unzip:' + f.name);
        }
      );
  
    }, function (err) {
      
      if (err) {
        context.fail(err, 'async forEach error');
      }
      console.log('all finish!');
      context.succeed();

    });
  });
};

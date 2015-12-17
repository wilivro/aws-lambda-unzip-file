var aws = require('aws-sdk');
var ep = new aws.Endpoint('s3.amazonaws.com');
var s3 = new aws.S3({endpoint: ep});
var mime = require('mime-types');
var async = require('async');
var JSZip = require('jszip');
var exec = require('child_process').exec;

var unzipBucket = 'cursos3.wiquadro.com.br';

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    var bucket = event.Records[0].s3.bucket.name;
    var key = event.Records[0].s3.object.key;

    s3.getObject({Bucket:bucket, Key:key},
        function(err,data) {
            if (err) {
                console.log("Error getting object " + key + " from bucket " + bucket +
                    ". Make sure they exist and your bucket is in the same region as this function.");
                context.fail('Error', "Error getting file: " + err);
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

                var putfile = function() {
                    s3.putObject({
                            Bucket: unzipBucket,
                            Key: 'scorm/'+key.split('.')[0]+"/"+f.name,
                            Body: new Buffer(f.asBinary(), "binary"),
                            ContentType: mimetype,
                            CacheControl: 'no-cache',
                            Expires: 0
                        }, function(err, data) {
                            if (err) {
                                context.fail(err, "unzip error");
                            }
                            console.log("success to unzip:" + f.name);
                        }
                    );
                }

                //obtendo extensão do arquivo
                var ext = f.name.split('.');
                ext = ext[ext.length-1];
                if(ext == 'js') {
                    console.log("F.NAME: "+ f.name);
                    //escrever document.domain = "wiquadro.com.br"; no final
                    //para habilitar acesso cross-domain.
                    var child = exec("echo \"document.domain = 'wiquadro.com.br'\" >> " + f.name,
                        function (error, stdout, stderr) {
                             if (error !== null) {
                                console.log('exec error: ' + error);
                                return;
                            }
                            putfile();
                            console.log('domain escrito com sucesso no arquivo: '+f.name);
                        }
                    );
                } else {
                    putfile();
                }
            }, function (err) {
                if (err) {
                    context.fail(err, "async forEach error");
                }
                console.log('all finish!');
                context.succeed();
            });
        }
    );
};

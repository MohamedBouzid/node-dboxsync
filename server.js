var Dropbox = require('dropbox');
var dbx = new Dropbox({ accessToken: process.argv[3] });
var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://localhost:27017/exampleDb';

// Verify arguments
if(process.argv.length != 4 ){
	
	console.log("You should provide a path for the dropbox folder...");
	process.exit(-1);

}
// synchronization function 
job = function(){

	var names = [];
	// Get all files in the folder given as argument
	dbx.filesListFolder({path: process.argv[2]})
	.then(function(response) {
		// Iterate through all files in this folder
		for  (var i=0 ; i< response.entries.length ; i++) {
			// Add the name of the file to the list; we 'll use it after to check wether the file exist in the database and dropbox account
			names.push(response.entries[i].name);
			// Download the file.			
			dbx.filesDownload({ path : process.argv[2]+response.entries[i].name })
			.then(function(resp) { 
				// Connect to database and prepare the collection
				mongoClient.connect(url, function(err, db) {
				co = db.collection('files');
				// Update the file in the database
				co.update({name : resp.name},{name : resp.name, contenu : resp.fileBinary},{upsert:true});
				db.close();
				});
			})
			.catch(function(error) {
				console.log(error);
			});
		}
		
		// In case of file removal from the dropbox we 'll remove it from our database as well
		mongoClient.connect(url, function(err, db) {
	
			db.collection('files').find({}).toArray(function(err, el) {
			for  (var i=0 ; i< el.length ; i++) {    
				if(!(el[i]  in names)) 
					db.collection('files').remove({name : el[i].name},function(err,res){
						if(err) 
							console.log(res+" Error while deleting element ");

					});  

				
			}

		});
	})
	.catch(function(error) {
		console.log(error);
	});

	db.close();
	});
  
}
  
setInterval(job,10000);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  


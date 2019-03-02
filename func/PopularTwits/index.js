var Twit = require('twit');
var azure = require('azure-storage');

var config = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
};

var T = new Twit(config);
var query = { q: "#ethereum OR #eth OR #blockchain OR #polkadot OR #substrate OR #bitcoin OR #swarm OR #ipfs min_retweets:20 min_faves:30 -filter:retweets", count: 100, result_type: "recent", lang: "en" };

function getPopularLatest() {
    T.get('search/tweets', query, function (error, data) {
        if (error) {
            console.error(error);
            return;
        }

        var retryOperations = new azure.ExponentialRetryPolicyFilter(3);
        var tableSvc = azure.createTableService(process.env.AZURE_STORAGE_CONNECTION_STRING)
            .withFilter(retryOperations);
        var tableName = process.env.AZURE_STORAGE_POPULAR_TWITS_TABLE;
        tableSvc.createTableIfNotExists(tableName, function (error) {
            if (error) {
                console.error(error);
                return;
            }

            var gen = azure.TableUtilities.entityGenerator;

            data.statuses.forEach(x => {
                var entry = {
                    PartitionKey: gen.String(x.id_str),
                    RowKey: gen.String(''),
                    Payload: gen.String(JSON.stringify(x)),
                    Deleted: false
                };

                tableSvc.insertEntity(tableName, entry, { echoContent: false }, function (error) {
                    if (error) {
                        console.error(error);
                    }
                });
            });
        });
    });
}

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();

    if (myTimer.isPastDue) {
        context.log('JavaScript is running late!');
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);
    getPopularLatest();
};


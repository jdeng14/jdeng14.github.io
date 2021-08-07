var LiltNode = require('lilt-node');

const APIKey = document.getElementById("APIKeyInput").value;

var defaultClient = LiltNode.ApiClient.instance;
// Configure API key authorization: ApiKeyAuth
var ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
ApiKeyAuth.apiKey = APIKey
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//ApiKeyAuth.apiKeyPrefix['key'] = "Token"
// Configure HTTP basic authorization: BasicAuth
var BasicAuth = defaultClient.authentications['BasicAuth'];
BasicAuth.username = APIKey
BasicAuth.password = APIKey

try {
    let apiInstance = new LiltNode.RootApi();
    apiInstance.root().then((data) => {
        console.log('API called successfully. Returned data: ' + data);
        window.localStorage.setItem("LILTAPIKEY", APIKey);
        console.log("Successfully stored API Key");
        window.location.href = "settings.html";
    }, (error) => {
        console.error(error);
        document.getElementById("errorMessage").innerHTML = "Invalid API Key";
    });
} catch {
    document.getElementById("errorMessage").innerHTML = "Invalid API Key";
}
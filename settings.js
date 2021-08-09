"use strict";

var LiltNode = require('lilt-node');

let nameToCode = {};

let defaultClient = LiltNode.ApiClient.instance;
// Configure API key authorization: ApiKeyAuth
let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
// let APIKey = window.sessionStorage.getItem("APIKEY");
// let APIKey = window.localStorage.getItem("LILTAPIKEY");
let APIKey = "2b6d066afe38cf67ff04e0c0f6c2b674";
if (!APIKey) {
    console.log("No API Key Found");
    return;
}
ApiKeyAuth.apiKey = APIKey;
let BasicAuth = defaultClient.authentications['BasicAuth'];
BasicAuth.username = APIKey;
BasicAuth.password = APIKey;

let apiInstance = new LiltNode.LanguagesApi();
apiInstance.getLanguages().then((languageResponse) => {
    let languages = Object.values(languageResponse.code_to_name);
    for (let key in languages) {
        nameToCode[languages[key]] = key;
    }

    let options = ""
    for (let index = 0; index < languages.length; index++) {
        options += '<option value="' + languages[index] + '">';
    }
    console.log(options);
    document.getElementById('languages').innerHTML = options;
}, (error) => {
    console.error(error);
});

async function listMemories() {
    //get source
    //get target

    let apiInstance = new LiltNode.MemoriesApi();
    let memories = await apiInstance.getMemory();

    //iterate through memories to find source and target
}


"use strict";

var LiltNode = require('lilt-node');

let nameToCode = {};
let source_to_target = {};

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
    source_to_target = languageResponse.source_to_target;

    let languages = Object.values(languageResponse.code_to_name);
    for (let key in languageResponse.code_to_name) {
        nameToCode[languageResponse.code_to_name[key]] = key;
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
    //get source code
    let sourceString = document.getElementById('sourceChoice').value;
    if (!sourceString in nameToCode) {
        console.log("Invalid Source Language");
        return;
    }
    let sourceCode = nameToCode[sourceString];
    //get target code
    let targetString = document.getElementById('targetChoice').value;
    if (!targetString in nameToCode) {
        console.log("Invalid Target Language");
        return;
    }
    let targetCode = nameToCode[targetString];

    if (!source_to_target[sourceCode][targetCode]) {
        console.log("Unsupported Language Pairing");
        return;
    }

    let apiInstance = new LiltNode.MemoriesApi();
    let memories = await apiInstance.getMemory();

    for (let index = 0; index < memories.length; index++) {
        if (memories[index].srclang === sourceCode && memories[index].trglang === targetCode) {
            console.log(memories[index]);
            return;
        }
    }
    console.log("No Memory Found");
}

// Set search button to find memory
window.onload = function() {
    var btn = document.getElementById("languageSearch");
    btn.onclick = listMemories;
}

window.onload = function() {
    try {
        let key = window.localStorage.getItem("LILTAPIKEY");
        console.log(key);
        document.getElementById("APIKeySpan").innerHTML = key;

        document.getElementById("searchButton").onclick = listMemories;

        document.getElementById("APIEdit").onclick = function () {
            location.href = "apikey.html";
        };
    } catch (error) {
        console.log(error);
    }
};


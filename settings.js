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

    if (!(sourceCode in source_to_target) || !source_to_target[sourceCode][targetCode]) {
        console.log("Unsupported Language Pairing");
        return;
    }

    let apiInstance = new LiltNode.MemoriesApi();
    let memories = await apiInstance.getMemory();

    let formString = "<form id='memoryForm'>";
    let found = false;

    for (let index = 0; index < memories.length; index++) {
        if (memories[index].srclang === sourceCode && memories[index].trglang === targetCode) {
            found = true;
            console.log(memories[index]);
            // The ID of the memory as a string
            let memoryId = memories[index].id.toString();
            formString += "<input type='radio' id=" + memoryId + " name=memoryChoice" + " value=" + memoryId + ">"
            formString += "<label for=" + memoryId + " class='memoryLabel'>" + memories[index].name + "</label><br>"
        }
    }
    formString += "</form>"
    document.getElementById("memoryFormDiv").innerHTML=formString;

    if (!found) {
        console.log("No Memory Found");
    }
}

function storeMemoryChoice() {
    let radios = document.getElementsByName('memoryChoice');
    if (radios.length === 0) {
        console.log("No Language Pair Selected");
    }
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            let sourceString = document.getElementById('sourceChoice').value;
            let sourceCode = nameToCode[sourceString];

            let targetString = document.getElementById('targetChoice').value;
            let targetCode = nameToCode[targetString];

            localStorage.setItem(sourceCode + targetCode + "LiltMemory", radios[i].value);
            document.getElementById("memoryFormDiv").innerHTML= sourceString + " to " + targetString + " set to Memory " + radios[i].value;
            document.getElementById("sourceChoice").value="";
            document.getElementById("targetChoice").value="";
            return;
        }
    }
    console.log("No Memory Selected");
}

// Set search button to find memory
window.onload = function() {
    try {
        let key = window.localStorage.getItem("LILTAPIKEY");
        console.log(key);
        document.getElementById("APIKeySpan").innerHTML = key;

        document.getElementById("searchButton").onclick = listMemories;
        document.getElementById("selectButton").onclick = storeMemoryChoice;

        document.getElementById("APIEdit").onclick = function () {
            location.href = "apikey.html";
        };
    } catch (error) {
        console.log(error);
    }
};


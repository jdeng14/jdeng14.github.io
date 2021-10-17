const LiltNode = require('lilt-node');

let memoriesDict = {};

async function translateInput() {
    let originalMessage = document.getElementById("messageInput").value;
    console.log(originalMessage);
    if (originalMessage) {
        let messages_arr = originalMessage.split("\n")
        let option = document.getElementById('languageChoice').value;
        if (!(option in memoriesDict)) {
            console.log("No Option Selected");
            return;
        }
        let translateInfo = memoriesDict[option];
        console.log(translateInfo[2]);
        let translatedMessages = await translateAllMessages(messages_arr, translateInfo[0], translateInfo[1], translateInfo[2]);
        let finalMessage = ""
        for (let index = 0; index < translatedMessages.length; index++) {
            finalMessage = finalMessage.concat(translatedMessages[index]);
            finalMessage = finalMessage.concat("\n");
        }
        document.getElementById("messageOutput").value = finalMessage;
    }
}

async function translateAllMessages(messages, srclang, trglang, memoryId) {
    let defaultClient = LiltNode.ApiClient.instance;
    // Configure API key authorization: ApiKeyAuth
    let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
    // let APIKey = window.sessionStorage.getItem("APIKEY");
    let APIKey = window.localStorage.getItem("LILTAPIKEY");
    if (!APIKey) {
        console.log("No API Key Found");
        return;
    }
    ApiKeyAuth.apiKey = APIKey;
    // Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
    // ApiKeyAuth.apiKeyPrefix = 'Token';
    // Configure HTTP basic authorization: BasicAuth
    let BasicAuth = defaultClient.authentications['BasicAuth'];
    BasicAuth.username = APIKey;
    BasicAuth.password = APIKey;

    let apiInstance = new LiltNode.TranslateApi();

    let promises = []

    for (let index = 0; index < messages.length; index++) {
        let promise = translateSingle(apiInstance, messages[index], srclang, trglang, memoryId);
        promises.push(promise);
    }

    let translatedMessages = await Promise.all(promises);
    return translatedMessages;
}

async function translateSingle(apiInstance, message, srclang, trglang, memoryId) {
    if (message !== "") {
        let registerData = await apiInstance.registerSegment(message, srclang, trglang);
        let opts = {
            'source': message, // String | The source text to be translated.
            'sourceHash': registerData.source_hash, // Number | A source hash code.
            };
        let translateData = await apiInstance.translateSegment(memoryId, opts);
        let translatedMessage = translateData.translation[0].targetWithTags;
        return translatedMessage;
    } else {
        return "";
    }
}

async function setLanguagePairs() {
    let defaultClient = LiltNode.ApiClient.instance;
    // Configure API key authorization: ApiKeyAuth
    let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
    let APIKey = window.localStorage.getItem("LILTAPIKEY");
    if (!APIKey) {
        console.log("No API Key Found");
        return;
    }
    ApiKeyAuth.apiKey = APIKey;
    let BasicAuth = defaultClient.authentications['BasicAuth'];
    BasicAuth.username = APIKey;
    BasicAuth.password = APIKey;

    let apiMemoryInstance = new LiltNode.MemoriesApi();
    let apiLanguageInstance = new LiltNode.LanguagesApi();

    let memories = await apiMemoryInstance.getMemory();
    let languages = await apiLanguageInstance.getLanguages();
    let dict = languages.code_to_name;

    let languagePairs = new Set();
    for (let i = 0; i < memories.length; i++) {
        let memory = memories[i];
        let src = dict[memory.srclang];
        let trg = dict[memory.trglang];
        languagePairs.add(src + " to " + trg);
        let cached = window.localStorage.getItem(memory.srclang + memory.trglang + "LiltMemory");
        if (cached !== null) {
            memoriesDict[src + " to " + trg] = [memory.srclang, memory.trglang, cached];
        } else {
            memoriesDict[src + " to " + trg] = [memory.srclang, memory.trglang, memory.id];
        }
    }

    let options = ""
    for (let pair of languagePairs) {
        options += '<option value="' + pair + '" />';
    }

    document.getElementById('languages').innerHTML = options;
}

setLanguagePairs();

window.onload = function() {
    var btn = document.getElementById("preTranslateButton");
    btn.onclick = translateInput;
}
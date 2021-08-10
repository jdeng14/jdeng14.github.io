"use strict";

var Front = require('@frontapp/plugin-sdk');
var LiltNode = require('lilt-node');
const { connectableObservableDescriptor } = require('rxjs/internal/observable/ConnectableObservable');

let memoriesDict = {};
let frontContext = undefined;

Front.contextUpdates.subscribe(context => {
    switch(context.type) {
      case 'noConversation':
        console.log('No conversation selected');
        break;
      case 'singleConversation':
        console.log("Single Conversation");
        frontContext = context;
        let option = document.getElementById('languageChoice').value;
        if (option in memoriesDict) {
            let translateInfo = memoriesDict[option];
            displayAllMessages(context, translateInfo[0], translateInfo[1], translateInfo[2]);
        } 
        break;
      case 'multiConversations':
        console.log('Multiple conversations selected', context.conversations);
        break;
      default:
        console.error(`Unsupported context type: ${context.type}`);
        break;
    }
  });


async function displayAllMessages(context, src, trg, memoryID) {
    const source = Front.buildCancelTokenSource();
    // Do not wait more than 500ms for the list of messages.
    setTimeout(() => source.cancel(), 500);
    try {
        const list = await context.listMessages(undefined, source.token);

        let nextPageToken = list.token
        const messages = list.results;

        while (nextPageToken) {
            const {results, token} = await context.listMessages(nextPageToken);
            nextPageToken = token;
            messages.push(...results);
        }

        let inner = "";
        for (let index = 0; index < messages.length; index++) {
            console.log(messages[index]);
            inner = inner.concat(messages[index].content.body);
        }
        document.getElementById("originalText").innerHTML = inner;
        let messages_arr = inner.split(/<[^>]*>/)
        let translatedMessages = await translateAllMessages(messages_arr, src, trg, memoryID);
        let tags = inner.match(/<[^>]*>/gi);
        let translatedInner = translatedMessages[0];

        for (let index = 0; index < tags.length; index++) {
            translatedInner = translatedInner.concat(tags[index]);
            translatedInner = translatedInner.concat(translatedMessages[index + 1]);
            translatedInner = translatedInner.concat(" ");
        }
        document.getElementById("translatedText").innerHTML = translatedInner;
        console.log(inner);
        console.log(translatedInner);

    } catch (error) {
        if (Front.isCancelError(error)) {
            return; // Do nothing.
        }
        throw error;
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
        memoriesDict[src + " to " + trg] = [memory.srclang, memory.trglang, memory.id];
    }

    let options = ""
    for (let pair of languagePairs) {
        options += '<option value="' + pair + '" />';
    }

    document.getElementById('languages').innerHTML = options;
}

setLanguagePairs();

$(document).on('change', 'input', function(){
    var options = $('datalist')[0].options;
    var val = $(this).val();
    for (var i=0;i<options.length;i++){
       if (options[i].value === val) {;
            let option = $(this).val();
            if (option in memoriesDict) {
                let translateInfo = memoriesDict[option];
                let src = translateInfo[0];
                let trg = translateInfo[1];
                let memoryID = translateInfo[2];
                if (frontContext) {
                    displayAllMessages(frontContext, src, trg, memoryID);
                }
            }
       }
    }
});
"use strict";

var Front = require('@frontapp/plugin-sdk');
var LiltNode = require('lilt-node');
const { connectableObservableDescriptor } = require('rxjs/internal/observable/ConnectableObservable');

let originalMessageID = undefined;
let memoriesDict = {};
let frontContext = undefined;

Front.contextUpdates.subscribe(context => {
    switch(context.type) {
      case 'noConversation':
        console.log('No conversation selected');
        break;
      case 'singleConversation':
        console.log("Single Conversation");
        setMessageID(context);
        frontContext = context;
        break;
      case 'multiConversations':
        console.log('Multiple conversations selected', context.conversations);
        break;
      default:
        console.error(`Unsupported context type: ${context.type}`);
        break;
    }
  });

async function setMessageID(context) {
    const source = Front.buildCancelTokenSource();
    // Do not wait more than 500ms for the list of messages.
    setTimeout(() => source.cancel(), 500);
    try {
        const list = await context.listMessages(undefined, source.token);

        let nextPageToken = list.token;
        const messages = list.results;

        while (nextPageToken) {
            const {results, token} = await context.listMessages(nextPageToken);
            nextPageToken = token;
            messages.push(...results);
        }

        originalMessageID = messages[messages.length - 1].id;

    } catch (error) {
        if (Front.isCancelError(error)) {
            return; // Do nothing.
        }
        throw error;
    }
}
async function sendTranslatedMessage() {
    let originalMessage = document.getElementById("messageInput").value;
    if (originalMessage) {
        let messages_arr = originalMessage.split("\n")
        let option = document.getElementById('languageChoice').value;
        if (option in memoriesDict) {
            console.log("No Option Selected");
        } 
        let translateInfo = memoriesDict[option];
        let translatedMessages = await translateAllMessages(messages_arr, translateInfo[0], translateInfo[1], translateInfo[2]);
        let finalMessage = ""
        for (let index = 0; index < translatedMessages.length; index++) {
            finalMessage = finalMessage.concat(translatedMessages[index]);
            finalMessage = finalMessage.concat("\n");
        }
        if (originalMessageID && frontContext) {
            const draft = await frontContext.createDraft({
                content: {
                  body: finalMessage,
                  type: 'text'
                },
                replyOptions: {
                  type: 'reply',
                  originalMessageId: originalMessageID
                }
            });

            let instantTranslationTagID = await getInstantTranslationTagID();
            if (instantTranslationTagID) {
                await frontContext.tag([instantTranslationTagID], undefined);
            }
        } else {
            console.log("No Conversation Selected");
        }
    } else {
        console.log("No message entered");
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
    };
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

async function getInstantTranslationTagID() {
    const source = Front.buildCancelTokenSource();
    // Do not wait more than 500ms for the list of messages.
    setTimeout(() => source.cancel(), 500);
    try {
        const list = await frontContext.listTags(undefined, undefined);

        let nextPageToken = list.token;
        const tags = list.results;

        while (nextPageToken) {
            const {results, token} = await frontContext.listTags(nextPageToken);
            nextPageToken = token;
            tags.push(...results);
        }

        for (let index = 0; index < tags.length; index++) {
            if (tags[index].name === "Instant Translation") {
                return tags[index].id;
            }
        }

        return null;

    } catch (error) {
        if (Front.isCancelError(error)) {
            return; // Do nothing.
        }
        throw error;
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

window.onload = function() {
    var btn = document.getElementById("sendButton");
    btn.onclick = sendTranslatedMessage;
}
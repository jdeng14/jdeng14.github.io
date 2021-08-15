"use strict";

var Front = require('@frontapp/plugin-sdk');
var LiltNode = require('lilt-node');
const { connectableObservableDescriptor } = require('rxjs/internal/observable/ConnectableObservable');

let memoriesDict = {};
let frontContext = undefined;
let originalMessageID = undefined;

Front.contextUpdates.subscribe(context => {
    switch(context.type) {
      case 'noConversation':
        console.log('No conversation selected');
        break;
      case 'singleConversation':
        console.log("Single Conversation");
        setMessageID(context);
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

async function displayAllMessages(context, src, trg, memoryID) {
    console.log(memoryID);
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

async function sendTranslatedMessage() {
    console.log(memoryID);
    let originalMessage = document.getElementById("messageInput").value;
    if (originalMessage) {
        let messages_arr = originalMessage.split("\n")
        let option = document.getElementById('languageChoice').value;
        if (!(option in memoriesDict)) {
            console.log("No Option Selected");
            return;
        }
        let reverseOptionArr = option.split(" to "); 
        let reverseOption = reverseOptionArr[1] + " to " + reverseOptionArr[0];
        let translateInfo = memoriesDict[reverseOption];
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
        let splitPair = pair.split(" to ");

        if (languagePairs.has(splitPair[1] + " to " + splitPair[0])) {
            options += '<option value="' + pair + '" />';
        }
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

window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
      return; // Do nothing if the event was already processed
    }
  
    switch (event.key) {
        case "r":
            window.scrollTo(0, 0);;
            break;
        case "s":
            window.scrollTo(0, document.body.scrollHeight);
            break;
        case "m":
            window.location.href = "manual.html";;
            break;
        case "c":
            window.location.href = "settings.html";;
            break;
        default:
            return; // Quit when this doesn't handle the key event.
    }
  
    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
  }, true);

window.onload = function() {
    var btn = document.getElementById("sendButton");
    btn.onclick = sendTranslatedMessage;
}
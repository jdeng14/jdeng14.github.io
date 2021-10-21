"use strict";

const Front = require('@frontapp/plugin-sdk');
const LiltNode = require('lilt-node');
const fetch = require('isomorphic-fetch');
const https = require('https');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

const serverAddress = "https://35.222.127.59:80";

// Dictionary that maps string of format "src to trg" to array of [src, trg, memoryID]
let memoriesDict = {};
// Stores the current Front context
let frontContext = undefined;
// Stores the original message ID
let originalMessageID = undefined;

// Get the most current Front context
Front.contextUpdates.subscribe(context => {
    switch(context.type) {
      case 'noConversation':
        break;
      case 'singleConversation':
        setMessageID(context);
        frontContext = context;
        // Get user's language pair choice
        let option = document.getElementById('languageChoice').value;
        if (option in memoriesDict) {
            let translateInfo = memoriesDict[option];
            displayAllMessages(context, translateInfo[0], translateInfo[1], translateInfo[2]);
        } 
        break;
      case 'multiConversations':
        break;
      default:
        console.error(`Unsupported context type: ${context.type}`);
        break;
    }
  });

/*
Description: Sets global variable "originalMessageID" to 
    the last message id in the current context
Args: 
    context: The current Front context
Returns:
    None
*/
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

/*
Description: Sets "translatedText" div to the translated text of the last message
    in the current Front context
Args: 
    context: The current Front context
    src: The source language ID
    trg: The target language ID
    memoryID: The memory ID
Returns:
    None
*/
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

        let inner = messages[messages.length - 1].content.body;
        let messages_arr = inner.split(/<[^>]*>/)
        let translatedMessages = await translateAllMessages(messages_arr, src, trg, memoryID);
        let tags = inner.match(/<[^>]*>/gi);
        let translatedInner = translatedMessages[0];
        if (tags) {
            for (let index = 0; index < tags.length; index++) {
                translatedInner = translatedInner.concat(tags[index]);
                translatedInner = translatedInner.concat(translatedMessages[index + 1]);
                translatedInner = translatedInner.concat(" ");
            }
        }
        document.getElementById("translatedText").innerHTML = translatedInner;

    } catch (error) {
        if (Front.isCancelError(error)) {
            return; // Do nothing.
        }
        throw error;
    }
}

/*
Description: Uses instant translation to translate the input and post in Front as a draft
Args: 
    None
Returns:
    None
*/
async function sendTranslatedMessage() {
    let originalMessage = document.getElementById("messageInput").value;
    if (originalMessage) {
        let messages_arr = originalMessage.split("\n")
        let option = document.getElementById('languageChoice').value;
        if (!(option in memoriesDict)) {
            handleError("No Option Selected");
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
            handleError("No Conversation Selected");
        }
    } else {
        handleError("No message entered");
    }
}

/*
Description: Uses HTL translation to translate the input and post in Front as a reply
Args: 
    None
Returns:
    None
*/
async function sendVerifiedTranslatedMessage() {
    let originalMessage = document.getElementById("messageInput").value;
    if (originalMessage) {
        let option = document.getElementById('languageChoice').value;
        if (!(option in memoriesDict)) {
            handleError("No Option Selected");
            return;
        }
        let reverseOptionArr = option.split(" to "); 
        let reverseOption = reverseOptionArr[1] + " to " + reverseOptionArr[0];
        let translateInfo = memoriesDict[reverseOption];

        const url = serverAddress + '/front/reply/' + frontContext.conversation.id;
        let bodyParams = {
            message: originalMessage,
            memoryID: translateInfo[2],
            LiltAPIKey: window.localStorage.getItem("LILTAPIKEY")
        }
        const options = {
            method: 'POST',
            body: JSON.stringify(bodyParams),
            headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
            agent: httpsAgent,
        };

        fetch(url, options)
        .then(res => res.json())
        .catch(err => handleError('error:' + err));
    } else {
        handleError("No message entered");
    }
}

/*
Description: Uses HTL translation to translate a message and post in Front as a comment
Args: 
    None
Returns:
    None
*/
async function readVerifiedTranslatedMessage() {
    try {
        const list = await context.listMessages(undefined, source.token);

        let nextPageToken = list.token
        const messages = list.results;

        while (nextPageToken) {
            const {results, token} = await context.listMessages(nextPageToken);
            nextPageToken = token;
            messages.push(...results);
        }

        let originalMessage = messages[messages.length - 1].content.body;

        let option = document.getElementById('languageChoice').value;
        let translateInfo = memoriesDict[option];

        const url = serverAddress + '/front/comment/' + frontContext.conversation.id;
        let bodyParams = {
            message: originalMessage,
            memoryID: translateInfo[2],
            LiltAPIKey: window.localStorage.getItem("LILTAPIKEY")
        }
        const options = {
            method: 'POST',
            body: JSON.stringify(bodyParams),
            headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
            agent: httpsAgent,
        };

        fetch(url, options)
        .then(res => res.json())
        .catch(err => handleError('error:' + err));

    } catch (error) {
        if (Front.isCancelError(error)) {
            return; // Do nothing.
        }
        throw error;
    }
}

/*
Description: Gets the Front tag corresponding to an instant translation
Args: 
    None
Returns:
    None
*/
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

/*
Description: Translates an array of messages
Args: 
    messages: An array of messages to be translated
    srclang: The source language identifier
    trglang: The target language identifier
    memoryID: The Lilt memory identifier
Returns:
    translatedMessages: An array of the translated messages
*/
async function translateAllMessages(messages, srclang, trglang, memoryId) {
    let defaultClient = LiltNode.ApiClient.instance;
    // Configure API key authorization: ApiKeyAuth
    let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
    // let APIKey = window.sessionStorage.getItem("APIKEY");
    let APIKey = window.localStorage.getItem("LILTAPIKEY");
    if (!APIKey) {
        handleError("No API Key Found");
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

/*
Description: Sets "translatedText" div to the translated text of the last message
    in the current Front context
Args: 
    apiInstance: The current Lilt API instance
    message: The single message to be translated
    srclang: The source language identifier
    trglang: The target language identifier
    memoryID: The Lilt memory identifier
Returns:
    translatedMessage: The translated message in a string
*/
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

/*
Description: Sets language pair dropdown to each possible language pair where
    The user has a memory for both directions 
Args: 
    None
Returns:
    None
*/
async function setLanguagePairs() {
    let defaultClient = LiltNode.ApiClient.instance;
    // Configure API key authorization: ApiKeyAuth
    let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
    let APIKey = window.localStorage.getItem("LILTAPIKEY");
    if (!APIKey) {
        handleError("No API Key Found");
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

function handleError(errorMessage) {
    console.log(errorMessage);
}

// Change message displayed when new language pair is selected
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

// Add hotkeys
window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
      return; // Do nothing if the event was already processed
    }
    if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
            case "r":
                window.scrollTo(0, 0);
                return true;
                break;
            case "s":
                window.scrollTo(0, document.body.scrollHeight);
                return true;
                break;
            case "m":
                window.location.href = "manual.html";
                return true;
                break;
            case "c":
                window.location.href = "settings.html";
                return true;
                break;
            default:
                return; // Quit when this doesn't handle the key event.
        }
    }
    return false;

    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
  }, true);

window.onload = function() {
    // Set language pair options in drop-down menu
    setLanguagePairs();
    // Change buttons to corresponding functions
    var sendButton = document.getElementById("sendButton");
    sendButton.onclick = sendTranslatedMessage;

    var verifyReadButton = document.getElementById("verifyReadButton");
    verifyReadButton.onclick = readVerifiedTranslatedMessage;

    var verifySendButton = document.getElementById("verifySendButton");
    verifySendButton.onclick = sendVerifiedTranslatedMessage;
}
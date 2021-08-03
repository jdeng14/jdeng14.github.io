"use strict";

var Front = require('@frontapp/plugin-sdk');
var LiltNode = require('lilt-node');
const { connectableObservableDescriptor } = require('rxjs/internal/observable/ConnectableObservable');

let originalMessageID = undefined;
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
        let messages = []
        messages.push(originalMessage);
        let translatedMessages = await translateAllMessages(messages, "en", "es", 60312);
        let translatedMessage = translatedMessages[0];
        if (originalMessageID && frontContext) {
            const draft = await frontContext.createDraft({
                content: {
                  body: translatedMessage,
                  type: 'text'
                },
                replyOptions: {
                  type: 'reply',
                  originalMessageId: originalMessageID
                }
            });
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
    let APIKey = "2b6d066afe38cf67ff04e0c0f6c2b674";
    ApiKeyAuth.apiKey = APIKey;
    // Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
    // ApiKeyAuth.apiKeyPrefix = 'Token';
    // Configure HTTP basic authorization: BasicAuth
    let BasicAuth = defaultClient.authentications['BasicAuth'];
    BasicAuth.username = APIKey;
    BasicAuth.password = APIKey;

    let apiInstance = new LiltNode.TranslateApi();

    let translatedMessages = []
    for (let index = 0; index < messages.length; index++) {
        let translated = await translateSingle(apiInstance, messages[index], srclang, trglang, memoryId);
        translatedMessages.push(translated);
    }
    return translatedMessages;
}

async function translateSingle(apiInstance, message, srclang, trglang, memoryId) {
    let registerData = await apiInstance.registerSegment(message, srclang, trglang);
    let opts = {
        'source': message, // String | The source text to be translated.
        'sourceHash': registerData.source_hash, // Number | A source hash code.
        };
    let translateData = await apiInstance.translateSegment(memoryId, opts);
    let translatedMessage = translateData.translation[0].targetWithTags;
    console.log(translatedMessage);
    return translatedMessage;
}

window.onload = function() {
    var btn = document.getElementById("sendButton");
    btn.onclick = sendTranslatedMessage;
}
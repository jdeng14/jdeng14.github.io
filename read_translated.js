"use strict";

var Front = require('@frontapp/plugin-sdk');
var LiltNode = require('lilt-node')

Front.contextUpdates.subscribe(context => {
    switch(context.type) {
      case 'noConversation':
        console.log('No conversation selected');
        break;
      case 'singleConversation':
        console.log("Single Conversation");
        document.getElementById("translatedText").innerHTML = "Loading...";
        listAllMessages(context);
        break;
      case 'multiConversations':
        console.log('Multiple conversations selected', context.conversations);
        break;
      default:
        console.error(`Unsupported context type: ${context.type}`);
        break;
    }
  });


async function listAllMessages(context) {
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
        let translatedMessages = await translateAllMessages(messages_arr, "en", "es", 60312);
        let tags = inner.match(/<[^>]*>/gi);
        let translatedInner = translatedMessages[0];

        for (let index = 0; index < tags.length; index++) {
            translatedInner = translatedInner.concat(tags[index]);
            translatedInner = translatedInner.concat(translatedMessages[index + 1]);
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
        if (messages[index] !== "") {
            let translated = await translateSingle(apiInstance, messages[index], srclang, trglang, memoryId);
            translatedMessages.push(translated);
        } else {
            translatedMessages.push("")
        }
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
    return translatedMessage;
}
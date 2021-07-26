"use strict";

var Front = require('@frontapp/plugin-sdk');
var LiltNode = require('lilt-node')
require('dotenv').config();

Front.contextUpdates.subscribe(context => {
    switch(context.type) {
      case 'noConversation':
        console.log('No conversation selected');
        break;
      case 'singleConversation':
        // console.log(listAllMessages());
        console.log("Single Conversation");
        break;
      case 'multiConversations':
        console.log('Multiple conversations selected', context.conversations);
        break;
      default:
        console.error(`Unsupported context type: ${context.type}`);
        break;
    }
  });


async function listAllMessages() {
    const source = buildCancelTokenSource();
    // Do not wait more than 500ms for the list of messages.
    setTimeout(() => source.cancel(), 500);
    try {
        const list = await Front.listMessages(undefined, source.token);

        let nextPageToken = list.token
        const messages = list.results;

        while (nextPageToken) {
            const {results, token} = await listMessages(nextPageToken);
            nextPageToken = token;
            messages.push(...results);
        }

        return messages;
    } catch (error) {
        if (isCancelError(error)) {
            return; // Do nothing.
        }
        throw error;
    }
}


async function translateSingleMessage() {
    let defaultClient = LiltNode.ApiClient.instance;
    // Configure API key authorization: ApiKeyAuth
    let ApiKeyAuth = defaultClient.authentications['ApiKeyAuth'];
    ApiKeyAuth.apiKey = "2b6d066afe38cf67ff04e0c0f6c2b674";
    //ApiKeyAuth.apiKey = process.env.API_KEY; Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
    // ApiKeyAuth.apiKeyPrefix = 'Token';
    // Configure HTTP basic authorization: BasicAuth
    let BasicAuth = defaultClient.authentications['BasicAuth'];
    BasicAuth.username = "2b6d066afe38cf67ff04e0c0f6c2b674";
    BasicAuth.password = "2b6d066afe38cf67ff04e0c0f6c2b674";

    let apiInstance = new LiltNode.TranslateApi();
    let srclang = "en"; // String | An ISO 639-1 language code.
    let trglang = "es"; // String | An ISO 639-1 language code.
    let memoryId = 60312; // Number | A unique Memory identifier.

    messages = listAllMessages();
    for (const message in messages) {
        apiInstance.registerSegment(message, srclang, trglang).then((registerData) => {
            let opts = {
                'source': message, // String | The source text to be translated.
                'sourceHash': registerData.source_hash, // Number | A source hash code.
                };
            apiInstance.translateSegment(memoryId, opts).then((translateData) => {
                // console.log('API called successfully. Returned data: ' + data);
                console.log(translateData);
                document.getElementById("translatedText").innerHTML = translateData.translation[0].targetWithTags;
            }, (error) => {
                console.error(error);
            });
        }, (error) => {
            console.error(error);
        });
    }
}

// translateSingleMessage();
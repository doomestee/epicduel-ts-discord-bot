import { reserialize } from "../../../util/XML.js";
import type SmartFoxClient from "../SFSClient.js";

export default class ExtHandler {
    client: SmartFoxClient;

    constructor(sfs: SmartFoxClient) {
        this.client = sfs;
    }

    handleMessage(msgObj: any, type: "xml" | "json" | "str") {
        //const roomId = 0;

        if (type === "xml") {
            const xmlData = msgObj;
            const [action] = [xmlData.body['@action']];

            if (action === "xtRes") {
                // TODO: come back and check this cos this is def 99% wrong
                //const xmlStr = xmlData.body.toString();
                //const asObj = deserialize(xmlStr);

                // Made into variable to enable diagnosis
                let reserialised = reserialize(xmlData.body);

                return this.client.emit("onExtensionResponse", { dataObj: reserialised, type });//new SFSEvent("onExtensionResponse", {dataObj: reserialised, type: type}));
            }
        } else if (type == "json") {
            return this.client.emit("onExtensionResponse", { dataObj: msgObj.o, type });//this.client.emit("onExtensionResponse", new SFSEvent("onExtensionResponse", {dataObj: msgObj.o, type: type}));
        } else if (type == "str") {
            return this.client.emit("onExtensionResponse", { dataObj: msgObj, type });//this.client.emit("onExtensionResponse", new SFSEvent("onExtensionResponse", {dataObj: msgObj, type: type}));
        }
    }
}
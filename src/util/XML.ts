import { XMLBuilder, XMLParser } from "fast-xml-parser";
import dot from "dot-object";
dot.keepArray = true;

//#region bloats
let ascTab = {
    ">": "&gt;",
    "<": "&lt;",
    "&": "&amp;",
    "\'": "&apos;",
    "\"": "&quot;",
} as { [x: string]: string };

let ascTabRev = {
    "&gt;": ">",
    "&lt;": "<",
    "&amp;": "&",
    "&apos;": "\'",
    "&quot;": "\"",
} as { [x: string]: string };

let hexTable = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "A": 10,
    "B": 11,
    "C": 12,
    "D": 13,
    "E": 14,
    "F": 15,
} as { [x: string]: number };

let tabs = "\t\t\t\t\t\t\t\t\t\t\t\t\t";
//#endregion

function getCharCode(ent='') {
    let hex = ent.substring(3, ent.length);
    hex = hex.substring(0, hex.length - 1);
    return Number("0x" + hex);
}

//#region xml stuff
export function encodeEntities(st='') {
    let strbuff = '';
    
    for (let i = 0; i < st.length; i++) {
        let ch = st.charAt(i);
        let cod = st.charCodeAt(i);
        if (cod == 9 || cod == 10 || cod == 13) strbuff += ch;
        else if (cod >= 32 && cod <= 126) {
            if (ascTab[ch] != null) strbuff += ascTab
            else strbuff += ch;
        } else strbuff += ch;
    }

    return strbuff;
}

export function decodeEntities(st='') {
    let strbuff = '';

    let i = 0;
    while (i < st.length) {
        let ch = st.charAt(i);
        if (ch == '&') {
            let ent = ch;

            do {
                i++;
                ch = st.charAt(i);
                ent += ch;
            } while (ch != ';' && i < st.length);

            let item = ascTabRev[ent];

            if (item != null) strbuff += item;
            else strbuff += String.fromCharCode(getCharCode(ent));
        } else strbuff += ch;
        i++;
    } return strbuff;
}

export function xml2js(xmlString: string, dataObj = false) : { [x: string]: any } {

    // Idk, apparently according to docs, you need to use an XMLParser each time separately.

    let str = xmlString;
    let execption = false;

    let obj = {};

    // Lazy fix for now

    if (xmlString.startsWith("<msg t='sys'><body action='pubMsg'")) {
        execption = true;
        str = xmlString.slice(0, xmlString.indexOf("CDATA[")) + "CDATA['" + xmlString.slice(xmlString.indexOf("CDATA[") + 6, xmlString.indexOf("]]></txt>")) + "'" + xmlString.slice(xmlString.indexOf("]]></txt>"));
    }

    function loopThrough(obj: Record<string, any>, refObj: Record<string, any>, skipProps: string, isArray=false) {
        let returnResult = null;
        if (isArray) {
            refObj = {};
        }

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let item = obj[key];

                if (refObj[skipProps] == null) refObj[skipProps] = {};
                if (Array.isArray(item)) {
                    refObj[skipProps][key] = [];
                    for (let i = 0; i < item.length; i++) {

                        refObj[skipProps][key].push(loopThrough(item[i], refObj, '', true));
                    }
                } else if (typeof item == 'object') {
                    loopThrough(item, refObj, skipProps + '.' + key);
                } else if (typeof item == 'string') {
                    if (item.startsWith('<')) {
                        returnResult = innerParse(item, refObj[skipProps][key], skipProps + '.' + key);

                    } else {
                        refObj[skipProps][key] = item;
                        returnResult = item;
                    }
                } else {
                    refObj[skipProps][key] = item;
                    returnResult = item;
                }
            }
        }

        return (isArray) ? refObj[skipProps] : refObj;
    }


    let idk = {};

    /**
     * @param {string} xml STRING ONLY
     * @param {Object} refObj If passed, refObj will be modified. If not passed, a new object will be created and returned.
     */
    function innerParse(xml='', refObj: Record<string, any>, skipProps='') {
        if (refObj === undefined) refObj = {};

        let parser = new XMLParser({
            ignoreAttributes: false, attributeNamePrefix: '@', parseTagValue: true, cdataPropName: '__cdata', isArray: (tag, jpath, leafnode, attribute) => {
                if (tag === "vars" && !leafnode) return true;//jpath.slice(jpath.lastIndexOf("vars") + 5) === "") return true;))
                if (tag === "var") return true;
                if (tag === "obj") return true;

                return false;
                //else return true;
            }
        });

        let xmlObj = parser.parse(xml);

        for (let key in xmlObj) {
            if (typeof xmlObj[key] == 'object') {

                let a = loopThrough(xmlObj[key], refObj, ((skipProps) ? skipProps + '.' : '') + key);

                refObj = {...refObj, ...a};
                idk = {...idk, ...a};
            } else {
                if (typeof xmlObj[key] == 'string' && xmlObj[key].startsWith('<')) {
                    // LOOP THROUGH THE STRING WITH XML INSIDE xmlObj[key];
                    refObj[key] = {};
                    innerParse(xmlObj[key], refObj);
                } else refObj[key] = xmlObj[key];
            }
        }

        return refObj;
    }
    
    innerParse(str, obj);

    let result = dot.dot(idk);
    let finalresult = {} as Record<string, string>;

    for (let i in result) {
        // Each item represents the key of the object, the loop must remove ".__cdata" from the key. Then update the finalresult object with the new key and the value.
        finalresult[i.replace('.__cdata', '')] = (execption && i.includes('.__cdata')) ? result[i].slice(1, -1) : result[i];
    }

    if (dataObj) {
        let reallyfinalresult = {} as Record<string, any>;
            let index = -1;

        for (let i in finalresult) {
            if (i.includes("dataObj") && index < i.indexOf("dataObj")) index = i.indexOf("dataObj");
        }

        if (index === -1) return dot.object(finalresult);

        // idk but i got pissed and i cba optimising the code now

        for (let i in finalresult) {
            if (i.includes("dataObj")) {
                let thing = i.substring(index + "dataObj".length);

                if (thing.startsWith(".")) thing = thing.substring(1);

                reallyfinalresult[thing] = finalresult[i];
            }
        }

        reallyfinalresult = dot.object(reallyfinalresult);

        let finalfinalresult = {};

        const sussy = (obj: Record<string, any>, trgObj: Record<string, any>, depth=0) => {
            for (let y in obj) {
                if (y === "obj") {
                    for (let t in obj[y]) {
                        const [name, type] = [obj[y][t]['@o'], obj[y][t]['@t']];

                        if (type === "a") trgObj[name] = [];
                        else if (type === "o") trgObj[name] = {};

                        sussy(obj[y][t], trgObj[name], depth + 1);
                    }
                } else if (y === "var") {
                    for (let t in obj[y]) {
                        const [vName, vType, vValue] = [obj[y][t]['@n'], obj[y][t]['@t'], obj[y][t]['#text']];

                        if (vType === "b") trgObj[vName] = vValue === "0";
                        else if (vType === "n") trgObj[vName] = Number(vValue);
                        else if (vType === "s") trgObj[vName] = vValue;
                        else if (vType === "x") trgObj[vName] = null;
                    }
                }
            }
        }

        sussy(reallyfinalresult, finalfinalresult);

        return finalfinalresult;
    }

    return dot.object(finalresult);
    //return innerParse(xmlString, obj);

    

    //for (let i in parsed) {
        /*if (typeof parsed[i] == 'object') {
            obj[i] = parsed[i];
        } else {
            if (typeof obj[i] == 'string' && (obj[i].startsWith("<") || obj[i].endsWITH(">"))) 
            obj[i] = parsed[i];
        }*/
    //}
}

export function obj2xml(srcObj: Record<string, any>, trgObj: Record<string, any>, depth = 0, objName = "") {
    if (depth === 0) trgObj.xmlStr = "<dataObj>";
    else {
        let ot = (Array.isArray(srcObj)) ? "a" : "o";
        trgObj.xmlStr += "<obj t=\'" + ot + "\' o=\'" + objName + "\'>";
    }

    for (let i in srcObj) {
        let t = typeof srcObj[i] as string;
        let o = srcObj[i];

        if (t === "boolean" || t == "number" || t == "string" || o === null) {
            if (t === "boolean") o = Number(t);
            else if (t == null) {
                t = 'x'; o = '';
            } else if (t == "string") o = encodeEntities(o);

            trgObj.xmlStr += "<var n=\'" + i + "\' t=\'" + t.substring(0, 1) + "\'>" + o + "</var>";
        } else if (t === "object") {
            obj2xml(o, trgObj, depth + 1, i);
            trgObj.xmlStr += "</obj>";
        }
    }

    if (depth === 0) trgObj.xmlStr += "</dataObj>";
}

export function obj2xml2(srcObj: Record<string, any>) {
    let test = new XMLBuilder({ignoreAttributes: false, attributeNamePrefix: '@', cdataPropName: '__cdata'});

    return test.build(srcObj);
}
//#endregion

export function deserialize(xmlStr: string, convertDataObj = false) : { [x: string]: any } {
    let result = undefined;
    try {
        result = xml2js(xmlStr, convertDataObj);
    } catch (err) {
        console.log(xmlStr);
        console.error(err);

        result = {};
    }
    return result;
}

export function serialize(obj: { [x: string]: any }) {
    const result = {} as { xmlStr: string };
    obj2xml(obj, result);

    return result.xmlStr;
}

export function reserialize(obj: { [x: string]: any }) {
    const result = (obj2xml2(obj));

    return xml2js(result, true);
}
import { JsonConverter, JsonCustomConvert } from "json2typescript";
@JsonConverter
export class StringOrStringArrayConverter
    implements JsonCustomConvert<string | string[]>
{
    serialize(data: string | string[]): any {
        return data;
    }

    deserialize(json: any): string | string[] {
        if (Array.isArray(json)) {
            return json.map((item) => String(item));
        } else {
            return String(json);
        }
    }
}
@JsonConverter
export class NumberOrNumberArrayConverter
    implements JsonCustomConvert<number | number[]>
{
    serialize(data: number | number[]): any {
        return data;
    }

    deserialize(json: any): number | number[] {
        if (Array.isArray(json)) {
            return json.map((item) => Number(item));
        } else {
            return Number(json);
        }
    }
}

@JsonConverter
export class ForceNumberArray implements JsonCustomConvert<number | number[]> {
    serialize(data: number[]): any {
        return data.length > 1 ? data : data.length > 0 ? data[0] : undefined;
    }

    deserialize(json: any): number[] {
        if (Array.isArray(json)) {
            return json.map((item) => Number(item));
        } else {
            return [Number(json)];
        }
    }
}
@JsonConverter
export class ForceStringArray implements JsonCustomConvert<string | string[]> {
    serialize(data: string[]): any {
        return data.length > 1 ? data : data.length > 0 ? data[0] : [];
    }

    deserialize(json: any): string[] {
        if (Array.isArray(json)) {
            return json.map((item) => String(item));
        } else {
            return [String(json)];
        }
    }
}

@JsonConverter
export class UniqueString implements JsonCustomConvert<string> {
    static uniqueStrings: Set<string> = new Set<string>();
    static reset() {
        UniqueString.uniqueStrings = new Set<string>();
    }
    static getUniqueStringWithForm(first: string, last: string): string {
        let uniqueString = `${first}${randomFiveDigits()}${last}`;
        while (UniqueString.uniqueStrings.has(uniqueString)) {
            // console.log("Duplicate String", uniqueString);
            uniqueString = `${first}${randomFiveDigits()}${last}`;
        }
        return uniqueString;
    }
    serialize(data: string): any {
        return data;
    }

    deserialize(json: any): string {
        const convertedString = String(json).toString();
        // if (UniqueString.uniqueStrings.has(convertedString)) {
        //     console.log("Duplicate String", convertedString);
        // }
        UniqueString.uniqueStrings.add(convertedString);
        return convertedString;
    }
}

@JsonConverter
export class LowerCaseString implements JsonCustomConvert<string> {
    serialize(data: string): any {
        return data;
    }
    deserialize(data: any): string {
        return String(data).toLowerCase();
    }
}

const randomFiveDigits = () => {
    return Math.floor(10000 + Math.random() * 90000);
};

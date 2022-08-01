import { isEmpty } from "lodash";

export const generateScanFileName = () => {
    return 'ScanFile' + (Math.floor((Math.random() * 10000) + 100000));
}

export const convertRawOptions = (rawOptions, isSwapKeyValue = false) => {
    return isEmpty(rawOptions) ? [] : Object.keys(rawOptions).map((key) => {
        return isSwapKeyValue ? { value: rawOptions[key], display: key } : { value: key, display: rawOptions[key] };
    })
}

export const renderOptions = (options) => {
    return isEmpty(options) ? [] : options;
}

export const defaultOptionsValue = (options) => {
    return options.length > 0 && !isEmpty(options[0]) ? options[0].value : 0;
}
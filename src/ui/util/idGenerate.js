/**
* generateUUID 生成UUID
* @returns {string} 返回字符串
*/
export const generateUUID = () => {
    let d = new Date().getTime();
    let uuid = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
    });
    return uuid;
}
/**
* generateUUID 生成 FileId
* @returns {string} 返回字符串
*/
export const generateFileID = () => {
    let s = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0;i < 36;i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    let uuid = s.join("");
    let result = uuid.replace(/-/g, "");
    return result;
}

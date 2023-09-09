import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const JSONFileName = "./Update.json";
const JSFileName = "./XMOJ.user.js";
var JSONFileContent = readFileSync(JSONFileName, "utf8");
var JSFileContent = readFileSync(JSFileName, "utf8");
var JSONObject = JSON.parse(JSONFileContent);

var LastJSONVersion = Object.keys(JSONObject.UpdateHistory)[Object.keys(JSONObject.UpdateHistory).length - 1];
var LastJSVersion = JSFileContent.match(/@version\s+(\d+\.\d+\.\d+)/)[1];
var LastVersion = LastJSVersion.split(".");
var LastPR = JSONObject.UpdateHistory[LastJSONVersion].UpdateContents[0].PR;
var LastDescription = JSONObject.UpdateHistory[LastJSONVersion].UpdateContents[0].Description;
console.log("Last JS version    : " + LastJSVersion);
console.log("Last JSON version  : " + LastJSONVersion);
console.log("Last PR            : " + LastPR);
if (LastJSONVersion.split(".")[2] != LastJSVersion.split(".")[2]) {
    console.error("XMOJ.user.js and Update.json have different patch versions.");
    process.exit(1);
}

var CurrentVersion = LastVersion[0] + "." + LastVersion[1] + "." + (parseInt(LastVersion[2]) + 1);
var CurrentPR = Number(process.argv[2]);
var CurrentDescription = String(process.argv[3]);
if (LastPR == CurrentPR) {
    CurrentVersion = LastJSONVersion;
}

console.log("Last description   : " + LastDescription);
console.log("Current version    : " + CurrentVersion);
console.log("Current PR         : " + CurrentPR);
console.log("Current description: " + CurrentDescription);

let CommitMessage = "";
if (LastPR == CurrentPR) {
    console.warn("Warning: PR is the same as last version.");
    JSONObject.UpdateHistory[CurrentVersion].UpdateDate = Date.now();
    JSONObject.UpdateHistory[CurrentVersion].UpdateContents[0].Description = CurrentDescription;
    CommitMessage = "Update time and description of " + CurrentVersion;
}
else {
    JSONObject.UpdateHistory[CurrentVersion] = {
        "UpdateDate": Date.now(),
        "Prerelease": true,
        "UpdateContents": [{
            "PR": CurrentPR,
            "Description": CurrentDescription
        }]
    };
    writeFileSync(JSFileName, JSFileContent.replace(/@version(\s+)\d+\.\d+\.\d+/, "@version$1" + CurrentVersion), "utf8");
    console.warn("XMOJ.user.js has been updated.");
    CommitMessage = "Update version info to " + CurrentVersion;
}
console.log("Commit message     : " + CommitMessage);

writeFileSync(JSONFileName, JSON.stringify(JSONObject, null, 4), "utf8");

console.warn("Update.json has been updated.");

if (LastPR != CurrentPR) {
    console.log("Pushing to GitHub...");
    execSync("git config --global user.email \"github-actions[bot]@users.noreply.github.com\"");
    execSync("git config --global user.name \"github-actions[bot]\"");
    execSync("git commit -a -m \"" + CommitMessage + "\"");
    execSync("git push");
    console.log("Pushed to GitHub.");
}

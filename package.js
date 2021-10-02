/**
 * authors: - Wulv
 *          - Revingly
*/

const { Mod } = require("./src/mod.js");

ModLoader.onLoad[Mod.modName] = Mod.load;
HttpServer.onRespond["IMAGE"] = Mod.getImage;

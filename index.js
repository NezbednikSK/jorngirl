const IRC = require("irc-framework");
const Discord = require("discord.js");
const config = require("./config.json");

var handler_discord = function(msg) {};
var handler_irc = function(msg) {};
var bot = new IRC.Client();
bot.connect({
    host: config.server,
    port: config.port,
    nick: config.account
});

var client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]
});
client.on("ready", () => {
    console.log("Discord ready");
    client.user.setActivity({
        name: (config.channel + " IRC"),
        type: "LISTENING"
    });
    var channel = client.channels.cache.get(config.channel_id);
    handler_discord = function(msg) {
        channel.send(msg);
    };
});
client.on("messageCreate", (message) => {
    if (message.author.id == client.user.id) return;
    if (message.channelId != config.channel_id) return;
    handler_irc(message.author.username + ": " + message.content);
});
client.login(config.token);

var first = false;
var second = false;
var third = false;
var joined = false;
bot.on("message", (e) => {
    if (joined) {
        if (!third) {
            third = true;
            return;
        }
        handler_discord("`" + e.nick + "`: " + e.message);
        return;
    }
    if (e.ident == "NickServ" && !first) {
        bot.say("NickServ", "IDENTIFY " + config.account + " " + config.password);
        first = true;
    }
    if (first) {
        if (!second && e.target == bot.user.nick) second = true;
        else {
            var channel = bot.channel(config.channel);
            channel.join();
            console.log("IRC ready");
            handler_irc = function(msg) {
                channel.say(msg);
            };
            joined = true;
        }
    }
});

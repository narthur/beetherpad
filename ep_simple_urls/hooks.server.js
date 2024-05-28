"use strict";

const API = require("ep_etherpad-lite/node/db/API");
const { parseMarkdown } = require("expost");

exports.expressCreateServer = (hookName, args, callback) => {
  args.app.use((req, res, next) => {
    const isAdmin = req.url.startsWith("/admin/") || req.url === "/admin";
    if (!req.url.startsWith("/p/") && !isAdmin) {
      req.url = `/p${req.url}`;
    }
    next();
  });

  callback();
};

exports.expressPreSession = async (hookName, args) => {
  args.app.get("/", (req, res) => {
    res.send(`
  <h1>DtherPad: dreeves's EtherPad <br> Also known as hippo.padm.us</h1>
  <p>(If you don't know how to create new pads, ask <a href="http://ai.eecs.umich.edu/people/dreeves">dreeves</a>.)</p>
    `);
  });

  args.app.get("/p/:pad", (req, res, next) => {
    const { pad } = req.params;

    API.getText(pad)
      .then(({ text }) => res.send(parseMarkdown(text)))
      .catch((err) => {
        console.error(`Error in markdown parsing for ${pad}:`, err);
        res.send("Oops, something went wrong!");
      });
  });
};

exports.socketio = (hookName, args, callback) => {
  const settingIO = args.io.of("/settings");
  const pluginIO = args.io.of("/pluginfw/installer");

  pluginIO.on("connection", (socket) => {
    socket.removeAllListeners("getInstalled");
    socket.removeAllListeners("search");
    socket.removeAllListeners("getAvailable");
    socket.removeAllListeners("checkUpdates");
    socket.removeAllListeners("install");
    socket.removeAllListeners("uninstall");

    socket.on("getInstalled", (query) => {
      socket.emit("results:installed", { installed: [] });
    });

    socket.on("checkUpdates", async (query) => {
      socket.emit("results:updatable", { updatable: {} });
    });

    socket.on("getAvailable", async (query) => {
      socket.emit("results:available", { available: {} });
    });

    socket.on("search", async (query) => {
      socket.emit("results:search", { results: {}, query });
    });

    socket.on("install", (plugin) => {
      socket.emit("finished:install", {
        plugin,
        error: "Plugin management is disabled",
      });
    });
    socket.on("uninstall", (plugin) => {
      socket.emit("finished:uninstall", {
        plugin,
        error: "Plugin management is disabled",
      });
    });
  });

  settingIO.on("connection", (socket) => {
    socket.removeAllListeners("saveSettings");
    socket.removeAllListeners("restartServer");

    socket.on("saveSettings", async (newSettings) => {
      console.log(
        "Admin request to save settings through a socket on /admin/settings",
      );
    });

    socket.on("restartServer", async () => {
      console.log(
        "Admin request to restart server through a socket on /admin/settings",
      );
    });
  });

  return callback();
};

"use strict";

const eejs = require("ep_etherpad-lite/node/eejs");
const toolbar = require("ep_etherpad-lite/node/utils/toolbar");
const settings = require("ep_etherpad-lite/node/utils/Settings");
const webaccess = require("ep_etherpad-lite/node/hooks/express/webaccess");

const { expressPreSession } = require("./hooks/expressPreSession");
const {
  eejsBlock_editbarMenuLeft,
} = require("./hooks/eejsBlock_editbarMenuLeft");

const secretDomain = process.env.ETHERPAD_SECRET_DOMAIN;

exports.expressPreSession = expressPreSession;

exports.socketio = (hookName, args, callback) => {
  const io = args.io;
  const settingIO = io.of("/settings");
  const pluginIO = io.of("/pluginfw/installer");

  io.on("connection", (socket) => {
    if (!socket.handshake.headers.host.startsWith(secretDomain)) {
      console.log("Unauthorized websocket connection disconnected");
      return socket.disconnect();
    }
  });

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

exports.eejsBlock_editbarMenuLeft = eejsBlock_editbarMenuLeft;

exports.eejsBlock_editbarMenuRight = (hookName, context, cb) => {
  const { renderContext } = context;
  const { req } = renderContext;
  const path = req.url.slice(2); // Remove /p

  const isReadOnly = !webaccess.userCanModify(req.params.pad, req);

  context.content = eejs.require(
    "ep_simple_urls/templates/expost_button.html",
    { url: `expost.${secretDomain}${path}`, toolbar, settings, isReadOnly },
  );
  return cb();
};

exports.eejsBlock_styles = (hookName, args, cb) => {
  args.content +=
    "<link href='../static/plugins/ep_simple_urls/static/css/ep_simple_urls.css' rel='stylesheet'>";
  return cb();
};

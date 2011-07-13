(function() {
  var Clients, app, everyone, express, fs, irc, nowjs, setupIrcEvents;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  express = require('express');
  app = express.createServer();
  app.use("/", express.static(__dirname + '/public'));
  fs = require('fs');
  app.get('/', function(req, res) {
    return fs.readFile('public/index.html', 'utf-8', function(err, data) {
      return res.end(data);
    });
  });
  app.listen(8000);
  nowjs = require('now');
  everyone = nowjs.initialize(app);
  irc = require('irc');
  Clients = {};
  everyone.on('connect', function() {});
  everyone.on('disconnect', function() {
    return Clients[this.user.clientId].client.disconnect('CurryChat - User connection lost.');
  });
  everyone.now.connect = function(nick, host, port) {
    var client, details;
    if (port == null) {
      port = 6667;
    }
    client = new irc.Client(host, nick, {
      port: port
    });
    details = {
      clientId: this.user.clientId,
      host: host,
      port: port,
      nick: nick,
      client: client
    };
    setupIrcEvents.call(this, details);
    return Clients[this.user.clientId] = details;
  };
  everyone.now.sendMessage = function(to, message) {
    var ircClient;
    ircClient = Clients[this.user.clientId].client;
    ircClient.say(to, message);
    return this.now.receiveMessage(ircClient.nick, to, message);
  };
  everyone.now.sendCommand = function(text) {
    var Commands, args, command, extra, ircClient;
    ircClient = Clients[this.user.clientId].client;
    args = text.split(' ');
    command = args.shift().replace(/\//, '');
    extra = function() {
      return args.join(' ');
    };
    Commands = {
      join: function() {
        return ircClient.join(args.shift());
      },
      part: function() {
        return ircClient.part(args.shift());
      },
      say: function() {
        var msg, to;
        to = args.shift();
        msg = extra();
        ircClient.say(to, msg);
        return this.now.receiveMessage(ircClient.nick, to, msg);
      },
      quit: function() {
        var msg;
        msg = extra();
        return ircClient.disconnect(msg);
      }
    };
    if ((Commands[command] != null) && typeof Commands[command] === 'function') {
      return Commands[command].call();
    } else {
      return this.now.invalidCommand(command);
    }
  };
  setupIrcEvents = function(options) {
    var ircClient;
    ircClient = options.client;
    ircClient.on('join', __bind(function(channel, nick) {
      if (nick === ircClient.nick) {
        this.now.handleJoin(channel);
      }
      return this.now.receiveJoin(channel, nick);
    }, this));
    ircClient.on('part', __bind(function(channel, nick, reason) {
      return this.now.receivePart(channel, nick, reason);
    }, this));
    ircClient.on('kick', __bind(function(channel, nick, kicker, reason) {
      return this.now.receiveKick(channel, nick, kicker, reason);
    }, this));
    ircClient.on('message', __bind(function(from, to, msg) {
      return this.now.receiveMessage(from, to, msg);
    }, this));
    ircClient.on('notice', __bind(function(from, to, msg) {
      return this.now.receiveMessage(from, to, msg);
    }, this));
    return ircClient.on('quit', __bind(function(nick, reason, channels) {
      return this.now.receiveQuit(nick, reason, channels);
    }, this));
  };
}).call(this);

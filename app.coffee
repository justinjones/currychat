express = (require 'express')
app = express.createServer()
app.use("/", express.static(__dirname + '/public'))
fs = require 'fs'

app.get '/', (req, res) ->
  fs.readFile 'public/index.html', 'utf-8', (err, data) ->
    res.end data

app.listen 8000

nowjs = require 'now'
everyone = nowjs.initialize(app)

irc = require 'irc'
Clients = {}

everyone.on 'connect', ->
  # Handle connection

everyone.on 'disconnect', ->
  # Handle disconnection
  Clients[@user.clientId].client.disconnect('CurryChat - User connection lost.');

everyone.now.connect = (nick, host, port) ->
  # Connect to IRC
  port = 6667 unless port?
  client = new irc.Client host, nick, { port: port }
  
  details =
    clientId: @user.clientId
    host: host
    port: port
    nick: nick
    client: client

  setupIrcEvents.call(@, details) # Call setupIrcEvents with the right value for this
  Clients[@user.clientId] = details

everyone.now.sendMessage = (to, message) ->
  ircClient = Clients[@user.clientId].client
  ircClient.say(to, message)
  # Placeholder - redirect messages back to the client
  # This should be handled client side for immediate feedback
  @now.receiveMessage(ircClient.nick, to, message)

everyone.now.sendCommand = (text) ->
  ircClient = Clients[@user.clientId].client
  
  args = text.split(' ')
  command = args.shift().replace(/\//, '')
  extra = () ->
    args.join(' ')

  Commands =
    join: () ->
      ircClient.join args.shift()
    part: () ->
      ircClient.part args.shift()
    say: () ->
      to = args.shift()
      msg = extra()
      ircClient.say(to, msg)
      # Placeholder - redirect messages back to the client
      # This should be handled client side for immediate feedback
      @now.receiveMessage(ircClient.nick, to, msg)
    quit: () ->
      msg = extra()
      ircClient.disconnect(msg)

  if Commands[command]? and typeof Commands[command] is 'function'
    Commands[command].call()
  else
    @now.invalidCommand(command)

setupIrcEvents = (options) ->
  # this/@ refers to a nowjs client
  ircClient = options.client

  ircClient.on 'join', (channel, nick) =>
    if nick is ircClient.nick
      @now.handleJoin(channel)
    @now.receiveJoin(channel, nick)

  ircClient.on 'part', (channel, nick, reason) =>
    @now.receivePart(channel, nick, reason)

  ircClient.on 'kick', (channel, nick, kicker, reason) =>
    @now.receiveKick(channel, nick, kicker, reason)

  ircClient.on 'message', (from, to, msg) =>
    @now.receiveMessage(from, to, msg)

  ircClient.on 'notice', (from, to, msg) =>
    @now.receiveMessage(from, to, msg) # Should notice be a different method?

  ircClient.on 'quit', (nick, reason, channels) =>
    @now.receiveQuit(nick, reason, channels)

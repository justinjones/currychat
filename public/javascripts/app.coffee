$().ready ->
  
  # Models

  class window.Channel extends Backbone.Model
    defaults:
      type: 'channel'
      name: null

    initialize: () ->
      @messages = new MessageList()

  class window.ChannelList extends Backbone.Collection
    model: Channel

    findByName: (name) ->
      @find (channel) ->
        return channel.get('name') == name

  class window.Message extends Backbone.Model
    defaults:
      type: 'message'
      from: null
      to: null
      message: ''

    initialize: () ->

  class window.MessageList extends Backbone.Collection
    model: Message


  # Views
  
  # A View for an individual channel
  # <li>#curry</li>
  class window.ChannelView extends Backbone.View
    tagName: "li"

    events:
      'click': 'use'
      'click a.close': 'part'

    initialize: ->
      @model.bind 'change', @render()
      @model.view = @

      @messages = new MessageListView({collection: @model.messages})

    render: =>
      $(@el).html(@model.get('name')) # Need to decide what templating to use
      @

    use: =>
      # Use channel - this should be handled by collection events later
      window.CurrentChannel = @model
      $('ul#channels li').removeClass('selected')
      $(@el).addClass('selected')
      $('.messages').hide()
      @messages.el.show()

    part: =>
      # Part channel

  
  # View for an individual message
  # <li>Justin: this irc shit is cool</li>
  class window.MessageView extends Backbone.View
    tagName: "li"

    events: {}

    initialize: ->
      @model.bind 'change', @render()
      @model.view = @

    render: =>
      from = @model.get('from')
      if from?
        text = "<#{from}> #{@model.get('message')}"
      else
        text = @model.get('message')
      $(@el).text(text)
      @

  
  # Container view for a bunch of channels
  # <div class="channels">
  #   <ol>
  #     ## Individual channel views
  #   </ol>
  # </div>
  class window.ChannelListView extends Backbone.View
    el: $('#channels')

    initialize: ->
      @collection
        .bind('add', @add)
        .bind('refresh', @refresh)
        .bind('current', @setCurrent)
        .bind('remove', @remove)

    add: (channel) =>
      # add a channel
      node = new ChannelView(model: channel).render().el
      @el.append node

    refresh: =>
      # refresh all

    setCurrent: =>
      # set the currently active channel

  # Container view for a bunch of messages
  # <div class="messages">
  #   <ol>
  #     ## Individual message views
  #   </ol>
  # </div>
  class window.MessageListView extends Backbone.View
    initialize: ->
      @el = $('<ul/>').addClass('messages').hide().appendTo($('#window'))
      @collection
        .bind('add', @add)
        .bind('refresh', @refresh)

    add: (message) =>
      # add a message
      console.log message
      node = new MessageView(model: message).render().el
      @el.append node

  
  window.Channels = new ChannelList()
  window.ChannelsPane = new ChannelListView({collection: Channels})

  # Now JS
  
  # This is called when a message is received from the IRC server
  # from is null if it's from the server
  # to is a nick (probably yours), a channel name, or '*' probably only for messages from the server too
  now.receiveMessage = (from, to, msg) ->
    channel = Channels.findByName(to)
    if channel?
      msg = new Message({from: from, to: to, message: msg})
      channel.messages.add(msg)
    
    console.log "Message"
    console.log {from: from, to: to, message: msg}
  
  # This is called when you join a channel
  now.handleJoin = (channelName) ->
    channel = Channels.findByName(channelName)
    unless channel?
      channel = new Channel({name: channelName})
      Channels.add channel
      channel.view.use()

      console.log "You joined #{channelName}"

  # This is called when anybody joins a channel (including you)
  now.receiveJoin = (channelName, nick) ->
    channel = Channels.findByName(channelName)
    if channel?
      msg = new Message({to: channelName, message: "### #{nick} has joined #{channelName}"})
      channel.messages.add(msg)

    console.log "#{nick} has joined #{channelName}"

  # Called when anybody leaves a channel
  now.receivePart = (channelName, nick, reason) ->
    channel = Channels.findByName(channelName)
    if channel?
      msg = new Message({to: channelName, message: "### #{nick} has left #{channelName} [#{reason}]"})
      channel.messages.add(msg)

    console.log "#{nick} has left #{channelName}"

  # Called when somebody quits IRC
  now.receiveQuit = (nick, reason, channels) ->
    text = "### #{nick} has quit IRC. [#{reason}]"
    for channelName in channels
      channel = Channels.findByName(channelName)
      if channel?
        msg = new Message({to: channelName, message: text})
        channel.messages.add(msg)

    console.log "#{nick} has quit IRC."

  # Called when somebody is kicked from a channel
  now.receiveKick = (channelName, nick, kicker, reason) ->
    channel = Channels.findByName(channelName)
    if channel?
      msg = new Message({to: channelName, message: "### #{nick} has been kicked from #{channelName} by #{kicker} [#{reason}]"})
      channel.messages.add(msg)
    
    console.log "#{nick} has been kicked from #{channelName} by #{kicker}."


  # Corner cutting to get it finished :(
  $('form').submit (e) ->
    e.preventDefault()
    val = $('#send-input').val()
    $('#send-input').val('')
    if val.match(/\/connect/)
      now.connect val.split(' ')[1], val.split(' ')[2]
      console.log "Connecting.."
    else if val.match(/\//)
      now.sendCommand val
      console.log "Sending command: #{val}"
    else
      now.sendMessage(CurrentChannel.get('name'), val)
      console.log "Send msg: #{val}"

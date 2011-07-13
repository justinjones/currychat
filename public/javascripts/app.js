(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $().ready(function() {
    window.Channel = (function() {
      __extends(Channel, Backbone.Model);
      function Channel() {
        Channel.__super__.constructor.apply(this, arguments);
      }
      Channel.prototype.defaults = {
        type: 'channel',
        name: null
      };
      Channel.prototype.initialize = function() {
        return this.messages = new MessageList();
      };
      return Channel;
    })();
    window.ChannelList = (function() {
      __extends(ChannelList, Backbone.Collection);
      function ChannelList() {
        ChannelList.__super__.constructor.apply(this, arguments);
      }
      ChannelList.prototype.model = Channel;
      ChannelList.prototype.findByName = function(name) {
        return this.find(function(channel) {
          return channel.get('name') === name;
        });
      };
      return ChannelList;
    })();
    window.Message = (function() {
      __extends(Message, Backbone.Model);
      function Message() {
        Message.__super__.constructor.apply(this, arguments);
      }
      Message.prototype.defaults = {
        type: 'message',
        from: null,
        to: null,
        message: ''
      };
      Message.prototype.initialize = function() {};
      return Message;
    })();
    window.MessageList = (function() {
      __extends(MessageList, Backbone.Collection);
      function MessageList() {
        MessageList.__super__.constructor.apply(this, arguments);
      }
      MessageList.prototype.model = Message;
      return MessageList;
    })();
    window.ChannelView = (function() {
      __extends(ChannelView, Backbone.View);
      function ChannelView() {
        this.part = __bind(this.part, this);
        this.use = __bind(this.use, this);
        this.render = __bind(this.render, this);
        ChannelView.__super__.constructor.apply(this, arguments);
      }
      ChannelView.prototype.tagName = "li";
      ChannelView.prototype.events = {
        'click': 'use',
        'click a.close': 'part'
      };
      ChannelView.prototype.initialize = function() {
        this.model.bind('change', this.render());
        this.model.view = this;
        return this.messages = new MessageListView({
          collection: this.model.messages
        });
      };
      ChannelView.prototype.render = function() {
        $(this.el).html(this.model.get('name'));
        return this;
      };
      ChannelView.prototype.use = function() {
        window.CurrentChannel = this.model;
        $('ul#channels li').removeClass('selected');
        $(this.el).addClass('selected');
        $('.messages').hide();
        return this.messages.el.show();
      };
      ChannelView.prototype.part = function() {};
      return ChannelView;
    })();
    window.MessageView = (function() {
      __extends(MessageView, Backbone.View);
      function MessageView() {
        this.render = __bind(this.render, this);
        MessageView.__super__.constructor.apply(this, arguments);
      }
      MessageView.prototype.tagName = "li";
      MessageView.prototype.events = {};
      MessageView.prototype.initialize = function() {
        this.model.bind('change', this.render());
        return this.model.view = this;
      };
      MessageView.prototype.render = function() {
        var from, text;
        from = this.model.get('from');
        if (from != null) {
          text = "<" + from + "> " + (this.model.get('message'));
        } else {
          text = this.model.get('message');
        }
        $(this.el).text(text);
        return this;
      };
      return MessageView;
    })();
    window.ChannelListView = (function() {
      __extends(ChannelListView, Backbone.View);
      function ChannelListView() {
        this.setCurrent = __bind(this.setCurrent, this);
        this.refresh = __bind(this.refresh, this);
        this.add = __bind(this.add, this);
        ChannelListView.__super__.constructor.apply(this, arguments);
      }
      ChannelListView.prototype.el = $('#channels');
      ChannelListView.prototype.initialize = function() {
        return this.collection.bind('add', this.add).bind('refresh', this.refresh).bind('current', this.setCurrent).bind('remove', this.remove);
      };
      ChannelListView.prototype.add = function(channel) {
        var node;
        node = new ChannelView({
          model: channel
        }).render().el;
        return this.el.append(node);
      };
      ChannelListView.prototype.refresh = function() {};
      ChannelListView.prototype.setCurrent = function() {};
      return ChannelListView;
    })();
    window.MessageListView = (function() {
      __extends(MessageListView, Backbone.View);
      function MessageListView() {
        this.add = __bind(this.add, this);
        MessageListView.__super__.constructor.apply(this, arguments);
      }
      MessageListView.prototype.initialize = function() {
        this.el = $('<ul/>').addClass('messages').hide().appendTo($('#window'));
        return this.collection.bind('add', this.add).bind('refresh', this.refresh);
      };
      MessageListView.prototype.add = function(message) {
        var node;
        console.log(message);
        node = new MessageView({
          model: message
        }).render().el;
        return this.el.append(node);
      };
      return MessageListView;
    })();
    window.Channels = new ChannelList();
    window.ChannelsPane = new ChannelListView({
      collection: Channels
    });
    now.receiveMessage = function(from, to, msg) {
      var channel;
      channel = Channels.findByName(to);
      if (channel != null) {
        msg = new Message({
          from: from,
          to: to,
          message: msg
        });
        channel.messages.add(msg);
      }
      console.log("Message");
      return console.log({
        from: from,
        to: to,
        message: msg
      });
    };
    now.handleJoin = function(channelName) {
      var channel;
      channel = Channels.findByName(channelName);
      if (channel == null) {
        channel = new Channel({
          name: channelName
        });
        Channels.add(channel);
        channel.view.use();
        return console.log("You joined " + channelName);
      }
    };
    now.receiveJoin = function(channelName, nick) {
      var channel, msg;
      channel = Channels.findByName(channelName);
      if (channel != null) {
        msg = new Message({
          to: channelName,
          message: "### " + nick + " has joined " + channelName
        });
        channel.messages.add(msg);
      }
      return console.log("" + nick + " has joined " + channelName);
    };
    now.receivePart = function(channelName, nick, reason) {
      var channel, msg;
      channel = Channels.findByName(channelName);
      if (channel != null) {
        msg = new Message({
          to: channelName,
          message: "### " + nick + " has left " + channelName + " [" + reason + "]"
        });
        channel.messages.add(msg);
      }
      return console.log("" + nick + " has left " + channelName);
    };
    now.receiveQuit = function(nick, reason, channels) {
      var channel, channelName, msg, text, _i, _len;
      text = "### " + nick + " has quit IRC. [" + reason + "]";
      for (_i = 0, _len = channels.length; _i < _len; _i++) {
        channelName = channels[_i];
        channel = Channels.findByName(channelName);
        if (channel != null) {
          msg = new Message({
            to: channelName,
            message: text
          });
          channel.messages.add(msg);
        }
      }
      return console.log("" + nick + " has quit IRC.");
    };
    now.receiveKick = function(channelName, nick, kicker, reason) {
      var channel, msg;
      channel = Channels.findByName(channelName);
      if (channel != null) {
        msg = new Message({
          to: channelName,
          message: "### " + nick + " has been kicked from " + channelName + " by " + kicker + " [" + reason + "]"
        });
        channel.messages.add(msg);
      }
      return console.log("" + nick + " has been kicked from " + channelName + " by " + kicker + ".");
    };
    return $('form').submit(function(e) {
      var val;
      e.preventDefault();
      val = $('#send-input').val();
      $('#send-input').val('');
      if (val.match(/\/connect/)) {
        now.connect(val.split(' ')[1], val.split(' ')[2]);
        return console.log("Connecting..");
      } else if (val.match(/\//)) {
        now.sendCommand(val);
        return console.log("Sending command: " + val);
      } else {
        now.sendMessage(CurrentChannel.get('name'), val);
        return console.log("Send msg: " + val);
      }
    });
  });
}).call(this);

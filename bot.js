require('dotenv').config()

const Discord = require('discord.js');
const client = new Discord.Client();

let defaultChannel;

let decks = {}
let attachments = {}
const emojis = {}
const emojiNames = {}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  if (client.user.tag.includes('Test')) {
    defaultChannel = client.channels.find(c => c.name == 'test')
    const deckChannel = client.channels.find(c => c.name == 'data')
    initDeck(deckChannel).then(() => drawRandom('fate'))

  }
});

function drawRandom(deckName, msg = null) {
  let deck = decks[deckName]
  let index = Math.floor(Math.random() * deck.length)
  let card = deck[index];
  if (!card.displayType || card.displayType === 'image') {
    postImage(card.name, card.link, msg)
  }
  if (card.displayType === 'emoji') {
    postEmoji(card.name, card.link, msg)
  }
}

function postImage(name, link, msg = null) {
  if (!attachments[link]) {
    let attachment = new Discord.Attachment(link, name);
    const embed = new Discord.RichEmbed()
      .attachFile(attachment)
      .setImage('attachment://' + name);
    attachments[link] = embed
    console.log(`New attachment '${link}'`)
  }
  let content = {
    embed: attachments[link]
  }

  if (msg) {
    msg.reply(content).catch(console.error)
  } else {
    defaultChannel.send(content).catch(console.error)
  }
}

function postEmoji(name, link, msg = null) {
  console.log('emoji')
  const channel = msg == null ? defaultChannel : msg.channel;

  console.log(emojiNames)
  if (!emojiNames[link]) {
    console.log('reg')

    const emojiName = 'token' + Object.keys(emojiNames).length
    channel.guild.createEmoji(link, emojiName).then(emoji => {
      emojiNames[link] = `<:${emojiName}:${emoji.id}>`
      postEmoji(name, link, msg)
    }).catch(console.error)
    return
  }
  if (msg) {
    msg.reply(emojiNames[link]).catch(console.error)
  } else {
    defaultChannel.send(emojiNames[link]).catch(console.error)
  }
}

client.on('message', msg => {
  let content = msg.content
  if (content.substring(0, 1) == '!') {
    let args = content.substring(1).split(/\s/);
    let cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      case 'draw':
        handleDrawCommand(msg, ...args)
        break;
      case 'init':
        initDeckChannel(msg, ...args)
        break
    }
  }
});

function handleDrawCommand(msg, deckName) {
  if (decks[deckName]) {
    drawRandom(deckName, msg)
  } else {
    msg.reply(`No deck '${deckName}' found`)
  }
}

function initNewDeck(options) {
  const deck = options.cards.map(link => {
    let name = link.split('/').pop()
    if (!link.startsWith('https://')) {
      link = 'https://' + link
    }
    const displayType = options.displayType
    return {
      name,
      link,
      displayType
    }
  })

  decks[options.name] = deck
}

function initDeckChannel(msg, name) {
  const deckChannelName = name
  const deckChannel = msg.guild.channels.find(c => c.name == deckChannelName)
  if (!deckChannel) {
    msg.reply(`Channel '${name}' not found`).catch(console.error)
    return
  }

  // console.log(msg.channel.messages)
  initDeck(deckChannel, msg)
}

client.login(process.env.BOT_TOKEN)

function initDeck(channel, msg = null) {
  channel.guild.emojis.forEach(e => {
    channel.guild.deleteEmoji(e.id)
    console.log(e.name)
  })

  return channel.fetchMessages({
    limit: 1
  }).then(messages => {
    let lastMessage = messages.first();
    let data = JSON.parse(lastMessage.content)
    let report = "Creating decks..."
    data.forEach(d => {
      initNewDeck(d)
      report += `\nDeck '${d.name}' created with ${d.cards.length} cards`
    })
    if (msg)
      msg.reply(report).catch(console.error)
  })
}
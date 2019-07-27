require('dotenv').config()

const Discord = require('discord.js');
const client = new Discord.Client();

let defaultChannel;
let deckChannel;
let deckChannelName;

let decks = {}
let attachments = {}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  defaultChannel = client.channels.find(c => c.name == 'test')
});

function drawRandom(deckName, msg = null) {
  let deck = decks[deckName]
  let index = Math.floor(Math.random() * deck.length)
  let card = deck[index];
  postImage(card.name, card.link, msg)
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
  if (msg != null) {
    msg.reply(content).catch(console.error)
  } else {
    defaultChannel.send(content).catch(console.error)
  }
}

client.on('message', msg => {
  let content = msg.content
  if (content.substring(0, 1) == '!') {
    let args = content.substring(1).split(/\s/);
    let cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      case 'roll':
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

function initNewDeck(name, ...args) {
  const deck = args.map(link => {
    let name = link.split('/').pop()
    if (!link.startsWith('https://')) {
      link = 'https://' + link
    }
    return {
      name,
      link
    }
  })

  decks[name] = deck
}

function initDeckChannel(msg, name){
  deckChannelName = name
  deckChannel = msg.guild.channels.find(c => c.name == deckChannelName)
  if (!deckChannel) {
    msg.reply(`Channel '${name}' not found`).catch(console.error)
    return
  }

  // console.log(msg.channel.messages)
  deckChannel.fetchMessages({ limit: 1 }).then(messages => {
    let lastMessage = messages.first();
    let data = JSON.parse(lastMessage.content)
    let report = "Creating decks..."
    data.forEach(d => {
      initNewDeck(d.name, ...d.cards)
      report += `\nDeck '${d.name}' created with ${d.cards.length} cards`
    })
    msg.reply(report).catch(console.error)
  })
}

client.login(process.env.BOT_TOKEN)

export default {
  async fetch(request, env) {
    return await handleRequest(request, env)
  },
  async scheduled(event, env, ctx) {
    const triggeredTime = new Date(event.scheduledTime);
    console.log(
      'Scheduled event triggered at:', 
      triggeredTime.toLocaleString('zh-Hans', {timeZone: 'Asia/Shanghai'})
    );
    ctx.waitUntil(scheduledTask(env));
  },
}

async function handleRequest(request, env) {
  return new Response('Nope.');
}

async function scheduledTask({TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID}) {
  console.log("Fetching website Sign Up page.")
  
  const site = 'mastodon.social';
  let opened = false;
  
  await fetch("https://" + site + "/auth/sign_up", {
    redirect: "manual",
  })
    .then((response) => {
      opened = (response.status === 200);
    });

  const currentTime = new Date();
  
  const msgData = {
    "parse_mode": "MarkdownV2",
    "text": ""
      + "*" + (opened ? "Now Opened" : "Still Closed") + "*\n"
      /* + "Checked at: `" + currentTime.toLocaleString('zh-Hans', { timeZone: 'Asia/Shanghai' }) + "`\n" */
      + "\\(via Cloudflare Workers\\)",
    "chat_id": TELEGRAM_CHAT_ID,
  }

  const msgURI = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';

  await fetch(msgURI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(msgData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Sending message:', data);
    })
    .catch((error) => {
      console.error('Error when sending message:', error);
    });
}

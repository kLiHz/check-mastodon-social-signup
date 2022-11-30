export default {
  async fetch(request, env) {
    return await handleRequest(request, env)
  }
}

class KvStorage {
  constructor(account_id, namespace_id, user_email, user_auth) {
    this.account_id = account_id;
    this.namespace_id = namespace_id;
    this.user_email = user_email;
    this.user_auth = user_auth;
    this.prefix = 'https://api.cloudflare.com/client/v4/accounts/'
      + this.account_id
      + '/storage/kv/namespaces/'
      + this.namespace_id
      + '/values/';
  }
  async put(key, value) {
    let form = new FormData();
    form.set('value', value);
    form.set('metadata', JSON.stringify({}));
    await fetch(this.prefix + key, {
      method: 'PUT',
      headers: {
        "X-Auth-Email": this.user_email,
        "Authorization": this.user_auth,
      },
      body: form,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Putting value of key: ' + key, data);
      })
      .catch((error) => {
        console.error('Error when putting value of key:' + key, error);
      });
  }
  async get(key) {
    let value = null;
    await fetch(this.prefix + key, {
      method: 'GET',
      headers: {
        "Content-Type": 'text/plain',
        "X-Auth-Email": this.user_email,
        "Authorization": this.user_auth,
      },
    })
      .then((response) => {
        console.log("Getting value of key: " + key);
        if (response.status === 200) {
          value = response.text();
        } else {
          value = null;
        }
      })
      .catch((error) => {
        value = null;
        console.error('Error when getting value of key:' + key, error);
      });
    return value;
  }
}


async function handleRequest(request, {
  ACCOUNT_ID, NAMESPACE_ID, USER_EMAIL, USER_AUTH,
  TELEGRAM_BOT_TOKEN, STATUS_DATA_TTL
}) {
  const STATUS = new KvStorage(ACCOUNT_ID, NAMESPACE_ID, USER_EMAIL, USER_AUTH);
  const url = new URL(request.url);
  const site = url.pathname === '/' ? 'mastodon.social' : url.pathname.substring(1);
  const params = url.searchParams;
  const refresh = params.get("refresh") === 'true';
  const report = params.get("report") === 'true';
  
  const TELEGRAM_CHAT_ID = params.get("chat_id");

  console.log("Refresh result:", refresh);
  console.log("Report to Telegram:", report);

  const openStatus = await STATUS.get(site);
  const lastChecked = await STATUS.get(site + '.lastChecked');

  let opened = openStatus === 'true';
  let lastCheckedDate = null;
  let elapsedSeconds = null;

  if (lastChecked != null) {
    lastCheckedDate = new Date(lastChecked);
    let now = new Date();
    elapsedSeconds = (now - lastCheckedDate) / 1000;
  }

  if (refresh || lastChecked === null || elapsedSeconds > STATUS_DATA_TTL) {
    console.log("Fetching website SignUp page.")
    await fetch("https://" + site + "/auth/sign_up", {
      redirect: "manual",
    })
      .then((response) => {
        opened = (response.status === 200);
      });
    await STATUS.put(site, opened);
    lastCheckedDate = new Date();
    await STATUS.put(site + '.lastChecked', lastCheckedDate.toISOString());
  }

  const msgData = {
    "parse_mode": "MarkdownV2",
    "text"
      : "*Mastodon SignUp Availability Report*\n\n"
      + "Instance Name: `" + site + "`\n"
      + "Allowing SignUp: *" + (opened ? "Opened" : "Still Closed") + "*\n"
      + "Last Checked: `" + lastCheckedDate.toLocaleString('zh-Hans', { timeZone: 'Asia/Shanghai' }) + "`"
      + "",
    "chat_id": TELEGRAM_CHAT_ID,
  }

  const msgURI = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';

  if (report) {
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

  if (opened) {
    return new Response('"' + site + '" is open for signup!');
  } else {
    return new Response('"' + site + '" is not open for signup.');
  }
}

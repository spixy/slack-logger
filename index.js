const express = require('express')
const bodyParser = require('body-parser')
const { env } = require('node:process')
// const { App } = require('@slack/bolt')

const ALLOWED_USER = env.ALLOWED_USER;
const JIRA_BASE = env.JIRA_BASE;
const JIRA_USER = env.JIRA_USER;
const JIRA_ISSUE = env.JIRA_ISSUE;
const JIRA_TOKEN = env.JIRA_TOKEN;

const createWorklog = (issue, text, seconds) => {
  const started = new Date().toISOString().replace("Z", "+0000");

  const bodyData = `{
  "comment": {
    "content": [
    {
      "content": [
      {
        "text": "${text}",
        "type": "text"
      }
      ],
      "type": "paragraph"
    }
    ],
    "type": "doc",
    "version": 1
  },
  "started": "${started}",
  "timeSpentSeconds": ${seconds}
  }`;
  console.log(bodyData);

  const basicAuth = `${JIRA_USER}:${JIRA_TOKEN}`;
  return fetch(`${JIRA_BASE}/rest/api/3/issue/${issue}/worklog`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(basicAuth).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: bodyData
    });
}

const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })); // Slack sends x-www-form-urlencoded

app.post("/slack/log", async (req, res) => {
  console.log(req.body);

  const { user_id, issue, text, seconds } = req.body; 
  const issueKey = issue ?? JIRA_ISSUE;
  const contentText = text?.trim() ?? "";  

  if (user_id !== ALLOWED_USER) {
    return res.status(401).json({ text: "🚫 You are not allowed to use this command." });
  }

  const result = await createWorklog(issueKey, contentText, seconds);
  
  console.log(`Status: ${result.status}`);
  console.log(await result.json());

  res.status(result.status).json();
});  
app.listen(8080, () => console.log("Listening on port 3000"));

// const app = new App({
//   token: SLACK_BOT_TOKEN,
//   signingSecret: SLACK_SIGNING_SECRET,
// });

// // Slash command handler
// app.command("/log", async ({ command, ack, respond }) => {
//   console.log(command);

//   await ack();

//   const issue = command.issue?.trim() ?? JIRA_ISSUE;
//   const text = command.text?.trim() ?? "";
//   const seconds = parseInt(command.seconds.trim());
  
//   const result = await createWorklog(issue, text, seconds);
  
//   console.log(`Status: ${result.status}`);
//   console.log(await result.json());

//   await respond(result.status === 201 ? "✅" : "Error");
// });

// (async () => {
//   await app.start(process.env.PORT || 3000);
// })();

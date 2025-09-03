const express = require('express')
const bodyParser = require('body-parser')
const { env } = require('node:process')

const ALLOWED_USER = env.ALLOWED_USER;
const JIRA_BASE = env.JIRA_BASE;
const JIRA_USER = env.JIRA_USER;
const JIRA_ISSUE = env.JIRA_ISSUE;
const JIRA_TOKEN = env.JIRA_TOKEN;

const createWorklog = (issue, text, timeSpent) => {
  const started = new Date().toISOString().replace("Z", "+0000");
  console.log({issue, text, timeSpent});

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
  "timeSpent": "${timeSpent}"
  }`;

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
  const { user_id, text } = req.body;

  const textParts = text.split(" ");

  const hasIssue = textParts[0].includes("-");
  const issue = hasIssue ? textParts[0] : JIRA_ISSUE

  const timeSpent = hasIssue ? textParts[1] : textParts[0];
  const contentText = textParts.slice(hasIssue ? 2 : 1).join(" ");

  if (user_id !== ALLOWED_USER) {
    return res.status(401).json({ text: "🚫 You are not allowed to use this command." });
  }

  res.status(200).json();

  const result = await createWorklog(issue, contentText, timeSpent);
  
  console.log(`Jira status: ${result.status}`);
});  
app.listen(8080, () => console.log("Listening on port 8080"));

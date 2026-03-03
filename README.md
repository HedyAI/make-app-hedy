# make-app-hedy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Make Custom App](https://img.shields.io/badge/Make-Custom%20App-6d3bff)](https://www.make.com)

A [Make](https://www.make.com) (formerly Integromat) custom app for [Hedy](https://hedy.bot) — your AI-powered meeting intelligence assistant.

Hedy helps you be the brightest person in the room by providing real-time transcription, meeting summaries, action items, and intelligent insights from your meetings.

## Modules

### Watch Events (Trigger)
Receives real-time webhook notifications when events occur in Hedy:
- **Session Created** — When a new meeting session starts
- **Session Ended** — When a meeting session completes
- **Highlight Created** — When a highlight is created during a meeting
- **Todo Exported** — When a todo item is exported

### Get a Session
Retrieve detailed session information including transcript, highlights, and todos.

### List Sessions
Search and list your sessions with configurable limits.

### Get a Highlight
Retrieve details of a specific highlight.

### List Highlights
Search and list highlights across all sessions.

### List Todos
List action items across all sessions.

### List Topics
List your conversation topics.

### Get a Topic
Retrieve details of a specific topic.

### Make an API Call
Perform a custom API call to any Hedy endpoint for advanced use cases.

## Authentication

1. Open Hedy and go to **Settings > API**
2. Click **Generate New Key**
3. Copy the API key (starts with `hedy_live_`)
4. In Make, create a new Hedy connection and paste your API key

## Example Scenarios

### Meeting Summary to Slack
Send meeting summaries to Slack when sessions end:
```
[Watch Events: session.ended] → [Get a Session] → [Slack: Send Message]
```

### Highlight Collection to Notion
Save important highlights to a Notion database:
```
[Watch Events: highlight.created] → [Get a Highlight] → [Notion: Create Database Item]
```

### Todo Export to Project Management
Export todos to your project management tool:
```
[Watch Events: todo.exported] → [Jira/Trello/Asana: Create Task]
```

### Daily Meeting Report
Generate daily meeting reports:
```
[Schedule: Daily at 5 PM] → [List Sessions] → [Format Report] → [Email: Send]
```

## Local Development

This app is built using the [Make Apps SDK](https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk) and managed via the [Make Apps Editor](https://marketplace.visualstudio.com/items?itemName=Integromat.apps-sdk) VS Code extension.

### Setup

1. Install the [Make Apps Editor](https://marketplace.visualstudio.com/items?itemName=Integromat.apps-sdk) VS Code extension
2. Generate an API token in your Make profile under **API Access**
3. Clone this repo and open it in VS Code
4. Create `.secrets/apikey` with your Make API token
5. Right-click `makecomapp.json` and select **Deploy to Make**

### Project Structure

```
make-app-hedy/
├── makecomapp.json              # App manifest
├── general/
│   ├── base.iml.json            # Base URL and shared config
│   └── common.json              # Shared data
├── connections/
│   └── apiKey/                  # API key connection
├── webhooks/
│   └── hedyEvents/              # Webhook lifecycle (attach/detach)
├── modules/
│   ├── watchEvents/             # Instant trigger
│   ├── getSession/              # Action: get session details
│   ├── listSessions/            # Search: list sessions
│   ├── getHighlight/            # Action: get highlight details
│   ├── listHighlights/          # Search: list highlights
│   ├── listTodos/               # Search: list todos
│   ├── listTopics/              # Search: list topics
│   ├── getTopic/                # Action: get topic details
│   ├── makeAnApiCall/           # Universal: custom API call
│   └── groups.json              # Module grouping
└── rpcs/
    ├── listTopicsRpc/           # Dynamic dropdown for topics
    └── listSessionsRpc/         # Dynamic dropdown for sessions
```

## Resources

- [Hedy Website](https://hedy.bot)
- [Hedy API Documentation](https://api.hedy.bot/docs)
- [Make Custom Apps Documentation](https://developers.make.com/custom-apps-documentation)
- [Make Apps Editor Extension](https://marketplace.visualstudio.com/items?itemName=Integromat.apps-sdk)

## Support

- **Hedy Support**: support@hedy.bot
- **GitHub Issues**: [make-app-hedy/issues](https://github.com/HedyAI/make-app-hedy/issues)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

Made with care by the [Hedy](https://hedy.bot) team

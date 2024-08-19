# DriveBotSync

🚀 A LINE Bot built with TypeScript and Node.js that uploads files sent to a LINE group to Google Drive using the Google Drive API.

## Features

- Uploads images, videos, audio, and files sent to a LINE group to a designated Google Drive folder.
- Built with TypeScript and Node.js.
- Integration with Google Drive API for file storage.
- Automatically creates and shares a Google Drive folder for uploads.

## Prerequisites

Before setting up the project, make sure you have the following:

1. **Node.js** (v14 or higher) and npm installed: [Download Node.js](https://nodejs.org/)
2. **Google Cloud Account** with Google Drive API enabled.
3. **LINE Developer Account** with a Messaging API channel created.

## Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/DriveBotSync/DriveBotSync.git
cd DriveBotSync
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Google Cloud Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project.
3. Enable the Google Drive API for the project.
4. Create a service account and download the `credentials.json` file.
5. Place the `credentials.json` file in the root of your project.

### 4. Setup the Environment Variables

Create a `.env` file by copying the `.env.template`:

```bash
cp .env.template .env
```

Fill in the necessary values in the `.env` file:

```dotenv
LINE_ACCESS_TOKEN=YOUR_LINE_ACCESS_TOKEN
LINE_SECRET=YOUR_LINE_SECRET
FOLDER_ID=YOUR_GOOGLE_DRIVE_FOLDER_ID
FOLDER_NAME=YOUR_GOOGLE_DRIVE_FOLDER_NAME
SERVICE_EMAIL=YOUR_GCP_SERVICE_EMAIL
PERSONAL_GOOGLE_ACCOUNT=YOUR_PERSONAL_GOOGLE_ACCOUNT
```

- Replace `YOUR_LINE_ACCESS_TOKEN` and `YOUR_LINE_SECRET` with the credentials from your LINE Developer account.
- `FOLDER_NAME` is the name of the folder in Google Drive where files will be uploaded.
- `FOLDER_ID` is optional. If not provided, the folder will be created automatically.
- Replace `YOUR_GCP_SERVICE_EMAIL` with the service account email created on Google Cloud Platform (GCP).
- Replace `YOUR_PERSONAL_GOOGLE_ACCOUNT` with the email address you want to share the folder with, such as your personal Google account.

### 5. Create the LINE Messaging API Channel

1. Go to the [LINE Developers Console](https://developers.line.biz/).
2. Create a new Messaging API channel.
3. Get your Channel Access Token and Channel Secret and update the `.env` file accordingly.
4. Set your webhook URL to point to your server, e.g., `https://your-server.com/webhook`.

### 6. Start the Server

```bash
npm start
```

This will start the server on port 8001. You can change the port in the `index.ts` file if necessary.

### 7. Test the Bot

1. Add your bot as a friend in LINE.
2. Add the bot to a group chat.
3. Send images, videos, audio, or files to the group chat.
4. The bot will automatically upload the files to the designated Google Drive folder and reply with a shareable link.

## Folder Structure

```plaintext
├── src
│   ├── index.ts           # Main server file
│   ├── GDriveManagement.ts # Google Drive management logic
│   └── getMimeType.ts      # Helper function to get MIME types
├── credentials.json        # Google Cloud credentials (not tracked by Git)
├── .env                    # Environment variables (not tracked by Git)
└── package.json            # Node.js package file
```

## Important Notes

- Make sure that your Google Cloud service account has the necessary permissions to create and manage files in Google Drive.
- Ensure that your webhook URL is publicly accessible so that LINE can send events to your server.

## Troubleshooting

- **Webhook URL not working**: Ensure that your server is running and that the URL is correct in the LINE Developer Console.
- **Google Drive API errors**: Double-check that your service account credentials are correct and that the Google Drive API is enabled for your project.

## License

This project is licensed under the MIT License. See the [LICENSE](https://opensource.org/licenses/MIT) file for more details.

## Author

Developed by Aphakorn Asavaphubodee.

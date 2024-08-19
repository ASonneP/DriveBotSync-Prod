import express from "express";
import {
  Client,
  middleware,
  WebhookEvent,
  MessageEvent,
  TextMessage,
} from "@line/bot-sdk";
import { google } from "googleapis";
import dotenv from "dotenv";
import { Readable } from "stream"; // Import Readable to create a stream from a buffer
import { getMimeType } from "./getMimeType";
import GDriveManagement from "./GDriveManagement";

dotenv.config();

const port = 8001;

const app = express();
const GDrive = new GDriveManagement();

// Fetch the Google Drive folder ID from environment variables
let folderId: string | null = process.env.FOLDER_ID || null;
let folderName: string = process.env.FOLDER_NAME || "";

//? Share the folder with Personal Account (Optional)
// const personalGoogleAccountEmail = process.env.PERSONAL_GOOGLE_ACCOUNT || "";

const lineConfig = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_SECRET || "",
};

const client = new Client(lineConfig);
console.log(client);

const rootPath = "/DriveBotSync";

app.get(rootPath, (req, res) => {
  res.send("HELLO USER!");
});

app.get(rootPath + "/testwebhook", (req, res) => {
  res.send("TEST WEBHOOK RESPONSE");
});

app.post(rootPath + "/webhook", middleware(lineConfig), (req, res) => {
  console.log("Received webhook event");
  const events = req.body.events as WebhookEvent[];
  Promise.all(events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error("Error handling event:", err);
      res.status(500).end();
    });
});

const handleEvent = async (event: WebhookEvent) => {
  console.log("Event received:", event);

  try {
    if (event.type === "message") {
      // Ensure it's a MessageEvent, which contains a replyToken
      const messageEvent = event as MessageEvent;
      let fileName: string;
      let buffer: Buffer;
      let mimeType: string;

      console.log(messageEvent);

      if (messageEvent.message.type === "file") {
        // Handle file message
        const fileMessage = messageEvent.message;
        fileName = fileMessage.fileName;
        console.log(`File message received: ${fileName}`);
        buffer = await getFileContent(fileMessage.id);
        mimeType = getMimeType(fileName); // Get the MIME type from the file extension
        console.log(`File content fetched for: ${fileName}`);
      } else if (messageEvent.message.type === "image") {
        // Handle image message
        const imageMessage = messageEvent.message;
        fileName = `image_${Date.now()}.jpg`; // Use a timestamp-based file name for images
        buffer = await getFileContent(imageMessage.id);
        mimeType = "image/jpeg"; // Set the MIME type for images
        console.log(`Image content fetched for: ${fileName}`);
      } else if (messageEvent.message.type === "video") {
        // Handle video message
        const videoMessage = messageEvent.message;
        fileName = `video_${Date.now()}.mp4`; // Use a timestamp-based file name for videos
        buffer = await getFileContent(videoMessage.id);
        mimeType = "video/mp4"; // Set the MIME type for videos
        console.log(`Video content fetched for: ${fileName}`);
      } else if (messageEvent.message.type === "audio") {
        // Handle audio message
        const audioMessage = messageEvent.message;
        fileName = `audio_${Date.now()}.mp3`; // Use a timestamp-based file name for audio
        buffer = await getFileContent(audioMessage.id);
        mimeType = "audio/mpeg"; // Set the MIME type for MP3 audio files
        console.log(`Audio content fetched for: ${fileName}`);
      } else {
        console.log(
          `Received non-supported file type: ${messageEvent.message.type}`
        );
        return null;
      }

      // Save the file to Google Drive
      const fileId = await uploadToGoogleDrive(buffer, fileName, mimeType);

      // Get the file's shareable link
      const fileLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

      // Send a reply with the status and file link
      const message: TextMessage = {
        type: "text",
        text: `File uploaded successfully: ${fileName}\nAccess it here: ${fileLink}`,
      };

      await client.replyMessage(messageEvent.replyToken, message);
      console.log(`Message sent to user: ${fileLink}`);
    } else {
      console.log("Received non-message event.");
    }
  } catch (error) {
    console.error("Error processing event:", error);
    await handleError(event);
  }

  return null;
};

const getFileContent = async (messageId: string): Promise<Buffer> => {
  try {
    const stream = await client.getMessageContent(messageId);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    console.log("File content retrieved successfully");
    return buffer;
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw error;
  }
};

// Convert a buffer to a readable stream
const bufferToStream = (buffer: Buffer): Readable => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Signal the end of the stream
  return stream;
};

const uploadToGoogleDrive = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Convert the buffer to a stream before uploading
    const fileStream = bufferToStream(buffer);

    // Ensure the folder ID is set by checking if the folderName folder exists
    if (!folderId) {
      folderId = await GDrive.checkFolderExistsOrCreate(folderName);
      if (!folderId) {
        throw new Error(
          `${folderName} folder could not be created in Google Drive.`
        );
      }
    }

    // Share the folder to Public
    await GDrive.shareFolderWithPublic(folderId);

    //? Share the folder with Personal Account (Optional)
    // await GDrive.shareFolderWithPersonalAccount(folderId, personalGoogleAccountEmail);

    // Create a new file on Google Drive
    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId], // Use folder ID
        mimeType, // Specify the MIME type here
      },
      media: {
        mimeType,
        body: fileStream, // Pass the stream instead of the buffer
      },
    });

    console.log(`Google Drive API response: ${res.status}`);
    return res.data.id || ""; // Return the uploaded file ID
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    throw error;
  }
};

// Handle error responses
const handleError = async (event: WebhookEvent) => {
  if (event.type === "message") {
    const messageEvent = event as MessageEvent;
    const message: TextMessage = {
      type: "text",
      text: `Failed to upload the file. Please try again later.`,
    };
    try {
      await client.replyMessage(messageEvent.replyToken, message);
    } catch (error) {
      console.error("Error sending failure message:", error);
    }
  } else {
    console.log("Cannot send error message for non-message events.");
  }
};

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

import { google } from "googleapis";
export default class GDriveManagement {
  // Function to check if the folder name exists, and create it if it doesn't
  checkFolderExistsOrCreate = async (
    folderName: string
  ): Promise<string | null> => {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      const drive = google.drive({ version: "v3", auth });

      // Search for the folder by name
      const response = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        fields: "files(id, name)",
      });

      const files = response.data.files;

      if (files && files.length > 0) {
        console.log(`Folder '${folderName}' found with ID: ${files[0].id}`);
        return files[0].id || ""; // Return the folder ID if found
      } else {
        console.log(`Folder '${folderName}' not found. Creating it now...`);

        // Create the folder if it doesn't exist
        const folderMetadata = {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        };

        const folder = await drive.files.create({
          requestBody: folderMetadata,
          fields: "id",
        });

        console.log(
          `Folder '${folderName}' created with ID: ${folder.data.id}`
        );
        return folder.data.id || ""; // Return the new folder ID
      }
    } catch (error) {
      console.error("Error checking or creating folder:", error);
      throw error;
    }
  };

  shareFolderWithPublic = async (folderId: string) => {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });

      // Make the folder public (anyone with the link can view it)
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: "reader", // You can change this to "writer" if you want public write access (not recommended)
          type: "anyone", // Public access
        },
      });

      console.log(`Folder shared publicly (anyone with the link can view)`);
    } catch (error) {
      console.error("Error sharing folder with the public:", error);
      throw error;
    }
  };

  shareFolderWithPersonalAccount = async (
    folderId: string,
    personalGoogleAccountEmail: string
  ) => {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });

      // Share with your personal Google account
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: "writer", // Grant write access
          type: "user",
          emailAddress: personalGoogleAccountEmail,
        },
      });

      console.log(
        `Folder shared with personal account: ${personalGoogleAccountEmail}`
      );
    } catch (error) {
      console.error("Error sharing folder:", error);
      throw error;
    }
  };
}

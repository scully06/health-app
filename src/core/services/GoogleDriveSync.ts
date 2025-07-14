// src/core/services/GoogleDriveSync.ts
import { HealthRecord } from "../models/HealthRecord";

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'HealthAppBackups';
const FILE_MIME_TYPE = 'application/json';

export class GoogleDriveSync {
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('アクセストークンがありません。');
    }
    this.accessToken = accessToken;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': FILE_MIME_TYPE,
    };
  }

  /**
   * アプリ専用のバックアップフォルダを検索または作成する
   * @returns {Promise<string>} フォルダのID
   */
  private async findOrCreateFolder(): Promise<string> {
    // フォルダを検索
    const query = `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`;
    const response = await fetch(`${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&spaces=drive`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error('フォルダの検索に失敗しました。');
    
    const data = await response.json();
    if (data.files && data.files.length > 0) {
      console.log('バックアップフォルダが見つかりました。');
      return data.files[0].id;
    }

    // フォルダが見つからなければ作成
    console.log('バックアップフォルダを作成します...');
    const folderMetadata = {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      spaces: ['drive'],
    };
    const createResponse = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(folderMetadata),
    });

    if (!createResponse.ok) throw new Error('フォルダの作成に失敗しました。');

    const createdFolder = await createResponse.json();
    return createdFolder.id;
  }

  /**
   * データをGoogle Driveにバックアップとして保存する
   * @param records 保存する健康記録データ
   */
  public async saveBackup(records: HealthRecord[]): Promise<void> {
    if (records.length === 0) {
      console.log('バックアップするデータがありません。');
      return;
    }

    const folderId = await this.findOrCreateFolder();
    const fileName = `health-app-backup-${new Date().toISOString()}.json`;
    const fileContent = JSON.stringify(records, null, 2);

    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: FILE_MIME_TYPE,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: FILE_MIME_TYPE }));
    form.append('file', new Blob([fileContent], { type: FILE_MIME_TYPE }));

    const response = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Driveへのバックアップに失敗しました:', errorData);
      throw new Error('Google Driveへのバックアップに失敗しました。');
    }

    console.log(`ファイル「${fileName}」が正常にバックアップされました。`);
  }
}

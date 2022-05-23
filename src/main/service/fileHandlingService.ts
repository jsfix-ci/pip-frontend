import {allowedFileTypes, allowedImageTypes} from '../models/consts';
import fs from 'fs';

export class FileHandlingService {
  validateImage(file: File): string {
    if (file) {
      if (this.isValidFileType(file['originalname'], true)) {
        if (this.isFileCorrectSize(file.size)) {
          return null;
        }
        return 'The selected file must be less than 2MB';
      }
      return 'The selected file must be a JPG, PNG, TIF or PDF';
    }
    return 'Select a file to upload';
  }

  validateFileUpload(file: File): string {
    if (file) {
      if (this.isValidFileType(file['originalname'], false)) {
        if (this.isFileCorrectSize(file.size)) {
          return null;
        }
        return 'File too large, please upload file smaller than 2MB';
      }
      return 'Please upload a valid file format';
    }
    return 'Please provide a file';
  }

  readFile(fileName): object {
    try {
      if (this.getFileExtension(fileName) === 'json') {
        const rawData = fs.readFileSync(`./manualUpload/tmp/${fileName}`, 'utf-8');
        return JSON.parse(rawData);
      } else {
        return fs.readFileSync(`./manualUpload/tmp/${fileName}`);
      }
    } catch (err) {
      console.error(`Error while reading the file ${err}.`);
      return null;
    }
  }

  isValidFileType(fileName: string, image: boolean): boolean {
    const fileType = fileName.split('.')[1]?.toLocaleLowerCase();
    return image ? allowedImageTypes.includes(fileType) : allowedFileTypes.includes(fileType);
  }

  isFileCorrectSize(fileSize: number): boolean {
    return fileSize <= 2000000;
  }

  removeFile(file): void {
    const filePath = `./manualUpload/tmp/${file}`;
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Error while deleting ${file}.`);
    }
  }

  getFileExtension(fileName: string): string {
    const regex = /(?:\.([^.]+))?$/;
    return regex.exec(fileName)[1];
  }
}

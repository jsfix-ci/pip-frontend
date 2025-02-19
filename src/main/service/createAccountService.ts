import {AccountManagementRequests} from '../resources/requests/accountManagementRequests';
import fs from 'fs';
import {FileHandlingService} from './fileHandlingService';
import {LanguageFileParser} from '../helpers/languageFileParser';

const languageFileParser = new LanguageFileParser();
const adminRolesList = [
  {
    key: 'super-admin-ctsc',
    text: 'Internal - Super Administrator - CTSC',
    mapping: 'INTERNAL_SUPER_ADMIN_CTSC',
    hint: 'Upload, Remove, Create new accounts, Assess new media requests',
  },
  {
    key: 'super-admin-local',
    text: 'Internal - Super Administrator - Local',
    mapping: 'INTERNAL_SUPER_ADMIN_LOCAL',
    hint: 'Upload, Remove, Create new account',
  },
  {
    key: 'admin-ctsc',
    text: 'Internal - Administrator - CTSC',
    mapping: 'INTERNAL_ADMIN_CTSC',
    hint: 'Upload, Remove, Assess new media request',
  },
  {
    key: 'admin-local',
    text: 'Internal - Administrator - Local',
    mapping: 'INTERNAL_ADMIN_LOCAL',
    hint: 'Upload, Remove',
  },
];
const accountManagementRequests = new AccountManagementRequests();
const fileHandlingService = new FileHandlingService();

export class CreateAccountService {
  public validateFormFields(formValues: object, file: File,
    language: string, languageFile: string): object {
    return {
      nameError: {
        message: this.validateMediaFullName(formValues['fullName'], language, languageFile),
        href: '#fullName',
      },
      emailError: {
        message: this.validateMediaEmailAddress(formValues['emailAddress'], language, languageFile),
        href: '#emailAddress',
      },
      employerError: {
        message: this.validateMediaEmployer(formValues['employer'], language, languageFile),
        href: '#employer',
      },
      fileUploadError: {
        message: fileHandlingService.validateImage(file, language, languageFile),
        href: '#file-upload',
      },
      checkBoxError: {
        message: this.validateCheckbox(formValues['tcbox'], language, languageFile),
        href: '#tcbox',
      },
    };

  }

  public validateAdminFormFields(formValues: object,
    language: string, languageFile: string): object {
    const fileJson = languageFileParser.getLanguageFileJson(languageFile, language);
    return {
      firstNameError: {
        message: this.isNotBlank(formValues['firstName']) ? null :
          languageFileParser.getText(fileJson, null, 'firstnameError'),
        href: '#firstName',
      },
      lastNameError: {
        message: this.isNotBlank(formValues['lastName']) ? null :
          languageFileParser.getText(fileJson, null, 'surnameError'),
        href: '#lastName',
      },
      emailError: {
        message: this.validateEmail(formValues['emailAddress'], language, languageFile),
        href: '#emailAddress',
      },
      radioError: {
        message: formValues['user-role'] ? null :
          languageFileParser.getText(fileJson, null, 'roleError'),
        href: '#user-role',
      },
    };
  }

  public getRoleByKey(key: string): object {
    return adminRolesList.find(item => item.key === key);
  }

  public buildRadiosList(checkedRadio = ''): any[] {
    const radios = [];
    adminRolesList.forEach((role) => {
      radios.push({
        value: role.key,
        text: role.text,
        checked: checkedRadio === role.key,
        hint: {
          text: role.hint,
        },
      });
    });
    return radios;
  }

  isNotBlank(input): boolean {
    return !!(input);
  }

  isDoubleSpaced(input): boolean {
    return input.indexOf('  ') !== -1;
  }

  isStartingWithSpace(input): boolean {
    return input.startsWith(' ');
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]{0,40}@[a-zA-Z0-9.-]{0,40}\.[a-zA-Z]{2,5}$/;
    return emailRegex.test(email);
  }

  validateMediaFullName(input, language, languageFile): string {
    const fileJson = languageFileParser.getLanguageFileJson(languageFile, language);
    if (!this.isNotBlank(input)) {
      return languageFileParser.getText(fileJson, 'fullNameErrors', 'blank');
    } else if (this.isStartingWithSpace(input)) {
      return languageFileParser.getText(fileJson, 'fullNameErrors', 'whiteSpace');
    } else if (this.isDoubleSpaced(input)) {
      return languageFileParser.getText(fileJson, 'fullNameErrors', 'doubleWhiteSpace');
    } else if ((input.split(' ').length - 1) < 1) {
      return languageFileParser.getText(fileJson, 'fullNameErrors', 'nameWithoutWhiteSpace');
    }
    return null;
  }

  validateMediaEmailAddress(input, language, languageFile): string {
    const fileJson = languageFileParser.getLanguageFileJson(languageFile, language);
    if (this.isStartingWithSpace(input)) {
      return languageFileParser.getText(fileJson, 'emailErrors', 'startWithWhiteSpace');
    } else if (this.isDoubleSpaced(input)) {
      return languageFileParser.getText(fileJson, 'emailErrors', 'doubleWhiteSpace');
    } else {
      return this.validateEmail(input, language, languageFile);
    }
  }

  validateMediaEmployer(input, language, languageFile): string {
    const fileJson = languageFileParser.getLanguageFileJson(languageFile, language);
    if (!this.isNotBlank(input)) {
      return languageFileParser.getText(fileJson, 'mediaEmployeeErrors', 'blank');
    } else if (this.isStartingWithSpace(input)) {
      return languageFileParser.getText(fileJson, 'mediaEmployeeErrors', 'whiteSpace');
    } else if (this.isDoubleSpaced(input)) {
      return languageFileParser.getText(fileJson, 'mediaEmployeeErrors', 'doubleWhiteSpace');
    }
    return null;
  }

  validateEmail(email: string, language: string, languageFile: string): string {
    let message = null;
    const fileJson = languageFileParser.getLanguageFileJson(languageFile, language);
    if (this.isNotBlank(email)) {
      if (!this.isValidEmail(email)) {
        message =  languageFileParser.getText(fileJson, 'emailErrors', 'invalidEmailAddress');
      }
    } else {
      message = languageFileParser.getText(fileJson, 'emailErrors', 'blank');
    }
    return message;
  }

  validateCheckbox(input, language, languageFile): string {
    const fileJson = languageFileParser.getLanguageFileJson(languageFile, language);
    if (input) {
      return null;
    } else {
      return languageFileParser.getText(fileJson, null, 'ariaCheckboxError');
    }
  }

  formatCreateAdminAccountPayload(accountObject): any[] {
    return [{
      email: accountObject.emailAddress,
      firstName: accountObject.firstName,
      surname: accountObject.lastName,
      role: accountObject.userRoleObject.mapping,
    }];
  }

  formatCreateMediaAccountPayload(accountObject): any[] {
    return [{
      email: accountObject.emailAddress,
      firstName: accountObject.fullName,
      role: 'VERIFIED',
    }];
  }

  formatCreateAccountPIPayload(azureAccount): any[] {
    return [{
      email: azureAccount.email,
      provenanceUserId: azureAccount.azureAccountId,
      roles: azureAccount.role,
      userProvenance: 'PI_AAD',
    }];
  }

  formatCreateMediaAccount(accountObject, file): any {
    return {
      fullName: accountObject.fullName,
      email: accountObject.emailAddress,
      employer: accountObject.employer,
      status: 'PENDING',
      file: {
        body: fs.readFileSync(file.path),
        name: file.originalname,
      },
    };
  }

  public async createAdminAccount(payload: object, requester: string): Promise<boolean> {
    const azureResponse = await accountManagementRequests.createAzureAccount(
      this.formatCreateAdminAccountPayload(payload), requester);
    if (azureResponse?.['CREATED_ACCOUNTS'][0]) {
      return await accountManagementRequests.createPIAccount(
        this.formatCreateAccountPIPayload(azureResponse['CREATED_ACCOUNTS'][0]), requester);
    }
    return false;
  }

  public async createMediaAccount(payload: object, requester: string): Promise<boolean> {
    const azureResponse = await accountManagementRequests.createAzureAccount(
      this.formatCreateMediaAccountPayload(payload), requester);
    if (azureResponse?.['CREATED_ACCOUNTS'][0]) {
      return await accountManagementRequests.createPIAccount(
        this.formatCreateAccountPIPayload(azureResponse['CREATED_ACCOUNTS'][0]), requester);
    }
    return false;
  }

  public async createMediaApplication(payload: object, file: File): Promise<boolean> {
    return await accountManagementRequests.createMediaAccount(this.formatCreateMediaAccount(payload, file));
  }
}

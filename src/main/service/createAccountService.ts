
export class CreateAccountService {
  public validateFormFields(formValues: object): object {
    const fields = {
      nameError: this.isNotBlank(formValues['fullName']) ? null : 'Enter your full name',
      emailError: this.validateEmail(formValues['emailAddress']),
      employerError: this.isNotBlank(formValues['employer']) ? null : 'Enter your employer',
      fileUploadError: this.validateImage(formValues['file-upload']),
    };

    return fields;
  }

  isValidImageType(imageName: string): boolean {
    const imageType = imageName.split('.')[1].toLocaleLowerCase();
    // TODO: once 546 is merge in add bellow to models/consts
    const allowedTypes = ['jpg', 'jpeg', 'png', 'tiff', 'pdf'];
    return allowedTypes.includes(imageType);
  }

  isNotBlank(input): boolean {
    return !!(input);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  }

  validateEmail(email: string): string {
    let message = null;
    if (this.isNotBlank(email)) {
      if (!this.isValidEmail(email)) {
        message = 'Enter an email address in the correct format, like name@example.com';
      }
    } else {
      message = 'Enter your email address';
    }
    return message;
  }

  validateImage(image: string): string {
    let message = null;
    if (this.isNotBlank(image)) {
      if(!this.isValidImageType(image)) {
        message = 'The selected file must be a JPG, PNG, TIF or PDF'
      }
    } else {
      message = 'Select a file to upload';
    }
    return message;
  }
}

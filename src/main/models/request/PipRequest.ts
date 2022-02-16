import { Request } from 'express';

export interface PipRequest extends Request {
  i18n?: {
    getDataByLanguage: (lng: string) => {
      'account-home': {};
      'alphabetical-search': {};
      'case-name-search': {};
      'case-name-search-results': {};
      'case-reference-number-search': {};
      'case-reference-number-search-results': {};
      'court-name-search': {};
      'delete-subscription': {};
      'home': {};
      'template': {};
      'account-request-submitted': {};
      'create-media-account': {};
      'error': {};
      'file-upload-confirm': {};
      'hearing-list': {};
      'list-option': {};
      'interstitial': {};
      'live-case-alphabet-search': {};
      'live-case-status': {};
      'manual-upload-summary': {};
      'not-found': {};
      'otp-template': {};
      'search': {};
      'search-results': {};
      'session-management': {};
      'single-justice-procedure': {};
      'standard-list': {};
      'subscription-add': {};
      'subscription-management': {};
      'subscription-urn-search': {};
      'subscription-urn-search-result': {};
      'unsubscribe-confirmation': {};
      'sign-in': {};
      'manual-upload': {};
      'view-option': {};
      'warned-list': {};
    };
  };
  lng?: string;
  user?: object;
  file?: File;
}

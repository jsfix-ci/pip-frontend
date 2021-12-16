import {CaseReferenceNumberSearchResultsPage} from './CaseReferenceNumberSearchResults.page';

const helpers = require('../Helpers/Selectors');

export class CaseReferenceNumberSearchPage {

  async getPageTitle(): Promise<string> {
    $(helpers.SearchTitle).catch(() => {
      console.log(`${helpers.SearchTitle} not found`);
    });

    return $(helpers.SearchTitle).getText();
  }

  async enterText(text: string): Promise<void> {
    $(helpers.SearchInput).catch(() => {
      console.log(`${helpers.SearchInput} not found`);
    });

    const searchInput = await $(helpers.SearchInput);
    await searchInput.addValue(text);
  }

  async clickContinue(): Promise<CaseReferenceNumberSearchResultsPage> {
    $(helpers.ContinueButton).catch(() => {
      console.log(`${helpers.ContinueButton} not found`);
    });

    const button = await $(helpers.ContinueButton);
    button.click();
    return new CaseReferenceNumberSearchResultsPage();
  }
}

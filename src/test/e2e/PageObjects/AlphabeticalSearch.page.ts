import { HearingListPage } from './HearingList.page';
import { CommonPage } from './Common.page';
import {SingleJusticeProcedurePage} from "./SingleJusticeProcedure.page";

const helpers = require('../Helpers/Selectors');

export class AlphabeticalSearchPage extends CommonPage {
  async selectFilter(filter: string): Promise<void> {
    await $(helpers[filter]).catch(() => {
      console.log(`${helpers[filter]} not found`);
    });

    await $(helpers[filter]).click();
  }

  async clickApplyFiltersButton(): Promise<void> {
    $(helpers.ContinueButton).catch(() => {
      console.log(`${helpers.ContinueButton} not found`);
    });

    const button = await $(helpers.ContinueButton);
    await button.click();
  }

  async checkIfSelected(filter: string): Promise<boolean> {
    $(helpers[filter]).catch(() => {
      console.log(`${helpers[filter]} not found`);
    });

    return await $(helpers[filter]).isSelected();
  }

  async selectFirstListResult(): Promise<HearingListPage> {
    await $(helpers.FirstItemResult).catch(() => {
      console.log(`${helpers.FirstItemResult} not found`);
    });

    const firstItem = await $(helpers.FirstItemResult);
    firstItem.click();
    return new HearingListPage();
  }

  async selectSecondListResult(): Promise<HearingListPage> {
    await $(helpers.SecondItemResult).catch(() => {
      console.log(`${helpers.SecondItemResult} not found`);
    });

    const secondItem = await $(helpers.SecondItemResult);
    secondItem.click();
    return new HearingListPage();
  }

  async selectSJPLink(): Promise<HearingListPage> {
    await $(helpers.SJPLink).catch(() => {
      console.log(`${helpers.SJPLink} not found`);
    });
    const sjpLink = await $(helpers.SJPLink);
    sjpLink.click();
    return new HearingListPage();
  }

}

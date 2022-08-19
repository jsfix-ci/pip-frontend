import moment from 'moment';
import { SubscriptionRequests } from '../resources/requests/subscriptionRequests';
import { PendingSubscriptionsFromCache } from '../resources/requests/utils/pendingSubscriptionsFromCache';
import { UserSubscriptions } from '../models/UserSubscriptions';
import {PublicationService} from './publicationService';
import {LocationService} from './locationService';
import {FilterService} from './filterService';
import {Location} from '../models/location';
import {ListType} from "../models/listType";

const subscriptionRequests = new SubscriptionRequests();
const pendingSubscriptionsFromCache = new PendingSubscriptionsFromCache();
const publicationService = new PublicationService();
const courtService = new LocationService();
const filterService = new FilterService();

export class SubscriptionService {
  async getSubscriptionsByUser(userid: string): Promise<UserSubscriptions> {
    const subscriptionData = await subscriptionRequests.getUserSubscriptions(userid);
    return (subscriptionData) ? subscriptionData : {caseSubscriptions: [], locationSubscriptions: []};
  }

  async generateCaseTableRows(subscriptionDataCases): Promise<any[]> {
    const caseRows = [];

    if (subscriptionDataCases.length) {
      subscriptionDataCases.forEach((subscription) => {
        caseRows.push(
          [
            {
              text: subscription.caseName,
            },
            {
              text: subscription.caseNumber,
            },
            {
              text: moment(subscription.dateAdded).format('DD MMMM YYYY'),
            },
            {
              html: `<a class='unsubscribe-action' href='delete-subscription?subscription=${subscription.subscriptionId}'>Unsubscribe</a>`,
              format: 'numeric',
            },
          ],
        );
      });
    }
    return caseRows;
  }

  async generateLocationTableRows(subscriptionDataCourts): Promise<any[]> {
    const courtRows = [];
    if (subscriptionDataCourts.length) {
      subscriptionDataCourts.forEach((subscription) => {
        courtRows.push([
          {
            text: subscription.locationName,
          },
          {
            text: moment(subscription.dateAdded).format('DD MMMM YYYY'),
          },
          {
            html: `<a class='unsubscribe-action' href='delete-subscription?subscription=${subscription.subscriptionId}'>Unsubscribe</a>`,
            format: 'numeric',
          },
        ]);
      });
    }
    return courtRows;
  }

  public async unsubscribe(subscriptionId: string): Promise<object> {
    return subscriptionRequests.unsubscribe(subscriptionId);
  }

  public async handleNewSubscription(pendingSubscription, user): Promise<void> {
    const selectionList = Object.keys(pendingSubscription);
    for (const selectionName of selectionList) {
      let hearingIdsList = [];
      let locationIdsList = [];
      let caseDetailsList: object[];
      let courtDetailsList: object[];
      let urnHearing;
      switch (selectionName) {
        case 'case-number':
        case 'hearing-selections[]':
          // pendingSubscription.selectionName gives undefined
          Array.isArray(pendingSubscription[`${selectionName}`]) ?
            hearingIdsList = pendingSubscription[`${selectionName}`] :
            hearingIdsList.push(pendingSubscription[`${selectionName}`]);
          caseDetailsList = await this.getCaseDetails(hearingIdsList, user);
          // set results into cache
          await this.setPendingSubscriptions(caseDetailsList, 'cases', user.piUserId);
          break;
        case 'urn':
          urnHearing = await publicationService.getCaseByCaseUrn(pendingSubscription[`${selectionName}`], user.piUserId);
          if (urnHearing) {
            urnHearing.urnSearch = true;
            await this.setPendingSubscriptions([urnHearing], 'cases', user.piUserId);
          }
          break;
        case 'court-selections[]':
          Array.isArray(pendingSubscription[`${selectionName}`]) ?
            locationIdsList = pendingSubscription[`${selectionName}`] :
            locationIdsList.push(pendingSubscription[`${selectionName}`]);
          courtDetailsList = await this.getCourtDetails(locationIdsList);
          // set results into cache
          await this.setPendingSubscriptions(courtDetailsList, 'courts', user.piUserId);
          break;
      }
    }
  }

  public async getCaseDetails(cases, user): Promise<object[]> {
    const casesList = [];
    for (const caseNumber of cases) {
      const caseDetails = await publicationService.getCaseByCaseNumber(caseNumber, user.piUserId);
      if (caseDetails) {
        casesList.push(caseDetails);
      }
    }
    return casesList;
  }

  public async getCourtDetails(courts): Promise<Location[]> {
    const courtsList = [];
    for (const locationId of courts) {
      const courtDetails = await courtService.getLocationById(locationId);
      if (courtDetails) {
        courtsList.push(courtDetails);
      }
    }
    return courtsList;
  }

  public async setPendingSubscriptions(subscriptions, subscriptionType, userId): Promise<void> {
    await pendingSubscriptionsFromCache.setPendingSubscriptions(subscriptions, subscriptionType, userId);
  }

  public async getPendingSubscriptions(userId, subscriptionType): Promise<any[]> {
    return await pendingSubscriptionsFromCache.getPendingSubscriptions(userId, subscriptionType);
  }

  public async subscribe(userId, userRole): Promise<boolean> {
    let subscribed = true;
    const casesType = 'cases';
    const courtsType = 'courts';
    const cachedCaseSubs = await pendingSubscriptionsFromCache.getPendingSubscriptions(userId, casesType);
    const cachedCourtSubs = await pendingSubscriptionsFromCache.getPendingSubscriptions(userId, courtsType);
    if (cachedCaseSubs) {
      for (const cachedCase of cachedCaseSubs) {
        const response = await subscriptionRequests.subscribe(this.createSubscriptionPayload(cachedCase, casesType, userId));
        response ? await this.removeFromCache({'case': cachedCase.caseNumber}, userId) : subscribed = response;
      }
    }
    if (cachedCourtSubs) {
      for (const cachedCourt of cachedCourtSubs) {
        cachedCourt['listType'] = this.generateAppropriateListTypesForLocation(cachedCourt, userRole);
        const response = await subscriptionRequests.subscribe(this.createSubscriptionPayload(cachedCourt, courtsType, userId));
        response ? await this.removeFromCache({court: cachedCourt.locationId}, userId) : subscribed = response;
      }
    }
    return subscribed;
  }

  createSubscriptionPayload(pendingSubscription, subscriptionType, userId): object {
    let payload;
    switch (subscriptionType) {
      case 'courts':
        payload = {
          channel: 'EMAIL',
          searchType: 'LOCATION_ID',
          searchValue: pendingSubscription.locationId,
          locationName: pendingSubscription.name,
          listType: pendingSubscription.listType,
          userId,
        };
        break;
      case 'cases':
        payload = {
          channel: 'EMAIL',
          searchType: pendingSubscription.urnSearch ? 'CASE_URN' : 'CASE_ID',
          searchValue: pendingSubscription.urnSearch ? pendingSubscription.caseUrn : pendingSubscription.caseNumber,
          caseNumber: pendingSubscription.caseNumber,
          caseName: pendingSubscription.caseName,
          urn: pendingSubscription.caseUrn,
          userId,
        };
        break;
      default:
        payload = {
          channel: 'EMAIL',
          searchType: '',
          searchValue: '',
          userId,
        };
        break;
    }
    return payload;
  }

  public async removeFromCache(record, userId): Promise<void> {
    return await pendingSubscriptionsFromCache.removeFromCache(record, userId);
  }

  /**
   * This method generates the relevant list types for the courts that the user has configured.
   * @param userId The user ID of the user who is configuring their list types.
   * @param filterValuesQuery The currently selected filters.
   * @param clearQuery The clear filter for the query.
   */
  public async generateListTypesForCourts(userId, userRole, filterValuesQuery, clearQuery): Promise<object> {
    let filterValues = filterService.stripFilters(filterValuesQuery);
    if (clearQuery) {
      filterValues = filterService.handleFilterClear(filterValues, clearQuery);
    }

    const applicableListTypes = await this.generateAppropriateListTypes(userId, userRole);

    const filterOptions = this.buildFilterValueOptions(applicableListTypes, filterValues);

    const alphabetisedListTypes = FilterService.generateAlphabetObject();

    if (filterValues.length == 0) {
      for (const [listName, listType] of applicableListTypes) {
        alphabetisedListTypes[listName.charAt(0).toUpperCase()][listName] = {
          listFriendlyName: listType.friendlyName,
          checked: listType.checked
        };
      }
    } else {
      for (const [listName, listType] of applicableListTypes) {
        if (listType.jurisdictions.some(jurisdiction => filterValues.includes(jurisdiction))) {
          alphabetisedListTypes[listName.charAt(0).toUpperCase()][listName] = {
            listFriendlyName: listType.friendlyName,
            checked: listType.checked
          };
        }
      }
    }

    return {
      listOptions: alphabetisedListTypes,
      filterOptions: filterOptions
    };
  }

  private async generateAppropriateListTypes(userId, userRole): Promise<Map<string, ListType>> {
    const userSubscriptions = await this.getSubscriptionsByUser(userId);
    const listTypes = await publicationService.getListTypes();

    let selectedListTypes = [];
    if (userSubscriptions['locationSubscriptions'].length > 0) {
      selectedListTypes = userSubscriptions['locationSubscriptions'][0]['listType'];
    }

    let courtJurisdictions = new Set();
    for (const subscription of userSubscriptions['locationSubscriptions']) {
      let returnedLocation = await courtService.getLocationById(subscription['locationId']);
      returnedLocation.jurisdiction.forEach(jurisdiction => courtJurisdictions.add(jurisdiction));
    }

    const sortedListTypes = new Map([...listTypes].sort());
    const applicableListTypes = new Map();
    for (const [listName, listType] of sortedListTypes) {
      if (listType.jurisdictions.some(jurisdiction => courtJurisdictions.has(jurisdiction))
        && (listType.restrictedProvenances.length === 0 || listType.restrictedProvenances.includes(userRole))) {
        (selectedListTypes != null && selectedListTypes.includes(listName)) ? listType.checked = true : listType.checked = false
        applicableListTypes.set(listName, listType);
      }
    }

    return applicableListTypes;
  }

  /**
   * Generates the appropriate list types for a location
   * @param location The location to get the list types for
   * @param userRole The role of the user.
   * @private
   */
  private generateAppropriateListTypesForLocation(location, userRole): Array<string> {
    const listTypes = publicationService.getListTypes();

    const appropriateListTypes = [];
    for (const [listName, listType] of listTypes) {
      if (listType.jurisdictions.some(jurisdiction => location.jurisdiction.includes(jurisdiction))
        && (listType.restrictedProvenances.length === 0 || listType.restrictedProvenances.includes(userRole))) {
        appropriateListTypes.push(listName)
      }
    }

    return appropriateListTypes;
  }

  public buildFilterValueOptions(list: Map<string, ListType>, selectedFilters: string[]): object {
    const filterValueOptions = {};
    let finalFilterValueOptions = [];

    filterValueOptions["Jurisdiction"] = {};
    finalFilterValueOptions = [];

    const filteredValue = this.getAllJurisdictions(list);

    filteredValue.forEach(value => {
        finalFilterValueOptions.push(value);
    });

    [...finalFilterValueOptions].sort().forEach(value => {
      filterValueOptions["Jurisdiction"][value] = {
        value: value,
        text: value,
        checked: selectedFilters.includes(value),
      };
    });
    return filterValueOptions;
  }

  private getAllJurisdictions(list: Map<String, ListType>): string[] {
    const filterSet = new Set() as Set<string>;
    list.forEach((value, key) => {
      value.jurisdictions.forEach(jurisdiction => filterSet.add(jurisdiction));
    });

    return [...filterSet];
  }


}

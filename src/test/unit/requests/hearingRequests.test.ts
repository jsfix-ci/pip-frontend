import sinon from 'sinon';
import { dataManagementApi } from '../../../main/resources/requests/utils/axiosConfig';
import { HearingRequests } from '../../../main/resources/requests/hearingRequests';
import fs from 'fs';
import path from 'path';

const hearingRequests = new HearingRequests();
const stub = sinon.stub(dataManagementApi, 'get');

const errorResponse = {
  response: {
    data: 'test error',
  },
};
const errorRequest = {
  request: 'test error',
};

const errorMessage = {
  message: 'test',
};

const validCaseNo = 'ABC12345';
const data = [{caseName: 'my hearing', caseNumber: '11223344'}];
const validUrn = '123456789';
const invalidUrn = '1234';
const rawData = fs.readFileSync(path.resolve(__dirname, '../mocks/subscriptionListResult.json'), 'utf-8');
const caseData = JSON.parse(rawData);
const mockCaseData = [{caseName: 'John Smith v B&Q PLC', caseNumber: 'ABC12345'}];

describe('Hearing get requests', () => {
  beforeEach(() => {
    stub.withArgs('/hearings/case-name/').resolves(Promise.reject(errorResponse));
    stub.withArgs('/hearings/case-name/bob').resolves(Promise.reject(errorRequest));
    stub.withArgs('/hearings/case-name/foo').resolves(Promise.reject(errorMessage));
    stub.withArgs('/hearings/case-name/my').resolves({data});
  });

  it('should return hearings list', async () => {
    expect(await hearingRequests.getHearingsByCaseName('my')).toBe(data);
  });

  it('should return empty list if request fails', async () => {
    expect(await hearingRequests.getHearingsByCaseName('')).toStrictEqual([]);
  });

  it('should return empty list if request fails', async () => {
    expect(await hearingRequests.getHearingsByCaseName('bob')).toStrictEqual([]);
  });

  it('should return empty list if message error', async () => {
    expect(await hearingRequests.getHearingsByCaseName('foo')).toStrictEqual([]);
  });
});

describe(`getHearingByCaseReferenceNumber(${validCaseNo})`, () => {
  beforeEach(() => {
    stub.withArgs('/hearings/case-number/').resolves(Promise.reject(errorResponse));
    stub.withArgs('/hearings/case-number/fail').resolves(Promise.reject(errorRequest));
    stub.withArgs('/hearings/case-number/ABC12345').resolves({data: mockCaseData});
  });

  it('should return list of cases', async () => {
    const responseData = await hearingRequests.getHearingByCaseReferenceNumber(validCaseNo);
    expect(responseData).toBe(mockCaseData);
  });

  it('should return empty list if request fails', async () => {
    expect(await hearingRequests.getHearingByCaseReferenceNumber('')).toStrictEqual(null);
  });

  it('should return empty list if request fails', async () => {
    expect(await hearingRequests.getHearingByCaseReferenceNumber('fail')).toStrictEqual(null);
  });
});

describe('non existing subscriptions getHearingByCaseReferenceNumber error request', () => {
  stub.withArgs('/hearings/case-number/12345').resolves(Promise.reject(errorRequest));
  it(`should have only cases for case reference ${validCaseNo}`, () => {
    return hearingRequests.getHearingByCaseReferenceNumber(validCaseNo).then(data => {
      expect(data[0].caseNumber).toEqual(validCaseNo);
    });
  });
});

describe('non existing subscriptions getHearingByCaseReferenceNumber error request', () => {
  stub.withArgs('/hearings/case-number/12345').resolves(Promise.reject(errorRequest));
  it('should return null list of subscriptions for error request', async () => {
    const userSubscriptions = await hearingRequests.getHearingByCaseReferenceNumber('12345');
    expect(userSubscriptions).toBe(null);
  });
});

describe('non existing subscriptions getHearingByCaseReferenceNumber error response', () => {
  stub.withArgs('/hearings/case-number/12345').resolves(Promise.reject(errorMessage));
  it('should return null list of subscriptions for errored call', async () => {
    const userSubscriptions = await hearingRequests.getHearingByCaseReferenceNumber('12345');
    expect(userSubscriptions).toBe(null);
  });
});

describe('get case by unique reference number', () => {
  beforeEach(async () => {
    stub.withArgs('/hearings/urn/123456789').resolves({data:caseData});
    stub.withArgs(`/hearings/urn/${invalidUrn}`).resolves({data:null});
    stub.withArgs('/hearings/urn/12345').resolves(Promise.reject(errorRequest));
    stub.withArgs('/hearings/urn/123456').resolves(Promise.reject(errorResponse));
    stub.withArgs('/hearings/urn/1234567').resolves(Promise.reject(errorMessage));
  });

  it('should return case matching the urn', async () => {
    const requestData = await hearingRequests.getCaseByUrn(validUrn);
    expect(requestData.urn).toEqual(validUrn);
  });

  it('should return null for non existing urn', async () => {
    const requestData = await hearingRequests.getCaseByUrn(invalidUrn);
    expect(requestData).toBe(null);
  });

  it('should return null for error request', async () => {
    const requestData = await hearingRequests.getCaseByUrn('12345');
    expect(requestData).toBe(null);
  });

  it('should return null for error response', async () => {
    const requestData = await hearingRequests.getCaseByUrn('123456');
    expect(requestData).toBe(null);
  });

  it('should return null for error message', async () => {
    const requestData = await hearingRequests.getCaseByUrn('1234567');
    expect(requestData).toBe(null);
  });
});


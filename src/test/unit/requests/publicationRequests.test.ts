import {PublicationRequests} from '../../../main/resources/requests/publicationRequests';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import {dataManagementApi} from '../../../main/resources/requests/utils/axiosConfig';

const Blob = require('node-blob');
const rawDataPubs = fs.readFileSync(path.resolve(__dirname, '../../../test/unit/mocks/summaryOfPublications.json'), 'utf-8');
const pubs = JSON.parse(rawDataPubs);
const totalCases = 6;
const pubRequests = new PublicationRequests();
const rawData = fs.readFileSync(path.resolve(__dirname, '../mocks/dailyCauseList.json'), 'utf-8');
const dailyCauseListData = JSON.parse(rawData);
const rawMetaData = fs.readFileSync(path.resolve(__dirname, '../mocks/returnedArtefacts.json'), 'utf-8');
const metaData = JSON.parse(rawMetaData)[0];
const artefactId = 'abc';
const userId = '123';

const successResponse = {
  data: 'success',
};
const errorRequest = {
  request: 'test error',
};
const errorResponse = {
  response: {
    data: 'test error',
  },
};

const errorMessage = {
  message: 'test',
};
const mockJson = {'data': {'hello': 'hello'}};
const mockPDF = new Blob(['testPDF']);
const indivPubJsonObject = {'data': mockPDF};
const valid = 'valid';
const invalid = 'invalid';
const dataManagementStub = sinon.stub(dataManagementApi, 'get');
const dataMngmntDeleteStub = sinon.stub(dataManagementApi, 'delete');
dataManagementStub.withArgs('/publication/locationId/valid').resolves(successResponse);

const publicationRequests = new PublicationRequests();

dataManagementStub.withArgs('/publication/locationId/valid').resolves(successResponse);

dataManagementStub.withArgs('/publication/abc1/payload').rejects(errorResponse);
dataManagementStub.withArgs('/publication/abc2/payload').rejects(errorRequest);
dataManagementStub.withArgs('/publication/abc3/payload').rejects(errorMessage);
dataManagementStub.withArgs('/publication/' + artefactId + '/payload').resolves({data: dailyCauseListData});

dataManagementStub.withArgs('/publication/abc1').rejects(errorResponse);
dataManagementStub.withArgs('/publication/abc2').rejects(errorRequest);
dataManagementStub.withArgs('/publication/abc3').rejects(errorMessage);
dataManagementStub.withArgs('/publication/' + artefactId).resolves({data: metaData});

dataMngmntDeleteStub.withArgs('/publication/abc1').rejects(errorResponse);
dataMngmntDeleteStub.withArgs('/publication/abc2').rejects(errorRequest);
dataMngmntDeleteStub.withArgs('/publication/abc3').rejects(errorMessage);
dataMngmntDeleteStub.withArgs('/publication/abc').resolves(true);

describe('getIndividualPubJson()', () => {

  it('should return publication json', async () => {
    expect(await publicationRequests.getIndividualPublicationJson(artefactId, userId)).toBe(dailyCauseListData);
  });

  it('should return court PRESTON', async () => {
    return await publicationRequests.getIndividualPublicationJson(artefactId, userId).then(data => {
      expect(data['venue']['venueName']).toEqual('PRESTON');
    });
  });

  it('should return judge title Mr', async () => {
    return await publicationRequests.getIndividualPublicationJson(artefactId, userId).then(data => {
      expect(data['courtLists'][0]['courtHouse']['courtRoom'][0]['session'][0]['judiciary'][0]['johTitle']).toEqual('Mr');
    });
  });

  it('should have two hearings', async () => {
    return await publicationRequests.getIndividualPublicationJson(artefactId, userId).then(data => {
      expect(data['courtLists'][0]['courtHouse']['courtRoom'][0]['session'][0]['sittings'][0]['hearing'].length).toEqual(2);
    });
  });

  it('should return empty list if request fails', async () => {
    expect(await publicationRequests.getIndividualPublicationJson('abc1', userId)).toBe(null);
  });

  it('should return empty list if request fails', async () => {
    expect(await publicationRequests.getIndividualPublicationJson('abc2', userId)).toBe(null);
  });

  it('should return empty list if message error', async () => {
    expect(await publicationRequests.getIndividualPublicationJson('abc3', userId)).toBe(null);
  });
});

describe('getIndividualPubMetadata()', () => {

  it('should return publication meta data', async () => {
    expect(await publicationRequests.getIndividualPublicationMetadata(artefactId, userId, false)).toBe(metaData);
  });

  it('should return content datetime', async () => {
    return await publicationRequests.getIndividualPublicationMetadata(artefactId, userId, false).then(data => {
      expect(data['contentDate']).toEqual('2022-02-14T14:14:59.73967');
    });
  });

  it('should return empty list if request fails', async () => {
    expect(await publicationRequests.getIndividualPublicationMetadata('abc1', userId, false)).toBe(null);
  });

  it('should return empty list if request fails', async () => {
    expect(await publicationRequests.getIndividualPublicationMetadata('abc2', userId, false)).toBe(null);
  });

  it('should return empty list if message error', async () => {
    expect(await publicationRequests.getIndividualPublicationMetadata('abc3', userId, false)).toBe(null);
  });
});

describe('Get by case value', () => {
  dataManagementStub.withArgs('/publication/search/valid/valid').resolves(successResponse);
  dataManagementStub.withArgs('/publication/search/valid/invalid').rejects(errorResponse);
  dataManagementStub.withArgs('/publication/search/invalid/valid').rejects(errorRequest);
  dataManagementStub.withArgs('/publication/search/invalid/invalid').rejects(errorMessage);

  it('should return data on successful get', async () => {
    expect(await pubRequests.getPublicationByCaseValue(valid, valid, userId)).toBe(successResponse.data);
  });

  it('should handle error response from returned service returning empty array', async () => {
    expect(await pubRequests.getPublicationByCaseValue(valid, invalid, userId)).toStrictEqual([]);
  });

  it('should handle error request from returned service returning empty array', async () => {
    expect(await pubRequests.getPublicationByCaseValue(invalid, valid, userId)).toStrictEqual([]);
  });

  it('should handle error request from returned service returning empty array', async () => {
    expect(await pubRequests.getPublicationByCaseValue(invalid, invalid, userId)).toStrictEqual([]);
  });
});

describe('Get publication by court id', () => {
  dataManagementStub.withArgs('/publication/locationId/valid').resolves(successResponse);
  dataManagementStub.withArgs('/publication/locationId/invalid').rejects(errorResponse);
  dataManagementStub.withArgs('/publication/locationId/test').rejects(errorRequest);
  dataManagementStub.withArgs('/publication/locationId/error').rejects(errorMessage);

  it('should return data on successful get', async () => {
    expect(await pubRequests.getPublicationsByCourt(valid, userId, false)).toBe(successResponse.data);
  });

  it('should handle error response from returned service returning empty array', async () => {
    expect(await pubRequests.getPublicationsByCourt(invalid, userId, false)).toStrictEqual([]);
  });

  it('should handle error request from returned service returning empty array', async () => {
    expect(await pubRequests.getPublicationsByCourt('test', userId, false)).toStrictEqual([]);
  });

  it('should handle error request from returned service returning empty array', async () => {
    expect(await pubRequests.getPublicationsByCourt('error', userId, false)).toStrictEqual([]);
  });
});

describe('get individual publication metadata', () => {
  it('should return metadata for a given publication', async () => {
    dataManagementStub.withArgs('/publication/fakeArtefactId').resolves({data: pubs});
    const message = await pubRequests.getIndividualPublicationMetadata('fakeArtefactId', userId, false);
    expect(message.length).toBe(totalCases);
  });

  it('should send an error request to the log if error request exists', async () => {
    dataManagementStub.withArgs('/publication/promiseBreakingData').rejects(errorRequest);
    expect(await pubRequests.getIndividualPublicationMetadata('promiseBreakingData', userId, false)).toBe(null);
  });

  it('should send an error to the log if error response exists', async () => {
    dataManagementStub.withArgs('/publication/brokenPromiseWithErrorResponse').rejects(errorResponse);
    const response = await pubRequests.getIndividualPublicationMetadata('brokenPromiseWithErrorResponse', userId, false);
    expect(response).toBe(null);
  });

  it('should send an error to the log if error message exists and error request does not exist', async () => {
    dataManagementStub.withArgs('/publication/noErrRequest').rejects(errorMessage);
    const message = await pubRequests.getIndividualPublicationMetadata('noErrRequest', userId, false);
    expect(message).toBe(null);
  });

  describe('get individual publication file', () => {
    it('should return file for a given publication', async () => {
      dataManagementStub.withArgs('/publication/fakeArtefactId/file', {
        headers: {'x-user-id': '123'},
        responseType: 'arraybuffer'}).resolves(indivPubJsonObject);
      const message = await pubRequests.getIndividualPublicationFile('fakeArtefactId', userId);
      expect(message).toBe(indivPubJsonObject.data);
    });

    it('should send an error request to the log if error request exists', async () => {
      dataManagementStub.withArgs('/publication/promiseBreakingData/file').rejects(errorRequest);
      expect(await pubRequests.getIndividualPublicationFile('promiseBreakingData', userId)).toBe(null);
    });

    it('should send an error to the log if error response exists', async () => {
      dataManagementStub.withArgs('/publication/brokenPromiseWithErrorResponse/file').rejects(errorResponse);
      const response = await pubRequests.getIndividualPublicationFile('brokenPromiseWithErrorResponse', userId);
      expect(response).toBe(null);
    });

    it('should send an error to the log if error message exists and error request does not exist', async () => {
      dataManagementStub.withArgs('/publication/search/y').rejects(errorMessage);
      const message = await publicationRequests.getPublicationsByCourt('y', userId, false);
      expect(message).toStrictEqual([]);
    });
  });

  describe('get individual publication json', () => {
    it('should return json for a given publication', async () => {
      dataManagementStub.withArgs('/publication/fakeArtefactId/payload', {headers: {'x-user-id': '123'}}).resolves(mockJson);
      const message = await pubRequests.getIndividualPublicationJson('fakeArtefactId', userId);
      expect(message).toBe(mockJson.data);
    });

    it('should send an error request to the log if error request exists', async () => {
      dataManagementStub.withArgs('/publication/promiseBreakingData/payload').rejects(errorRequest);
      expect(await pubRequests.getIndividualPublicationJson('promiseBreakingData', userId)).toBe(null);
    });

    it('should send an error to the log if error response exists', async () => {
      dataManagementStub.withArgs('/publication/brokenPromiseWithErrorResponse/payload').rejects(errorResponse);
      const response = await pubRequests.getIndividualPublicationJson('brokenPromiseWithErrorResponse', userId);
      expect(response).toBe(null);
    });

    it('should send an error to the log if error message exists and error request does not exist', async () => {
      dataManagementStub.withArgs('/publication/noErrRequest/payload').rejects(errorMessage);
      const message = await pubRequests.getIndividualPublicationJson('y', userId);
      expect(message).toBe(null);
    });
  });

  describe('delete publication', () => {
    it('should return true if valid data is provided', async () => {
      const response = await pubRequests.deletePublication('abc', 'joe@bloggs.com');
      expect(response).toBe(true);
    });

    it('should handle error response', async () => {
      expect(await pubRequests.deletePublication('abc1', 'joe@bloggs.com')).toBe(false);
    });

    it('should handle error request', async () => {
      expect(await pubRequests.deletePublication('abc2', 'joe@bloggs.com')).toBe(false);
    });

    it('should handle error message', async () => {
      expect(await pubRequests.deletePublication('abc3', 'joe@bloggs.com')).toBe(false);
    });
  });
});

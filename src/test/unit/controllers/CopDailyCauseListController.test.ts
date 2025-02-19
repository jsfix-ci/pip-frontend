import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import {PublicationService} from '../../../main/service/publicationService';
import {LocationService} from '../../../main/service/locationService';
import {DataManipulationService} from '../../../main/service/dataManipulationService';
import {Response} from 'express';
import {mockRequest} from '../mocks/mockRequest';
import moment from 'moment';
import CopDailyCauseListController from '../../../main/controllers/CopDailyCauseListController';

const rawData = fs.readFileSync(path.resolve(__dirname, '../mocks/copDailyCauseList.json'), 'utf-8');
const listData = JSON.parse(rawData);

const rawMetaData = fs.readFileSync(path.resolve(__dirname, '../mocks/returnedArtefacts.json'), 'utf-8');
const metaData = JSON.parse(rawMetaData)[0];

const rawDataCourt = fs.readFileSync(path.resolve(__dirname, '../mocks/courtAndHearings.json'), 'utf-8');
const courtData = JSON.parse(rawDataCourt);

const copDailyCauseListController = new CopDailyCauseListController();

const copDailyCauseListJsonStub = sinon.stub(PublicationService.prototype, 'getIndividualPublicationJson');
const copDailyCauseListMetaDataStub = sinon.stub(PublicationService.prototype, 'getIndividualPublicationMetadata');
sinon.stub(LocationService.prototype, 'getLocationById').resolves(courtData[0]);
sinon.stub(DataManipulationService.prototype, 'manipulateCopDailyCauseList').returns(listData);
sinon.stub(DataManipulationService.prototype, 'getRegionalJohFromLocationDetails').returns('Test JoH');

const artefactId = 'abc';

copDailyCauseListJsonStub.withArgs(artefactId).resolves(listData);
copDailyCauseListJsonStub.withArgs('').resolves([]);

copDailyCauseListMetaDataStub.withArgs(artefactId).resolves(metaData);
copDailyCauseListMetaDataStub.withArgs('').resolves([]);

const i18n = {
  'cop-daily-cause-list': {},
};

describe('Cop Daily Cause List Controller', () => {

  const response = { render: () => {return '';}} as unknown as Response;
  const request = mockRequest(i18n);
  request.path = '/cop-daily-cause-list';

  afterEach(() => {
    sinon.restore();
  });

  it('should render the cop daily cause list page', async () => {
    request.query = {artefactId: artefactId};
    request.user = {piUserId: '1'};

    const responseMock = sinon.mock(response);
    const expectedData = {
      ...i18n['cop-daily-cause-list'],
      listData,
      contentDate: moment(Date.parse(metaData['contentDate'])).format('DD MMMM YYYY'),
      publishedDate: '13 February 2022',
      publishedTime: '9:30am',
      courtName: 'Abergavenny Magistrates\' Court',
      regionalJoh: 'Test JoH',
      provenance: 'prov1',
      bill: false,
    };

    responseMock.expects('render').once().withArgs('cop-daily-cause-list', expectedData);

    await copDailyCauseListController.get(request, response);
    return responseMock.verify();
  });

  it('should render error page if query param is empty', async () => {
    const request = mockRequest(i18n);
    request.query = {};
    request.user = {piUserId: '123'};

    const responseMock = sinon.mock(response);

    responseMock.expects('render').once().withArgs('error', request.i18n.getDataByLanguage(request.lng).error);

    await copDailyCauseListController.get(request, response);
    return responseMock.verify();
  });
});

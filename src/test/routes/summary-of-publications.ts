import { expect } from 'chai';
import { app } from '../../main/app';
import request from 'supertest';
import {PublicationService} from '../../main/service/publicationService';
import sinon from 'sinon';

const mockJSON = '{"data":"false"}';
const mockArray = '[{"data":"false"}]';
sinon.stub(PublicationService.prototype, 'getIndivPubJson').resolves(mockJSON);
sinon.stub(PublicationService.prototype, 'getPublications').resolves(mockArray);

describe('', () => {
  describe('on GET', () => {
    test('should return summary of publications page', async () => {
      await request(app)
        .get('/summary-of-publications?courtId=0')
        .expect((res) => expect(res.status).to.equal(200));
    });
  });
});

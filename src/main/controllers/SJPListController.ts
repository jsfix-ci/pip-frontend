import {PipRequest} from '../models/request/PipRequest';
import {cloneDeep} from 'lodash';
import {Response} from 'express';
import {PublicationService} from '../service/publicationService';

const publicationService = new PublicationService();
export default class SJPListController {

  public async get(req: PipRequest, res: Response): Promise<void> {
    const artefactId = req.query['artefactId'];
    const metadata = await publicationService.getIndivPubMetadata(artefactId, (!!req.user));
    const fileData = await publicationService.getIndivPubFile(artefactId, (!!req.user));
    const fileDataBuffer = Buffer.from(fileData, 'base64');
    if (metadata.isFlatFile) {
      console.log('this is a flatFile');
      res.set('Content-Type', 'application/pdf');
      res.set('filename', 'data.pdf');
      res.send(fileDataBuffer);
    } else {
      console.log(fileDataBuffer.toString());
      const data = JSON.parse(fileDataBuffer.toString()).Hearing;
      res.render('single-justice-procedure', {
        ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['single-justice-procedure']),
        casesList: data,
        raw: fileDataBuffer,
      });
    }
  }
}

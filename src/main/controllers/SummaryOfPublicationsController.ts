import {PipRequest} from '../models/request/PipRequest';
import { Response } from 'express';
import {cloneDeep} from 'lodash';
import { PublicationService } from '../service/publicationService';
import {CourtService} from '../service/courtService';

const publicationService = new PublicationService();
const courtService = new CourtService();

export default class SummaryOfPublicationsController {

  public async get(req: PipRequest, res: Response): Promise<void> {
    //TODO we should link this up to the reference data endpoint when it's passed
    const courtId = req.query['courtId'];

    if (courtId) {
      const court = await courtService.getCourtById(parseInt(courtId.toString()));
      const courtName = (court == null ? 'Missing Court' : court.name);
      const publications = await publicationService.getPublications(parseInt(courtId.toString()), (!!req.user));
      if (publications.length === 1){
        const ourPublication = publications[0];
        if (ourPublication.isFlatFile){
          res.redirect(`file-publication?artefactId=${ourPublication.artefactId}`);
        }
        else {
          res.redirect(`list-type?artefactId=${ourPublication.artefactId}`);
        }
      }
      else {
        res.render('summary-of-publications', {
          ...cloneDeep(req.i18n.getDataByLanguage(req.lng)['summary-of-publications']),
          publications,
          courtName,
        });
      }
    } else {
      res.render('error', req.i18n.getDataByLanguage(req.lng).error);
    }
  }
}

import {PublicationRequests} from '../resources/requests/PublicationRequests';
import {Artefact} from '../models/artefact';

const PublicationReqs = new PublicationRequests();

export class SummaryOfPublicationsService {

  public async getPublications(courtId, verification: boolean): Promise<Artefact[]> {
    return PublicationReqs.getListOfPubs(courtId, verification);
  }
}

import { federatedDatabase } from "../database";
import { GAMES_CLUB } from "../games.model";

const FEDERATED_CLUBS = federatedDatabase.model("games_clubs", GAMES_CLUB.schema);

export { FEDERATED_CLUBS };

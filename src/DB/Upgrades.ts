import Upgrade from "../Classes/Upgrade";
import type UserData from "../Classes/UserData";

export default [
    new Upgrade(
        'capacity', 
        ['Observer'],
        (source: UserData) => {
            return source.data.getBuildingAmount('Observer').gte(1);
        }
    ),
]
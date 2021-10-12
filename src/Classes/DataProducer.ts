import Decimal from "decimal.js";
import type Upgrade from "./Upgrade"
import type UserData from "./UserData";

export default class DataProducer {
    public name: string;
    public description: string;
    public income: Decimal;
    public price: (current: Decimal, amount: Decimal) => Decimal
    public visible: (source: UserData) => boolean

    public calculateIncome(owned: Decimal, upgrades: Upgrade[]): Decimal
    {
        return new Decimal(0);
    }

    public findUpgrades(source: Upgrade[]): Upgrade[] {
        return source.filter(u => u.affects.includes(this.name));
    }
}
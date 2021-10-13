import Decimal from "decimal.js";
import DataProducer from "../DataProducer";
import type Upgrade from "../Upgrade";
import type UserData from "../UserData";

export default class Observer extends DataProducer {
    public name: string = 'Observer';
    public description: string = 'Observes changes in the world around it to gather data';
    public income: Decimal = new Decimal(1);
    public price = (current: Decimal, amount: Decimal) => 
    {
        return new Decimal(1).times(current.add(1));
    }
    
    public calculateIncome = (owned: Decimal, upgrades: Upgrade[]) => 
    {
        return new Decimal(1);
    }

    public visible = (source: UserData) => 
    {
        return true;
    }
}
import type UserData from "./UserData";

export default class Upgrade {
    public id: string;
    public affects: string[];
    public visible: DataCondition;

    constructor(id: string, affects: string[], visible: DataCondition) {
        this.id = id;
        this.affects = affects;
        this.visible = visible;
    }
}

type DataCondition = (data: UserData) => boolean;
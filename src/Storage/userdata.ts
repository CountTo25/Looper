import { writable } from "svelte/store";
import type Upgrade from "../Classes/Upgrade";
import UserData from "../Classes/UserData"

export let userdata = writable(new UserData());

export const parseRawData = function(): void {
    let UD: UserData = new UserData();
    userdata.set(UD);
}

export const update = () => {
    userdata.update(r => r);
}
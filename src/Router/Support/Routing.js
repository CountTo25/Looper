import { set, clear } from "../../Storage/routes";

export default class Routing {
    static go(route = '', data = {}) {
        clear();
        window.location.href = window.location.href.replace(window.location.hash, '')+'#'+route;
        set(data);
    }

    static find(path = '', routes) {
        return routes.filter((route)=>(route.path === path))[0];
    }
}
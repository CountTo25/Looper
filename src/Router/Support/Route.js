
export default class Route {
    /**
    * @typedef {Object} RouteDefinition
    * @property {?Object} view .svelte view that will be rendered
    * @property {?Object} layout .svelte layout that will be used at rendering
    * @property {?string|?function} title string or closure that will be used to render the title. Function accepts path parameters
    * @property {?string} name name that will be used if you want to redirect to route via Route.go('somename');
    * @property {?Authorization} authorization authorizer that will allow or deny access
    */

    /**
     * @param {RouteDefinition} data used to render route
     * @param {string} path from where view will be rendered
     * acessor for generating new route in streamlined way
     */
    static path(path, data) {
        return new RoutePath(path, data);
    }

        /**
    * @typedef {Object} RouteDefinitionOverride
    * @property {?Object} view - .svelte view that will be rendered
    * @property {?Object} layout - .svelte layout that will be used at rendering
    * @property {?string|?function} title - string or closure that will be used to render the title. Function accepts path parameters
    * @property {?string} name name that will be used if you want to redirect to route via Route.go('somename');
    * @property {?Authorization} authorization authorizer that will allow or deny access

    */

    /**
     * @param {string} prefix that will be prepended to 
     * @param {Array} routes array of routes that will be prefixed
     * @param {?RouteDefinitionOverride} overrides definition that will override route individual definitions
    */
    static group(prefix, overrides, routes) {
        return new RouteGroup(prefix, overrides, routes);
    }

    /** 
     * @param {RouteGroup[]|RoutePath[]} all 
     * declare your routes here
    */
    static define(all) {
        return Compiler.work(all);
    } 
}

class Compiler {
    static work(routes) {
        let compiled = {};
        routes.forEach(route => {
            if (route instanceof RouteGroup) {
                compiled = {...compiled, ... this.handleGroup(route, route.prefix, route.overrides)};
            }
            if (route instanceof RoutePath) {
                console.log(route);
                compiled[route.pathable()] = route.data;
            }
        })
        return compiled;
    }

    static handleGroup(group, prefixStack = '', inheritance = {}) {
        let res = {};
        group.routes.forEach(route => {
            if (route instanceof RouteGroup) {
                res = {...res, ...Compiler.handleGroup(route, prefixStack + route.groupable(), {...inheritance, ...route.overrides})}
            }

            if (route instanceof RoutePath) {
                res[prefixStack+route.groupable()] = {...route.data, ...group.overrides, ...inheritance}
            }
        });
        return res;
    }
}

export class RoutePath {
        /**
     * @param {RouteDefinition} data
     * @param {string} path from where view will be rendered
     */
    constructor(path, data) {
        this.path = path;
        this.data = data;
    }

    groupable() {
        let clean = this.path;
        if (clean[0] === '/') {
            clean = clean.replace('/', '');
        }

        if (clean[clean.length-1] !== '/' && clean.length > 2) {
            clean = clean+'/';
        }

        return clean;
    }

    pathable() {
        let clean = this.path;
        if (clean[0] !== '/') {
            clean = '/'+clean;
        }
        if (clean[clean.length - 1] !== '/' && clean.length > 2) {
            clean = clean+'/';
        }
        return clean;
    }
}

export class RouteGroup {
    constructor(prefix, overrides = {}, routes) {
        this.prefix = prefix.replace('/', '');
        if (this.prefix[0] !== '/') {
            this.prefix = '/'+this.prefix;
        }

        if (this.prefix[prefix.length-1] !== '/') {
            this.prefix+='/';
        }

        this.routes = routes;
        this.overrides = overrides;
    };

    groupable() {
        return this.prefix.replace('/', '');
    }
}

<script>
import Route from "./Support/Route"
import routes from "./Routes";
import App from "../App.svelte";

let basetitle = document.title;
let fallback = '/404/';
let pass = {};
let storage = {};
let keywords = [];
let params = {};

if (!window.location.href.includes('#')) {
    //not a routed view, just / address
    let hash = '#/';
    if (window.location.href[window.location.href.length - 1] !== '/') {
        hash = '/'+hash;
    }
    window.location.href = window.location.href + hash;
}


let urn = window.location.hash.replace('#', '');
let view = null;
let layout = null;
let inject = {};

let changeTrigger = false;


getView(urn);

function getView(urn) {
    params = {};
    //capture variables
    let captured = captureRoute(urn);
    keywords = captured.arguments;
    console.log(routes);
    console.log(captured.route);
    if (!('view' in routes[captured.route]) && !'action' in routes[captured.route]) { //ghetto way instead of checking if its a view
        view = routes[captured.route];
        document.title = basetitle;
        return; //use simple schema
    }

    if ('action' in routes[captured.route]) {
        window.history.back();
        routes[captured.route].action(...keywords);
    }

    if ('before' in routes[captured.route]) {
        let failed = false;
        if (Array.isArray(routes[captured.route].before)) {
            routes[captured.route].before.forEach(element => {
                let result = element();
                if (!result) {failed = true}
            });
        }

        if (typeof routes[captured.route].before === 'function') {
            failed = routes[captured.route].before();
        }
    }

    if ('layout' in routes[captured.route]) {
        view = routes[captured.route].view;
        layout = routes[captured.route].layout;
    } else {
        view = routes[captured.route].view;
        layout = null;
    }
    if ('title' in routes[captured.route]) {
        if (typeof routes[captured.route].title === 'function') {
            document.title = routes[captured.route].title(keywords);
        } else {
            document.title = routes[captured.route].title;
        }
    } else {
        //document.title = basetitle;
    }
}

function onBrowserHistory(e) {
    changeTrigger = !changeTrigger;
    let route = window.location.hash.replace('/', '').replace('#', ''); //thats you, loser
    route = route.length === 0 ? '/' : '/'+route;
    pass = {};
    if (route in storage) {
        pass = storage[route];
    }
    getView(route);
}

window.addEventListener('hashchange', onBrowserHistory);


window.routing = {
    goto: function(route = '', pass = {}) {
        window.location.href = window.location.href.replace(window.location.hash, '')+'#'+route;
        storage[route] = pass;
        inject = pass;
    }
}

function captureRoute(urn) {
    let args = [];

    let explodedUrn = urn.split('/').filter(n => n);
    if (explodedUrn.length === 0 ) {
        explodedUrn = ['/'];
    }

    for (const [path, _] of Object.entries(routes)) {
        let explodedPath = path.split('/').filter(n => n); //string '' is same as false
        if (explodedPath.length === 0) {
            explodedPath = ['/'];
        }

        if (explodedPath.length !== explodedUrn.length) {
            continue;
        }

        let matched = false;
        for (let i = 0; i < explodedPath.length; i++) {
            if (explodedPath[i] !== explodedUrn[i]) {
                //not all hope is lost
                let regexp = new RegExp(/{([^}]*)}/gi);
                if (!regexp.test(explodedPath[i])) {
                    break;
                }
                params[explodedPath[i].replace('{', '').replace('}', '')] = explodedUrn[i];
                args.push(explodedUrn[i]);
            }

            if (i === explodedPath.length - 1 && explodedPath.length === explodedUrn.length) {
                matched = true;
            }
        }

        if (matched) {
            return {
                arguments: args,
                route: path,
            }
        }
    }

    return {
        arguments: [],
        route: fallback,
    }
}

</script>

{#if layout !== null}
    <svelte:component this={layout}>
        {#key changeTrigger}
            <svelte:component this={view}  {...params} pass={inject}/>
        {/key}
    </svelte:component>
{:else}
    <svelte:component this={view}  {...params} pass={inject}/>
{/if}



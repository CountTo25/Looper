
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update$1(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update$1($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    class Route {
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
            });
            return compiled;
        }

        static handleGroup(group, prefixStack = '', inheritance = {}) {
            let res = {};
            group.routes.forEach(route => {
                if (route instanceof RouteGroup) {
                    res = {...res, ...Compiler.handleGroup(route, prefixStack + route.groupable(), {...inheritance, ...route.overrides})};
                }

                if (route instanceof RoutePath) {
                    res[prefixStack+route.groupable()] = {...route.data, ...group.overrides, ...inheritance};
                }
            });
            return res;
        }
    }

    class RoutePath {
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

    class RouteGroup {
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var decimal = createCommonjsModule(function (module) {
    (function (globalScope) {


      /*
       *  decimal.js v10.3.1
       *  An arbitrary-precision Decimal type for JavaScript.
       *  https://github.com/MikeMcl/decimal.js
       *  Copyright (c) 2021 Michael Mclaughlin <M8ch88l@gmail.com>
       *  MIT Licence
       */


      // -----------------------------------  EDITABLE DEFAULTS  ------------------------------------ //


        // The maximum exponent magnitude.
        // The limit on the value of `toExpNeg`, `toExpPos`, `minE` and `maxE`.
      var EXP_LIMIT = 9e15,                      // 0 to 9e15

        // The limit on the value of `precision`, and on the value of the first argument to
        // `toDecimalPlaces`, `toExponential`, `toFixed`, `toPrecision` and `toSignificantDigits`.
        MAX_DIGITS = 1e9,                        // 0 to 1e9

        // Base conversion alphabet.
        NUMERALS = '0123456789abcdef',

        // The natural logarithm of 10 (1025 digits).
        LN10 = '2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058',

        // Pi (1025 digits).
        PI = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789',


        // The initial configuration properties of the Decimal constructor.
        DEFAULTS = {

          // These values must be integers within the stated ranges (inclusive).
          // Most of these values can be changed at run-time using the `Decimal.config` method.

          // The maximum number of significant digits of the result of a calculation or base conversion.
          // E.g. `Decimal.config({ precision: 20 });`
          precision: 20,                         // 1 to MAX_DIGITS

          // The rounding mode used when rounding to `precision`.
          //
          // ROUND_UP         0 Away from zero.
          // ROUND_DOWN       1 Towards zero.
          // ROUND_CEIL       2 Towards +Infinity.
          // ROUND_FLOOR      3 Towards -Infinity.
          // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
          // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
          // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
          // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
          // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
          //
          // E.g.
          // `Decimal.rounding = 4;`
          // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
          rounding: 4,                           // 0 to 8

          // The modulo mode used when calculating the modulus: a mod n.
          // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
          // The remainder (r) is calculated as: r = a - n * q.
          //
          // UP         0 The remainder is positive if the dividend is negative, else is negative.
          // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
          // FLOOR      3 The remainder has the same sign as the divisor (Python %).
          // HALF_EVEN  6 The IEEE 754 remainder function.
          // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
          //
          // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
          // division (9) are commonly used for the modulus operation. The other rounding modes can also
          // be used, but they may not give useful results.
          modulo: 1,                             // 0 to 9

          // The exponent value at and beneath which `toString` returns exponential notation.
          // JavaScript numbers: -7
          toExpNeg: -7,                          // 0 to -EXP_LIMIT

          // The exponent value at and above which `toString` returns exponential notation.
          // JavaScript numbers: 21
          toExpPos:  21,                         // 0 to EXP_LIMIT

          // The minimum exponent value, beneath which underflow to zero occurs.
          // JavaScript numbers: -324  (5e-324)
          minE: -EXP_LIMIT,                      // -1 to -EXP_LIMIT

          // The maximum exponent value, above which overflow to Infinity occurs.
          // JavaScript numbers: 308  (1.7976931348623157e+308)
          maxE: EXP_LIMIT,                       // 1 to EXP_LIMIT

          // Whether to use cryptographically-secure random number generation, if available.
          crypto: false                          // true/false
        },


      // ----------------------------------- END OF EDITABLE DEFAULTS ------------------------------- //


        Decimal, inexact, noConflict, quadrant,
        external = true,

        decimalError = '[DecimalError] ',
        invalidArgument = decimalError + 'Invalid argument: ',
        precisionLimitExceeded = decimalError + 'Precision limit exceeded',
        cryptoUnavailable = decimalError + 'crypto unavailable',
        tag = '[object Decimal]',

        mathfloor = Math.floor,
        mathpow = Math.pow,

        isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i,
        isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i,
        isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i,
        isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,

        BASE = 1e7,
        LOG_BASE = 7,
        MAX_SAFE_INTEGER = 9007199254740991,

        LN10_PRECISION = LN10.length - 1,
        PI_PRECISION = PI.length - 1,

        // Decimal.prototype object
        P = { toStringTag: tag };


      // Decimal prototype methods


      /*
       *  absoluteValue             abs
       *  ceil
       *  clampedTo                 clamp
       *  comparedTo                cmp
       *  cosine                    cos
       *  cubeRoot                  cbrt
       *  decimalPlaces             dp
       *  dividedBy                 div
       *  dividedToIntegerBy        divToInt
       *  equals                    eq
       *  floor
       *  greaterThan               gt
       *  greaterThanOrEqualTo      gte
       *  hyperbolicCosine          cosh
       *  hyperbolicSine            sinh
       *  hyperbolicTangent         tanh
       *  inverseCosine             acos
       *  inverseHyperbolicCosine   acosh
       *  inverseHyperbolicSine     asinh
       *  inverseHyperbolicTangent  atanh
       *  inverseSine               asin
       *  inverseTangent            atan
       *  isFinite
       *  isInteger                 isInt
       *  isNaN
       *  isNegative                isNeg
       *  isPositive                isPos
       *  isZero
       *  lessThan                  lt
       *  lessThanOrEqualTo         lte
       *  logarithm                 log
       *  [maximum]                 [max]
       *  [minimum]                 [min]
       *  minus                     sub
       *  modulo                    mod
       *  naturalExponential        exp
       *  naturalLogarithm          ln
       *  negated                   neg
       *  plus                      add
       *  precision                 sd
       *  round
       *  sine                      sin
       *  squareRoot                sqrt
       *  tangent                   tan
       *  times                     mul
       *  toBinary
       *  toDecimalPlaces           toDP
       *  toExponential
       *  toFixed
       *  toFraction
       *  toHexadecimal             toHex
       *  toNearest
       *  toNumber
       *  toOctal
       *  toPower                   pow
       *  toPrecision
       *  toSignificantDigits       toSD
       *  toString
       *  truncated                 trunc
       *  valueOf                   toJSON
       */


      /*
       * Return a new Decimal whose value is the absolute value of this Decimal.
       *
       */
      P.absoluteValue = P.abs = function () {
        var x = new this.constructor(this);
        if (x.s < 0) x.s = 1;
        return finalise(x);
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
       * direction of positive Infinity.
       *
       */
      P.ceil = function () {
        return finalise(new this.constructor(this), this.e + 1, 2);
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal clamped to the range
       * delineated by `min` and `max`.
       *
       * min {number|string|Decimal}
       * max {number|string|Decimal}
       *
       */
      P.clampedTo = P.clamp = function (min, max) {
        var k,
          x = this,
          Ctor = x.constructor;
        min = new Ctor(min);
        max = new Ctor(max);
        if (!min.s || !max.s) return new Ctor(NaN);
        if (min.gt(max)) throw Error(invalidArgument + max);
        k = x.cmp(min);
        return k < 0 ? min : x.cmp(max) > 0 ? max : new Ctor(x);
      };


      /*
       * Return
       *   1    if the value of this Decimal is greater than the value of `y`,
       *  -1    if the value of this Decimal is less than the value of `y`,
       *   0    if they have the same value,
       *   NaN  if the value of either Decimal is NaN.
       *
       */
      P.comparedTo = P.cmp = function (y) {
        var i, j, xdL, ydL,
          x = this,
          xd = x.d,
          yd = (y = new x.constructor(y)).d,
          xs = x.s,
          ys = y.s;

        // Either NaN or ±Infinity?
        if (!xd || !yd) {
          return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
        }

        // Either zero?
        if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;

        // Signs differ?
        if (xs !== ys) return xs;

        // Compare exponents.
        if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;

        xdL = xd.length;
        ydL = yd.length;

        // Compare digit by digit.
        for (i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i) {
          if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
        }

        // Compare lengths.
        return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
      };


      /*
       * Return a new Decimal whose value is the cosine of the value in radians of this Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-1, 1]
       *
       * cos(0)         = 1
       * cos(-0)        = 1
       * cos(Infinity)  = NaN
       * cos(-Infinity) = NaN
       * cos(NaN)       = NaN
       *
       */
      P.cosine = P.cos = function () {
        var pr, rm,
          x = this,
          Ctor = x.constructor;

        if (!x.d) return new Ctor(NaN);

        // cos(0) = cos(-0) = 1
        if (!x.d[0]) return new Ctor(1);

        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
        Ctor.rounding = 1;

        x = cosine(Ctor, toLessThanHalfPi(Ctor, x));

        Ctor.precision = pr;
        Ctor.rounding = rm;

        return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
      };


      /*
       *
       * Return a new Decimal whose value is the cube root of the value of this Decimal, rounded to
       * `precision` significant digits using rounding mode `rounding`.
       *
       *  cbrt(0)  =  0
       *  cbrt(-0) = -0
       *  cbrt(1)  =  1
       *  cbrt(-1) = -1
       *  cbrt(N)  =  N
       *  cbrt(-I) = -I
       *  cbrt(I)  =  I
       *
       * Math.cbrt(x) = (x < 0 ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3))
       *
       */
      P.cubeRoot = P.cbrt = function () {
        var e, m, n, r, rep, s, sd, t, t3, t3plusx,
          x = this,
          Ctor = x.constructor;

        if (!x.isFinite() || x.isZero()) return new Ctor(x);
        external = false;

        // Initial estimate.
        s = x.s * mathpow(x.s * x, 1 / 3);

         // Math.cbrt underflow/overflow?
         // Pass x to Math.pow as integer, then adjust the exponent of the result.
        if (!s || Math.abs(s) == 1 / 0) {
          n = digitsToString(x.d);
          e = x.e;

          // Adjust n exponent so it is a multiple of 3 away from x exponent.
          if (s = (e - n.length + 1) % 3) n += (s == 1 || s == -2 ? '0' : '00');
          s = mathpow(n, 1 / 3);

          // Rarely, e may be one less than the result exponent value.
          e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));

          if (s == 1 / 0) {
            n = '5e' + e;
          } else {
            n = s.toExponential();
            n = n.slice(0, n.indexOf('e') + 1) + e;
          }

          r = new Ctor(n);
          r.s = x.s;
        } else {
          r = new Ctor(s.toString());
        }

        sd = (e = Ctor.precision) + 3;

        // Halley's method.
        // TODO? Compare Newton's method.
        for (;;) {
          t = r;
          t3 = t.times(t).times(t);
          t3plusx = t3.plus(x);
          r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);

          // TODO? Replace with for-loop and checkRoundingDigits.
          if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
            n = n.slice(sd - 3, sd + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or 4999
            // , i.e. approaching a rounding boundary, continue the iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the exact result as the
              // nines may infinitely repeat.
              if (!rep) {
                finalise(t, e + 1, 0);

                if (t.times(t).times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              sd += 4;
              rep = 1;
            } else {

              // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
              // If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                finalise(r, e + 1, 1);
                m = !r.times(r).times(r).eq(x);
              }

              break;
            }
          }
        }

        external = true;

        return finalise(r, e, Ctor.rounding, m);
      };


      /*
       * Return the number of decimal places of the value of this Decimal.
       *
       */
      P.decimalPlaces = P.dp = function () {
        var w,
          d = this.d,
          n = NaN;

        if (d) {
          w = d.length - 1;
          n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;

          // Subtract the number of trailing zeros of the last word.
          w = d[w];
          if (w) for (; w % 10 == 0; w /= 10) n--;
          if (n < 0) n = 0;
        }

        return n;
      };


      /*
       *  n / 0 = I
       *  n / N = N
       *  n / I = 0
       *  0 / n = 0
       *  0 / 0 = N
       *  0 / N = N
       *  0 / I = 0
       *  N / n = N
       *  N / 0 = N
       *  N / N = N
       *  N / I = N
       *  I / n = I
       *  I / 0 = I
       *  I / N = N
       *  I / I = N
       *
       * Return a new Decimal whose value is the value of this Decimal divided by `y`, rounded to
       * `precision` significant digits using rounding mode `rounding`.
       *
       */
      P.dividedBy = P.div = function (y) {
        return divide(this, new this.constructor(y));
      };


      /*
       * Return a new Decimal whose value is the integer part of dividing the value of this Decimal
       * by the value of `y`, rounded to `precision` significant digits using rounding mode `rounding`.
       *
       */
      P.dividedToIntegerBy = P.divToInt = function (y) {
        var x = this,
          Ctor = x.constructor;
        return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
      };


      /*
       * Return true if the value of this Decimal is equal to the value of `y`, otherwise return false.
       *
       */
      P.equals = P.eq = function (y) {
        return this.cmp(y) === 0;
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
       * direction of negative Infinity.
       *
       */
      P.floor = function () {
        return finalise(new this.constructor(this), this.e + 1, 3);
      };


      /*
       * Return true if the value of this Decimal is greater than the value of `y`, otherwise return
       * false.
       *
       */
      P.greaterThan = P.gt = function (y) {
        return this.cmp(y) > 0;
      };


      /*
       * Return true if the value of this Decimal is greater than or equal to the value of `y`,
       * otherwise return false.
       *
       */
      P.greaterThanOrEqualTo = P.gte = function (y) {
        var k = this.cmp(y);
        return k == 1 || k === 0;
      };


      /*
       * Return a new Decimal whose value is the hyperbolic cosine of the value in radians of this
       * Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [1, Infinity]
       *
       * cosh(x) = 1 + x^2/2! + x^4/4! + x^6/6! + ...
       *
       * cosh(0)         = 1
       * cosh(-0)        = 1
       * cosh(Infinity)  = Infinity
       * cosh(-Infinity) = Infinity
       * cosh(NaN)       = NaN
       *
       *  x        time taken (ms)   result
       * 1000      9                 9.8503555700852349694e+433
       * 10000     25                4.4034091128314607936e+4342
       * 100000    171               1.4033316802130615897e+43429
       * 1000000   3817              1.5166076984010437725e+434294
       * 10000000  abandoned after 2 minute wait
       *
       * TODO? Compare performance of cosh(x) = 0.5 * (exp(x) + exp(-x))
       *
       */
      P.hyperbolicCosine = P.cosh = function () {
        var k, n, pr, rm, len,
          x = this,
          Ctor = x.constructor,
          one = new Ctor(1);

        if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
        if (x.isZero()) return one;

        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
        Ctor.rounding = 1;
        len = x.d.length;

        // Argument reduction: cos(4x) = 1 - 8cos^2(x) + 8cos^4(x) + 1
        // i.e. cos(x) = 1 - cos^2(x/4)(8 - 8cos^2(x/4))

        // Estimate the optimum number of times to use the argument reduction.
        // TODO? Estimation reused from cosine() and may not be optimal here.
        if (len < 32) {
          k = Math.ceil(len / 3);
          n = (1 / tinyPow(4, k)).toString();
        } else {
          k = 16;
          n = '2.3283064365386962890625e-10';
        }

        x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);

        // Reverse argument reduction
        var cosh2_x,
          i = k,
          d8 = new Ctor(8);
        for (; i--;) {
          cosh2_x = x.times(x);
          x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
        }

        return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
      };


      /*
       * Return a new Decimal whose value is the hyperbolic sine of the value in radians of this
       * Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-Infinity, Infinity]
       *
       * sinh(x) = x + x^3/3! + x^5/5! + x^7/7! + ...
       *
       * sinh(0)         = 0
       * sinh(-0)        = -0
       * sinh(Infinity)  = Infinity
       * sinh(-Infinity) = -Infinity
       * sinh(NaN)       = NaN
       *
       * x        time taken (ms)
       * 10       2 ms
       * 100      5 ms
       * 1000     14 ms
       * 10000    82 ms
       * 100000   886 ms            1.4033316802130615897e+43429
       * 200000   2613 ms
       * 300000   5407 ms
       * 400000   8824 ms
       * 500000   13026 ms          8.7080643612718084129e+217146
       * 1000000  48543 ms
       *
       * TODO? Compare performance of sinh(x) = 0.5 * (exp(x) - exp(-x))
       *
       */
      P.hyperbolicSine = P.sinh = function () {
        var k, pr, rm, len,
          x = this,
          Ctor = x.constructor;

        if (!x.isFinite() || x.isZero()) return new Ctor(x);

        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
        Ctor.rounding = 1;
        len = x.d.length;

        if (len < 3) {
          x = taylorSeries(Ctor, 2, x, x, true);
        } else {

          // Alternative argument reduction: sinh(3x) = sinh(x)(3 + 4sinh^2(x))
          // i.e. sinh(x) = sinh(x/3)(3 + 4sinh^2(x/3))
          // 3 multiplications and 1 addition

          // Argument reduction: sinh(5x) = sinh(x)(5 + sinh^2(x)(20 + 16sinh^2(x)))
          // i.e. sinh(x) = sinh(x/5)(5 + sinh^2(x/5)(20 + 16sinh^2(x/5)))
          // 4 multiplications and 2 additions

          // Estimate the optimum number of times to use the argument reduction.
          k = 1.4 * Math.sqrt(len);
          k = k > 16 ? 16 : k | 0;

          x = x.times(1 / tinyPow(5, k));
          x = taylorSeries(Ctor, 2, x, x, true);

          // Reverse argument reduction
          var sinh2_x,
            d5 = new Ctor(5),
            d16 = new Ctor(16),
            d20 = new Ctor(20);
          for (; k--;) {
            sinh2_x = x.times(x);
            x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
          }
        }

        Ctor.precision = pr;
        Ctor.rounding = rm;

        return finalise(x, pr, rm, true);
      };


      /*
       * Return a new Decimal whose value is the hyperbolic tangent of the value in radians of this
       * Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-1, 1]
       *
       * tanh(x) = sinh(x) / cosh(x)
       *
       * tanh(0)         = 0
       * tanh(-0)        = -0
       * tanh(Infinity)  = 1
       * tanh(-Infinity) = -1
       * tanh(NaN)       = NaN
       *
       */
      P.hyperbolicTangent = P.tanh = function () {
        var pr, rm,
          x = this,
          Ctor = x.constructor;

        if (!x.isFinite()) return new Ctor(x.s);
        if (x.isZero()) return new Ctor(x);

        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + 7;
        Ctor.rounding = 1;

        return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
      };


      /*
       * Return a new Decimal whose value is the arccosine (inverse cosine) in radians of the value of
       * this Decimal.
       *
       * Domain: [-1, 1]
       * Range: [0, pi]
       *
       * acos(x) = pi/2 - asin(x)
       *
       * acos(0)       = pi/2
       * acos(-0)      = pi/2
       * acos(1)       = 0
       * acos(-1)      = pi
       * acos(1/2)     = pi/3
       * acos(-1/2)    = 2*pi/3
       * acos(|x| > 1) = NaN
       * acos(NaN)     = NaN
       *
       */
      P.inverseCosine = P.acos = function () {
        var halfPi,
          x = this,
          Ctor = x.constructor,
          k = x.abs().cmp(1),
          pr = Ctor.precision,
          rm = Ctor.rounding;

        if (k !== -1) {
          return k === 0
            // |x| is 1
            ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0)
            // |x| > 1 or x is NaN
            : new Ctor(NaN);
        }

        if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);

        // TODO? Special case acos(0.5) = pi/3 and acos(-0.5) = 2*pi/3

        Ctor.precision = pr + 6;
        Ctor.rounding = 1;

        x = x.asin();
        halfPi = getPi(Ctor, pr + 4, rm).times(0.5);

        Ctor.precision = pr;
        Ctor.rounding = rm;

        return halfPi.minus(x);
      };


      /*
       * Return a new Decimal whose value is the inverse of the hyperbolic cosine in radians of the
       * value of this Decimal.
       *
       * Domain: [1, Infinity]
       * Range: [0, Infinity]
       *
       * acosh(x) = ln(x + sqrt(x^2 - 1))
       *
       * acosh(x < 1)     = NaN
       * acosh(NaN)       = NaN
       * acosh(Infinity)  = Infinity
       * acosh(-Infinity) = NaN
       * acosh(0)         = NaN
       * acosh(-0)        = NaN
       * acosh(1)         = 0
       * acosh(-1)        = NaN
       *
       */
      P.inverseHyperbolicCosine = P.acosh = function () {
        var pr, rm,
          x = this,
          Ctor = x.constructor;

        if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
        if (!x.isFinite()) return new Ctor(x);

        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
        Ctor.rounding = 1;
        external = false;

        x = x.times(x).minus(1).sqrt().plus(x);

        external = true;
        Ctor.precision = pr;
        Ctor.rounding = rm;

        return x.ln();
      };


      /*
       * Return a new Decimal whose value is the inverse of the hyperbolic sine in radians of the value
       * of this Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-Infinity, Infinity]
       *
       * asinh(x) = ln(x + sqrt(x^2 + 1))
       *
       * asinh(NaN)       = NaN
       * asinh(Infinity)  = Infinity
       * asinh(-Infinity) = -Infinity
       * asinh(0)         = 0
       * asinh(-0)        = -0
       *
       */
      P.inverseHyperbolicSine = P.asinh = function () {
        var pr, rm,
          x = this,
          Ctor = x.constructor;

        if (!x.isFinite() || x.isZero()) return new Ctor(x);

        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
        Ctor.rounding = 1;
        external = false;

        x = x.times(x).plus(1).sqrt().plus(x);

        external = true;
        Ctor.precision = pr;
        Ctor.rounding = rm;

        return x.ln();
      };


      /*
       * Return a new Decimal whose value is the inverse of the hyperbolic tangent in radians of the
       * value of this Decimal.
       *
       * Domain: [-1, 1]
       * Range: [-Infinity, Infinity]
       *
       * atanh(x) = 0.5 * ln((1 + x) / (1 - x))
       *
       * atanh(|x| > 1)   = NaN
       * atanh(NaN)       = NaN
       * atanh(Infinity)  = NaN
       * atanh(-Infinity) = NaN
       * atanh(0)         = 0
       * atanh(-0)        = -0
       * atanh(1)         = Infinity
       * atanh(-1)        = -Infinity
       *
       */
      P.inverseHyperbolicTangent = P.atanh = function () {
        var pr, rm, wpr, xsd,
          x = this,
          Ctor = x.constructor;

        if (!x.isFinite()) return new Ctor(NaN);
        if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);

        pr = Ctor.precision;
        rm = Ctor.rounding;
        xsd = x.sd();

        if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);

        Ctor.precision = wpr = xsd - x.e;

        x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);

        Ctor.precision = pr + 4;
        Ctor.rounding = 1;

        x = x.ln();

        Ctor.precision = pr;
        Ctor.rounding = rm;

        return x.times(0.5);
      };


      /*
       * Return a new Decimal whose value is the arcsine (inverse sine) in radians of the value of this
       * Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-pi/2, pi/2]
       *
       * asin(x) = 2*atan(x/(1 + sqrt(1 - x^2)))
       *
       * asin(0)       = 0
       * asin(-0)      = -0
       * asin(1/2)     = pi/6
       * asin(-1/2)    = -pi/6
       * asin(1)       = pi/2
       * asin(-1)      = -pi/2
       * asin(|x| > 1) = NaN
       * asin(NaN)     = NaN
       *
       * TODO? Compare performance of Taylor series.
       *
       */
      P.inverseSine = P.asin = function () {
        var halfPi, k,
          pr, rm,
          x = this,
          Ctor = x.constructor;

        if (x.isZero()) return new Ctor(x);

        k = x.abs().cmp(1);
        pr = Ctor.precision;
        rm = Ctor.rounding;

        if (k !== -1) {

          // |x| is 1
          if (k === 0) {
            halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
            halfPi.s = x.s;
            return halfPi;
          }

          // |x| > 1 or x is NaN
          return new Ctor(NaN);
        }

        // TODO? Special case asin(1/2) = pi/6 and asin(-1/2) = -pi/6

        Ctor.precision = pr + 6;
        Ctor.rounding = 1;

        x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();

        Ctor.precision = pr;
        Ctor.rounding = rm;

        return x.times(2);
      };


      /*
       * Return a new Decimal whose value is the arctangent (inverse tangent) in radians of the value
       * of this Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-pi/2, pi/2]
       *
       * atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
       *
       * atan(0)         = 0
       * atan(-0)        = -0
       * atan(1)         = pi/4
       * atan(-1)        = -pi/4
       * atan(Infinity)  = pi/2
       * atan(-Infinity) = -pi/2
       * atan(NaN)       = NaN
       *
       */
      P.inverseTangent = P.atan = function () {
        var i, j, k, n, px, t, r, wpr, x2,
          x = this,
          Ctor = x.constructor,
          pr = Ctor.precision,
          rm = Ctor.rounding;

        if (!x.isFinite()) {
          if (!x.s) return new Ctor(NaN);
          if (pr + 4 <= PI_PRECISION) {
            r = getPi(Ctor, pr + 4, rm).times(0.5);
            r.s = x.s;
            return r;
          }
        } else if (x.isZero()) {
          return new Ctor(x);
        } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
          r = getPi(Ctor, pr + 4, rm).times(0.25);
          r.s = x.s;
          return r;
        }

        Ctor.precision = wpr = pr + 10;
        Ctor.rounding = 1;

        // TODO? if (x >= 1 && pr <= PI_PRECISION) atan(x) = halfPi * x.s - atan(1 / x);

        // Argument reduction
        // Ensure |x| < 0.42
        // atan(x) = 2 * atan(x / (1 + sqrt(1 + x^2)))

        k = Math.min(28, wpr / LOG_BASE + 2 | 0);

        for (i = k; i; --i) x = x.div(x.times(x).plus(1).sqrt().plus(1));

        external = false;

        j = Math.ceil(wpr / LOG_BASE);
        n = 1;
        x2 = x.times(x);
        r = new Ctor(x);
        px = x;

        // atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
        for (; i !== -1;) {
          px = px.times(x2);
          t = r.minus(px.div(n += 2));

          px = px.times(x2);
          r = t.plus(px.div(n += 2));

          if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--;);
        }

        if (k) r = r.times(2 << (k - 1));

        external = true;

        return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
      };


      /*
       * Return true if the value of this Decimal is a finite number, otherwise return false.
       *
       */
      P.isFinite = function () {
        return !!this.d;
      };


      /*
       * Return true if the value of this Decimal is an integer, otherwise return false.
       *
       */
      P.isInteger = P.isInt = function () {
        return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
      };


      /*
       * Return true if the value of this Decimal is NaN, otherwise return false.
       *
       */
      P.isNaN = function () {
        return !this.s;
      };


      /*
       * Return true if the value of this Decimal is negative, otherwise return false.
       *
       */
      P.isNegative = P.isNeg = function () {
        return this.s < 0;
      };


      /*
       * Return true if the value of this Decimal is positive, otherwise return false.
       *
       */
      P.isPositive = P.isPos = function () {
        return this.s > 0;
      };


      /*
       * Return true if the value of this Decimal is 0 or -0, otherwise return false.
       *
       */
      P.isZero = function () {
        return !!this.d && this.d[0] === 0;
      };


      /*
       * Return true if the value of this Decimal is less than `y`, otherwise return false.
       *
       */
      P.lessThan = P.lt = function (y) {
        return this.cmp(y) < 0;
      };


      /*
       * Return true if the value of this Decimal is less than or equal to `y`, otherwise return false.
       *
       */
      P.lessThanOrEqualTo = P.lte = function (y) {
        return this.cmp(y) < 1;
      };


      /*
       * Return the logarithm of the value of this Decimal to the specified base, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * If no base is specified, return log[10](arg).
       *
       * log[base](arg) = ln(arg) / ln(base)
       *
       * The result will always be correctly rounded if the base of the log is 10, and 'almost always'
       * otherwise:
       *
       * Depending on the rounding mode, the result may be incorrectly rounded if the first fifteen
       * rounding digits are [49]99999999999999 or [50]00000000000000. In that case, the maximum error
       * between the result and the correctly rounded result will be one ulp (unit in the last place).
       *
       * log[-b](a)       = NaN
       * log[0](a)        = NaN
       * log[1](a)        = NaN
       * log[NaN](a)      = NaN
       * log[Infinity](a) = NaN
       * log[b](0)        = -Infinity
       * log[b](-0)       = -Infinity
       * log[b](-a)       = NaN
       * log[b](1)        = 0
       * log[b](Infinity) = Infinity
       * log[b](NaN)      = NaN
       *
       * [base] {number|string|Decimal} The base of the logarithm.
       *
       */
      P.logarithm = P.log = function (base) {
        var isBase10, d, denominator, k, inf, num, sd, r,
          arg = this,
          Ctor = arg.constructor,
          pr = Ctor.precision,
          rm = Ctor.rounding,
          guard = 5;

        // Default base is 10.
        if (base == null) {
          base = new Ctor(10);
          isBase10 = true;
        } else {
          base = new Ctor(base);
          d = base.d;

          // Return NaN if base is negative, or non-finite, or is 0 or 1.
          if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);

          isBase10 = base.eq(10);
        }

        d = arg.d;

        // Is arg negative, non-finite, 0 or 1?
        if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
          return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
        }

        // The result will have a non-terminating decimal expansion if base is 10 and arg is not an
        // integer power of 10.
        if (isBase10) {
          if (d.length > 1) {
            inf = true;
          } else {
            for (k = d[0]; k % 10 === 0;) k /= 10;
            inf = k !== 1;
          }
        }

        external = false;
        sd = pr + guard;
        num = naturalLogarithm(arg, sd);
        denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);

        // The result will have 5 rounding digits.
        r = divide(num, denominator, sd, 1);

        // If at a rounding boundary, i.e. the result's rounding digits are [49]9999 or [50]0000,
        // calculate 10 further digits.
        //
        // If the result is known to have an infinite decimal expansion, repeat this until it is clear
        // that the result is above or below the boundary. Otherwise, if after calculating the 10
        // further digits, the last 14 are nines, round up and assume the result is exact.
        // Also assume the result is exact if the last 14 are zero.
        //
        // Example of a result that will be incorrectly rounded:
        // log[1048576](4503599627370502) = 2.60000000000000009610279511444746...
        // The above result correctly rounded using ROUND_CEIL to 1 decimal place should be 2.7, but it
        // will be given as 2.6 as there are 15 zeros immediately after the requested decimal place, so
        // the exact result would be assumed to be 2.6, which rounded using ROUND_CEIL to 1 decimal
        // place is still 2.6.
        if (checkRoundingDigits(r.d, k = pr, rm)) {

          do {
            sd += 10;
            num = naturalLogarithm(arg, sd);
            denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
            r = divide(num, denominator, sd, 1);

            if (!inf) {

              // Check for 14 nines from the 2nd rounding digit, as the first may be 4.
              if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
                r = finalise(r, pr + 1, 0);
              }

              break;
            }
          } while (checkRoundingDigits(r.d, k += 10, rm));
        }

        external = true;

        return finalise(r, pr, rm);
      };


      /*
       * Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
       *
       * arguments {number|string|Decimal}
       *
      P.max = function () {
        Array.prototype.push.call(arguments, this);
        return maxOrMin(this.constructor, arguments, 'lt');
      };
       */


      /*
       * Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
       *
       * arguments {number|string|Decimal}
       *
      P.min = function () {
        Array.prototype.push.call(arguments, this);
        return maxOrMin(this.constructor, arguments, 'gt');
      };
       */


      /*
       *  n - 0 = n
       *  n - N = N
       *  n - I = -I
       *  0 - n = -n
       *  0 - 0 = 0
       *  0 - N = N
       *  0 - I = -I
       *  N - n = N
       *  N - 0 = N
       *  N - N = N
       *  N - I = N
       *  I - n = I
       *  I - 0 = I
       *  I - N = N
       *  I - I = N
       *
       * Return a new Decimal whose value is the value of this Decimal minus `y`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       */
      P.minus = P.sub = function (y) {
        var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd,
          x = this,
          Ctor = x.constructor;

        y = new Ctor(y);

        // If either is not finite...
        if (!x.d || !y.d) {

          // Return NaN if either is NaN.
          if (!x.s || !y.s) y = new Ctor(NaN);

          // Return y negated if x is finite and y is ±Infinity.
          else if (x.d) y.s = -y.s;

          // Return x if y is finite and x is ±Infinity.
          // Return x if both are ±Infinity with different signs.
          // Return NaN if both are ±Infinity with the same sign.
          else y = new Ctor(y.d || x.s !== y.s ? x : NaN);

          return y;
        }

        // If signs differ...
        if (x.s != y.s) {
          y.s = -y.s;
          return x.plus(y);
        }

        xd = x.d;
        yd = y.d;
        pr = Ctor.precision;
        rm = Ctor.rounding;

        // If either is zero...
        if (!xd[0] || !yd[0]) {

          // Return y negated if x is zero and y is non-zero.
          if (yd[0]) y.s = -y.s;

          // Return x if y is zero and x is non-zero.
          else if (xd[0]) y = new Ctor(x);

          // Return zero if both are zero.
          // From IEEE 754 (2008) 6.3: 0 - 0 = -0 - -0 = -0 when rounding to -Infinity.
          else return new Ctor(rm === 3 ? -0 : 0);

          return external ? finalise(y, pr, rm) : y;
        }

        // x and y are finite, non-zero numbers with the same sign.

        // Calculate base 1e7 exponents.
        e = mathfloor(y.e / LOG_BASE);
        xe = mathfloor(x.e / LOG_BASE);

        xd = xd.slice();
        k = xe - e;

        // If base 1e7 exponents differ...
        if (k) {
          xLTy = k < 0;

          if (xLTy) {
            d = xd;
            k = -k;
            len = yd.length;
          } else {
            d = yd;
            e = xe;
            len = xd.length;
          }

          // Numbers with massively different exponents would result in a very high number of
          // zeros needing to be prepended, but this can be avoided while still ensuring correct
          // rounding by limiting the number of zeros to `Math.ceil(pr / LOG_BASE) + 2`.
          i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;

          if (k > i) {
            k = i;
            d.length = 1;
          }

          // Prepend zeros to equalise exponents.
          d.reverse();
          for (i = k; i--;) d.push(0);
          d.reverse();

        // Base 1e7 exponents equal.
        } else {

          // Check digits to determine which is the bigger number.

          i = xd.length;
          len = yd.length;
          xLTy = i < len;
          if (xLTy) len = i;

          for (i = 0; i < len; i++) {
            if (xd[i] != yd[i]) {
              xLTy = xd[i] < yd[i];
              break;
            }
          }

          k = 0;
        }

        if (xLTy) {
          d = xd;
          xd = yd;
          yd = d;
          y.s = -y.s;
        }

        len = xd.length;

        // Append zeros to `xd` if shorter.
        // Don't add zeros to `yd` if shorter as subtraction only needs to start at `yd` length.
        for (i = yd.length - len; i > 0; --i) xd[len++] = 0;

        // Subtract yd from xd.
        for (i = yd.length; i > k;) {

          if (xd[--i] < yd[i]) {
            for (j = i; j && xd[--j] === 0;) xd[j] = BASE - 1;
            --xd[j];
            xd[i] += BASE;
          }

          xd[i] -= yd[i];
        }

        // Remove trailing zeros.
        for (; xd[--len] === 0;) xd.pop();

        // Remove leading zeros and adjust exponent accordingly.
        for (; xd[0] === 0; xd.shift()) --e;

        // Zero?
        if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);

        y.d = xd;
        y.e = getBase10Exponent(xd, e);

        return external ? finalise(y, pr, rm) : y;
      };


      /*
       *   n % 0 =  N
       *   n % N =  N
       *   n % I =  n
       *   0 % n =  0
       *  -0 % n = -0
       *   0 % 0 =  N
       *   0 % N =  N
       *   0 % I =  0
       *   N % n =  N
       *   N % 0 =  N
       *   N % N =  N
       *   N % I =  N
       *   I % n =  N
       *   I % 0 =  N
       *   I % N =  N
       *   I % I =  N
       *
       * Return a new Decimal whose value is the value of this Decimal modulo `y`, rounded to
       * `precision` significant digits using rounding mode `rounding`.
       *
       * The result depends on the modulo mode.
       *
       */
      P.modulo = P.mod = function (y) {
        var q,
          x = this,
          Ctor = x.constructor;

        y = new Ctor(y);

        // Return NaN if x is ±Infinity or NaN, or y is NaN or ±0.
        if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);

        // Return x if y is ±Infinity or x is ±0.
        if (!y.d || x.d && !x.d[0]) {
          return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
        }

        // Prevent rounding of intermediate calculations.
        external = false;

        if (Ctor.modulo == 9) {

          // Euclidian division: q = sign(y) * floor(x / abs(y))
          // result = x - q * y    where  0 <= result < abs(y)
          q = divide(x, y.abs(), 0, 3, 1);
          q.s *= y.s;
        } else {
          q = divide(x, y, 0, Ctor.modulo, 1);
        }

        q = q.times(y);

        external = true;

        return x.minus(q);
      };


      /*
       * Return a new Decimal whose value is the natural exponential of the value of this Decimal,
       * i.e. the base e raised to the power the value of this Decimal, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       */
      P.naturalExponential = P.exp = function () {
        return naturalExponential(this);
      };


      /*
       * Return a new Decimal whose value is the natural logarithm of the value of this Decimal,
       * rounded to `precision` significant digits using rounding mode `rounding`.
       *
       */
      P.naturalLogarithm = P.ln = function () {
        return naturalLogarithm(this);
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal negated, i.e. as if multiplied by
       * -1.
       *
       */
      P.negated = P.neg = function () {
        var x = new this.constructor(this);
        x.s = -x.s;
        return finalise(x);
      };


      /*
       *  n + 0 = n
       *  n + N = N
       *  n + I = I
       *  0 + n = n
       *  0 + 0 = 0
       *  0 + N = N
       *  0 + I = I
       *  N + n = N
       *  N + 0 = N
       *  N + N = N
       *  N + I = N
       *  I + n = I
       *  I + 0 = I
       *  I + N = N
       *  I + I = I
       *
       * Return a new Decimal whose value is the value of this Decimal plus `y`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       */
      P.plus = P.add = function (y) {
        var carry, d, e, i, k, len, pr, rm, xd, yd,
          x = this,
          Ctor = x.constructor;

        y = new Ctor(y);

        // If either is not finite...
        if (!x.d || !y.d) {

          // Return NaN if either is NaN.
          if (!x.s || !y.s) y = new Ctor(NaN);

          // Return x if y is finite and x is ±Infinity.
          // Return x if both are ±Infinity with the same sign.
          // Return NaN if both are ±Infinity with different signs.
          // Return y if x is finite and y is ±Infinity.
          else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);

          return y;
        }

         // If signs differ...
        if (x.s != y.s) {
          y.s = -y.s;
          return x.minus(y);
        }

        xd = x.d;
        yd = y.d;
        pr = Ctor.precision;
        rm = Ctor.rounding;

        // If either is zero...
        if (!xd[0] || !yd[0]) {

          // Return x if y is zero.
          // Return y if y is non-zero.
          if (!yd[0]) y = new Ctor(x);

          return external ? finalise(y, pr, rm) : y;
        }

        // x and y are finite, non-zero numbers with the same sign.

        // Calculate base 1e7 exponents.
        k = mathfloor(x.e / LOG_BASE);
        e = mathfloor(y.e / LOG_BASE);

        xd = xd.slice();
        i = k - e;

        // If base 1e7 exponents differ...
        if (i) {

          if (i < 0) {
            d = xd;
            i = -i;
            len = yd.length;
          } else {
            d = yd;
            e = k;
            len = xd.length;
          }

          // Limit number of zeros prepended to max(ceil(pr / LOG_BASE), len) + 1.
          k = Math.ceil(pr / LOG_BASE);
          len = k > len ? k + 1 : len + 1;

          if (i > len) {
            i = len;
            d.length = 1;
          }

          // Prepend zeros to equalise exponents. Note: Faster to use reverse then do unshifts.
          d.reverse();
          for (; i--;) d.push(0);
          d.reverse();
        }

        len = xd.length;
        i = yd.length;

        // If yd is longer than xd, swap xd and yd so xd points to the longer array.
        if (len - i < 0) {
          i = len;
          d = yd;
          yd = xd;
          xd = d;
        }

        // Only start adding at yd.length - 1 as the further digits of xd can be left as they are.
        for (carry = 0; i;) {
          carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
          xd[i] %= BASE;
        }

        if (carry) {
          xd.unshift(carry);
          ++e;
        }

        // Remove trailing zeros.
        // No need to check for zero, as +x + +y != 0 && -x + -y != 0
        for (len = xd.length; xd[--len] == 0;) xd.pop();

        y.d = xd;
        y.e = getBase10Exponent(xd, e);

        return external ? finalise(y, pr, rm) : y;
      };


      /*
       * Return the number of significant digits of the value of this Decimal.
       *
       * [z] {boolean|number} Whether to count integer-part trailing zeros: true, false, 1 or 0.
       *
       */
      P.precision = P.sd = function (z) {
        var k,
          x = this;

        if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);

        if (x.d) {
          k = getPrecision(x.d);
          if (z && x.e + 1 > k) k = x.e + 1;
        } else {
          k = NaN;
        }

        return k;
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal rounded to a whole number using
       * rounding mode `rounding`.
       *
       */
      P.round = function () {
        var x = this,
          Ctor = x.constructor;

        return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
      };


      /*
       * Return a new Decimal whose value is the sine of the value in radians of this Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-1, 1]
       *
       * sin(x) = x - x^3/3! + x^5/5! - ...
       *
       * sin(0)         = 0
       * sin(-0)        = -0
       * sin(Infinity)  = NaN
       * sin(-Infinity) = NaN
       * sin(NaN)       = NaN
       *
       */
      P.sine = P.sin = function () {
        var pr, rm,
          x = this,
          Ctor = x.constructor;

        if (!x.isFinite()) return new Ctor(NaN);
        if (x.isZero()) return new Ctor(x);

        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
        Ctor.rounding = 1;

        x = sine(Ctor, toLessThanHalfPi(Ctor, x));

        Ctor.precision = pr;
        Ctor.rounding = rm;

        return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
      };


      /*
       * Return a new Decimal whose value is the square root of this Decimal, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       *  sqrt(-n) =  N
       *  sqrt(N)  =  N
       *  sqrt(-I) =  N
       *  sqrt(I)  =  I
       *  sqrt(0)  =  0
       *  sqrt(-0) = -0
       *
       */
      P.squareRoot = P.sqrt = function () {
        var m, n, sd, r, rep, t,
          x = this,
          d = x.d,
          e = x.e,
          s = x.s,
          Ctor = x.constructor;

        // Negative/NaN/Infinity/zero?
        if (s !== 1 || !d || !d[0]) {
          return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
        }

        external = false;

        // Initial estimate.
        s = Math.sqrt(+x);

        // Math.sqrt underflow/overflow?
        // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
        if (s == 0 || s == 1 / 0) {
          n = digitsToString(d);

          if ((n.length + e) % 2 == 0) n += '0';
          s = Math.sqrt(n);
          e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);

          if (s == 1 / 0) {
            n = '5e' + e;
          } else {
            n = s.toExponential();
            n = n.slice(0, n.indexOf('e') + 1) + e;
          }

          r = new Ctor(n);
        } else {
          r = new Ctor(s.toString());
        }

        sd = (e = Ctor.precision) + 3;

        // Newton-Raphson iteration.
        for (;;) {
          t = r;
          r = t.plus(divide(x, t, sd + 2, 1)).times(0.5);

          // TODO? Replace with for-loop and checkRoundingDigits.
          if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
            n = n.slice(sd - 3, sd + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or
            // 4999, i.e. approaching a rounding boundary, continue the iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the exact result as the
              // nines may infinitely repeat.
              if (!rep) {
                finalise(t, e + 1, 0);

                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              sd += 4;
              rep = 1;
            } else {

              // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
              // If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                finalise(r, e + 1, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }

        external = true;

        return finalise(r, e, Ctor.rounding, m);
      };


      /*
       * Return a new Decimal whose value is the tangent of the value in radians of this Decimal.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-Infinity, Infinity]
       *
       * tan(0)         = 0
       * tan(-0)        = -0
       * tan(Infinity)  = NaN
       * tan(-Infinity) = NaN
       * tan(NaN)       = NaN
       *
       */
      P.tangent = P.tan = function () {
        var pr, rm,
          x = this,
          Ctor = x.constructor;

        if (!x.isFinite()) return new Ctor(NaN);
        if (x.isZero()) return new Ctor(x);

        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + 10;
        Ctor.rounding = 1;

        x = x.sin();
        x.s = 1;
        x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);

        Ctor.precision = pr;
        Ctor.rounding = rm;

        return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
      };


      /*
       *  n * 0 = 0
       *  n * N = N
       *  n * I = I
       *  0 * n = 0
       *  0 * 0 = 0
       *  0 * N = N
       *  0 * I = N
       *  N * n = N
       *  N * 0 = N
       *  N * N = N
       *  N * I = N
       *  I * n = I
       *  I * 0 = N
       *  I * N = N
       *  I * I = I
       *
       * Return a new Decimal whose value is this Decimal times `y`, rounded to `precision` significant
       * digits using rounding mode `rounding`.
       *
       */
      P.times = P.mul = function (y) {
        var carry, e, i, k, r, rL, t, xdL, ydL,
          x = this,
          Ctor = x.constructor,
          xd = x.d,
          yd = (y = new Ctor(y)).d;

        y.s *= x.s;

         // If either is NaN, ±Infinity or ±0...
        if (!xd || !xd[0] || !yd || !yd[0]) {

          return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd

            // Return NaN if either is NaN.
            // Return NaN if x is ±0 and y is ±Infinity, or y is ±0 and x is ±Infinity.
            ? NaN

            // Return ±Infinity if either is ±Infinity.
            // Return ±0 if either is ±0.
            : !xd || !yd ? y.s / 0 : y.s * 0);
        }

        e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
        xdL = xd.length;
        ydL = yd.length;

        // Ensure xd points to the longer array.
        if (xdL < ydL) {
          r = xd;
          xd = yd;
          yd = r;
          rL = xdL;
          xdL = ydL;
          ydL = rL;
        }

        // Initialise the result array with zeros.
        r = [];
        rL = xdL + ydL;
        for (i = rL; i--;) r.push(0);

        // Multiply!
        for (i = ydL; --i >= 0;) {
          carry = 0;
          for (k = xdL + i; k > i;) {
            t = r[k] + yd[i] * xd[k - i - 1] + carry;
            r[k--] = t % BASE | 0;
            carry = t / BASE | 0;
          }

          r[k] = (r[k] + carry) % BASE | 0;
        }

        // Remove trailing zeros.
        for (; !r[--rL];) r.pop();

        if (carry) ++e;
        else r.shift();

        y.d = r;
        y.e = getBase10Exponent(r, e);

        return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
      };


      /*
       * Return a string representing the value of this Decimal in base 2, round to `sd` significant
       * digits using rounding mode `rm`.
       *
       * If the optional `sd` argument is present then return binary exponential notation.
       *
       * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       */
      P.toBinary = function (sd, rm) {
        return toStringBinary(this, 2, sd, rm);
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `dp`
       * decimal places using rounding mode `rm` or `rounding` if `rm` is omitted.
       *
       * If `dp` is omitted, return a new Decimal whose value is the value of this Decimal.
       *
       * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       */
      P.toDecimalPlaces = P.toDP = function (dp, rm) {
        var x = this,
          Ctor = x.constructor;

        x = new Ctor(x);
        if (dp === void 0) return x;

        checkInt32(dp, 0, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);

        return finalise(x, dp + x.e + 1, rm);
      };


      /*
       * Return a string representing the value of this Decimal in exponential notation rounded to
       * `dp` fixed decimal places using rounding mode `rounding`.
       *
       * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       */
      P.toExponential = function (dp, rm) {
        var str,
          x = this,
          Ctor = x.constructor;

        if (dp === void 0) {
          str = finiteToString(x, true);
        } else {
          checkInt32(dp, 0, MAX_DIGITS);

          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);

          x = finalise(new Ctor(x), dp + 1, rm);
          str = finiteToString(x, true, dp + 1);
        }

        return x.isNeg() && !x.isZero() ? '-' + str : str;
      };


      /*
       * Return a string representing the value of this Decimal in normal (fixed-point) notation to
       * `dp` fixed decimal places and rounded using rounding mode `rm` or `rounding` if `rm` is
       * omitted.
       *
       * As with JavaScript numbers, (-0).toFixed(0) is '0', but e.g. (-0.00001).toFixed(0) is '-0'.
       *
       * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
       * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
       * (-0).toFixed(3) is '0.000'.
       * (-0.5).toFixed(0) is '-0'.
       *
       */
      P.toFixed = function (dp, rm) {
        var str, y,
          x = this,
          Ctor = x.constructor;

        if (dp === void 0) {
          str = finiteToString(x);
        } else {
          checkInt32(dp, 0, MAX_DIGITS);

          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);

          y = finalise(new Ctor(x), dp + x.e + 1, rm);
          str = finiteToString(y, false, dp + y.e + 1);
        }

        // To determine whether to add the minus sign look at the value before it was rounded,
        // i.e. look at `x` rather than `y`.
        return x.isNeg() && !x.isZero() ? '-' + str : str;
      };


      /*
       * Return an array representing the value of this Decimal as a simple fraction with an integer
       * numerator and an integer denominator.
       *
       * The denominator will be a positive non-zero value less than or equal to the specified maximum
       * denominator. If a maximum denominator is not specified, the denominator will be the lowest
       * value necessary to represent the number exactly.
       *
       * [maxD] {number|string|Decimal} Maximum denominator. Integer >= 1 and < Infinity.
       *
       */
      P.toFraction = function (maxD) {
        var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r,
          x = this,
          xd = x.d,
          Ctor = x.constructor;

        if (!xd) return new Ctor(x);

        n1 = d0 = new Ctor(1);
        d1 = n0 = new Ctor(0);

        d = new Ctor(d1);
        e = d.e = getPrecision(xd) - x.e - 1;
        k = e % LOG_BASE;
        d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);

        if (maxD == null) {

          // d is 10**e, the minimum max-denominator needed.
          maxD = e > 0 ? d : n1;
        } else {
          n = new Ctor(maxD);
          if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
          maxD = n.gt(d) ? (e > 0 ? d : n1) : n;
        }

        external = false;
        n = new Ctor(digitsToString(xd));
        pr = Ctor.precision;
        Ctor.precision = e = xd.length * LOG_BASE * 2;

        for (;;)  {
          q = divide(n, d, 0, 1, 1);
          d2 = d0.plus(q.times(d1));
          if (d2.cmp(maxD) == 1) break;
          d0 = d1;
          d1 = d2;
          d2 = n1;
          n1 = n0.plus(q.times(d2));
          n0 = d2;
          d2 = d;
          d = n.minus(q.times(d2));
          n = d2;
        }

        d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
        n0 = n0.plus(d2.times(n1));
        d0 = d0.plus(d2.times(d1));
        n0.s = n1.s = x.s;

        // Determine which fraction is closer to x, n0/d0 or n1/d1?
        r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1
            ? [n1, d1] : [n0, d0];

        Ctor.precision = pr;
        external = true;

        return r;
      };


      /*
       * Return a string representing the value of this Decimal in base 16, round to `sd` significant
       * digits using rounding mode `rm`.
       *
       * If the optional `sd` argument is present then return binary exponential notation.
       *
       * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       */
      P.toHexadecimal = P.toHex = function (sd, rm) {
        return toStringBinary(this, 16, sd, rm);
      };


      /*
       * Returns a new Decimal whose value is the nearest multiple of `y` in the direction of rounding
       * mode `rm`, or `Decimal.rounding` if `rm` is omitted, to the value of this Decimal.
       *
       * The return value will always have the same sign as this Decimal, unless either this Decimal
       * or `y` is NaN, in which case the return value will be also be NaN.
       *
       * The return value is not affected by the value of `precision`.
       *
       * y {number|string|Decimal} The magnitude to round to a multiple of.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * 'toNearest() rounding mode not an integer: {rm}'
       * 'toNearest() rounding mode out of range: {rm}'
       *
       */
      P.toNearest = function (y, rm) {
        var x = this,
          Ctor = x.constructor;

        x = new Ctor(x);

        if (y == null) {

          // If x is not finite, return x.
          if (!x.d) return x;

          y = new Ctor(1);
          rm = Ctor.rounding;
        } else {
          y = new Ctor(y);
          if (rm === void 0) {
            rm = Ctor.rounding;
          } else {
            checkInt32(rm, 0, 8);
          }

          // If x is not finite, return x if y is not NaN, else NaN.
          if (!x.d) return y.s ? x : y;

          // If y is not finite, return Infinity with the sign of x if y is Infinity, else NaN.
          if (!y.d) {
            if (y.s) y.s = x.s;
            return y;
          }
        }

        // If y is not zero, calculate the nearest multiple of y to x.
        if (y.d[0]) {
          external = false;
          x = divide(x, y, 0, rm, 1).times(y);
          external = true;
          finalise(x);

        // If y is zero, return zero with the sign of x.
        } else {
          y.s = x.s;
          x = y;
        }

        return x;
      };


      /*
       * Return the value of this Decimal converted to a number primitive.
       * Zero keeps its sign.
       *
       */
      P.toNumber = function () {
        return +this;
      };


      /*
       * Return a string representing the value of this Decimal in base 8, round to `sd` significant
       * digits using rounding mode `rm`.
       *
       * If the optional `sd` argument is present then return binary exponential notation.
       *
       * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       */
      P.toOctal = function (sd, rm) {
        return toStringBinary(this, 8, sd, rm);
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal raised to the power `y`, rounded
       * to `precision` significant digits using rounding mode `rounding`.
       *
       * ECMAScript compliant.
       *
       *   pow(x, NaN)                           = NaN
       *   pow(x, ±0)                            = 1

       *   pow(NaN, non-zero)                    = NaN
       *   pow(abs(x) > 1, +Infinity)            = +Infinity
       *   pow(abs(x) > 1, -Infinity)            = +0
       *   pow(abs(x) == 1, ±Infinity)           = NaN
       *   pow(abs(x) < 1, +Infinity)            = +0
       *   pow(abs(x) < 1, -Infinity)            = +Infinity
       *   pow(+Infinity, y > 0)                 = +Infinity
       *   pow(+Infinity, y < 0)                 = +0
       *   pow(-Infinity, odd integer > 0)       = -Infinity
       *   pow(-Infinity, even integer > 0)      = +Infinity
       *   pow(-Infinity, odd integer < 0)       = -0
       *   pow(-Infinity, even integer < 0)      = +0
       *   pow(+0, y > 0)                        = +0
       *   pow(+0, y < 0)                        = +Infinity
       *   pow(-0, odd integer > 0)              = -0
       *   pow(-0, even integer > 0)             = +0
       *   pow(-0, odd integer < 0)              = -Infinity
       *   pow(-0, even integer < 0)             = +Infinity
       *   pow(finite x < 0, finite non-integer) = NaN
       *
       * For non-integer or very large exponents pow(x, y) is calculated using
       *
       *   x^y = exp(y*ln(x))
       *
       * Assuming the first 15 rounding digits are each equally likely to be any digit 0-9, the
       * probability of an incorrectly rounded result
       * P([49]9{14} | [50]0{14}) = 2 * 0.2 * 10^-14 = 4e-15 = 1/2.5e+14
       * i.e. 1 in 250,000,000,000,000
       *
       * If a result is incorrectly rounded the maximum error will be 1 ulp (unit in last place).
       *
       * y {number|string|Decimal} The power to which to raise this Decimal.
       *
       */
      P.toPower = P.pow = function (y) {
        var e, k, pr, r, rm, s,
          x = this,
          Ctor = x.constructor,
          yn = +(y = new Ctor(y));

        // Either ±Infinity, NaN or ±0?
        if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));

        x = new Ctor(x);

        if (x.eq(1)) return x;

        pr = Ctor.precision;
        rm = Ctor.rounding;

        if (y.eq(1)) return finalise(x, pr, rm);

        // y exponent
        e = mathfloor(y.e / LOG_BASE);

        // If y is a small integer use the 'exponentiation by squaring' algorithm.
        if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
          r = intPow(Ctor, x, k, pr);
          return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
        }

        s = x.s;

        // if x is negative
        if (s < 0) {

          // if y is not an integer
          if (e < y.d.length - 1) return new Ctor(NaN);

          // Result is positive if x is negative and the last digit of integer y is even.
          if ((y.d[e] & 1) == 0) s = 1;

          // if x.eq(-1)
          if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
            x.s = s;
            return x;
          }
        }

        // Estimate result exponent.
        // x^y = 10^e,  where e = y * log10(x)
        // log10(x) = log10(x_significand) + x_exponent
        // log10(x_significand) = ln(x_significand) / ln(10)
        k = mathpow(+x, yn);
        e = k == 0 || !isFinite(k)
          ? mathfloor(yn * (Math.log('0.' + digitsToString(x.d)) / Math.LN10 + x.e + 1))
          : new Ctor(k + '').e;

        // Exponent estimate may be incorrect e.g. x: 0.999999999999999999, y: 2.29, e: 0, r.e: -1.

        // Overflow/underflow?
        if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);

        external = false;
        Ctor.rounding = x.s = 1;

        // Estimate the extra guard digits needed to ensure five correct rounding digits from
        // naturalLogarithm(x). Example of failure without these extra digits (precision: 10):
        // new Decimal(2.32456).pow('2087987436534566.46411')
        // should be 1.162377823e+764914905173815, but is 1.162355823e+764914905173815
        k = Math.min(12, (e + '').length);

        // r = x^y = exp(y*ln(x))
        r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);

        // r may be Infinity, e.g. (0.9999999999999999).pow(-1e+40)
        if (r.d) {

          // Truncate to the required precision plus five rounding digits.
          r = finalise(r, pr + 5, 1);

          // If the rounding digits are [49]9999 or [50]0000 increase the precision by 10 and recalculate
          // the result.
          if (checkRoundingDigits(r.d, pr, rm)) {
            e = pr + 10;

            // Truncate to the increased precision plus five rounding digits.
            r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);

            // Check for 14 nines from the 2nd rounding digit (the first rounding digit may be 4 or 9).
            if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
              r = finalise(r, pr + 1, 0);
            }
          }
        }

        r.s = s;
        external = true;
        Ctor.rounding = rm;

        return finalise(r, pr, rm);
      };


      /*
       * Return a string representing the value of this Decimal rounded to `sd` significant digits
       * using rounding mode `rounding`.
       *
       * Return exponential notation if `sd` is less than the number of digits necessary to represent
       * the integer part of the value in normal notation.
       *
       * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       */
      P.toPrecision = function (sd, rm) {
        var str,
          x = this,
          Ctor = x.constructor;

        if (sd === void 0) {
          str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
        } else {
          checkInt32(sd, 1, MAX_DIGITS);

          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);

          x = finalise(new Ctor(x), sd, rm);
          str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
        }

        return x.isNeg() && !x.isZero() ? '-' + str : str;
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `sd`
       * significant digits using rounding mode `rm`, or to `precision` and `rounding` respectively if
       * omitted.
       *
       * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * 'toSD() digits out of range: {sd}'
       * 'toSD() digits not an integer: {sd}'
       * 'toSD() rounding mode not an integer: {rm}'
       * 'toSD() rounding mode out of range: {rm}'
       *
       */
      P.toSignificantDigits = P.toSD = function (sd, rm) {
        var x = this,
          Ctor = x.constructor;

        if (sd === void 0) {
          sd = Ctor.precision;
          rm = Ctor.rounding;
        } else {
          checkInt32(sd, 1, MAX_DIGITS);

          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);
        }

        return finalise(new Ctor(x), sd, rm);
      };


      /*
       * Return a string representing the value of this Decimal.
       *
       * Return exponential notation if this Decimal has a positive exponent equal to or greater than
       * `toExpPos`, or a negative exponent equal to or less than `toExpNeg`.
       *
       */
      P.toString = function () {
        var x = this,
          Ctor = x.constructor,
          str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);

        return x.isNeg() && !x.isZero() ? '-' + str : str;
      };


      /*
       * Return a new Decimal whose value is the value of this Decimal truncated to a whole number.
       *
       */
      P.truncated = P.trunc = function () {
        return finalise(new this.constructor(this), this.e + 1, 1);
      };


      /*
       * Return a string representing the value of this Decimal.
       * Unlike `toString`, negative zero will include the minus sign.
       *
       */
      P.valueOf = P.toJSON = function () {
        var x = this,
          Ctor = x.constructor,
          str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);

        return x.isNeg() ? '-' + str : str;
      };


      // Helper functions for Decimal.prototype (P) and/or Decimal methods, and their callers.


      /*
       *  digitsToString           P.cubeRoot, P.logarithm, P.squareRoot, P.toFraction, P.toPower,
       *                           finiteToString, naturalExponential, naturalLogarithm
       *  checkInt32               P.toDecimalPlaces, P.toExponential, P.toFixed, P.toNearest,
       *                           P.toPrecision, P.toSignificantDigits, toStringBinary, random
       *  checkRoundingDigits      P.logarithm, P.toPower, naturalExponential, naturalLogarithm
       *  convertBase              toStringBinary, parseOther
       *  cos                      P.cos
       *  divide                   P.atanh, P.cubeRoot, P.dividedBy, P.dividedToIntegerBy,
       *                           P.logarithm, P.modulo, P.squareRoot, P.tan, P.tanh, P.toFraction,
       *                           P.toNearest, toStringBinary, naturalExponential, naturalLogarithm,
       *                           taylorSeries, atan2, parseOther
       *  finalise                 P.absoluteValue, P.atan, P.atanh, P.ceil, P.cos, P.cosh,
       *                           P.cubeRoot, P.dividedToIntegerBy, P.floor, P.logarithm, P.minus,
       *                           P.modulo, P.negated, P.plus, P.round, P.sin, P.sinh, P.squareRoot,
       *                           P.tan, P.times, P.toDecimalPlaces, P.toExponential, P.toFixed,
       *                           P.toNearest, P.toPower, P.toPrecision, P.toSignificantDigits,
       *                           P.truncated, divide, getLn10, getPi, naturalExponential,
       *                           naturalLogarithm, ceil, floor, round, trunc
       *  finiteToString           P.toExponential, P.toFixed, P.toPrecision, P.toString, P.valueOf,
       *                           toStringBinary
       *  getBase10Exponent        P.minus, P.plus, P.times, parseOther
       *  getLn10                  P.logarithm, naturalLogarithm
       *  getPi                    P.acos, P.asin, P.atan, toLessThanHalfPi, atan2
       *  getPrecision             P.precision, P.toFraction
       *  getZeroString            digitsToString, finiteToString
       *  intPow                   P.toPower, parseOther
       *  isOdd                    toLessThanHalfPi
       *  maxOrMin                 max, min
       *  naturalExponential       P.naturalExponential, P.toPower
       *  naturalLogarithm         P.acosh, P.asinh, P.atanh, P.logarithm, P.naturalLogarithm,
       *                           P.toPower, naturalExponential
       *  nonFiniteToString        finiteToString, toStringBinary
       *  parseDecimal             Decimal
       *  parseOther               Decimal
       *  sin                      P.sin
       *  taylorSeries             P.cosh, P.sinh, cos, sin
       *  toLessThanHalfPi         P.cos, P.sin
       *  toStringBinary           P.toBinary, P.toHexadecimal, P.toOctal
       *  truncate                 intPow
       *
       *  Throws:                  P.logarithm, P.precision, P.toFraction, checkInt32, getLn10, getPi,
       *                           naturalLogarithm, config, parseOther, random, Decimal
       */


      function digitsToString(d) {
        var i, k, ws,
          indexOfLastWord = d.length - 1,
          str = '',
          w = d[0];

        if (indexOfLastWord > 0) {
          str += w;
          for (i = 1; i < indexOfLastWord; i++) {
            ws = d[i] + '';
            k = LOG_BASE - ws.length;
            if (k) str += getZeroString(k);
            str += ws;
          }

          w = d[i];
          ws = w + '';
          k = LOG_BASE - ws.length;
          if (k) str += getZeroString(k);
        } else if (w === 0) {
          return '0';
        }

        // Remove trailing zeros of last w.
        for (; w % 10 === 0;) w /= 10;

        return str + w;
      }


      function checkInt32(i, min, max) {
        if (i !== ~~i || i < min || i > max) {
          throw Error(invalidArgument + i);
        }
      }


      /*
       * Check 5 rounding digits if `repeating` is null, 4 otherwise.
       * `repeating == null` if caller is `log` or `pow`,
       * `repeating != null` if caller is `naturalLogarithm` or `naturalExponential`.
       */
      function checkRoundingDigits(d, i, rm, repeating) {
        var di, k, r, rd;

        // Get the length of the first word of the array d.
        for (k = d[0]; k >= 10; k /= 10) --i;

        // Is the rounding digit in the first word of d?
        if (--i < 0) {
          i += LOG_BASE;
          di = 0;
        } else {
          di = Math.ceil((i + 1) / LOG_BASE);
          i %= LOG_BASE;
        }

        // i is the index (0 - 6) of the rounding digit.
        // E.g. if within the word 3487563 the first rounding digit is 5,
        // then i = 4, k = 1000, rd = 3487563 % 1000 = 563
        k = mathpow(10, LOG_BASE - i);
        rd = d[di] % k | 0;

        if (repeating == null) {
          if (i < 3) {
            if (i == 0) rd = rd / 100 | 0;
            else if (i == 1) rd = rd / 10 | 0;
            r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 50000 || rd == 0;
          } else {
            r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) &&
              (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 ||
                (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
          }
        } else {
          if (i < 4) {
            if (i == 0) rd = rd / 1000 | 0;
            else if (i == 1) rd = rd / 100 | 0;
            else if (i == 2) rd = rd / 10 | 0;
            r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
          } else {
            r = ((repeating || rm < 4) && rd + 1 == k ||
            (!repeating && rm > 3) && rd + 1 == k / 2) &&
              (d[di + 1] / k / 1000 | 0) == mathpow(10, i - 3) - 1;
          }
        }

        return r;
      }


      // Convert string of `baseIn` to an array of numbers of `baseOut`.
      // Eg. convertBase('255', 10, 16) returns [15, 15].
      // Eg. convertBase('ff', 16, 10) returns [2, 5, 5].
      function convertBase(str, baseIn, baseOut) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          strL = str.length;

        for (; i < strL;) {
          for (arrL = arr.length; arrL--;) arr[arrL] *= baseIn;
          arr[0] += NUMERALS.indexOf(str.charAt(i++));
          for (j = 0; j < arr.length; j++) {
            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] === void 0) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }


      /*
       * cos(x) = 1 - x^2/2! + x^4/4! - ...
       * |x| < pi/2
       *
       */
      function cosine(Ctor, x) {
        var k, len, y;

        if (x.isZero()) return x;

        // Argument reduction: cos(4x) = 8*(cos^4(x) - cos^2(x)) + 1
        // i.e. cos(x) = 8*(cos^4(x/4) - cos^2(x/4)) + 1

        // Estimate the optimum number of times to use the argument reduction.
        len = x.d.length;
        if (len < 32) {
          k = Math.ceil(len / 3);
          y = (1 / tinyPow(4, k)).toString();
        } else {
          k = 16;
          y = '2.3283064365386962890625e-10';
        }

        Ctor.precision += k;

        x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));

        // Reverse argument reduction
        for (var i = k; i--;) {
          var cos2x = x.times(x);
          x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
        }

        Ctor.precision -= k;

        return x;
      }


      /*
       * Perform division in the specified base.
       */
      var divide = (function () {

        // Assumes non-zero x and k, and hence non-zero result.
        function multiplyInteger(x, k, base) {
          var temp,
            carry = 0,
            i = x.length;

          for (x = x.slice(); i--;) {
            temp = x[i] * k + carry;
            x[i] = temp % base | 0;
            carry = temp / base | 0;
          }

          if (carry) x.unshift(carry);

          return x;
        }

        function compare(a, b, aL, bL) {
          var i, r;

          if (aL != bL) {
            r = aL > bL ? 1 : -1;
          } else {
            for (i = r = 0; i < aL; i++) {
              if (a[i] != b[i]) {
                r = a[i] > b[i] ? 1 : -1;
                break;
              }
            }
          }

          return r;
        }

        function subtract(a, b, aL, base) {
          var i = 0;

          // Subtract b from a.
          for (; aL--;) {
            a[aL] -= i;
            i = a[aL] < b[aL] ? 1 : 0;
            a[aL] = i * base + a[aL] - b[aL];
          }

          // Remove leading zeros.
          for (; !a[0] && a.length > 1;) a.shift();
        }

        return function (x, y, pr, rm, dp, base) {
          var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0,
            yL, yz,
            Ctor = x.constructor,
            sign = x.s == y.s ? 1 : -1,
            xd = x.d,
            yd = y.d;

          // Either NaN, Infinity or 0?
          if (!xd || !xd[0] || !yd || !yd[0]) {

            return new Ctor(// Return NaN if either NaN, or both Infinity or 0.
              !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN :

              // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
              xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
          }

          if (base) {
            logBase = 1;
            e = x.e - y.e;
          } else {
            base = BASE;
            logBase = LOG_BASE;
            e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
          }

          yL = yd.length;
          xL = xd.length;
          q = new Ctor(sign);
          qd = q.d = [];

          // Result exponent may be one less than e.
          // The digit array of a Decimal from toStringBinary may have trailing zeros.
          for (i = 0; yd[i] == (xd[i] || 0); i++);

          if (yd[i] > (xd[i] || 0)) e--;

          if (pr == null) {
            sd = pr = Ctor.precision;
            rm = Ctor.rounding;
          } else if (dp) {
            sd = pr + (x.e - y.e) + 1;
          } else {
            sd = pr;
          }

          if (sd < 0) {
            qd.push(1);
            more = true;
          } else {

            // Convert precision in number of base 10 digits to base 1e7 digits.
            sd = sd / logBase + 2 | 0;
            i = 0;

            // divisor < 1e7
            if (yL == 1) {
              k = 0;
              yd = yd[0];
              sd++;

              // k is the carry.
              for (; (i < xL || k) && sd--; i++) {
                t = k * base + (xd[i] || 0);
                qd[i] = t / yd | 0;
                k = t % yd | 0;
              }

              more = k || i < xL;

            // divisor >= 1e7
            } else {

              // Normalise xd and yd so highest order digit of yd is >= base/2
              k = base / (yd[0] + 1) | 0;

              if (k > 1) {
                yd = multiplyInteger(yd, k, base);
                xd = multiplyInteger(xd, k, base);
                yL = yd.length;
                xL = xd.length;
              }

              xi = yL;
              rem = xd.slice(0, yL);
              remL = rem.length;

              // Add zeros to make remainder as long as divisor.
              for (; remL < yL;) rem[remL++] = 0;

              yz = yd.slice();
              yz.unshift(0);
              yd0 = yd[0];

              if (yd[1] >= base / 2) ++yd0;

              do {
                k = 0;

                // Compare divisor and remainder.
                cmp = compare(yd, rem, yL, remL);

                // If divisor < remainder.
                if (cmp < 0) {

                  // Calculate trial digit, k.
                  rem0 = rem[0];
                  if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

                  // k will be how many times the divisor goes into the current remainder.
                  k = rem0 / yd0 | 0;

                  //  Algorithm:
                  //  1. product = divisor * trial digit (k)
                  //  2. if product > remainder: product -= divisor, k--
                  //  3. remainder -= product
                  //  4. if product was < remainder at 2:
                  //    5. compare new remainder and divisor
                  //    6. If remainder > divisor: remainder -= divisor, k++

                  if (k > 1) {
                    if (k >= base) k = base - 1;

                    // product = divisor * trial digit.
                    prod = multiplyInteger(yd, k, base);
                    prodL = prod.length;
                    remL = rem.length;

                    // Compare product and remainder.
                    cmp = compare(prod, rem, prodL, remL);

                    // product > remainder.
                    if (cmp == 1) {
                      k--;

                      // Subtract divisor from product.
                      subtract(prod, yL < prodL ? yz : yd, prodL, base);
                    }
                  } else {

                    // cmp is -1.
                    // If k is 0, there is no need to compare yd and rem again below, so change cmp to 1
                    // to avoid it. If k is 1 there is a need to compare yd and rem again below.
                    if (k == 0) cmp = k = 1;
                    prod = yd.slice();
                  }

                  prodL = prod.length;
                  if (prodL < remL) prod.unshift(0);

                  // Subtract product from remainder.
                  subtract(rem, prod, remL, base);

                  // If product was < previous remainder.
                  if (cmp == -1) {
                    remL = rem.length;

                    // Compare divisor and new remainder.
                    cmp = compare(yd, rem, yL, remL);

                    // If divisor < new remainder, subtract divisor from remainder.
                    if (cmp < 1) {
                      k++;

                      // Subtract divisor from remainder.
                      subtract(rem, yL < remL ? yz : yd, remL, base);
                    }
                  }

                  remL = rem.length;
                } else if (cmp === 0) {
                  k++;
                  rem = [0];
                }    // if cmp === 1, k will be 0

                // Add the next digit, k, to the result array.
                qd[i++] = k;

                // Update the remainder.
                if (cmp && rem[0]) {
                  rem[remL++] = xd[xi] || 0;
                } else {
                  rem = [xd[xi]];
                  remL = 1;
                }

              } while ((xi++ < xL || rem[0] !== void 0) && sd--);

              more = rem[0] !== void 0;
            }

            // Leading zero?
            if (!qd[0]) qd.shift();
          }

          // logBase is 1 when divide is being used for base conversion.
          if (logBase == 1) {
            q.e = e;
            inexact = more;
          } else {

            // To calculate q.e, first get the number of digits of qd[0].
            for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
            q.e = i + e * logBase - 1;

            finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
          }

          return q;
        };
      })();


      /*
       * Round `x` to `sd` significant digits using rounding mode `rm`.
       * Check for over/under-flow.
       */
       function finalise(x, sd, rm, isTruncated) {
        var digits, i, j, k, rd, roundUp, w, xd, xdi,
          Ctor = x.constructor;

        // Don't round if sd is null or undefined.
        out: if (sd != null) {
          xd = x.d;

          // Infinity/NaN.
          if (!xd) return x;

          // rd: the rounding digit, i.e. the digit after the digit that may be rounded up.
          // w: the word of xd containing rd, a base 1e7 number.
          // xdi: the index of w within xd.
          // digits: the number of digits of w.
          // i: what would be the index of rd within w if all the numbers were 7 digits long (i.e. if
          // they had leading zeros)
          // j: if > 0, the actual index of rd within w (if < 0, rd is a leading zero).

          // Get the length of the first word of the digits array xd.
          for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
          i = sd - digits;

          // Is the rounding digit in the first word of xd?
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            w = xd[xdi = 0];

            // Get the rounding digit at index j of w.
            rd = w / mathpow(10, digits - j - 1) % 10 | 0;
          } else {
            xdi = Math.ceil((i + 1) / LOG_BASE);
            k = xd.length;
            if (xdi >= k) {
              if (isTruncated) {

                // Needed by `naturalExponential`, `naturalLogarithm` and `squareRoot`.
                for (; k++ <= xdi;) xd.push(0);
                w = rd = 0;
                digits = 1;
                i %= LOG_BASE;
                j = i - LOG_BASE + 1;
              } else {
                break out;
              }
            } else {
              w = k = xd[xdi];

              // Get the number of digits of w.
              for (digits = 1; k >= 10; k /= 10) digits++;

              // Get the index of rd within w.
              i %= LOG_BASE;

              // Get the index of rd within w, adjusted for leading zeros.
              // The number of leading zeros of w is given by LOG_BASE - digits.
              j = i - LOG_BASE + digits;

              // Get the rounding digit at index j of w.
              rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
            }
          }

          // Are there any non-zero digits after the rounding digit?
          isTruncated = isTruncated || sd < 0 ||
            xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));

          // The expression `w % mathpow(10, digits - j - 1)` returns all the digits of w to the right
          // of the digit at (left-to-right) index j, e.g. if w is 908714 and j is 2, the expression
          // will give 714.

          roundUp = rm < 4
            ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
            : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 &&

              // Check whether the digit to the left of the rounding digit is odd.
              ((i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10) & 1 ||
                rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xd[0]) {
            xd.length = 0;
            if (roundUp) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
              x.e = -sd || 0;
            } else {

              // Zero.
              xd[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xd.length = xdi;
            k = 1;
            xdi--;
          } else {
            xd.length = xdi + 1;
            k = mathpow(10, LOG_BASE - i);

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of w.
            xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
          }

          if (roundUp) {
            for (;;) {

              // Is the digit to be rounded up in the first word of xd?
              if (xdi == 0) {

                // i will be the length of xd[0] before k is added.
                for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
                j = xd[0] += k;
                for (k = 1; j >= 10; j /= 10) k++;

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xd[0] == BASE) xd[0] = 1;
                }

                break;
              } else {
                xd[xdi] += k;
                if (xd[xdi] != BASE) break;
                xd[xdi--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xd.length; xd[--i] === 0;) xd.pop();
        }

        if (external) {

          // Overflow?
          if (x.e > Ctor.maxE) {

            // Infinity.
            x.d = null;
            x.e = NaN;

          // Underflow?
          } else if (x.e < Ctor.minE) {

            // Zero.
            x.e = 0;
            x.d = [0];
            // Ctor.underflow = true;
          } // else Ctor.underflow = false;
        }

        return x;
      }


      function finiteToString(x, isExp, sd) {
        if (!x.isFinite()) return nonFiniteToString(x);
        var k,
          e = x.e,
          str = digitsToString(x.d),
          len = str.length;

        if (isExp) {
          if (sd && (k = sd - len) > 0) {
            str = str.charAt(0) + '.' + str.slice(1) + getZeroString(k);
          } else if (len > 1) {
            str = str.charAt(0) + '.' + str.slice(1);
          }

          str = str + (x.e < 0 ? 'e' : 'e+') + x.e;
        } else if (e < 0) {
          str = '0.' + getZeroString(-e - 1) + str;
          if (sd && (k = sd - len) > 0) str += getZeroString(k);
        } else if (e >= len) {
          str += getZeroString(e + 1 - len);
          if (sd && (k = sd - e - 1) > 0) str = str + '.' + getZeroString(k);
        } else {
          if ((k = e + 1) < len) str = str.slice(0, k) + '.' + str.slice(k);
          if (sd && (k = sd - len) > 0) {
            if (e + 1 === len) str += '.';
            str += getZeroString(k);
          }
        }

        return str;
      }


      // Calculate the base 10 exponent from the base 1e7 exponent.
      function getBase10Exponent(digits, e) {
        var w = digits[0];

        // Add the number of digits of the first word of the digits array.
        for ( e *= LOG_BASE; w >= 10; w /= 10) e++;
        return e;
      }


      function getLn10(Ctor, sd, pr) {
        if (sd > LN10_PRECISION) {

          // Reset global state in case the exception is caught.
          external = true;
          if (pr) Ctor.precision = pr;
          throw Error(precisionLimitExceeded);
        }
        return finalise(new Ctor(LN10), sd, 1, true);
      }


      function getPi(Ctor, sd, rm) {
        if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
        return finalise(new Ctor(PI), sd, rm, true);
      }


      function getPrecision(digits) {
        var w = digits.length - 1,
          len = w * LOG_BASE + 1;

        w = digits[w];

        // If non-zero...
        if (w) {

          // Subtract the number of trailing zeros of the last word.
          for (; w % 10 == 0; w /= 10) len--;

          // Add the number of digits of the first word.
          for (w = digits[0]; w >= 10; w /= 10) len++;
        }

        return len;
      }


      function getZeroString(k) {
        var zs = '';
        for (; k--;) zs += '0';
        return zs;
      }


      /*
       * Return a new Decimal whose value is the value of Decimal `x` to the power `n`, where `n` is an
       * integer of type number.
       *
       * Implements 'exponentiation by squaring'. Called by `pow` and `parseOther`.
       *
       */
      function intPow(Ctor, x, n, pr) {
        var isTruncated,
          r = new Ctor(1),

          // Max n of 9007199254740991 takes 53 loop iterations.
          // Maximum digits array length; leaves [28, 34] guard digits.
          k = Math.ceil(pr / LOG_BASE + 4);

        external = false;

        for (;;) {
          if (n % 2) {
            r = r.times(x);
            if (truncate(r.d, k)) isTruncated = true;
          }

          n = mathfloor(n / 2);
          if (n === 0) {

            // To ensure correct rounding when r.d is truncated, increment the last word if it is zero.
            n = r.d.length - 1;
            if (isTruncated && r.d[n] === 0) ++r.d[n];
            break;
          }

          x = x.times(x);
          truncate(x.d, k);
        }

        external = true;

        return r;
      }


      function isOdd(n) {
        return n.d[n.d.length - 1] & 1;
      }


      /*
       * Handle `max` and `min`. `ltgt` is 'lt' or 'gt'.
       */
      function maxOrMin(Ctor, args, ltgt) {
        var y,
          x = new Ctor(args[0]),
          i = 0;

        for (; ++i < args.length;) {
          y = new Ctor(args[i]);
          if (!y.s) {
            x = y;
            break;
          } else if (x[ltgt](y)) {
            x = y;
          }
        }

        return x;
      }


      /*
       * Return a new Decimal whose value is the natural exponential of `x` rounded to `sd` significant
       * digits.
       *
       * Taylor/Maclaurin series.
       *
       * exp(x) = x^0/0! + x^1/1! + x^2/2! + x^3/3! + ...
       *
       * Argument reduction:
       *   Repeat x = x / 32, k += 5, until |x| < 0.1
       *   exp(x) = exp(x / 2^k)^(2^k)
       *
       * Previously, the argument was initially reduced by
       * exp(x) = exp(r) * 10^k  where r = x - k * ln10, k = floor(x / ln10)
       * to first put r in the range [0, ln10], before dividing by 32 until |x| < 0.1, but this was
       * found to be slower than just dividing repeatedly by 32 as above.
       *
       * Max integer argument: exp('20723265836946413') = 6.3e+9000000000000000
       * Min integer argument: exp('-20723265836946411') = 1.2e-9000000000000000
       * (Math object integer min/max: Math.exp(709) = 8.2e+307, Math.exp(-745) = 5e-324)
       *
       *  exp(Infinity)  = Infinity
       *  exp(-Infinity) = 0
       *  exp(NaN)       = NaN
       *  exp(±0)        = 1
       *
       *  exp(x) is non-terminating for any finite, non-zero x.
       *
       *  The result will always be correctly rounded.
       *
       */
      function naturalExponential(x, sd) {
        var denominator, guard, j, pow, sum, t, wpr,
          rep = 0,
          i = 0,
          k = 0,
          Ctor = x.constructor,
          rm = Ctor.rounding,
          pr = Ctor.precision;

        // 0/NaN/Infinity?
        if (!x.d || !x.d[0] || x.e > 17) {

          return new Ctor(x.d
            ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0
            : x.s ? x.s < 0 ? 0 : x : 0 / 0);
        }

        if (sd == null) {
          external = false;
          wpr = pr;
        } else {
          wpr = sd;
        }

        t = new Ctor(0.03125);

        // while abs(x) >= 0.1
        while (x.e > -2) {

          // x = x / 2^5
          x = x.times(t);
          k += 5;
        }

        // Use 2 * log10(2^k) + 5 (empirically derived) to estimate the increase in precision
        // necessary to ensure the first 4 rounding digits are correct.
        guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
        wpr += guard;
        denominator = pow = sum = new Ctor(1);
        Ctor.precision = wpr;

        for (;;) {
          pow = finalise(pow.times(x), wpr, 1);
          denominator = denominator.times(++i);
          t = sum.plus(divide(pow, denominator, wpr, 1));

          if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
            j = k;
            while (j--) sum = finalise(sum.times(sum), wpr, 1);

            // Check to see if the first 4 rounding digits are [49]999.
            // If so, repeat the summation with a higher precision, otherwise
            // e.g. with precision: 18, rounding: 1
            // exp(18.404272462595034083567793919843761) = 98372560.1229999999 (should be 98372560.123)
            // `wpr - guard` is the index of first rounding digit.
            if (sd == null) {

              if (rep < 3 && checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
                Ctor.precision = wpr += 10;
                denominator = pow = t = new Ctor(1);
                i = 0;
                rep++;
              } else {
                return finalise(sum, Ctor.precision = pr, rm, external = true);
              }
            } else {
              Ctor.precision = pr;
              return sum;
            }
          }

          sum = t;
        }
      }


      /*
       * Return a new Decimal whose value is the natural logarithm of `x` rounded to `sd` significant
       * digits.
       *
       *  ln(-n)        = NaN
       *  ln(0)         = -Infinity
       *  ln(-0)        = -Infinity
       *  ln(1)         = 0
       *  ln(Infinity)  = Infinity
       *  ln(-Infinity) = NaN
       *  ln(NaN)       = NaN
       *
       *  ln(n) (n != 1) is non-terminating.
       *
       */
      function naturalLogarithm(y, sd) {
        var c, c0, denominator, e, numerator, rep, sum, t, wpr, x1, x2,
          n = 1,
          guard = 10,
          x = y,
          xd = x.d,
          Ctor = x.constructor,
          rm = Ctor.rounding,
          pr = Ctor.precision;

        // Is x negative or Infinity, NaN, 0 or 1?
        if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
          return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
        }

        if (sd == null) {
          external = false;
          wpr = pr;
        } else {
          wpr = sd;
        }

        Ctor.precision = wpr += guard;
        c = digitsToString(xd);
        c0 = c.charAt(0);

        if (Math.abs(e = x.e) < 1.5e15) {

          // Argument reduction.
          // The series converges faster the closer the argument is to 1, so using
          // ln(a^b) = b * ln(a),   ln(a) = ln(a^b) / b
          // multiply the argument by itself until the leading digits of the significand are 7, 8, 9,
          // 10, 11, 12 or 13, recording the number of multiplications so the sum of the series can
          // later be divided by this number, then separate out the power of 10 using
          // ln(a*10^b) = ln(a) + b*ln(10).

          // max n is 21 (gives 0.9, 1.0 or 1.1) (9e15 / 21 = 4.2e14).
          //while (c0 < 9 && c0 != 1 || c0 == 1 && c.charAt(1) > 1) {
          // max n is 6 (gives 0.7 - 1.3)
          while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
            x = x.times(y);
            c = digitsToString(x.d);
            c0 = c.charAt(0);
            n++;
          }

          e = x.e;

          if (c0 > 1) {
            x = new Ctor('0.' + c);
            e++;
          } else {
            x = new Ctor(c0 + '.' + c.slice(1));
          }
        } else {

          // The argument reduction method above may result in overflow if the argument y is a massive
          // number with exponent >= 1500000000000000 (9e15 / 6 = 1.5e15), so instead recall this
          // function using ln(x*10^e) = ln(x) + e*ln(10).
          t = getLn10(Ctor, wpr + 2, pr).times(e + '');
          x = naturalLogarithm(new Ctor(c0 + '.' + c.slice(1)), wpr - guard).plus(t);
          Ctor.precision = pr;

          return sd == null ? finalise(x, pr, rm, external = true) : x;
        }

        // x1 is x reduced to a value near 1.
        x1 = x;

        // Taylor series.
        // ln(y) = ln((1 + x)/(1 - x)) = 2(x + x^3/3 + x^5/5 + x^7/7 + ...)
        // where x = (y - 1)/(y + 1)    (|x| < 1)
        sum = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
        x2 = finalise(x.times(x), wpr, 1);
        denominator = 3;

        for (;;) {
          numerator = finalise(numerator.times(x2), wpr, 1);
          t = sum.plus(divide(numerator, new Ctor(denominator), wpr, 1));

          if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
            sum = sum.times(2);

            // Reverse the argument reduction. Check that e is not 0 because, besides preventing an
            // unnecessary calculation, -0 + 0 = +0 and to ensure correct rounding -0 needs to stay -0.
            if (e !== 0) sum = sum.plus(getLn10(Ctor, wpr + 2, pr).times(e + ''));
            sum = divide(sum, new Ctor(n), wpr, 1);

            // Is rm > 3 and the first 4 rounding digits 4999, or rm < 4 (or the summation has
            // been repeated previously) and the first 4 rounding digits 9999?
            // If so, restart the summation with a higher precision, otherwise
            // e.g. with precision: 12, rounding: 1
            // ln(135520028.6126091714265381533) = 18.7246299999 when it should be 18.72463.
            // `wpr - guard` is the index of first rounding digit.
            if (sd == null) {
              if (checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
                Ctor.precision = wpr += guard;
                t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
                x2 = finalise(x.times(x), wpr, 1);
                denominator = rep = 1;
              } else {
                return finalise(sum, Ctor.precision = pr, rm, external = true);
              }
            } else {
              Ctor.precision = pr;
              return sum;
            }
          }

          sum = t;
          denominator += 2;
        }
      }


      // ±Infinity, NaN.
      function nonFiniteToString(x) {
        // Unsigned.
        return String(x.s * x.s / 0);
      }


      /*
       * Parse the value of a new Decimal `x` from string `str`.
       */
      function parseDecimal(x, str) {
        var e, i, len;

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

        // Determine leading zeros.
        for (i = 0; str.charCodeAt(i) === 48; i++);

        // Determine trailing zeros.
        for (len = str.length; str.charCodeAt(len - 1) === 48; --len);
        str = str.slice(i, len);

        if (str) {
          len -= i;
          x.e = e = e - i - 1;
          x.d = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first word of the digits array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;

          if (i < len) {
            if (i) x.d.push(+str.slice(0, i));
            for (len -= LOG_BASE; i < len;) x.d.push(+str.slice(i, i += LOG_BASE));
            str = str.slice(i);
            i = LOG_BASE - str.length;
          } else {
            i -= len;
          }

          for (; i--;) str += '0';
          x.d.push(+str);

          if (external) {

            // Overflow?
            if (x.e > x.constructor.maxE) {

              // Infinity.
              x.d = null;
              x.e = NaN;

            // Underflow?
            } else if (x.e < x.constructor.minE) {

              // Zero.
              x.e = 0;
              x.d = [0];
              // x.constructor.underflow = true;
            } // else x.constructor.underflow = false;
          }
        } else {

          // Zero.
          x.e = 0;
          x.d = [0];
        }

        return x;
      }


      /*
       * Parse the value of a new Decimal `x` from a string `str`, which is not a decimal value.
       */
      function parseOther(x, str) {
        var base, Ctor, divisor, i, isFloat, len, p, xd, xe;

        if (str.indexOf('_') > -1) {
          str = str.replace(/(\d)_(?=\d)/g, '$1');
          if (isDecimal.test(str)) return parseDecimal(x, str);
        } else if (str === 'Infinity' || str === 'NaN') {
          if (!+str) x.s = NaN;
          x.e = NaN;
          x.d = null;
          return x;
        }

        if (isHex.test(str))  {
          base = 16;
          str = str.toLowerCase();
        } else if (isBinary.test(str))  {
          base = 2;
        } else if (isOctal.test(str))  {
          base = 8;
        } else {
          throw Error(invalidArgument + str);
        }

        // Is there a binary exponent part?
        i = str.search(/p/i);

        if (i > 0) {
          p = +str.slice(i + 1);
          str = str.substring(2, i);
        } else {
          str = str.slice(2);
        }

        // Convert `str` as an integer then divide the result by `base` raised to a power such that the
        // fraction part will be restored.
        i = str.indexOf('.');
        isFloat = i >= 0;
        Ctor = x.constructor;

        if (isFloat) {
          str = str.replace('.', '');
          len = str.length;
          i = len - i;

          // log[10](16) = 1.2041... , log[10](88) = 1.9444....
          divisor = intPow(Ctor, new Ctor(base), i, i * 2);
        }

        xd = convertBase(str, base, BASE);
        xe = xd.length - 1;

        // Remove trailing zeros.
        for (i = xe; xd[i] === 0; --i) xd.pop();
        if (i < 0) return new Ctor(x.s * 0);
        x.e = getBase10Exponent(xd, xe);
        x.d = xd;
        external = false;

        // At what precision to perform the division to ensure exact conversion?
        // maxDecimalIntegerPartDigitCount = ceil(log[10](b) * otherBaseIntegerPartDigitCount)
        // log[10](2) = 0.30103, log[10](8) = 0.90309, log[10](16) = 1.20412
        // E.g. ceil(1.2 * 3) = 4, so up to 4 decimal digits are needed to represent 3 hex int digits.
        // maxDecimalFractionPartDigitCount = {Hex:4|Oct:3|Bin:1} * otherBaseFractionPartDigitCount
        // Therefore using 4 * the number of digits of str will always be enough.
        if (isFloat) x = divide(x, divisor, len * 4);

        // Multiply by the binary exponent part if present.
        if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
        external = true;

        return x;
      }


      /*
       * sin(x) = x - x^3/3! + x^5/5! - ...
       * |x| < pi/2
       *
       */
      function sine(Ctor, x) {
        var k,
          len = x.d.length;

        if (len < 3) {
          return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
        }

        // Argument reduction: sin(5x) = 16*sin^5(x) - 20*sin^3(x) + 5*sin(x)
        // i.e. sin(x) = 16*sin^5(x/5) - 20*sin^3(x/5) + 5*sin(x/5)
        // and  sin(x) = sin(x/5)(5 + sin^2(x/5)(16sin^2(x/5) - 20))

        // Estimate the optimum number of times to use the argument reduction.
        k = 1.4 * Math.sqrt(len);
        k = k > 16 ? 16 : k | 0;

        x = x.times(1 / tinyPow(5, k));
        x = taylorSeries(Ctor, 2, x, x);

        // Reverse argument reduction
        var sin2_x,
          d5 = new Ctor(5),
          d16 = new Ctor(16),
          d20 = new Ctor(20);
        for (; k--;) {
          sin2_x = x.times(x);
          x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
        }

        return x;
      }


      // Calculate Taylor series for `cos`, `cosh`, `sin` and `sinh`.
      function taylorSeries(Ctor, n, x, y, isHyperbolic) {
        var j, t, u, x2,
          pr = Ctor.precision,
          k = Math.ceil(pr / LOG_BASE);

        external = false;
        x2 = x.times(x);
        u = new Ctor(y);

        for (;;) {
          t = divide(u.times(x2), new Ctor(n++ * n++), pr, 1);
          u = isHyperbolic ? y.plus(t) : y.minus(t);
          y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
          t = u.plus(y);

          if (t.d[k] !== void 0) {
            for (j = k; t.d[j] === u.d[j] && j--;);
            if (j == -1) break;
          }

          j = u;
          u = y;
          y = t;
          t = j;
        }

        external = true;
        t.d.length = k + 1;

        return t;
      }


      // Exponent e must be positive and non-zero.
      function tinyPow(b, e) {
        var n = b;
        while (--e) n *= b;
        return n;
      }


      // Return the absolute value of `x` reduced to less than or equal to half pi.
      function toLessThanHalfPi(Ctor, x) {
        var t,
          isNeg = x.s < 0,
          pi = getPi(Ctor, Ctor.precision, 1),
          halfPi = pi.times(0.5);

        x = x.abs();

        if (x.lte(halfPi)) {
          quadrant = isNeg ? 4 : 1;
          return x;
        }

        t = x.divToInt(pi);

        if (t.isZero()) {
          quadrant = isNeg ? 3 : 2;
        } else {
          x = x.minus(t.times(pi));

          // 0 <= x < pi
          if (x.lte(halfPi)) {
            quadrant = isOdd(t) ? (isNeg ? 2 : 3) : (isNeg ? 4 : 1);
            return x;
          }

          quadrant = isOdd(t) ? (isNeg ? 1 : 4) : (isNeg ? 3 : 2);
        }

        return x.minus(pi).abs();
      }


      /*
       * Return the value of Decimal `x` as a string in base `baseOut`.
       *
       * If the optional `sd` argument is present include a binary exponent suffix.
       */
      function toStringBinary(x, baseOut, sd, rm) {
        var base, e, i, k, len, roundUp, str, xd, y,
          Ctor = x.constructor,
          isExp = sd !== void 0;

        if (isExp) {
          checkInt32(sd, 1, MAX_DIGITS);
          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);
        } else {
          sd = Ctor.precision;
          rm = Ctor.rounding;
        }

        if (!x.isFinite()) {
          str = nonFiniteToString(x);
        } else {
          str = finiteToString(x);
          i = str.indexOf('.');

          // Use exponential notation according to `toExpPos` and `toExpNeg`? No, but if required:
          // maxBinaryExponent = floor((decimalExponent + 1) * log[2](10))
          // minBinaryExponent = floor(decimalExponent * log[2](10))
          // log[2](10) = 3.321928094887362347870319429489390175864

          if (isExp) {
            base = 2;
            if (baseOut == 16) {
              sd = sd * 4 - 3;
            } else if (baseOut == 8) {
              sd = sd * 3 - 2;
            }
          } else {
            base = baseOut;
          }

          // Convert the number as an integer then divide the result by its base raised to a power such
          // that the fraction part will be restored.

          // Non-integer.
          if (i >= 0) {
            str = str.replace('.', '');
            y = new Ctor(1);
            y.e = str.length - i;
            y.d = convertBase(finiteToString(y), 10, base);
            y.e = y.d.length;
          }

          xd = convertBase(str, 10, base);
          e = len = xd.length;

          // Remove trailing zeros.
          for (; xd[--len] == 0;) xd.pop();

          if (!xd[0]) {
            str = isExp ? '0p+0' : '0';
          } else {
            if (i < 0) {
              e--;
            } else {
              x = new Ctor(x);
              x.d = xd;
              x.e = e;
              x = divide(x, y, sd, rm, 0, base);
              xd = x.d;
              e = x.e;
              roundUp = inexact;
            }

            // The rounding digit, i.e. the digit after the digit that may be rounded up.
            i = xd[sd];
            k = base / 2;
            roundUp = roundUp || xd[sd + 1] !== void 0;

            roundUp = rm < 4
              ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2))
              : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 ||
                rm === (x.s < 0 ? 8 : 7));

            xd.length = sd;

            if (roundUp) {

              // Rounding up may mean the previous digit has to be rounded up and so on.
              for (; ++xd[--sd] > base - 1;) {
                xd[sd] = 0;
                if (!sd) {
                  ++e;
                  xd.unshift(1);
                }
              }
            }

            // Determine trailing zeros.
            for (len = xd.length; !xd[len - 1]; --len);

            // E.g. [4, 11, 15] becomes 4bf.
            for (i = 0, str = ''; i < len; i++) str += NUMERALS.charAt(xd[i]);

            // Add binary exponent suffix?
            if (isExp) {
              if (len > 1) {
                if (baseOut == 16 || baseOut == 8) {
                  i = baseOut == 16 ? 4 : 3;
                  for (--len; len % i; len++) str += '0';
                  xd = convertBase(str, base, baseOut);
                  for (len = xd.length; !xd[len - 1]; --len);

                  // xd[0] will always be be 1
                  for (i = 1, str = '1.'; i < len; i++) str += NUMERALS.charAt(xd[i]);
                } else {
                  str = str.charAt(0) + '.' + str.slice(1);
                }
              }

              str =  str + (e < 0 ? 'p' : 'p+') + e;
            } else if (e < 0) {
              for (; ++e;) str = '0' + str;
              str = '0.' + str;
            } else {
              if (++e > len) for (e -= len; e-- ;) str += '0';
              else if (e < len) str = str.slice(0, e) + '.' + str.slice(e);
            }
          }

          str = (baseOut == 16 ? '0x' : baseOut == 2 ? '0b' : baseOut == 8 ? '0o' : '') + str;
        }

        return x.s < 0 ? '-' + str : str;
      }


      // Does not strip trailing zeros.
      function truncate(arr, len) {
        if (arr.length > len) {
          arr.length = len;
          return true;
        }
      }


      // Decimal methods


      /*
       *  abs
       *  acos
       *  acosh
       *  add
       *  asin
       *  asinh
       *  atan
       *  atanh
       *  atan2
       *  cbrt
       *  ceil
       *  clamp
       *  clone
       *  config
       *  cos
       *  cosh
       *  div
       *  exp
       *  floor
       *  hypot
       *  ln
       *  log
       *  log2
       *  log10
       *  max
       *  min
       *  mod
       *  mul
       *  pow
       *  random
       *  round
       *  set
       *  sign
       *  sin
       *  sinh
       *  sqrt
       *  sub
       *  sum
       *  tan
       *  tanh
       *  trunc
       */


      /*
       * Return a new Decimal whose value is the absolute value of `x`.
       *
       * x {number|string|Decimal}
       *
       */
      function abs(x) {
        return new this(x).abs();
      }


      /*
       * Return a new Decimal whose value is the arccosine in radians of `x`.
       *
       * x {number|string|Decimal}
       *
       */
      function acos(x) {
        return new this(x).acos();
      }


      /*
       * Return a new Decimal whose value is the inverse of the hyperbolic cosine of `x`, rounded to
       * `precision` significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function acosh(x) {
        return new this(x).acosh();
      }


      /*
       * Return a new Decimal whose value is the sum of `x` and `y`, rounded to `precision` significant
       * digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       * y {number|string|Decimal}
       *
       */
      function add(x, y) {
        return new this(x).plus(y);
      }


      /*
       * Return a new Decimal whose value is the arcsine in radians of `x`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       *
       */
      function asin(x) {
        return new this(x).asin();
      }


      /*
       * Return a new Decimal whose value is the inverse of the hyperbolic sine of `x`, rounded to
       * `precision` significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function asinh(x) {
        return new this(x).asinh();
      }


      /*
       * Return a new Decimal whose value is the arctangent in radians of `x`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       *
       */
      function atan(x) {
        return new this(x).atan();
      }


      /*
       * Return a new Decimal whose value is the inverse of the hyperbolic tangent of `x`, rounded to
       * `precision` significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function atanh(x) {
        return new this(x).atanh();
      }


      /*
       * Return a new Decimal whose value is the arctangent in radians of `y/x` in the range -pi to pi
       * (inclusive), rounded to `precision` significant digits using rounding mode `rounding`.
       *
       * Domain: [-Infinity, Infinity]
       * Range: [-pi, pi]
       *
       * y {number|string|Decimal} The y-coordinate.
       * x {number|string|Decimal} The x-coordinate.
       *
       * atan2(±0, -0)               = ±pi
       * atan2(±0, +0)               = ±0
       * atan2(±0, -x)               = ±pi for x > 0
       * atan2(±0, x)                = ±0 for x > 0
       * atan2(-y, ±0)               = -pi/2 for y > 0
       * atan2(y, ±0)                = pi/2 for y > 0
       * atan2(±y, -Infinity)        = ±pi for finite y > 0
       * atan2(±y, +Infinity)        = ±0 for finite y > 0
       * atan2(±Infinity, x)         = ±pi/2 for finite x
       * atan2(±Infinity, -Infinity) = ±3*pi/4
       * atan2(±Infinity, +Infinity) = ±pi/4
       * atan2(NaN, x) = NaN
       * atan2(y, NaN) = NaN
       *
       */
      function atan2(y, x) {
        y = new this(y);
        x = new this(x);
        var r,
          pr = this.precision,
          rm = this.rounding,
          wpr = pr + 4;

        // Either NaN
        if (!y.s || !x.s) {
          r = new this(NaN);

        // Both ±Infinity
        } else if (!y.d && !x.d) {
          r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
          r.s = y.s;

        // x is ±Infinity or y is ±0
        } else if (!x.d || y.isZero()) {
          r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
          r.s = y.s;

        // y is ±Infinity or x is ±0
        } else if (!y.d || x.isZero()) {
          r = getPi(this, wpr, 1).times(0.5);
          r.s = y.s;

        // Both non-zero and finite
        } else if (x.s < 0) {
          this.precision = wpr;
          this.rounding = 1;
          r = this.atan(divide(y, x, wpr, 1));
          x = getPi(this, wpr, 1);
          this.precision = pr;
          this.rounding = rm;
          r = y.s < 0 ? r.minus(x) : r.plus(x);
        } else {
          r = this.atan(divide(y, x, wpr, 1));
        }

        return r;
      }


      /*
       * Return a new Decimal whose value is the cube root of `x`, rounded to `precision` significant
       * digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       *
       */
      function cbrt(x) {
        return new this(x).cbrt();
      }


      /*
       * Return a new Decimal whose value is `x` rounded to an integer using `ROUND_CEIL`.
       *
       * x {number|string|Decimal}
       *
       */
      function ceil(x) {
        return finalise(x = new this(x), x.e + 1, 2);
      }


      /*
       * Return a new Decimal whose value is `x` clamped to the range delineated by `min` and `max`.
       *
       * x {number|string|Decimal}
       * min {number|string|Decimal}
       * max {number|string|Decimal}
       *
       */
      function clamp(x, min, max) {
        return new this(x).clamp(min, max);
      }


      /*
       * Configure global settings for a Decimal constructor.
       *
       * `obj` is an object with one or more of the following properties,
       *
       *   precision  {number}
       *   rounding   {number}
       *   toExpNeg   {number}
       *   toExpPos   {number}
       *   maxE       {number}
       *   minE       {number}
       *   modulo     {number}
       *   crypto     {boolean|number}
       *   defaults   {true}
       *
       * E.g. Decimal.config({ precision: 20, rounding: 4 })
       *
       */
      function config(obj) {
        if (!obj || typeof obj !== 'object') throw Error(decimalError + 'Object expected');
        var i, p, v,
          useDefaults = obj.defaults === true,
          ps = [
            'precision', 1, MAX_DIGITS,
            'rounding', 0, 8,
            'toExpNeg', -EXP_LIMIT, 0,
            'toExpPos', 0, EXP_LIMIT,
            'maxE', 0, EXP_LIMIT,
            'minE', -EXP_LIMIT, 0,
            'modulo', 0, 9
          ];

        for (i = 0; i < ps.length; i += 3) {
          if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
          if ((v = obj[p]) !== void 0) {
            if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
            else throw Error(invalidArgument + p + ': ' + v);
          }
        }

        if (p = 'crypto', useDefaults) this[p] = DEFAULTS[p];
        if ((v = obj[p]) !== void 0) {
          if (v === true || v === false || v === 0 || v === 1) {
            if (v) {
              if (typeof crypto != 'undefined' && crypto &&
                (crypto.getRandomValues || crypto.randomBytes)) {
                this[p] = true;
              } else {
                throw Error(cryptoUnavailable);
              }
            } else {
              this[p] = false;
            }
          } else {
            throw Error(invalidArgument + p + ': ' + v);
          }
        }

        return this;
      }


      /*
       * Return a new Decimal whose value is the cosine of `x`, rounded to `precision` significant
       * digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function cos(x) {
        return new this(x).cos();
      }


      /*
       * Return a new Decimal whose value is the hyperbolic cosine of `x`, rounded to precision
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function cosh(x) {
        return new this(x).cosh();
      }


      /*
       * Create and return a Decimal constructor with the same configuration properties as this Decimal
       * constructor.
       *
       */
      function clone(obj) {
        var i, p, ps;

        /*
         * The Decimal constructor and exported function.
         * Return a new Decimal instance.
         *
         * v {number|string|Decimal} A numeric value.
         *
         */
        function Decimal(v) {
          var e, i, t,
            x = this;

          // Decimal called without new.
          if (!(x instanceof Decimal)) return new Decimal(v);

          // Retain a reference to this Decimal constructor, and shadow Decimal.prototype.constructor
          // which points to Object.
          x.constructor = Decimal;

          // Duplicate.
          if (isDecimalInstance(v)) {
            x.s = v.s;

            if (external) {
              if (!v.d || v.e > Decimal.maxE) {

                // Infinity.
                x.e = NaN;
                x.d = null;
              } else if (v.e < Decimal.minE) {

                // Zero.
                x.e = 0;
                x.d = [0];
              } else {
                x.e = v.e;
                x.d = v.d.slice();
              }
            } else {
              x.e = v.e;
              x.d = v.d ? v.d.slice() : v.d;
            }

            return;
          }

          t = typeof v;

          if (t === 'number') {
            if (v === 0) {
              x.s = 1 / v < 0 ? -1 : 1;
              x.e = 0;
              x.d = [0];
              return;
            }

            if (v < 0) {
              v = -v;
              x.s = -1;
            } else {
              x.s = 1;
            }

            // Fast path for small integers.
            if (v === ~~v && v < 1e7) {
              for (e = 0, i = v; i >= 10; i /= 10) e++;

              if (external) {
                if (e > Decimal.maxE) {
                  x.e = NaN;
                  x.d = null;
                } else if (e < Decimal.minE) {
                  x.e = 0;
                  x.d = [0];
                } else {
                  x.e = e;
                  x.d = [v];
                }
              } else {
                x.e = e;
                x.d = [v];
              }

              return;

            // Infinity, NaN.
            } else if (v * 0 !== 0) {
              if (!v) x.s = NaN;
              x.e = NaN;
              x.d = null;
              return;
            }

            return parseDecimal(x, v.toString());

          } else if (t !== 'string') {
            throw Error(invalidArgument + v);
          }

          // Minus sign?
          if ((i = v.charCodeAt(0)) === 45) {
            v = v.slice(1);
            x.s = -1;
          } else {
            // Plus sign?
            if (i === 43) v = v.slice(1);
            x.s = 1;
          }

          return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
        }

        Decimal.prototype = P;

        Decimal.ROUND_UP = 0;
        Decimal.ROUND_DOWN = 1;
        Decimal.ROUND_CEIL = 2;
        Decimal.ROUND_FLOOR = 3;
        Decimal.ROUND_HALF_UP = 4;
        Decimal.ROUND_HALF_DOWN = 5;
        Decimal.ROUND_HALF_EVEN = 6;
        Decimal.ROUND_HALF_CEIL = 7;
        Decimal.ROUND_HALF_FLOOR = 8;
        Decimal.EUCLID = 9;

        Decimal.config = Decimal.set = config;
        Decimal.clone = clone;
        Decimal.isDecimal = isDecimalInstance;

        Decimal.abs = abs;
        Decimal.acos = acos;
        Decimal.acosh = acosh;        // ES6
        Decimal.add = add;
        Decimal.asin = asin;
        Decimal.asinh = asinh;        // ES6
        Decimal.atan = atan;
        Decimal.atanh = atanh;        // ES6
        Decimal.atan2 = atan2;
        Decimal.cbrt = cbrt;          // ES6
        Decimal.ceil = ceil;
        Decimal.clamp = clamp;
        Decimal.cos = cos;
        Decimal.cosh = cosh;          // ES6
        Decimal.div = div;
        Decimal.exp = exp;
        Decimal.floor = floor;
        Decimal.hypot = hypot;        // ES6
        Decimal.ln = ln;
        Decimal.log = log;
        Decimal.log10 = log10;        // ES6
        Decimal.log2 = log2;          // ES6
        Decimal.max = max;
        Decimal.min = min;
        Decimal.mod = mod;
        Decimal.mul = mul;
        Decimal.pow = pow;
        Decimal.random = random;
        Decimal.round = round;
        Decimal.sign = sign;          // ES6
        Decimal.sin = sin;
        Decimal.sinh = sinh;          // ES6
        Decimal.sqrt = sqrt;
        Decimal.sub = sub;
        Decimal.sum = sum;
        Decimal.tan = tan;
        Decimal.tanh = tanh;          // ES6
        Decimal.trunc = trunc;        // ES6

        if (obj === void 0) obj = {};
        if (obj) {
          if (obj.defaults !== true) {
            ps = ['precision', 'rounding', 'toExpNeg', 'toExpPos', 'maxE', 'minE', 'modulo', 'crypto'];
            for (i = 0; i < ps.length;) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
          }
        }

        Decimal.config(obj);

        return Decimal;
      }


      /*
       * Return a new Decimal whose value is `x` divided by `y`, rounded to `precision` significant
       * digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       * y {number|string|Decimal}
       *
       */
      function div(x, y) {
        return new this(x).div(y);
      }


      /*
       * Return a new Decimal whose value is the natural exponential of `x`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} The power to which to raise the base of the natural log.
       *
       */
      function exp(x) {
        return new this(x).exp();
      }


      /*
       * Return a new Decimal whose value is `x` round to an integer using `ROUND_FLOOR`.
       *
       * x {number|string|Decimal}
       *
       */
      function floor(x) {
        return finalise(x = new this(x), x.e + 1, 3);
      }


      /*
       * Return a new Decimal whose value is the square root of the sum of the squares of the arguments,
       * rounded to `precision` significant digits using rounding mode `rounding`.
       *
       * hypot(a, b, ...) = sqrt(a^2 + b^2 + ...)
       *
       * arguments {number|string|Decimal}
       *
       */
      function hypot() {
        var i, n,
          t = new this(0);

        external = false;

        for (i = 0; i < arguments.length;) {
          n = new this(arguments[i++]);
          if (!n.d) {
            if (n.s) {
              external = true;
              return new this(1 / 0);
            }
            t = n;
          } else if (t.d) {
            t = t.plus(n.times(n));
          }
        }

        external = true;

        return t.sqrt();
      }


      /*
       * Return true if object is a Decimal instance (where Decimal is any Decimal constructor),
       * otherwise return false.
       *
       */
      function isDecimalInstance(obj) {
        return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
      }


      /*
       * Return a new Decimal whose value is the natural logarithm of `x`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       *
       */
      function ln(x) {
        return new this(x).ln();
      }


      /*
       * Return a new Decimal whose value is the log of `x` to the base `y`, or to base 10 if no base
       * is specified, rounded to `precision` significant digits using rounding mode `rounding`.
       *
       * log[y](x)
       *
       * x {number|string|Decimal} The argument of the logarithm.
       * y {number|string|Decimal} The base of the logarithm.
       *
       */
      function log(x, y) {
        return new this(x).log(y);
      }


      /*
       * Return a new Decimal whose value is the base 2 logarithm of `x`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       *
       */
      function log2(x) {
        return new this(x).log(2);
      }


      /*
       * Return a new Decimal whose value is the base 10 logarithm of `x`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       *
       */
      function log10(x) {
        return new this(x).log(10);
      }


      /*
       * Return a new Decimal whose value is the maximum of the arguments.
       *
       * arguments {number|string|Decimal}
       *
       */
      function max() {
        return maxOrMin(this, arguments, 'lt');
      }


      /*
       * Return a new Decimal whose value is the minimum of the arguments.
       *
       * arguments {number|string|Decimal}
       *
       */
      function min() {
        return maxOrMin(this, arguments, 'gt');
      }


      /*
       * Return a new Decimal whose value is `x` modulo `y`, rounded to `precision` significant digits
       * using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       * y {number|string|Decimal}
       *
       */
      function mod(x, y) {
        return new this(x).mod(y);
      }


      /*
       * Return a new Decimal whose value is `x` multiplied by `y`, rounded to `precision` significant
       * digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       * y {number|string|Decimal}
       *
       */
      function mul(x, y) {
        return new this(x).mul(y);
      }


      /*
       * Return a new Decimal whose value is `x` raised to the power `y`, rounded to precision
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} The base.
       * y {number|string|Decimal} The exponent.
       *
       */
      function pow(x, y) {
        return new this(x).pow(y);
      }


      /*
       * Returns a new Decimal with a random value equal to or greater than 0 and less than 1, and with
       * `sd`, or `Decimal.precision` if `sd` is omitted, significant digits (or less if trailing zeros
       * are produced).
       *
       * [sd] {number} Significant digits. Integer, 0 to MAX_DIGITS inclusive.
       *
       */
      function random(sd) {
        var d, e, k, n,
          i = 0,
          r = new this(1),
          rd = [];

        if (sd === void 0) sd = this.precision;
        else checkInt32(sd, 1, MAX_DIGITS);

        k = Math.ceil(sd / LOG_BASE);

        if (!this.crypto) {
          for (; i < k;) rd[i++] = Math.random() * 1e7 | 0;

        // Browsers supporting crypto.getRandomValues.
        } else if (crypto.getRandomValues) {
          d = crypto.getRandomValues(new Uint32Array(k));

          for (; i < k;) {
            n = d[i];

            // 0 <= n < 4294967296
            // Probability n >= 4.29e9, is 4967296 / 4294967296 = 0.00116 (1 in 865).
            if (n >= 4.29e9) {
              d[i] = crypto.getRandomValues(new Uint32Array(1))[0];
            } else {

              // 0 <= n <= 4289999999
              // 0 <= (n % 1e7) <= 9999999
              rd[i++] = n % 1e7;
            }
          }

        // Node.js supporting crypto.randomBytes.
        } else if (crypto.randomBytes) {

          // buffer
          d = crypto.randomBytes(k *= 4);

          for (; i < k;) {

            // 0 <= n < 2147483648
            n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 0x7f) << 24);

            // Probability n >= 2.14e9, is 7483648 / 2147483648 = 0.0035 (1 in 286).
            if (n >= 2.14e9) {
              crypto.randomBytes(4).copy(d, i);
            } else {

              // 0 <= n <= 2139999999
              // 0 <= (n % 1e7) <= 9999999
              rd.push(n % 1e7);
              i += 4;
            }
          }

          i = k / 4;
        } else {
          throw Error(cryptoUnavailable);
        }

        k = rd[--i];
        sd %= LOG_BASE;

        // Convert trailing digits to zeros according to sd.
        if (k && sd) {
          n = mathpow(10, LOG_BASE - sd);
          rd[i] = (k / n | 0) * n;
        }

        // Remove trailing words which are zero.
        for (; rd[i] === 0; i--) rd.pop();

        // Zero?
        if (i < 0) {
          e = 0;
          rd = [0];
        } else {
          e = -1;

          // Remove leading words which are zero and adjust exponent accordingly.
          for (; rd[0] === 0; e -= LOG_BASE) rd.shift();

          // Count the digits of the first word of rd to determine leading zeros.
          for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;

          // Adjust the exponent for leading zeros of the first word of rd.
          if (k < LOG_BASE) e -= LOG_BASE - k;
        }

        r.e = e;
        r.d = rd;

        return r;
      }


      /*
       * Return a new Decimal whose value is `x` rounded to an integer using rounding mode `rounding`.
       *
       * To emulate `Math.round`, set rounding to 7 (ROUND_HALF_CEIL).
       *
       * x {number|string|Decimal}
       *
       */
      function round(x) {
        return finalise(x = new this(x), x.e + 1, this.rounding);
      }


      /*
       * Return
       *   1    if x > 0,
       *  -1    if x < 0,
       *   0    if x is 0,
       *  -0    if x is -0,
       *   NaN  otherwise
       *
       * x {number|string|Decimal}
       *
       */
      function sign(x) {
        x = new this(x);
        return x.d ? (x.d[0] ? x.s : 0 * x.s) : x.s || NaN;
      }


      /*
       * Return a new Decimal whose value is the sine of `x`, rounded to `precision` significant digits
       * using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function sin(x) {
        return new this(x).sin();
      }


      /*
       * Return a new Decimal whose value is the hyperbolic sine of `x`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function sinh(x) {
        return new this(x).sinh();
      }


      /*
       * Return a new Decimal whose value is the square root of `x`, rounded to `precision` significant
       * digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       *
       */
      function sqrt(x) {
        return new this(x).sqrt();
      }


      /*
       * Return a new Decimal whose value is `x` minus `y`, rounded to `precision` significant digits
       * using rounding mode `rounding`.
       *
       * x {number|string|Decimal}
       * y {number|string|Decimal}
       *
       */
      function sub(x, y) {
        return new this(x).sub(y);
      }


      /*
       * Return a new Decimal whose value is the sum of the arguments, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * Only the result is rounded, not the intermediate calculations.
       *
       * arguments {number|string|Decimal}
       *
       */
      function sum() {
        var i = 0,
          args = arguments,
          x = new this(args[i]);

        external = false;
        for (; x.s && ++i < args.length;) x = x.plus(args[i]);
        external = true;

        return finalise(x, this.precision, this.rounding);
      }


      /*
       * Return a new Decimal whose value is the tangent of `x`, rounded to `precision` significant
       * digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function tan(x) {
        return new this(x).tan();
      }


      /*
       * Return a new Decimal whose value is the hyperbolic tangent of `x`, rounded to `precision`
       * significant digits using rounding mode `rounding`.
       *
       * x {number|string|Decimal} A value in radians.
       *
       */
      function tanh(x) {
        return new this(x).tanh();
      }


      /*
       * Return a new Decimal whose value is `x` truncated to an integer.
       *
       * x {number|string|Decimal}
       *
       */
      function trunc(x) {
        return finalise(x = new this(x), x.e + 1, 1);
      }


      // Create and configure initial Decimal constructor.
      Decimal = clone(DEFAULTS);
      Decimal.prototype.constructor = Decimal;
      Decimal['default'] = Decimal.Decimal = Decimal;

      // Create the internal constants from their string values.
      LN10 = new Decimal(LN10);
      PI = new Decimal(PI);


      // Export.


      // AMD.
      if (module.exports) {
        if (typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol') {
          P[Symbol['for']('nodejs.util.inspect.custom')] = P.toString;
          P[Symbol.toStringTag] = 'Decimal';
        }

        module.exports = Decimal;

      // Browser.
      } else {
        if (!globalScope) {
          globalScope = typeof self != 'undefined' && self && self.self == self ? self : window;
        }

        noConflict = globalScope.Decimal;
        Decimal.noConflict = function () {
          globalScope.Decimal = noConflict;
          return Decimal;
        };

        globalScope.Decimal = Decimal;
      }
    })(commonjsGlobal);
    });

    class UserData {
        constructor() {
            this.loop = new Loop();
            this.data = new DataRecord();
            this.records = {};
        }
        tick() {
            this.loop.progress = this.loop.progress.add(new decimal(1));
            this.data.amount = this.data.amount.add(new decimal(1));
            if (this.loop.progress.gte(this.loop.duration)) {
                this.data.amount = new decimal(0);
                this.loop.progress = new decimal(0);
                this.loop.number = this.loop.number.add(new decimal(1));
            }
            update();
        }
    }
    class DataRecord {
        constructor() {
            this.amount = new decimal(0);
            this.producers = [];
        }
        getBuildingAmount(name) {
            let filtered = this.producers.filter(p => p.name === name);
            if (filtered.length === 0) {
                return new decimal(0);
            }
            return filtered[0].amount;
        }
    }
    class Loop {
        constructor() {
            this.number = new decimal(1);
            this.duration = new decimal(10);
            this.progress = new decimal(0);
        }
    }

    let userdata = writable(new UserData());
    const update = () => {
        userdata.update(r => r);
    };

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/Layout.svelte generated by Svelte v3.43.1 */
    const file$2 = "src/Layout.svelte";

    // (21:0) {#if showData}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let div1_intro;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "AAA";
    			attr_dev(div0, "class", "border all body glass p-2");
    			add_location(div0, file$2, 22, 8, 707);
    			attr_dev(div1, "class", "header-overlay px-2 py-1 svelte-1pjjylv");
    			add_location(div1, file$2, 21, 4, 635);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		i: function intro(local) {
    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fade, { duration: 100 });
    					div1_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(21:0) {#if showData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let span0;
    	let t0;
    	let t1_value = /*$userdata*/ ctx[1].loop.number + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*$userdata*/ ctx[1].data.amount + "";
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let div1;
    	let span2;
    	let t8;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showData*/ ctx[0] && create_if_block$1(ctx);
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text("loop #");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(" data");
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			div1 = element("div");
    			span2 = element("span");
    			span2.textContent = "Loops";
    			t8 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(span0, "class", "border all glass px-3 py-1 font-monospace");
    			add_location(span0, file$2, 12, 4, 367);
    			attr_dev(span1, "class", "border all glass px-3 py-1 font-monospace");
    			add_location(span1, file$2, 15, 4, 478);
    			attr_dev(div0, "class", "py-2 px-2 border bottom glass");
    			add_location(div0, file$2, 8, 0, 228);
    			attr_dev(span2, "class", "border all glass clickable px-3 py-1");
    			add_location(span2, file$2, 28, 4, 843);
    			attr_dev(div1, "class", "py-2 px-2 border bottom glass");
    			add_location(div1, file$2, 27, 0, 795);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span2);
    			insert_dev(target, t8, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "mouseenter", /*mouseenter_handler*/ ctx[4], false, false, false),
    					listen_dev(div0, "mouseleave", /*mouseleave_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$userdata*/ 2) && t1_value !== (t1_value = /*$userdata*/ ctx[1].loop.number + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*$userdata*/ 2) && t3_value !== (t3_value = /*$userdata*/ ctx[1].data.amount + "")) set_data_dev(t3, t3_value);

    			if (/*showData*/ ctx[0]) {
    				if (if_block) {
    					if (dirty & /*showData*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t6.parentNode, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t8);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $userdata;
    	validate_store(userdata, 'userdata');
    	component_subscribe($$self, userdata, $$value => $$invalidate(1, $userdata = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Layout', slots, ['default']);
    	let showData = false;

    	let interval = setInterval(
    		() => {
    			$userdata.tick();
    			update();
    		},
    		1000
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = () => {
    		$$invalidate(0, showData = true);
    	};

    	const mouseleave_handler = () => {
    		$$invalidate(0, showData = false);
    	};

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		userdata,
    		update,
    		fade,
    		showData,
    		interval,
    		$userdata
    	});

    	$$self.$inject_state = $$props => {
    		if ('showData' in $$props) $$invalidate(0, showData = $$props.showData);
    		if ('interval' in $$props) interval = $$props.interval;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showData, $userdata, $$scope, slots, mouseenter_handler, mouseleave_handler];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    class DataProducer {
        calculateIncome(owned, upgrades) {
            return new decimal(0);
        }
        findUpgrades(source) {
            return source.filter(u => u.affects.includes(this.name));
        }
    }

    class Observer extends DataProducer {
        constructor() {
            super(...arguments);
            this.name = 'Observer';
            this.description = 'Observes changes in the world around it to gather data';
            this.income = new decimal(1);
            this.price = (current, amount) => {
                return new decimal(1).times(current);
            };
            this.calculateIncome = (owned, upgrades) => {
                return new decimal(1);
            };
            this.visible = (source) => {
                return true;
            };
        }
    }

    const all = {
        observer: new Observer(),
    };

    /* src/Parts/BuildingNode.svelte generated by Svelte v3.43.1 */
    const file$1 = "src/Parts/BuildingNode.svelte";

    function create_fragment$3(ctx) {
    	let div9;
    	let div2;
    	let div0;
    	let t0_value = /*building*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let div4;
    	let div3;
    	let t4_value = /*building*/ ctx[0].price(/*amount*/ ctx[1], new decimal(1)) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div8;
    	let div5;
    	let t8;
    	let div6;
    	let t10;
    	let div7;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(/*amount*/ ctx[1]);
    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");
    			t4 = text(t4_value);
    			t5 = text(" data");
    			t6 = space();
    			div8 = element("div");
    			div5 = element("div");
    			div5.textContent = "1";
    			t8 = space();
    			div6 = element("div");
    			div6.textContent = "10";
    			t10 = space();
    			div7 = element("div");
    			div7.textContent = "MAX";
    			add_location(div0, file$1, 7, 8, 204);
    			add_location(div1, file$1, 8, 8, 239);
    			attr_dev(div2, "class", "col-6 my-auto");
    			add_location(div2, file$1, 6, 4, 168);
    			add_location(div3, file$1, 11, 8, 310);
    			attr_dev(div4, "class", "col-3 my-auto");
    			add_location(div4, file$1, 10, 4, 274);
    			add_location(div5, file$1, 16, 8, 440);
    			add_location(div6, file$1, 17, 8, 461);
    			add_location(div7, file$1, 18, 8, 483);
    			attr_dev(div8, "class", "col-3 my-auto");
    			add_location(div8, file$1, 15, 4, 404);
    			attr_dev(div9, "class", "row my-1 mx-0 w-100 border glass all clickable");
    			add_location(div9, file$1, 5, 0, 103);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div9, t3);
    			append_dev(div9, div4);
    			append_dev(div4, div3);
    			append_dev(div3, t4);
    			append_dev(div3, t5);
    			append_dev(div9, t6);
    			append_dev(div9, div8);
    			append_dev(div8, div5);
    			append_dev(div8, t8);
    			append_dev(div8, div6);
    			append_dev(div8, t10);
    			append_dev(div8, div7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*building*/ 1 && t0_value !== (t0_value = /*building*/ ctx[0].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*amount*/ 2) set_data_dev(t2, /*amount*/ ctx[1]);
    			if (dirty & /*building, amount*/ 3 && t4_value !== (t4_value = /*building*/ ctx[0].price(/*amount*/ ctx[1], new decimal(1)) + "")) set_data_dev(t4, t4_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BuildingNode', slots, []);
    	let { building } = $$props;
    	let { amount } = $$props;
    	const writable_props = ['building', 'amount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BuildingNode> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('building' in $$props) $$invalidate(0, building = $$props.building);
    		if ('amount' in $$props) $$invalidate(1, amount = $$props.amount);
    	};

    	$$self.$capture_state = () => ({ Decimal: decimal, building, amount });

    	$$self.$inject_state = $$props => {
    		if ('building' in $$props) $$invalidate(0, building = $$props.building);
    		if ('amount' in $$props) $$invalidate(1, amount = $$props.amount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [building, amount];
    }

    class BuildingNode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { building: 0, amount: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BuildingNode",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*building*/ ctx[0] === undefined && !('building' in props)) {
    			console.warn("<BuildingNode> was created without expected prop 'building'");
    		}

    		if (/*amount*/ ctx[1] === undefined && !('amount' in props)) {
    			console.warn("<BuildingNode> was created without expected prop 'amount'");
    		}
    	}

    	get building() {
    		throw new Error("<BuildingNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set building(value) {
    		throw new Error("<BuildingNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get amount() {
    		throw new Error("<BuildingNode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set amount(value) {
    		throw new Error("<BuildingNode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Views/Loops.svelte generated by Svelte v3.43.1 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file = "src/Views/Loops.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (19:16) {#each purchaseable as building}
    function create_each_block(ctx) {
    	let buildingnode;
    	let current;

    	buildingnode = new BuildingNode({
    			props: {
    				building: /*building*/ ctx[3],
    				amount: /*$userdata*/ ctx[0].data.getBuildingAmount(/*building*/ ctx[3].name)
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(buildingnode.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(buildingnode, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const buildingnode_changes = {};
    			if (dirty & /*purchaseable*/ 2) buildingnode_changes.building = /*building*/ ctx[3];
    			if (dirty & /*$userdata, purchaseable*/ 3) buildingnode_changes.amount = /*$userdata*/ ctx[0].data.getBuildingAmount(/*building*/ ctx[3].name);
    			buildingnode.$set(buildingnode_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buildingnode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buildingnode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buildingnode, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(19:16) {#each purchaseable as building}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let t0;
    	let t1_value = /*$userdata*/ ctx[0].loop.number + "";
    	let t1;
    	let t2;
    	let div6;
    	let div5;
    	let div2;
    	let div1;
    	let t3;
    	let div4;
    	let div3;
    	let current;
    	let each_value = /*purchaseable*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("Loop #");
    			t1 = text(t1_value);
    			t2 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div3.textContent = "A";
    			attr_dev(div0, "class", "glass bg loopbar text-center p-1");
    			add_location(div0, file, 10, 0, 426);
    			attr_dev(div1, "class", "border glass all p-2");
    			add_location(div1, file, 17, 12, 612);
    			attr_dev(div2, "class", "col-6");
    			add_location(div2, file, 16, 8, 580);
    			attr_dev(div3, "class", "border glass all p-2");
    			add_location(div3, file, 24, 12, 894);
    			attr_dev(div4, "class", "col-6");
    			add_location(div4, file, 23, 8, 862);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file, 15, 4, 554);
    			attr_dev(div6, "class", "container-fluid mt-2");
    			add_location(div6, file, 14, 0, 515);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$userdata*/ 1) && t1_value !== (t1_value = /*$userdata*/ ctx[0].loop.number + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*purchaseable, $userdata*/ 3) {
    				each_value = /*purchaseable*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $userdata;
    	validate_store(userdata, 'userdata');
    	component_subscribe($$self, userdata, $$value => $$invalidate(0, $userdata = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Loops', slots, []);
    	let buildings;
    	let purchaseable;
    	console.log($userdata.data.producers);
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Loops> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Producers: all,
    		BuildingNode,
    		userdata,
    		buildings,
    		purchaseable,
    		$userdata
    	});

    	$$self.$inject_state = $$props => {
    		if ('buildings' in $$props) buildings = $$props.buildings;
    		if ('purchaseable' in $$props) $$invalidate(1, purchaseable = $$props.purchaseable);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$userdata*/ 1) {
    			buildings = $userdata.data.producers.map(p => all[p.name]);
    		}

    		if ($$self.$$.dirty & /*$userdata*/ 1) {
    			$$invalidate(1, purchaseable = Object.keys(all).filter(p => all[p].visible($userdata)).map(p => all[p]));
    		}
    	};

    	return [$userdata, purchaseable];
    }

    class Loops extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loops",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    var routes = Route.define([
        Route.group('', {layout: Layout}, [
            Route.path('', {view: Loops, title: 'Loops'})
        ]),
    ]);

    /* src/Router/Router.svelte generated by Svelte v3.43.1 */

    const { Object: Object_1, console: console_1 } = globals;

    // (163:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*params*/ ctx[0], { pass: /*inject*/ ctx[3] }];
    	var switch_value = /*view*/ ctx[1];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*params, inject*/ 9)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*params*/ 1 && get_spread_object(/*params*/ ctx[0]),
    					dirty & /*inject*/ 8 && { pass: /*inject*/ ctx[3] }
    				])
    			: {};

    			if (switch_value !== (switch_value = /*view*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(163:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (157:0) {#if layout !== null}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*layout*/ ctx[2];

    	function switch_props(ctx) {
    		return {
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};

    			if (dirty & /*$$scope, view, params, inject*/ 16395) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*layout*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(157:0) {#if layout !== null}",
    		ctx
    	});

    	return block;
    }

    // (159:8) {#key changeTrigger}
    function create_key_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*params*/ ctx[0], { pass: /*inject*/ ctx[3] }];
    	var switch_value = /*view*/ ctx[1];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*params, inject*/ 9)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*params*/ 1 && get_spread_object(/*params*/ ctx[0]),
    					dirty & /*inject*/ 8 && { pass: /*inject*/ ctx[3] }
    				])
    			: {};

    			if (switch_value !== (switch_value = /*view*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(159:8) {#key changeTrigger}",
    		ctx
    	});

    	return block;
    }

    // (158:4) <svelte:component this={layout}>
    function create_default_slot(ctx) {
    	let previous_key = /*changeTrigger*/ ctx[4];
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*changeTrigger*/ 16 && safe_not_equal(previous_key, previous_key = /*changeTrigger*/ ctx[4])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(158:4) <svelte:component this={layout}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*layout*/ ctx[2] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
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
    			hash = '/' + hash;
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
    		$$invalidate(0, params = {});

    		//capture variables
    		let captured = captureRoute(urn);

    		keywords = captured.arguments;
    		console.log(routes);
    		console.log(captured.route);

    		if (!('view' in routes[captured.route]) && !'action' in routes[captured.route]) {
    			//ghetto way instead of checking if its a view
    			$$invalidate(1, view = routes[captured.route]);

    			document.title = basetitle;
    			return; //use simple schema
    		}

    		if ('action' in routes[captured.route]) {
    			window.history.back();
    			routes[captured.route].action(...keywords);
    		}

    		if ('before' in routes[captured.route]) {

    			if (Array.isArray(routes[captured.route].before)) {
    				routes[captured.route].before.forEach(element => {
    					element();
    				});
    			}

    			if (typeof routes[captured.route].before === 'function') {
    				routes[captured.route].before();
    			}
    		}

    		if ('layout' in routes[captured.route]) {
    			$$invalidate(1, view = routes[captured.route].view);
    			$$invalidate(2, layout = routes[captured.route].layout);
    		} else {
    			$$invalidate(1, view = routes[captured.route].view);
    			$$invalidate(2, layout = null);
    		}

    		if ('title' in routes[captured.route]) {
    			if (typeof routes[captured.route].title === 'function') {
    				document.title = routes[captured.route].title(keywords);
    			} else {
    				document.title = routes[captured.route].title;
    			}
    		} //document.title = basetitle;
    	}

    	function onBrowserHistory(e) {
    		$$invalidate(4, changeTrigger = !changeTrigger);
    		let route = window.location.hash.replace('/', '').replace('#', ''); //thats you, loser
    		route = route.length === 0 ? '/' : '/' + route;
    		pass = {};

    		if (route in storage) {
    			pass = storage[route];
    		}

    		getView(route);
    	}

    	window.addEventListener('hashchange', onBrowserHistory);

    	window.routing = {
    		goto(route = '', pass = {}) {
    			window.location.href = window.location.href.replace(window.location.hash, '') + '#' + route;
    			storage[route] = pass;
    			$$invalidate(3, inject = pass);
    		}
    	};

    	function captureRoute(urn) {
    		let args = [];
    		let explodedUrn = urn.split('/').filter(n => n);

    		if (explodedUrn.length === 0) {
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

    					$$invalidate(0, params[explodedPath[i].replace('{', '').replace('}', '')] = explodedUrn[i], params);
    					args.push(explodedUrn[i]);
    				}

    				if (i === explodedPath.length - 1 && explodedPath.length === explodedUrn.length) {
    					matched = true;
    				}
    			}

    			if (matched) {
    				return { arguments: args, route: path };
    			}
    		}

    		return { arguments: [], route: fallback };
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Route,
    		routes,
    		App,
    		basetitle,
    		fallback,
    		pass,
    		storage,
    		keywords,
    		params,
    		urn,
    		view,
    		layout,
    		inject,
    		changeTrigger,
    		getView,
    		onBrowserHistory,
    		captureRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ('basetitle' in $$props) basetitle = $$props.basetitle;
    		if ('fallback' in $$props) fallback = $$props.fallback;
    		if ('pass' in $$props) pass = $$props.pass;
    		if ('storage' in $$props) storage = $$props.storage;
    		if ('keywords' in $$props) keywords = $$props.keywords;
    		if ('params' in $$props) $$invalidate(0, params = $$props.params);
    		if ('urn' in $$props) urn = $$props.urn;
    		if ('view' in $$props) $$invalidate(1, view = $$props.view);
    		if ('layout' in $$props) $$invalidate(2, layout = $$props.layout);
    		if ('inject' in $$props) $$invalidate(3, inject = $$props.inject);
    		if ('changeTrigger' in $$props) $$invalidate(4, changeTrigger = $$props.changeTrigger);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params, view, layout, inject, changeTrigger];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.43.1 */

    function create_fragment(ctx) {
    	let router;
    	let current;
    	router = new Router({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

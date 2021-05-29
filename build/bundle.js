
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    function append(target, node) {
        target.appendChild(node);
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
    function empty$1() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
                update(component.$$);
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
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var require$$0$1 = {
    	"0": 65533,
    	"128": 8364,
    	"130": 8218,
    	"131": 402,
    	"132": 8222,
    	"133": 8230,
    	"134": 8224,
    	"135": 8225,
    	"136": 710,
    	"137": 8240,
    	"138": 352,
    	"139": 8249,
    	"140": 338,
    	"142": 381,
    	"145": 8216,
    	"146": 8217,
    	"147": 8220,
    	"148": 8221,
    	"149": 8226,
    	"150": 8211,
    	"151": 8212,
    	"152": 732,
    	"153": 8482,
    	"154": 353,
    	"155": 8250,
    	"156": 339,
    	"158": 382,
    	"159": 376
    };

    var __importDefault$1 = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    var decode_json_1 = __importDefault$1(require$$0$1);
    // Adapted from https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
    var fromCodePoint = 
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.fromCodePoint ||
        function (codePoint) {
            var output = "";
            if (codePoint > 0xffff) {
                codePoint -= 0x10000;
                output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
                codePoint = 0xdc00 | (codePoint & 0x3ff);
            }
            output += String.fromCharCode(codePoint);
            return output;
        };
    function decodeCodePoint(codePoint) {
        if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
            return "\uFFFD";
        }
        if (codePoint in decode_json_1.default) {
            codePoint = decode_json_1.default[codePoint];
        }
        return fromCodePoint(codePoint);
    }
    var _default$2 = decodeCodePoint;

    var decode_codepoint = /*#__PURE__*/Object.defineProperty({
    	default: _default$2
    }, '__esModule', {value: true});

    var Aacute$1 = "Á";
    var aacute$1 = "á";
    var Abreve = "Ă";
    var abreve = "ă";
    var ac = "∾";
    var acd = "∿";
    var acE = "∾̳";
    var Acirc$1 = "Â";
    var acirc$1 = "â";
    var acute$1 = "´";
    var Acy = "А";
    var acy = "а";
    var AElig$1 = "Æ";
    var aelig$1 = "æ";
    var af = "⁡";
    var Afr = "𝔄";
    var afr = "𝔞";
    var Agrave$1 = "À";
    var agrave$1 = "à";
    var alefsym = "ℵ";
    var aleph = "ℵ";
    var Alpha = "Α";
    var alpha = "α";
    var Amacr = "Ā";
    var amacr = "ā";
    var amalg = "⨿";
    var amp$2 = "&";
    var AMP$1 = "&";
    var andand = "⩕";
    var And = "⩓";
    var and = "∧";
    var andd = "⩜";
    var andslope = "⩘";
    var andv = "⩚";
    var ang = "∠";
    var ange = "⦤";
    var angle = "∠";
    var angmsdaa = "⦨";
    var angmsdab = "⦩";
    var angmsdac = "⦪";
    var angmsdad = "⦫";
    var angmsdae = "⦬";
    var angmsdaf = "⦭";
    var angmsdag = "⦮";
    var angmsdah = "⦯";
    var angmsd = "∡";
    var angrt = "∟";
    var angrtvb = "⊾";
    var angrtvbd = "⦝";
    var angsph = "∢";
    var angst = "Å";
    var angzarr = "⍼";
    var Aogon = "Ą";
    var aogon = "ą";
    var Aopf = "𝔸";
    var aopf = "𝕒";
    var apacir = "⩯";
    var ap = "≈";
    var apE = "⩰";
    var ape = "≊";
    var apid = "≋";
    var apos$1 = "'";
    var ApplyFunction = "⁡";
    var approx = "≈";
    var approxeq = "≊";
    var Aring$1 = "Å";
    var aring$1 = "å";
    var Ascr = "𝒜";
    var ascr = "𝒶";
    var Assign = "≔";
    var ast = "*";
    var asymp = "≈";
    var asympeq = "≍";
    var Atilde$1 = "Ã";
    var atilde$1 = "ã";
    var Auml$1 = "Ä";
    var auml$1 = "ä";
    var awconint = "∳";
    var awint = "⨑";
    var backcong = "≌";
    var backepsilon = "϶";
    var backprime = "‵";
    var backsim = "∽";
    var backsimeq = "⋍";
    var Backslash = "∖";
    var Barv = "⫧";
    var barvee = "⊽";
    var barwed = "⌅";
    var Barwed = "⌆";
    var barwedge = "⌅";
    var bbrk = "⎵";
    var bbrktbrk = "⎶";
    var bcong = "≌";
    var Bcy = "Б";
    var bcy = "б";
    var bdquo = "„";
    var becaus = "∵";
    var because = "∵";
    var Because = "∵";
    var bemptyv = "⦰";
    var bepsi = "϶";
    var bernou = "ℬ";
    var Bernoullis = "ℬ";
    var Beta = "Β";
    var beta = "β";
    var beth = "ℶ";
    var between = "≬";
    var Bfr = "𝔅";
    var bfr = "𝔟";
    var bigcap = "⋂";
    var bigcirc = "◯";
    var bigcup = "⋃";
    var bigodot = "⨀";
    var bigoplus = "⨁";
    var bigotimes = "⨂";
    var bigsqcup = "⨆";
    var bigstar = "★";
    var bigtriangledown = "▽";
    var bigtriangleup = "△";
    var biguplus = "⨄";
    var bigvee = "⋁";
    var bigwedge = "⋀";
    var bkarow = "⤍";
    var blacklozenge = "⧫";
    var blacksquare = "▪";
    var blacktriangle = "▴";
    var blacktriangledown = "▾";
    var blacktriangleleft = "◂";
    var blacktriangleright = "▸";
    var blank = "␣";
    var blk12 = "▒";
    var blk14 = "░";
    var blk34 = "▓";
    var block = "█";
    var bne = "=⃥";
    var bnequiv = "≡⃥";
    var bNot = "⫭";
    var bnot = "⌐";
    var Bopf = "𝔹";
    var bopf = "𝕓";
    var bot = "⊥";
    var bottom = "⊥";
    var bowtie = "⋈";
    var boxbox = "⧉";
    var boxdl = "┐";
    var boxdL = "╕";
    var boxDl = "╖";
    var boxDL = "╗";
    var boxdr = "┌";
    var boxdR = "╒";
    var boxDr = "╓";
    var boxDR = "╔";
    var boxh = "─";
    var boxH = "═";
    var boxhd = "┬";
    var boxHd = "╤";
    var boxhD = "╥";
    var boxHD = "╦";
    var boxhu = "┴";
    var boxHu = "╧";
    var boxhU = "╨";
    var boxHU = "╩";
    var boxminus = "⊟";
    var boxplus = "⊞";
    var boxtimes = "⊠";
    var boxul = "┘";
    var boxuL = "╛";
    var boxUl = "╜";
    var boxUL = "╝";
    var boxur = "└";
    var boxuR = "╘";
    var boxUr = "╙";
    var boxUR = "╚";
    var boxv = "│";
    var boxV = "║";
    var boxvh = "┼";
    var boxvH = "╪";
    var boxVh = "╫";
    var boxVH = "╬";
    var boxvl = "┤";
    var boxvL = "╡";
    var boxVl = "╢";
    var boxVL = "╣";
    var boxvr = "├";
    var boxvR = "╞";
    var boxVr = "╟";
    var boxVR = "╠";
    var bprime = "‵";
    var breve = "˘";
    var Breve = "˘";
    var brvbar$1 = "¦";
    var bscr = "𝒷";
    var Bscr = "ℬ";
    var bsemi = "⁏";
    var bsim = "∽";
    var bsime = "⋍";
    var bsolb = "⧅";
    var bsol = "\\";
    var bsolhsub = "⟈";
    var bull = "•";
    var bullet = "•";
    var bump = "≎";
    var bumpE = "⪮";
    var bumpe = "≏";
    var Bumpeq = "≎";
    var bumpeq = "≏";
    var Cacute = "Ć";
    var cacute = "ć";
    var capand = "⩄";
    var capbrcup = "⩉";
    var capcap = "⩋";
    var cap = "∩";
    var Cap = "⋒";
    var capcup = "⩇";
    var capdot = "⩀";
    var CapitalDifferentialD = "ⅅ";
    var caps = "∩︀";
    var caret = "⁁";
    var caron = "ˇ";
    var Cayleys = "ℭ";
    var ccaps = "⩍";
    var Ccaron = "Č";
    var ccaron = "č";
    var Ccedil$1 = "Ç";
    var ccedil$1 = "ç";
    var Ccirc = "Ĉ";
    var ccirc = "ĉ";
    var Cconint = "∰";
    var ccups = "⩌";
    var ccupssm = "⩐";
    var Cdot = "Ċ";
    var cdot = "ċ";
    var cedil$1 = "¸";
    var Cedilla = "¸";
    var cemptyv = "⦲";
    var cent$1 = "¢";
    var centerdot = "·";
    var CenterDot = "·";
    var cfr = "𝔠";
    var Cfr = "ℭ";
    var CHcy = "Ч";
    var chcy = "ч";
    var check = "✓";
    var checkmark = "✓";
    var Chi = "Χ";
    var chi = "χ";
    var circ = "ˆ";
    var circeq = "≗";
    var circlearrowleft = "↺";
    var circlearrowright = "↻";
    var circledast = "⊛";
    var circledcirc = "⊚";
    var circleddash = "⊝";
    var CircleDot = "⊙";
    var circledR = "®";
    var circledS = "Ⓢ";
    var CircleMinus = "⊖";
    var CirclePlus = "⊕";
    var CircleTimes = "⊗";
    var cir = "○";
    var cirE = "⧃";
    var cire = "≗";
    var cirfnint = "⨐";
    var cirmid = "⫯";
    var cirscir = "⧂";
    var ClockwiseContourIntegral = "∲";
    var CloseCurlyDoubleQuote = "”";
    var CloseCurlyQuote = "’";
    var clubs = "♣";
    var clubsuit = "♣";
    var colon = ":";
    var Colon = "∷";
    var Colone = "⩴";
    var colone = "≔";
    var coloneq = "≔";
    var comma = ",";
    var commat = "@";
    var comp = "∁";
    var compfn = "∘";
    var complement = "∁";
    var complexes = "ℂ";
    var cong = "≅";
    var congdot = "⩭";
    var Congruent = "≡";
    var conint = "∮";
    var Conint = "∯";
    var ContourIntegral = "∮";
    var copf = "𝕔";
    var Copf = "ℂ";
    var coprod = "∐";
    var Coproduct = "∐";
    var copy$1 = "©";
    var COPY$1 = "©";
    var copysr = "℗";
    var CounterClockwiseContourIntegral = "∳";
    var crarr = "↵";
    var cross = "✗";
    var Cross = "⨯";
    var Cscr = "𝒞";
    var cscr = "𝒸";
    var csub = "⫏";
    var csube = "⫑";
    var csup = "⫐";
    var csupe = "⫒";
    var ctdot = "⋯";
    var cudarrl = "⤸";
    var cudarrr = "⤵";
    var cuepr = "⋞";
    var cuesc = "⋟";
    var cularr = "↶";
    var cularrp = "⤽";
    var cupbrcap = "⩈";
    var cupcap = "⩆";
    var CupCap = "≍";
    var cup = "∪";
    var Cup = "⋓";
    var cupcup = "⩊";
    var cupdot = "⊍";
    var cupor = "⩅";
    var cups = "∪︀";
    var curarr = "↷";
    var curarrm = "⤼";
    var curlyeqprec = "⋞";
    var curlyeqsucc = "⋟";
    var curlyvee = "⋎";
    var curlywedge = "⋏";
    var curren$1 = "¤";
    var curvearrowleft = "↶";
    var curvearrowright = "↷";
    var cuvee = "⋎";
    var cuwed = "⋏";
    var cwconint = "∲";
    var cwint = "∱";
    var cylcty = "⌭";
    var dagger = "†";
    var Dagger = "‡";
    var daleth = "ℸ";
    var darr = "↓";
    var Darr = "↡";
    var dArr = "⇓";
    var dash = "‐";
    var Dashv = "⫤";
    var dashv = "⊣";
    var dbkarow = "⤏";
    var dblac = "˝";
    var Dcaron = "Ď";
    var dcaron = "ď";
    var Dcy = "Д";
    var dcy = "д";
    var ddagger = "‡";
    var ddarr = "⇊";
    var DD = "ⅅ";
    var dd = "ⅆ";
    var DDotrahd = "⤑";
    var ddotseq = "⩷";
    var deg$1 = "°";
    var Del = "∇";
    var Delta = "Δ";
    var delta = "δ";
    var demptyv = "⦱";
    var dfisht = "⥿";
    var Dfr = "𝔇";
    var dfr = "𝔡";
    var dHar = "⥥";
    var dharl = "⇃";
    var dharr = "⇂";
    var DiacriticalAcute = "´";
    var DiacriticalDot = "˙";
    var DiacriticalDoubleAcute = "˝";
    var DiacriticalGrave = "`";
    var DiacriticalTilde = "˜";
    var diam = "⋄";
    var diamond = "⋄";
    var Diamond = "⋄";
    var diamondsuit = "♦";
    var diams = "♦";
    var die = "¨";
    var DifferentialD = "ⅆ";
    var digamma = "ϝ";
    var disin = "⋲";
    var div = "÷";
    var divide$1 = "÷";
    var divideontimes = "⋇";
    var divonx = "⋇";
    var DJcy = "Ђ";
    var djcy = "ђ";
    var dlcorn = "⌞";
    var dlcrop = "⌍";
    var dollar = "$";
    var Dopf = "𝔻";
    var dopf = "𝕕";
    var Dot = "¨";
    var dot = "˙";
    var DotDot = "⃜";
    var doteq = "≐";
    var doteqdot = "≑";
    var DotEqual = "≐";
    var dotminus = "∸";
    var dotplus = "∔";
    var dotsquare = "⊡";
    var doublebarwedge = "⌆";
    var DoubleContourIntegral = "∯";
    var DoubleDot = "¨";
    var DoubleDownArrow = "⇓";
    var DoubleLeftArrow = "⇐";
    var DoubleLeftRightArrow = "⇔";
    var DoubleLeftTee = "⫤";
    var DoubleLongLeftArrow = "⟸";
    var DoubleLongLeftRightArrow = "⟺";
    var DoubleLongRightArrow = "⟹";
    var DoubleRightArrow = "⇒";
    var DoubleRightTee = "⊨";
    var DoubleUpArrow = "⇑";
    var DoubleUpDownArrow = "⇕";
    var DoubleVerticalBar = "∥";
    var DownArrowBar = "⤓";
    var downarrow = "↓";
    var DownArrow = "↓";
    var Downarrow = "⇓";
    var DownArrowUpArrow = "⇵";
    var DownBreve = "̑";
    var downdownarrows = "⇊";
    var downharpoonleft = "⇃";
    var downharpoonright = "⇂";
    var DownLeftRightVector = "⥐";
    var DownLeftTeeVector = "⥞";
    var DownLeftVectorBar = "⥖";
    var DownLeftVector = "↽";
    var DownRightTeeVector = "⥟";
    var DownRightVectorBar = "⥗";
    var DownRightVector = "⇁";
    var DownTeeArrow = "↧";
    var DownTee = "⊤";
    var drbkarow = "⤐";
    var drcorn = "⌟";
    var drcrop = "⌌";
    var Dscr = "𝒟";
    var dscr = "𝒹";
    var DScy = "Ѕ";
    var dscy = "ѕ";
    var dsol = "⧶";
    var Dstrok = "Đ";
    var dstrok = "đ";
    var dtdot = "⋱";
    var dtri = "▿";
    var dtrif = "▾";
    var duarr = "⇵";
    var duhar = "⥯";
    var dwangle = "⦦";
    var DZcy = "Џ";
    var dzcy = "џ";
    var dzigrarr = "⟿";
    var Eacute$1 = "É";
    var eacute$1 = "é";
    var easter = "⩮";
    var Ecaron = "Ě";
    var ecaron = "ě";
    var Ecirc$1 = "Ê";
    var ecirc$1 = "ê";
    var ecir = "≖";
    var ecolon = "≕";
    var Ecy = "Э";
    var ecy = "э";
    var eDDot = "⩷";
    var Edot = "Ė";
    var edot = "ė";
    var eDot = "≑";
    var ee = "ⅇ";
    var efDot = "≒";
    var Efr = "𝔈";
    var efr = "𝔢";
    var eg = "⪚";
    var Egrave$1 = "È";
    var egrave$1 = "è";
    var egs = "⪖";
    var egsdot = "⪘";
    var el = "⪙";
    var Element = "∈";
    var elinters = "⏧";
    var ell = "ℓ";
    var els = "⪕";
    var elsdot = "⪗";
    var Emacr = "Ē";
    var emacr = "ē";
    var empty = "∅";
    var emptyset = "∅";
    var EmptySmallSquare = "◻";
    var emptyv = "∅";
    var EmptyVerySmallSquare = "▫";
    var emsp13 = " ";
    var emsp14 = " ";
    var emsp = " ";
    var ENG = "Ŋ";
    var eng = "ŋ";
    var ensp = " ";
    var Eogon = "Ę";
    var eogon = "ę";
    var Eopf = "𝔼";
    var eopf = "𝕖";
    var epar = "⋕";
    var eparsl = "⧣";
    var eplus = "⩱";
    var epsi = "ε";
    var Epsilon = "Ε";
    var epsilon = "ε";
    var epsiv = "ϵ";
    var eqcirc = "≖";
    var eqcolon = "≕";
    var eqsim = "≂";
    var eqslantgtr = "⪖";
    var eqslantless = "⪕";
    var Equal = "⩵";
    var equals = "=";
    var EqualTilde = "≂";
    var equest = "≟";
    var Equilibrium = "⇌";
    var equiv = "≡";
    var equivDD = "⩸";
    var eqvparsl = "⧥";
    var erarr = "⥱";
    var erDot = "≓";
    var escr = "ℯ";
    var Escr = "ℰ";
    var esdot = "≐";
    var Esim = "⩳";
    var esim = "≂";
    var Eta = "Η";
    var eta = "η";
    var ETH$1 = "Ð";
    var eth$1 = "ð";
    var Euml$1 = "Ë";
    var euml$1 = "ë";
    var euro = "€";
    var excl = "!";
    var exist = "∃";
    var Exists = "∃";
    var expectation = "ℰ";
    var exponentiale = "ⅇ";
    var ExponentialE = "ⅇ";
    var fallingdotseq = "≒";
    var Fcy = "Ф";
    var fcy = "ф";
    var female = "♀";
    var ffilig = "ﬃ";
    var fflig = "ﬀ";
    var ffllig = "ﬄ";
    var Ffr = "𝔉";
    var ffr = "𝔣";
    var filig = "ﬁ";
    var FilledSmallSquare = "◼";
    var FilledVerySmallSquare = "▪";
    var fjlig = "fj";
    var flat = "♭";
    var fllig = "ﬂ";
    var fltns = "▱";
    var fnof = "ƒ";
    var Fopf = "𝔽";
    var fopf = "𝕗";
    var forall = "∀";
    var ForAll = "∀";
    var fork = "⋔";
    var forkv = "⫙";
    var Fouriertrf = "ℱ";
    var fpartint = "⨍";
    var frac12$1 = "½";
    var frac13 = "⅓";
    var frac14$1 = "¼";
    var frac15 = "⅕";
    var frac16 = "⅙";
    var frac18 = "⅛";
    var frac23 = "⅔";
    var frac25 = "⅖";
    var frac34$1 = "¾";
    var frac35 = "⅗";
    var frac38 = "⅜";
    var frac45 = "⅘";
    var frac56 = "⅚";
    var frac58 = "⅝";
    var frac78 = "⅞";
    var frasl = "⁄";
    var frown = "⌢";
    var fscr = "𝒻";
    var Fscr = "ℱ";
    var gacute = "ǵ";
    var Gamma = "Γ";
    var gamma = "γ";
    var Gammad = "Ϝ";
    var gammad = "ϝ";
    var gap = "⪆";
    var Gbreve = "Ğ";
    var gbreve = "ğ";
    var Gcedil = "Ģ";
    var Gcirc = "Ĝ";
    var gcirc = "ĝ";
    var Gcy = "Г";
    var gcy = "г";
    var Gdot = "Ġ";
    var gdot = "ġ";
    var ge = "≥";
    var gE = "≧";
    var gEl = "⪌";
    var gel = "⋛";
    var geq = "≥";
    var geqq = "≧";
    var geqslant = "⩾";
    var gescc = "⪩";
    var ges = "⩾";
    var gesdot = "⪀";
    var gesdoto = "⪂";
    var gesdotol = "⪄";
    var gesl = "⋛︀";
    var gesles = "⪔";
    var Gfr = "𝔊";
    var gfr = "𝔤";
    var gg = "≫";
    var Gg = "⋙";
    var ggg = "⋙";
    var gimel = "ℷ";
    var GJcy = "Ѓ";
    var gjcy = "ѓ";
    var gla = "⪥";
    var gl = "≷";
    var glE = "⪒";
    var glj = "⪤";
    var gnap = "⪊";
    var gnapprox = "⪊";
    var gne = "⪈";
    var gnE = "≩";
    var gneq = "⪈";
    var gneqq = "≩";
    var gnsim = "⋧";
    var Gopf = "𝔾";
    var gopf = "𝕘";
    var grave = "`";
    var GreaterEqual = "≥";
    var GreaterEqualLess = "⋛";
    var GreaterFullEqual = "≧";
    var GreaterGreater = "⪢";
    var GreaterLess = "≷";
    var GreaterSlantEqual = "⩾";
    var GreaterTilde = "≳";
    var Gscr = "𝒢";
    var gscr = "ℊ";
    var gsim = "≳";
    var gsime = "⪎";
    var gsiml = "⪐";
    var gtcc = "⪧";
    var gtcir = "⩺";
    var gt$2 = ">";
    var GT$1 = ">";
    var Gt = "≫";
    var gtdot = "⋗";
    var gtlPar = "⦕";
    var gtquest = "⩼";
    var gtrapprox = "⪆";
    var gtrarr = "⥸";
    var gtrdot = "⋗";
    var gtreqless = "⋛";
    var gtreqqless = "⪌";
    var gtrless = "≷";
    var gtrsim = "≳";
    var gvertneqq = "≩︀";
    var gvnE = "≩︀";
    var Hacek = "ˇ";
    var hairsp = " ";
    var half = "½";
    var hamilt = "ℋ";
    var HARDcy = "Ъ";
    var hardcy = "ъ";
    var harrcir = "⥈";
    var harr = "↔";
    var hArr = "⇔";
    var harrw = "↭";
    var Hat = "^";
    var hbar = "ℏ";
    var Hcirc = "Ĥ";
    var hcirc = "ĥ";
    var hearts = "♥";
    var heartsuit = "♥";
    var hellip = "…";
    var hercon = "⊹";
    var hfr = "𝔥";
    var Hfr = "ℌ";
    var HilbertSpace = "ℋ";
    var hksearow = "⤥";
    var hkswarow = "⤦";
    var hoarr = "⇿";
    var homtht = "∻";
    var hookleftarrow = "↩";
    var hookrightarrow = "↪";
    var hopf = "𝕙";
    var Hopf = "ℍ";
    var horbar = "―";
    var HorizontalLine = "─";
    var hscr = "𝒽";
    var Hscr = "ℋ";
    var hslash = "ℏ";
    var Hstrok = "Ħ";
    var hstrok = "ħ";
    var HumpDownHump = "≎";
    var HumpEqual = "≏";
    var hybull = "⁃";
    var hyphen = "‐";
    var Iacute$1 = "Í";
    var iacute$1 = "í";
    var ic = "⁣";
    var Icirc$1 = "Î";
    var icirc$1 = "î";
    var Icy = "И";
    var icy = "и";
    var Idot = "İ";
    var IEcy = "Е";
    var iecy = "е";
    var iexcl$1 = "¡";
    var iff = "⇔";
    var ifr = "𝔦";
    var Ifr = "ℑ";
    var Igrave$1 = "Ì";
    var igrave$1 = "ì";
    var ii = "ⅈ";
    var iiiint = "⨌";
    var iiint = "∭";
    var iinfin = "⧜";
    var iiota = "℩";
    var IJlig = "Ĳ";
    var ijlig = "ĳ";
    var Imacr = "Ī";
    var imacr = "ī";
    var image = "ℑ";
    var ImaginaryI = "ⅈ";
    var imagline = "ℐ";
    var imagpart = "ℑ";
    var imath = "ı";
    var Im = "ℑ";
    var imof = "⊷";
    var imped = "Ƶ";
    var Implies = "⇒";
    var incare = "℅";
    var infin = "∞";
    var infintie = "⧝";
    var inodot = "ı";
    var intcal = "⊺";
    var int = "∫";
    var Int = "∬";
    var integers = "ℤ";
    var Integral = "∫";
    var intercal = "⊺";
    var Intersection = "⋂";
    var intlarhk = "⨗";
    var intprod = "⨼";
    var InvisibleComma = "⁣";
    var InvisibleTimes = "⁢";
    var IOcy = "Ё";
    var iocy = "ё";
    var Iogon = "Į";
    var iogon = "į";
    var Iopf = "𝕀";
    var iopf = "𝕚";
    var Iota = "Ι";
    var iota = "ι";
    var iprod = "⨼";
    var iquest$1 = "¿";
    var iscr = "𝒾";
    var Iscr = "ℐ";
    var isin = "∈";
    var isindot = "⋵";
    var isinE = "⋹";
    var isins = "⋴";
    var isinsv = "⋳";
    var isinv = "∈";
    var it = "⁢";
    var Itilde = "Ĩ";
    var itilde = "ĩ";
    var Iukcy = "І";
    var iukcy = "і";
    var Iuml$1 = "Ï";
    var iuml$1 = "ï";
    var Jcirc = "Ĵ";
    var jcirc = "ĵ";
    var Jcy = "Й";
    var jcy = "й";
    var Jfr = "𝔍";
    var jfr = "𝔧";
    var jmath = "ȷ";
    var Jopf = "𝕁";
    var jopf = "𝕛";
    var Jscr = "𝒥";
    var jscr = "𝒿";
    var Jsercy = "Ј";
    var jsercy = "ј";
    var Jukcy = "Є";
    var jukcy = "є";
    var Kappa = "Κ";
    var kappa = "κ";
    var kappav = "ϰ";
    var Kcedil = "Ķ";
    var kcedil = "ķ";
    var Kcy = "К";
    var kcy = "к";
    var Kfr = "𝔎";
    var kfr = "𝔨";
    var kgreen = "ĸ";
    var KHcy = "Х";
    var khcy = "х";
    var KJcy = "Ќ";
    var kjcy = "ќ";
    var Kopf = "𝕂";
    var kopf = "𝕜";
    var Kscr = "𝒦";
    var kscr = "𝓀";
    var lAarr = "⇚";
    var Lacute = "Ĺ";
    var lacute = "ĺ";
    var laemptyv = "⦴";
    var lagran = "ℒ";
    var Lambda = "Λ";
    var lambda = "λ";
    var lang = "⟨";
    var Lang = "⟪";
    var langd = "⦑";
    var langle = "⟨";
    var lap = "⪅";
    var Laplacetrf = "ℒ";
    var laquo$1 = "«";
    var larrb = "⇤";
    var larrbfs = "⤟";
    var larr = "←";
    var Larr = "↞";
    var lArr = "⇐";
    var larrfs = "⤝";
    var larrhk = "↩";
    var larrlp = "↫";
    var larrpl = "⤹";
    var larrsim = "⥳";
    var larrtl = "↢";
    var latail = "⤙";
    var lAtail = "⤛";
    var lat = "⪫";
    var late = "⪭";
    var lates = "⪭︀";
    var lbarr = "⤌";
    var lBarr = "⤎";
    var lbbrk = "❲";
    var lbrace = "{";
    var lbrack = "[";
    var lbrke = "⦋";
    var lbrksld = "⦏";
    var lbrkslu = "⦍";
    var Lcaron = "Ľ";
    var lcaron = "ľ";
    var Lcedil = "Ļ";
    var lcedil = "ļ";
    var lceil = "⌈";
    var lcub = "{";
    var Lcy = "Л";
    var lcy = "л";
    var ldca = "⤶";
    var ldquo = "“";
    var ldquor = "„";
    var ldrdhar = "⥧";
    var ldrushar = "⥋";
    var ldsh = "↲";
    var le = "≤";
    var lE = "≦";
    var LeftAngleBracket = "⟨";
    var LeftArrowBar = "⇤";
    var leftarrow = "←";
    var LeftArrow = "←";
    var Leftarrow = "⇐";
    var LeftArrowRightArrow = "⇆";
    var leftarrowtail = "↢";
    var LeftCeiling = "⌈";
    var LeftDoubleBracket = "⟦";
    var LeftDownTeeVector = "⥡";
    var LeftDownVectorBar = "⥙";
    var LeftDownVector = "⇃";
    var LeftFloor = "⌊";
    var leftharpoondown = "↽";
    var leftharpoonup = "↼";
    var leftleftarrows = "⇇";
    var leftrightarrow = "↔";
    var LeftRightArrow = "↔";
    var Leftrightarrow = "⇔";
    var leftrightarrows = "⇆";
    var leftrightharpoons = "⇋";
    var leftrightsquigarrow = "↭";
    var LeftRightVector = "⥎";
    var LeftTeeArrow = "↤";
    var LeftTee = "⊣";
    var LeftTeeVector = "⥚";
    var leftthreetimes = "⋋";
    var LeftTriangleBar = "⧏";
    var LeftTriangle = "⊲";
    var LeftTriangleEqual = "⊴";
    var LeftUpDownVector = "⥑";
    var LeftUpTeeVector = "⥠";
    var LeftUpVectorBar = "⥘";
    var LeftUpVector = "↿";
    var LeftVectorBar = "⥒";
    var LeftVector = "↼";
    var lEg = "⪋";
    var leg = "⋚";
    var leq = "≤";
    var leqq = "≦";
    var leqslant = "⩽";
    var lescc = "⪨";
    var les = "⩽";
    var lesdot = "⩿";
    var lesdoto = "⪁";
    var lesdotor = "⪃";
    var lesg = "⋚︀";
    var lesges = "⪓";
    var lessapprox = "⪅";
    var lessdot = "⋖";
    var lesseqgtr = "⋚";
    var lesseqqgtr = "⪋";
    var LessEqualGreater = "⋚";
    var LessFullEqual = "≦";
    var LessGreater = "≶";
    var lessgtr = "≶";
    var LessLess = "⪡";
    var lesssim = "≲";
    var LessSlantEqual = "⩽";
    var LessTilde = "≲";
    var lfisht = "⥼";
    var lfloor = "⌊";
    var Lfr = "𝔏";
    var lfr = "𝔩";
    var lg = "≶";
    var lgE = "⪑";
    var lHar = "⥢";
    var lhard = "↽";
    var lharu = "↼";
    var lharul = "⥪";
    var lhblk = "▄";
    var LJcy = "Љ";
    var ljcy = "љ";
    var llarr = "⇇";
    var ll = "≪";
    var Ll = "⋘";
    var llcorner = "⌞";
    var Lleftarrow = "⇚";
    var llhard = "⥫";
    var lltri = "◺";
    var Lmidot = "Ŀ";
    var lmidot = "ŀ";
    var lmoustache = "⎰";
    var lmoust = "⎰";
    var lnap = "⪉";
    var lnapprox = "⪉";
    var lne = "⪇";
    var lnE = "≨";
    var lneq = "⪇";
    var lneqq = "≨";
    var lnsim = "⋦";
    var loang = "⟬";
    var loarr = "⇽";
    var lobrk = "⟦";
    var longleftarrow = "⟵";
    var LongLeftArrow = "⟵";
    var Longleftarrow = "⟸";
    var longleftrightarrow = "⟷";
    var LongLeftRightArrow = "⟷";
    var Longleftrightarrow = "⟺";
    var longmapsto = "⟼";
    var longrightarrow = "⟶";
    var LongRightArrow = "⟶";
    var Longrightarrow = "⟹";
    var looparrowleft = "↫";
    var looparrowright = "↬";
    var lopar = "⦅";
    var Lopf = "𝕃";
    var lopf = "𝕝";
    var loplus = "⨭";
    var lotimes = "⨴";
    var lowast = "∗";
    var lowbar = "_";
    var LowerLeftArrow = "↙";
    var LowerRightArrow = "↘";
    var loz = "◊";
    var lozenge = "◊";
    var lozf = "⧫";
    var lpar = "(";
    var lparlt = "⦓";
    var lrarr = "⇆";
    var lrcorner = "⌟";
    var lrhar = "⇋";
    var lrhard = "⥭";
    var lrm = "‎";
    var lrtri = "⊿";
    var lsaquo = "‹";
    var lscr = "𝓁";
    var Lscr = "ℒ";
    var lsh = "↰";
    var Lsh = "↰";
    var lsim = "≲";
    var lsime = "⪍";
    var lsimg = "⪏";
    var lsqb = "[";
    var lsquo = "‘";
    var lsquor = "‚";
    var Lstrok = "Ł";
    var lstrok = "ł";
    var ltcc = "⪦";
    var ltcir = "⩹";
    var lt$2 = "<";
    var LT$1 = "<";
    var Lt = "≪";
    var ltdot = "⋖";
    var lthree = "⋋";
    var ltimes = "⋉";
    var ltlarr = "⥶";
    var ltquest = "⩻";
    var ltri = "◃";
    var ltrie = "⊴";
    var ltrif = "◂";
    var ltrPar = "⦖";
    var lurdshar = "⥊";
    var luruhar = "⥦";
    var lvertneqq = "≨︀";
    var lvnE = "≨︀";
    var macr$1 = "¯";
    var male = "♂";
    var malt = "✠";
    var maltese = "✠";
    var map = "↦";
    var mapsto = "↦";
    var mapstodown = "↧";
    var mapstoleft = "↤";
    var mapstoup = "↥";
    var marker = "▮";
    var mcomma = "⨩";
    var Mcy = "М";
    var mcy = "м";
    var mdash = "—";
    var mDDot = "∺";
    var measuredangle = "∡";
    var MediumSpace = " ";
    var Mellintrf = "ℳ";
    var Mfr = "𝔐";
    var mfr = "𝔪";
    var mho = "℧";
    var micro$1 = "µ";
    var midast = "*";
    var midcir = "⫰";
    var mid = "∣";
    var middot$1 = "·";
    var minusb = "⊟";
    var minus = "−";
    var minusd = "∸";
    var minusdu = "⨪";
    var MinusPlus = "∓";
    var mlcp = "⫛";
    var mldr = "…";
    var mnplus = "∓";
    var models = "⊧";
    var Mopf = "𝕄";
    var mopf = "𝕞";
    var mp = "∓";
    var mscr = "𝓂";
    var Mscr = "ℳ";
    var mstpos = "∾";
    var Mu = "Μ";
    var mu = "μ";
    var multimap = "⊸";
    var mumap = "⊸";
    var nabla = "∇";
    var Nacute = "Ń";
    var nacute = "ń";
    var nang = "∠⃒";
    var nap = "≉";
    var napE = "⩰̸";
    var napid = "≋̸";
    var napos = "ŉ";
    var napprox = "≉";
    var natural = "♮";
    var naturals = "ℕ";
    var natur = "♮";
    var nbsp$1 = " ";
    var nbump = "≎̸";
    var nbumpe = "≏̸";
    var ncap = "⩃";
    var Ncaron = "Ň";
    var ncaron = "ň";
    var Ncedil = "Ņ";
    var ncedil = "ņ";
    var ncong = "≇";
    var ncongdot = "⩭̸";
    var ncup = "⩂";
    var Ncy = "Н";
    var ncy = "н";
    var ndash = "–";
    var nearhk = "⤤";
    var nearr = "↗";
    var neArr = "⇗";
    var nearrow = "↗";
    var ne = "≠";
    var nedot = "≐̸";
    var NegativeMediumSpace = "​";
    var NegativeThickSpace = "​";
    var NegativeThinSpace = "​";
    var NegativeVeryThinSpace = "​";
    var nequiv = "≢";
    var nesear = "⤨";
    var nesim = "≂̸";
    var NestedGreaterGreater = "≫";
    var NestedLessLess = "≪";
    var NewLine = "\n";
    var nexist = "∄";
    var nexists = "∄";
    var Nfr = "𝔑";
    var nfr = "𝔫";
    var ngE = "≧̸";
    var nge = "≱";
    var ngeq = "≱";
    var ngeqq = "≧̸";
    var ngeqslant = "⩾̸";
    var nges = "⩾̸";
    var nGg = "⋙̸";
    var ngsim = "≵";
    var nGt = "≫⃒";
    var ngt = "≯";
    var ngtr = "≯";
    var nGtv = "≫̸";
    var nharr = "↮";
    var nhArr = "⇎";
    var nhpar = "⫲";
    var ni = "∋";
    var nis = "⋼";
    var nisd = "⋺";
    var niv = "∋";
    var NJcy = "Њ";
    var njcy = "њ";
    var nlarr = "↚";
    var nlArr = "⇍";
    var nldr = "‥";
    var nlE = "≦̸";
    var nle = "≰";
    var nleftarrow = "↚";
    var nLeftarrow = "⇍";
    var nleftrightarrow = "↮";
    var nLeftrightarrow = "⇎";
    var nleq = "≰";
    var nleqq = "≦̸";
    var nleqslant = "⩽̸";
    var nles = "⩽̸";
    var nless = "≮";
    var nLl = "⋘̸";
    var nlsim = "≴";
    var nLt = "≪⃒";
    var nlt = "≮";
    var nltri = "⋪";
    var nltrie = "⋬";
    var nLtv = "≪̸";
    var nmid = "∤";
    var NoBreak = "⁠";
    var NonBreakingSpace = " ";
    var nopf = "𝕟";
    var Nopf = "ℕ";
    var Not = "⫬";
    var not$1 = "¬";
    var NotCongruent = "≢";
    var NotCupCap = "≭";
    var NotDoubleVerticalBar = "∦";
    var NotElement = "∉";
    var NotEqual = "≠";
    var NotEqualTilde = "≂̸";
    var NotExists = "∄";
    var NotGreater = "≯";
    var NotGreaterEqual = "≱";
    var NotGreaterFullEqual = "≧̸";
    var NotGreaterGreater = "≫̸";
    var NotGreaterLess = "≹";
    var NotGreaterSlantEqual = "⩾̸";
    var NotGreaterTilde = "≵";
    var NotHumpDownHump = "≎̸";
    var NotHumpEqual = "≏̸";
    var notin = "∉";
    var notindot = "⋵̸";
    var notinE = "⋹̸";
    var notinva = "∉";
    var notinvb = "⋷";
    var notinvc = "⋶";
    var NotLeftTriangleBar = "⧏̸";
    var NotLeftTriangle = "⋪";
    var NotLeftTriangleEqual = "⋬";
    var NotLess = "≮";
    var NotLessEqual = "≰";
    var NotLessGreater = "≸";
    var NotLessLess = "≪̸";
    var NotLessSlantEqual = "⩽̸";
    var NotLessTilde = "≴";
    var NotNestedGreaterGreater = "⪢̸";
    var NotNestedLessLess = "⪡̸";
    var notni = "∌";
    var notniva = "∌";
    var notnivb = "⋾";
    var notnivc = "⋽";
    var NotPrecedes = "⊀";
    var NotPrecedesEqual = "⪯̸";
    var NotPrecedesSlantEqual = "⋠";
    var NotReverseElement = "∌";
    var NotRightTriangleBar = "⧐̸";
    var NotRightTriangle = "⋫";
    var NotRightTriangleEqual = "⋭";
    var NotSquareSubset = "⊏̸";
    var NotSquareSubsetEqual = "⋢";
    var NotSquareSuperset = "⊐̸";
    var NotSquareSupersetEqual = "⋣";
    var NotSubset = "⊂⃒";
    var NotSubsetEqual = "⊈";
    var NotSucceeds = "⊁";
    var NotSucceedsEqual = "⪰̸";
    var NotSucceedsSlantEqual = "⋡";
    var NotSucceedsTilde = "≿̸";
    var NotSuperset = "⊃⃒";
    var NotSupersetEqual = "⊉";
    var NotTilde = "≁";
    var NotTildeEqual = "≄";
    var NotTildeFullEqual = "≇";
    var NotTildeTilde = "≉";
    var NotVerticalBar = "∤";
    var nparallel = "∦";
    var npar = "∦";
    var nparsl = "⫽⃥";
    var npart = "∂̸";
    var npolint = "⨔";
    var npr = "⊀";
    var nprcue = "⋠";
    var nprec = "⊀";
    var npreceq = "⪯̸";
    var npre = "⪯̸";
    var nrarrc = "⤳̸";
    var nrarr = "↛";
    var nrArr = "⇏";
    var nrarrw = "↝̸";
    var nrightarrow = "↛";
    var nRightarrow = "⇏";
    var nrtri = "⋫";
    var nrtrie = "⋭";
    var nsc = "⊁";
    var nsccue = "⋡";
    var nsce = "⪰̸";
    var Nscr = "𝒩";
    var nscr = "𝓃";
    var nshortmid = "∤";
    var nshortparallel = "∦";
    var nsim = "≁";
    var nsime = "≄";
    var nsimeq = "≄";
    var nsmid = "∤";
    var nspar = "∦";
    var nsqsube = "⋢";
    var nsqsupe = "⋣";
    var nsub = "⊄";
    var nsubE = "⫅̸";
    var nsube = "⊈";
    var nsubset = "⊂⃒";
    var nsubseteq = "⊈";
    var nsubseteqq = "⫅̸";
    var nsucc = "⊁";
    var nsucceq = "⪰̸";
    var nsup = "⊅";
    var nsupE = "⫆̸";
    var nsupe = "⊉";
    var nsupset = "⊃⃒";
    var nsupseteq = "⊉";
    var nsupseteqq = "⫆̸";
    var ntgl = "≹";
    var Ntilde$1 = "Ñ";
    var ntilde$1 = "ñ";
    var ntlg = "≸";
    var ntriangleleft = "⋪";
    var ntrianglelefteq = "⋬";
    var ntriangleright = "⋫";
    var ntrianglerighteq = "⋭";
    var Nu = "Ν";
    var nu = "ν";
    var num = "#";
    var numero = "№";
    var numsp = " ";
    var nvap = "≍⃒";
    var nvdash = "⊬";
    var nvDash = "⊭";
    var nVdash = "⊮";
    var nVDash = "⊯";
    var nvge = "≥⃒";
    var nvgt = ">⃒";
    var nvHarr = "⤄";
    var nvinfin = "⧞";
    var nvlArr = "⤂";
    var nvle = "≤⃒";
    var nvlt = "<⃒";
    var nvltrie = "⊴⃒";
    var nvrArr = "⤃";
    var nvrtrie = "⊵⃒";
    var nvsim = "∼⃒";
    var nwarhk = "⤣";
    var nwarr = "↖";
    var nwArr = "⇖";
    var nwarrow = "↖";
    var nwnear = "⤧";
    var Oacute$1 = "Ó";
    var oacute$1 = "ó";
    var oast = "⊛";
    var Ocirc$1 = "Ô";
    var ocirc$1 = "ô";
    var ocir = "⊚";
    var Ocy = "О";
    var ocy = "о";
    var odash = "⊝";
    var Odblac = "Ő";
    var odblac = "ő";
    var odiv = "⨸";
    var odot = "⊙";
    var odsold = "⦼";
    var OElig = "Œ";
    var oelig = "œ";
    var ofcir = "⦿";
    var Ofr = "𝔒";
    var ofr = "𝔬";
    var ogon = "˛";
    var Ograve$1 = "Ò";
    var ograve$1 = "ò";
    var ogt = "⧁";
    var ohbar = "⦵";
    var ohm = "Ω";
    var oint = "∮";
    var olarr = "↺";
    var olcir = "⦾";
    var olcross = "⦻";
    var oline = "‾";
    var olt = "⧀";
    var Omacr = "Ō";
    var omacr = "ō";
    var Omega = "Ω";
    var omega = "ω";
    var Omicron = "Ο";
    var omicron = "ο";
    var omid = "⦶";
    var ominus = "⊖";
    var Oopf = "𝕆";
    var oopf = "𝕠";
    var opar = "⦷";
    var OpenCurlyDoubleQuote = "“";
    var OpenCurlyQuote = "‘";
    var operp = "⦹";
    var oplus = "⊕";
    var orarr = "↻";
    var Or = "⩔";
    var or = "∨";
    var ord = "⩝";
    var order = "ℴ";
    var orderof = "ℴ";
    var ordf$1 = "ª";
    var ordm$1 = "º";
    var origof = "⊶";
    var oror = "⩖";
    var orslope = "⩗";
    var orv = "⩛";
    var oS = "Ⓢ";
    var Oscr = "𝒪";
    var oscr = "ℴ";
    var Oslash$1 = "Ø";
    var oslash$1 = "ø";
    var osol = "⊘";
    var Otilde$1 = "Õ";
    var otilde$1 = "õ";
    var otimesas = "⨶";
    var Otimes = "⨷";
    var otimes = "⊗";
    var Ouml$1 = "Ö";
    var ouml$1 = "ö";
    var ovbar = "⌽";
    var OverBar = "‾";
    var OverBrace = "⏞";
    var OverBracket = "⎴";
    var OverParenthesis = "⏜";
    var para$1 = "¶";
    var parallel = "∥";
    var par = "∥";
    var parsim = "⫳";
    var parsl = "⫽";
    var part = "∂";
    var PartialD = "∂";
    var Pcy = "П";
    var pcy = "п";
    var percnt = "%";
    var period = ".";
    var permil = "‰";
    var perp = "⊥";
    var pertenk = "‱";
    var Pfr = "𝔓";
    var pfr = "𝔭";
    var Phi = "Φ";
    var phi = "φ";
    var phiv = "ϕ";
    var phmmat = "ℳ";
    var phone = "☎";
    var Pi = "Π";
    var pi = "π";
    var pitchfork = "⋔";
    var piv = "ϖ";
    var planck = "ℏ";
    var planckh = "ℎ";
    var plankv = "ℏ";
    var plusacir = "⨣";
    var plusb = "⊞";
    var pluscir = "⨢";
    var plus = "+";
    var plusdo = "∔";
    var plusdu = "⨥";
    var pluse = "⩲";
    var PlusMinus = "±";
    var plusmn$1 = "±";
    var plussim = "⨦";
    var plustwo = "⨧";
    var pm = "±";
    var Poincareplane = "ℌ";
    var pointint = "⨕";
    var popf = "𝕡";
    var Popf = "ℙ";
    var pound$1 = "£";
    var prap = "⪷";
    var Pr = "⪻";
    var pr = "≺";
    var prcue = "≼";
    var precapprox = "⪷";
    var prec = "≺";
    var preccurlyeq = "≼";
    var Precedes = "≺";
    var PrecedesEqual = "⪯";
    var PrecedesSlantEqual = "≼";
    var PrecedesTilde = "≾";
    var preceq = "⪯";
    var precnapprox = "⪹";
    var precneqq = "⪵";
    var precnsim = "⋨";
    var pre = "⪯";
    var prE = "⪳";
    var precsim = "≾";
    var prime = "′";
    var Prime = "″";
    var primes = "ℙ";
    var prnap = "⪹";
    var prnE = "⪵";
    var prnsim = "⋨";
    var prod = "∏";
    var Product = "∏";
    var profalar = "⌮";
    var profline = "⌒";
    var profsurf = "⌓";
    var prop = "∝";
    var Proportional = "∝";
    var Proportion = "∷";
    var propto = "∝";
    var prsim = "≾";
    var prurel = "⊰";
    var Pscr = "𝒫";
    var pscr = "𝓅";
    var Psi = "Ψ";
    var psi = "ψ";
    var puncsp = " ";
    var Qfr = "𝔔";
    var qfr = "𝔮";
    var qint = "⨌";
    var qopf = "𝕢";
    var Qopf = "ℚ";
    var qprime = "⁗";
    var Qscr = "𝒬";
    var qscr = "𝓆";
    var quaternions = "ℍ";
    var quatint = "⨖";
    var quest = "?";
    var questeq = "≟";
    var quot$2 = "\"";
    var QUOT$1 = "\"";
    var rAarr = "⇛";
    var race = "∽̱";
    var Racute = "Ŕ";
    var racute = "ŕ";
    var radic = "√";
    var raemptyv = "⦳";
    var rang = "⟩";
    var Rang = "⟫";
    var rangd = "⦒";
    var range = "⦥";
    var rangle = "⟩";
    var raquo$1 = "»";
    var rarrap = "⥵";
    var rarrb = "⇥";
    var rarrbfs = "⤠";
    var rarrc = "⤳";
    var rarr = "→";
    var Rarr = "↠";
    var rArr = "⇒";
    var rarrfs = "⤞";
    var rarrhk = "↪";
    var rarrlp = "↬";
    var rarrpl = "⥅";
    var rarrsim = "⥴";
    var Rarrtl = "⤖";
    var rarrtl = "↣";
    var rarrw = "↝";
    var ratail = "⤚";
    var rAtail = "⤜";
    var ratio = "∶";
    var rationals = "ℚ";
    var rbarr = "⤍";
    var rBarr = "⤏";
    var RBarr = "⤐";
    var rbbrk = "❳";
    var rbrace = "}";
    var rbrack = "]";
    var rbrke = "⦌";
    var rbrksld = "⦎";
    var rbrkslu = "⦐";
    var Rcaron = "Ř";
    var rcaron = "ř";
    var Rcedil = "Ŗ";
    var rcedil = "ŗ";
    var rceil = "⌉";
    var rcub = "}";
    var Rcy = "Р";
    var rcy = "р";
    var rdca = "⤷";
    var rdldhar = "⥩";
    var rdquo = "”";
    var rdquor = "”";
    var rdsh = "↳";
    var real = "ℜ";
    var realine = "ℛ";
    var realpart = "ℜ";
    var reals = "ℝ";
    var Re = "ℜ";
    var rect = "▭";
    var reg$1 = "®";
    var REG$1 = "®";
    var ReverseElement = "∋";
    var ReverseEquilibrium = "⇋";
    var ReverseUpEquilibrium = "⥯";
    var rfisht = "⥽";
    var rfloor = "⌋";
    var rfr = "𝔯";
    var Rfr = "ℜ";
    var rHar = "⥤";
    var rhard = "⇁";
    var rharu = "⇀";
    var rharul = "⥬";
    var Rho = "Ρ";
    var rho = "ρ";
    var rhov = "ϱ";
    var RightAngleBracket = "⟩";
    var RightArrowBar = "⇥";
    var rightarrow = "→";
    var RightArrow = "→";
    var Rightarrow = "⇒";
    var RightArrowLeftArrow = "⇄";
    var rightarrowtail = "↣";
    var RightCeiling = "⌉";
    var RightDoubleBracket = "⟧";
    var RightDownTeeVector = "⥝";
    var RightDownVectorBar = "⥕";
    var RightDownVector = "⇂";
    var RightFloor = "⌋";
    var rightharpoondown = "⇁";
    var rightharpoonup = "⇀";
    var rightleftarrows = "⇄";
    var rightleftharpoons = "⇌";
    var rightrightarrows = "⇉";
    var rightsquigarrow = "↝";
    var RightTeeArrow = "↦";
    var RightTee = "⊢";
    var RightTeeVector = "⥛";
    var rightthreetimes = "⋌";
    var RightTriangleBar = "⧐";
    var RightTriangle = "⊳";
    var RightTriangleEqual = "⊵";
    var RightUpDownVector = "⥏";
    var RightUpTeeVector = "⥜";
    var RightUpVectorBar = "⥔";
    var RightUpVector = "↾";
    var RightVectorBar = "⥓";
    var RightVector = "⇀";
    var ring = "˚";
    var risingdotseq = "≓";
    var rlarr = "⇄";
    var rlhar = "⇌";
    var rlm = "‏";
    var rmoustache = "⎱";
    var rmoust = "⎱";
    var rnmid = "⫮";
    var roang = "⟭";
    var roarr = "⇾";
    var robrk = "⟧";
    var ropar = "⦆";
    var ropf = "𝕣";
    var Ropf = "ℝ";
    var roplus = "⨮";
    var rotimes = "⨵";
    var RoundImplies = "⥰";
    var rpar = ")";
    var rpargt = "⦔";
    var rppolint = "⨒";
    var rrarr = "⇉";
    var Rrightarrow = "⇛";
    var rsaquo = "›";
    var rscr = "𝓇";
    var Rscr = "ℛ";
    var rsh = "↱";
    var Rsh = "↱";
    var rsqb = "]";
    var rsquo = "’";
    var rsquor = "’";
    var rthree = "⋌";
    var rtimes = "⋊";
    var rtri = "▹";
    var rtrie = "⊵";
    var rtrif = "▸";
    var rtriltri = "⧎";
    var RuleDelayed = "⧴";
    var ruluhar = "⥨";
    var rx = "℞";
    var Sacute = "Ś";
    var sacute = "ś";
    var sbquo = "‚";
    var scap = "⪸";
    var Scaron = "Š";
    var scaron = "š";
    var Sc = "⪼";
    var sc = "≻";
    var sccue = "≽";
    var sce = "⪰";
    var scE = "⪴";
    var Scedil = "Ş";
    var scedil = "ş";
    var Scirc = "Ŝ";
    var scirc = "ŝ";
    var scnap = "⪺";
    var scnE = "⪶";
    var scnsim = "⋩";
    var scpolint = "⨓";
    var scsim = "≿";
    var Scy = "С";
    var scy = "с";
    var sdotb = "⊡";
    var sdot = "⋅";
    var sdote = "⩦";
    var searhk = "⤥";
    var searr = "↘";
    var seArr = "⇘";
    var searrow = "↘";
    var sect$1 = "§";
    var semi = ";";
    var seswar = "⤩";
    var setminus = "∖";
    var setmn = "∖";
    var sext = "✶";
    var Sfr = "𝔖";
    var sfr = "𝔰";
    var sfrown = "⌢";
    var sharp = "♯";
    var SHCHcy = "Щ";
    var shchcy = "щ";
    var SHcy = "Ш";
    var shcy = "ш";
    var ShortDownArrow = "↓";
    var ShortLeftArrow = "←";
    var shortmid = "∣";
    var shortparallel = "∥";
    var ShortRightArrow = "→";
    var ShortUpArrow = "↑";
    var shy$1 = "­";
    var Sigma = "Σ";
    var sigma = "σ";
    var sigmaf = "ς";
    var sigmav = "ς";
    var sim = "∼";
    var simdot = "⩪";
    var sime = "≃";
    var simeq = "≃";
    var simg = "⪞";
    var simgE = "⪠";
    var siml = "⪝";
    var simlE = "⪟";
    var simne = "≆";
    var simplus = "⨤";
    var simrarr = "⥲";
    var slarr = "←";
    var SmallCircle = "∘";
    var smallsetminus = "∖";
    var smashp = "⨳";
    var smeparsl = "⧤";
    var smid = "∣";
    var smile = "⌣";
    var smt = "⪪";
    var smte = "⪬";
    var smtes = "⪬︀";
    var SOFTcy = "Ь";
    var softcy = "ь";
    var solbar = "⌿";
    var solb = "⧄";
    var sol = "/";
    var Sopf = "𝕊";
    var sopf = "𝕤";
    var spades = "♠";
    var spadesuit = "♠";
    var spar = "∥";
    var sqcap = "⊓";
    var sqcaps = "⊓︀";
    var sqcup = "⊔";
    var sqcups = "⊔︀";
    var Sqrt = "√";
    var sqsub = "⊏";
    var sqsube = "⊑";
    var sqsubset = "⊏";
    var sqsubseteq = "⊑";
    var sqsup = "⊐";
    var sqsupe = "⊒";
    var sqsupset = "⊐";
    var sqsupseteq = "⊒";
    var square = "□";
    var Square = "□";
    var SquareIntersection = "⊓";
    var SquareSubset = "⊏";
    var SquareSubsetEqual = "⊑";
    var SquareSuperset = "⊐";
    var SquareSupersetEqual = "⊒";
    var SquareUnion = "⊔";
    var squarf = "▪";
    var squ = "□";
    var squf = "▪";
    var srarr = "→";
    var Sscr = "𝒮";
    var sscr = "𝓈";
    var ssetmn = "∖";
    var ssmile = "⌣";
    var sstarf = "⋆";
    var Star = "⋆";
    var star = "☆";
    var starf = "★";
    var straightepsilon = "ϵ";
    var straightphi = "ϕ";
    var strns = "¯";
    var sub = "⊂";
    var Sub = "⋐";
    var subdot = "⪽";
    var subE = "⫅";
    var sube = "⊆";
    var subedot = "⫃";
    var submult = "⫁";
    var subnE = "⫋";
    var subne = "⊊";
    var subplus = "⪿";
    var subrarr = "⥹";
    var subset = "⊂";
    var Subset = "⋐";
    var subseteq = "⊆";
    var subseteqq = "⫅";
    var SubsetEqual = "⊆";
    var subsetneq = "⊊";
    var subsetneqq = "⫋";
    var subsim = "⫇";
    var subsub = "⫕";
    var subsup = "⫓";
    var succapprox = "⪸";
    var succ = "≻";
    var succcurlyeq = "≽";
    var Succeeds = "≻";
    var SucceedsEqual = "⪰";
    var SucceedsSlantEqual = "≽";
    var SucceedsTilde = "≿";
    var succeq = "⪰";
    var succnapprox = "⪺";
    var succneqq = "⪶";
    var succnsim = "⋩";
    var succsim = "≿";
    var SuchThat = "∋";
    var sum = "∑";
    var Sum = "∑";
    var sung = "♪";
    var sup1$1 = "¹";
    var sup2$1 = "²";
    var sup3$1 = "³";
    var sup = "⊃";
    var Sup = "⋑";
    var supdot = "⪾";
    var supdsub = "⫘";
    var supE = "⫆";
    var supe = "⊇";
    var supedot = "⫄";
    var Superset = "⊃";
    var SupersetEqual = "⊇";
    var suphsol = "⟉";
    var suphsub = "⫗";
    var suplarr = "⥻";
    var supmult = "⫂";
    var supnE = "⫌";
    var supne = "⊋";
    var supplus = "⫀";
    var supset = "⊃";
    var Supset = "⋑";
    var supseteq = "⊇";
    var supseteqq = "⫆";
    var supsetneq = "⊋";
    var supsetneqq = "⫌";
    var supsim = "⫈";
    var supsub = "⫔";
    var supsup = "⫖";
    var swarhk = "⤦";
    var swarr = "↙";
    var swArr = "⇙";
    var swarrow = "↙";
    var swnwar = "⤪";
    var szlig$1 = "ß";
    var Tab = "\t";
    var target = "⌖";
    var Tau = "Τ";
    var tau = "τ";
    var tbrk = "⎴";
    var Tcaron = "Ť";
    var tcaron = "ť";
    var Tcedil = "Ţ";
    var tcedil = "ţ";
    var Tcy = "Т";
    var tcy = "т";
    var tdot = "⃛";
    var telrec = "⌕";
    var Tfr = "𝔗";
    var tfr = "𝔱";
    var there4 = "∴";
    var therefore = "∴";
    var Therefore = "∴";
    var Theta = "Θ";
    var theta = "θ";
    var thetasym = "ϑ";
    var thetav = "ϑ";
    var thickapprox = "≈";
    var thicksim = "∼";
    var ThickSpace = "  ";
    var ThinSpace = " ";
    var thinsp = " ";
    var thkap = "≈";
    var thksim = "∼";
    var THORN$1 = "Þ";
    var thorn$1 = "þ";
    var tilde = "˜";
    var Tilde = "∼";
    var TildeEqual = "≃";
    var TildeFullEqual = "≅";
    var TildeTilde = "≈";
    var timesbar = "⨱";
    var timesb = "⊠";
    var times$1 = "×";
    var timesd = "⨰";
    var tint = "∭";
    var toea = "⤨";
    var topbot = "⌶";
    var topcir = "⫱";
    var top = "⊤";
    var Topf = "𝕋";
    var topf = "𝕥";
    var topfork = "⫚";
    var tosa = "⤩";
    var tprime = "‴";
    var trade = "™";
    var TRADE = "™";
    var triangle = "▵";
    var triangledown = "▿";
    var triangleleft = "◃";
    var trianglelefteq = "⊴";
    var triangleq = "≜";
    var triangleright = "▹";
    var trianglerighteq = "⊵";
    var tridot = "◬";
    var trie = "≜";
    var triminus = "⨺";
    var TripleDot = "⃛";
    var triplus = "⨹";
    var trisb = "⧍";
    var tritime = "⨻";
    var trpezium = "⏢";
    var Tscr = "𝒯";
    var tscr = "𝓉";
    var TScy = "Ц";
    var tscy = "ц";
    var TSHcy = "Ћ";
    var tshcy = "ћ";
    var Tstrok = "Ŧ";
    var tstrok = "ŧ";
    var twixt = "≬";
    var twoheadleftarrow = "↞";
    var twoheadrightarrow = "↠";
    var Uacute$1 = "Ú";
    var uacute$1 = "ú";
    var uarr = "↑";
    var Uarr = "↟";
    var uArr = "⇑";
    var Uarrocir = "⥉";
    var Ubrcy = "Ў";
    var ubrcy = "ў";
    var Ubreve = "Ŭ";
    var ubreve = "ŭ";
    var Ucirc$1 = "Û";
    var ucirc$1 = "û";
    var Ucy = "У";
    var ucy = "у";
    var udarr = "⇅";
    var Udblac = "Ű";
    var udblac = "ű";
    var udhar = "⥮";
    var ufisht = "⥾";
    var Ufr = "𝔘";
    var ufr = "𝔲";
    var Ugrave$1 = "Ù";
    var ugrave$1 = "ù";
    var uHar = "⥣";
    var uharl = "↿";
    var uharr = "↾";
    var uhblk = "▀";
    var ulcorn = "⌜";
    var ulcorner = "⌜";
    var ulcrop = "⌏";
    var ultri = "◸";
    var Umacr = "Ū";
    var umacr = "ū";
    var uml$1 = "¨";
    var UnderBar = "_";
    var UnderBrace = "⏟";
    var UnderBracket = "⎵";
    var UnderParenthesis = "⏝";
    var Union = "⋃";
    var UnionPlus = "⊎";
    var Uogon = "Ų";
    var uogon = "ų";
    var Uopf = "𝕌";
    var uopf = "𝕦";
    var UpArrowBar = "⤒";
    var uparrow = "↑";
    var UpArrow = "↑";
    var Uparrow = "⇑";
    var UpArrowDownArrow = "⇅";
    var updownarrow = "↕";
    var UpDownArrow = "↕";
    var Updownarrow = "⇕";
    var UpEquilibrium = "⥮";
    var upharpoonleft = "↿";
    var upharpoonright = "↾";
    var uplus = "⊎";
    var UpperLeftArrow = "↖";
    var UpperRightArrow = "↗";
    var upsi = "υ";
    var Upsi = "ϒ";
    var upsih = "ϒ";
    var Upsilon = "Υ";
    var upsilon = "υ";
    var UpTeeArrow = "↥";
    var UpTee = "⊥";
    var upuparrows = "⇈";
    var urcorn = "⌝";
    var urcorner = "⌝";
    var urcrop = "⌎";
    var Uring = "Ů";
    var uring = "ů";
    var urtri = "◹";
    var Uscr = "𝒰";
    var uscr = "𝓊";
    var utdot = "⋰";
    var Utilde = "Ũ";
    var utilde = "ũ";
    var utri = "▵";
    var utrif = "▴";
    var uuarr = "⇈";
    var Uuml$1 = "Ü";
    var uuml$1 = "ü";
    var uwangle = "⦧";
    var vangrt = "⦜";
    var varepsilon = "ϵ";
    var varkappa = "ϰ";
    var varnothing = "∅";
    var varphi = "ϕ";
    var varpi = "ϖ";
    var varpropto = "∝";
    var varr = "↕";
    var vArr = "⇕";
    var varrho = "ϱ";
    var varsigma = "ς";
    var varsubsetneq = "⊊︀";
    var varsubsetneqq = "⫋︀";
    var varsupsetneq = "⊋︀";
    var varsupsetneqq = "⫌︀";
    var vartheta = "ϑ";
    var vartriangleleft = "⊲";
    var vartriangleright = "⊳";
    var vBar = "⫨";
    var Vbar = "⫫";
    var vBarv = "⫩";
    var Vcy = "В";
    var vcy = "в";
    var vdash = "⊢";
    var vDash = "⊨";
    var Vdash = "⊩";
    var VDash = "⊫";
    var Vdashl = "⫦";
    var veebar = "⊻";
    var vee = "∨";
    var Vee = "⋁";
    var veeeq = "≚";
    var vellip = "⋮";
    var verbar = "|";
    var Verbar = "‖";
    var vert = "|";
    var Vert = "‖";
    var VerticalBar = "∣";
    var VerticalLine = "|";
    var VerticalSeparator = "❘";
    var VerticalTilde = "≀";
    var VeryThinSpace = " ";
    var Vfr = "𝔙";
    var vfr = "𝔳";
    var vltri = "⊲";
    var vnsub = "⊂⃒";
    var vnsup = "⊃⃒";
    var Vopf = "𝕍";
    var vopf = "𝕧";
    var vprop = "∝";
    var vrtri = "⊳";
    var Vscr = "𝒱";
    var vscr = "𝓋";
    var vsubnE = "⫋︀";
    var vsubne = "⊊︀";
    var vsupnE = "⫌︀";
    var vsupne = "⊋︀";
    var Vvdash = "⊪";
    var vzigzag = "⦚";
    var Wcirc = "Ŵ";
    var wcirc = "ŵ";
    var wedbar = "⩟";
    var wedge = "∧";
    var Wedge = "⋀";
    var wedgeq = "≙";
    var weierp = "℘";
    var Wfr = "𝔚";
    var wfr = "𝔴";
    var Wopf = "𝕎";
    var wopf = "𝕨";
    var wp = "℘";
    var wr = "≀";
    var wreath = "≀";
    var Wscr = "𝒲";
    var wscr = "𝓌";
    var xcap = "⋂";
    var xcirc = "◯";
    var xcup = "⋃";
    var xdtri = "▽";
    var Xfr = "𝔛";
    var xfr = "𝔵";
    var xharr = "⟷";
    var xhArr = "⟺";
    var Xi = "Ξ";
    var xi = "ξ";
    var xlarr = "⟵";
    var xlArr = "⟸";
    var xmap = "⟼";
    var xnis = "⋻";
    var xodot = "⨀";
    var Xopf = "𝕏";
    var xopf = "𝕩";
    var xoplus = "⨁";
    var xotime = "⨂";
    var xrarr = "⟶";
    var xrArr = "⟹";
    var Xscr = "𝒳";
    var xscr = "𝓍";
    var xsqcup = "⨆";
    var xuplus = "⨄";
    var xutri = "△";
    var xvee = "⋁";
    var xwedge = "⋀";
    var Yacute$1 = "Ý";
    var yacute$1 = "ý";
    var YAcy = "Я";
    var yacy = "я";
    var Ycirc = "Ŷ";
    var ycirc = "ŷ";
    var Ycy = "Ы";
    var ycy = "ы";
    var yen$1 = "¥";
    var Yfr = "𝔜";
    var yfr = "𝔶";
    var YIcy = "Ї";
    var yicy = "ї";
    var Yopf = "𝕐";
    var yopf = "𝕪";
    var Yscr = "𝒴";
    var yscr = "𝓎";
    var YUcy = "Ю";
    var yucy = "ю";
    var yuml$1 = "ÿ";
    var Yuml = "Ÿ";
    var Zacute = "Ź";
    var zacute = "ź";
    var Zcaron = "Ž";
    var zcaron = "ž";
    var Zcy = "З";
    var zcy = "з";
    var Zdot = "Ż";
    var zdot = "ż";
    var zeetrf = "ℨ";
    var ZeroWidthSpace = "​";
    var Zeta = "Ζ";
    var zeta = "ζ";
    var zfr = "𝔷";
    var Zfr = "ℨ";
    var ZHcy = "Ж";
    var zhcy = "ж";
    var zigrarr = "⇝";
    var zopf = "𝕫";
    var Zopf = "ℤ";
    var Zscr = "𝒵";
    var zscr = "𝓏";
    var zwj = "‍";
    var zwnj = "‌";
    var require$$1$1 = {
    	Aacute: Aacute$1,
    	aacute: aacute$1,
    	Abreve: Abreve,
    	abreve: abreve,
    	ac: ac,
    	acd: acd,
    	acE: acE,
    	Acirc: Acirc$1,
    	acirc: acirc$1,
    	acute: acute$1,
    	Acy: Acy,
    	acy: acy,
    	AElig: AElig$1,
    	aelig: aelig$1,
    	af: af,
    	Afr: Afr,
    	afr: afr,
    	Agrave: Agrave$1,
    	agrave: agrave$1,
    	alefsym: alefsym,
    	aleph: aleph,
    	Alpha: Alpha,
    	alpha: alpha,
    	Amacr: Amacr,
    	amacr: amacr,
    	amalg: amalg,
    	amp: amp$2,
    	AMP: AMP$1,
    	andand: andand,
    	And: And,
    	and: and,
    	andd: andd,
    	andslope: andslope,
    	andv: andv,
    	ang: ang,
    	ange: ange,
    	angle: angle,
    	angmsdaa: angmsdaa,
    	angmsdab: angmsdab,
    	angmsdac: angmsdac,
    	angmsdad: angmsdad,
    	angmsdae: angmsdae,
    	angmsdaf: angmsdaf,
    	angmsdag: angmsdag,
    	angmsdah: angmsdah,
    	angmsd: angmsd,
    	angrt: angrt,
    	angrtvb: angrtvb,
    	angrtvbd: angrtvbd,
    	angsph: angsph,
    	angst: angst,
    	angzarr: angzarr,
    	Aogon: Aogon,
    	aogon: aogon,
    	Aopf: Aopf,
    	aopf: aopf,
    	apacir: apacir,
    	ap: ap,
    	apE: apE,
    	ape: ape,
    	apid: apid,
    	apos: apos$1,
    	ApplyFunction: ApplyFunction,
    	approx: approx,
    	approxeq: approxeq,
    	Aring: Aring$1,
    	aring: aring$1,
    	Ascr: Ascr,
    	ascr: ascr,
    	Assign: Assign,
    	ast: ast,
    	asymp: asymp,
    	asympeq: asympeq,
    	Atilde: Atilde$1,
    	atilde: atilde$1,
    	Auml: Auml$1,
    	auml: auml$1,
    	awconint: awconint,
    	awint: awint,
    	backcong: backcong,
    	backepsilon: backepsilon,
    	backprime: backprime,
    	backsim: backsim,
    	backsimeq: backsimeq,
    	Backslash: Backslash,
    	Barv: Barv,
    	barvee: barvee,
    	barwed: barwed,
    	Barwed: Barwed,
    	barwedge: barwedge,
    	bbrk: bbrk,
    	bbrktbrk: bbrktbrk,
    	bcong: bcong,
    	Bcy: Bcy,
    	bcy: bcy,
    	bdquo: bdquo,
    	becaus: becaus,
    	because: because,
    	Because: Because,
    	bemptyv: bemptyv,
    	bepsi: bepsi,
    	bernou: bernou,
    	Bernoullis: Bernoullis,
    	Beta: Beta,
    	beta: beta,
    	beth: beth,
    	between: between,
    	Bfr: Bfr,
    	bfr: bfr,
    	bigcap: bigcap,
    	bigcirc: bigcirc,
    	bigcup: bigcup,
    	bigodot: bigodot,
    	bigoplus: bigoplus,
    	bigotimes: bigotimes,
    	bigsqcup: bigsqcup,
    	bigstar: bigstar,
    	bigtriangledown: bigtriangledown,
    	bigtriangleup: bigtriangleup,
    	biguplus: biguplus,
    	bigvee: bigvee,
    	bigwedge: bigwedge,
    	bkarow: bkarow,
    	blacklozenge: blacklozenge,
    	blacksquare: blacksquare,
    	blacktriangle: blacktriangle,
    	blacktriangledown: blacktriangledown,
    	blacktriangleleft: blacktriangleleft,
    	blacktriangleright: blacktriangleright,
    	blank: blank,
    	blk12: blk12,
    	blk14: blk14,
    	blk34: blk34,
    	block: block,
    	bne: bne,
    	bnequiv: bnequiv,
    	bNot: bNot,
    	bnot: bnot,
    	Bopf: Bopf,
    	bopf: bopf,
    	bot: bot,
    	bottom: bottom,
    	bowtie: bowtie,
    	boxbox: boxbox,
    	boxdl: boxdl,
    	boxdL: boxdL,
    	boxDl: boxDl,
    	boxDL: boxDL,
    	boxdr: boxdr,
    	boxdR: boxdR,
    	boxDr: boxDr,
    	boxDR: boxDR,
    	boxh: boxh,
    	boxH: boxH,
    	boxhd: boxhd,
    	boxHd: boxHd,
    	boxhD: boxhD,
    	boxHD: boxHD,
    	boxhu: boxhu,
    	boxHu: boxHu,
    	boxhU: boxhU,
    	boxHU: boxHU,
    	boxminus: boxminus,
    	boxplus: boxplus,
    	boxtimes: boxtimes,
    	boxul: boxul,
    	boxuL: boxuL,
    	boxUl: boxUl,
    	boxUL: boxUL,
    	boxur: boxur,
    	boxuR: boxuR,
    	boxUr: boxUr,
    	boxUR: boxUR,
    	boxv: boxv,
    	boxV: boxV,
    	boxvh: boxvh,
    	boxvH: boxvH,
    	boxVh: boxVh,
    	boxVH: boxVH,
    	boxvl: boxvl,
    	boxvL: boxvL,
    	boxVl: boxVl,
    	boxVL: boxVL,
    	boxvr: boxvr,
    	boxvR: boxvR,
    	boxVr: boxVr,
    	boxVR: boxVR,
    	bprime: bprime,
    	breve: breve,
    	Breve: Breve,
    	brvbar: brvbar$1,
    	bscr: bscr,
    	Bscr: Bscr,
    	bsemi: bsemi,
    	bsim: bsim,
    	bsime: bsime,
    	bsolb: bsolb,
    	bsol: bsol,
    	bsolhsub: bsolhsub,
    	bull: bull,
    	bullet: bullet,
    	bump: bump,
    	bumpE: bumpE,
    	bumpe: bumpe,
    	Bumpeq: Bumpeq,
    	bumpeq: bumpeq,
    	Cacute: Cacute,
    	cacute: cacute,
    	capand: capand,
    	capbrcup: capbrcup,
    	capcap: capcap,
    	cap: cap,
    	Cap: Cap,
    	capcup: capcup,
    	capdot: capdot,
    	CapitalDifferentialD: CapitalDifferentialD,
    	caps: caps,
    	caret: caret,
    	caron: caron,
    	Cayleys: Cayleys,
    	ccaps: ccaps,
    	Ccaron: Ccaron,
    	ccaron: ccaron,
    	Ccedil: Ccedil$1,
    	ccedil: ccedil$1,
    	Ccirc: Ccirc,
    	ccirc: ccirc,
    	Cconint: Cconint,
    	ccups: ccups,
    	ccupssm: ccupssm,
    	Cdot: Cdot,
    	cdot: cdot,
    	cedil: cedil$1,
    	Cedilla: Cedilla,
    	cemptyv: cemptyv,
    	cent: cent$1,
    	centerdot: centerdot,
    	CenterDot: CenterDot,
    	cfr: cfr,
    	Cfr: Cfr,
    	CHcy: CHcy,
    	chcy: chcy,
    	check: check,
    	checkmark: checkmark,
    	Chi: Chi,
    	chi: chi,
    	circ: circ,
    	circeq: circeq,
    	circlearrowleft: circlearrowleft,
    	circlearrowright: circlearrowright,
    	circledast: circledast,
    	circledcirc: circledcirc,
    	circleddash: circleddash,
    	CircleDot: CircleDot,
    	circledR: circledR,
    	circledS: circledS,
    	CircleMinus: CircleMinus,
    	CirclePlus: CirclePlus,
    	CircleTimes: CircleTimes,
    	cir: cir,
    	cirE: cirE,
    	cire: cire,
    	cirfnint: cirfnint,
    	cirmid: cirmid,
    	cirscir: cirscir,
    	ClockwiseContourIntegral: ClockwiseContourIntegral,
    	CloseCurlyDoubleQuote: CloseCurlyDoubleQuote,
    	CloseCurlyQuote: CloseCurlyQuote,
    	clubs: clubs,
    	clubsuit: clubsuit,
    	colon: colon,
    	Colon: Colon,
    	Colone: Colone,
    	colone: colone,
    	coloneq: coloneq,
    	comma: comma,
    	commat: commat,
    	comp: comp,
    	compfn: compfn,
    	complement: complement,
    	complexes: complexes,
    	cong: cong,
    	congdot: congdot,
    	Congruent: Congruent,
    	conint: conint,
    	Conint: Conint,
    	ContourIntegral: ContourIntegral,
    	copf: copf,
    	Copf: Copf,
    	coprod: coprod,
    	Coproduct: Coproduct,
    	copy: copy$1,
    	COPY: COPY$1,
    	copysr: copysr,
    	CounterClockwiseContourIntegral: CounterClockwiseContourIntegral,
    	crarr: crarr,
    	cross: cross,
    	Cross: Cross,
    	Cscr: Cscr,
    	cscr: cscr,
    	csub: csub,
    	csube: csube,
    	csup: csup,
    	csupe: csupe,
    	ctdot: ctdot,
    	cudarrl: cudarrl,
    	cudarrr: cudarrr,
    	cuepr: cuepr,
    	cuesc: cuesc,
    	cularr: cularr,
    	cularrp: cularrp,
    	cupbrcap: cupbrcap,
    	cupcap: cupcap,
    	CupCap: CupCap,
    	cup: cup,
    	Cup: Cup,
    	cupcup: cupcup,
    	cupdot: cupdot,
    	cupor: cupor,
    	cups: cups,
    	curarr: curarr,
    	curarrm: curarrm,
    	curlyeqprec: curlyeqprec,
    	curlyeqsucc: curlyeqsucc,
    	curlyvee: curlyvee,
    	curlywedge: curlywedge,
    	curren: curren$1,
    	curvearrowleft: curvearrowleft,
    	curvearrowright: curvearrowright,
    	cuvee: cuvee,
    	cuwed: cuwed,
    	cwconint: cwconint,
    	cwint: cwint,
    	cylcty: cylcty,
    	dagger: dagger,
    	Dagger: Dagger,
    	daleth: daleth,
    	darr: darr,
    	Darr: Darr,
    	dArr: dArr,
    	dash: dash,
    	Dashv: Dashv,
    	dashv: dashv,
    	dbkarow: dbkarow,
    	dblac: dblac,
    	Dcaron: Dcaron,
    	dcaron: dcaron,
    	Dcy: Dcy,
    	dcy: dcy,
    	ddagger: ddagger,
    	ddarr: ddarr,
    	DD: DD,
    	dd: dd,
    	DDotrahd: DDotrahd,
    	ddotseq: ddotseq,
    	deg: deg$1,
    	Del: Del,
    	Delta: Delta,
    	delta: delta,
    	demptyv: demptyv,
    	dfisht: dfisht,
    	Dfr: Dfr,
    	dfr: dfr,
    	dHar: dHar,
    	dharl: dharl,
    	dharr: dharr,
    	DiacriticalAcute: DiacriticalAcute,
    	DiacriticalDot: DiacriticalDot,
    	DiacriticalDoubleAcute: DiacriticalDoubleAcute,
    	DiacriticalGrave: DiacriticalGrave,
    	DiacriticalTilde: DiacriticalTilde,
    	diam: diam,
    	diamond: diamond,
    	Diamond: Diamond,
    	diamondsuit: diamondsuit,
    	diams: diams,
    	die: die,
    	DifferentialD: DifferentialD,
    	digamma: digamma,
    	disin: disin,
    	div: div,
    	divide: divide$1,
    	divideontimes: divideontimes,
    	divonx: divonx,
    	DJcy: DJcy,
    	djcy: djcy,
    	dlcorn: dlcorn,
    	dlcrop: dlcrop,
    	dollar: dollar,
    	Dopf: Dopf,
    	dopf: dopf,
    	Dot: Dot,
    	dot: dot,
    	DotDot: DotDot,
    	doteq: doteq,
    	doteqdot: doteqdot,
    	DotEqual: DotEqual,
    	dotminus: dotminus,
    	dotplus: dotplus,
    	dotsquare: dotsquare,
    	doublebarwedge: doublebarwedge,
    	DoubleContourIntegral: DoubleContourIntegral,
    	DoubleDot: DoubleDot,
    	DoubleDownArrow: DoubleDownArrow,
    	DoubleLeftArrow: DoubleLeftArrow,
    	DoubleLeftRightArrow: DoubleLeftRightArrow,
    	DoubleLeftTee: DoubleLeftTee,
    	DoubleLongLeftArrow: DoubleLongLeftArrow,
    	DoubleLongLeftRightArrow: DoubleLongLeftRightArrow,
    	DoubleLongRightArrow: DoubleLongRightArrow,
    	DoubleRightArrow: DoubleRightArrow,
    	DoubleRightTee: DoubleRightTee,
    	DoubleUpArrow: DoubleUpArrow,
    	DoubleUpDownArrow: DoubleUpDownArrow,
    	DoubleVerticalBar: DoubleVerticalBar,
    	DownArrowBar: DownArrowBar,
    	downarrow: downarrow,
    	DownArrow: DownArrow,
    	Downarrow: Downarrow,
    	DownArrowUpArrow: DownArrowUpArrow,
    	DownBreve: DownBreve,
    	downdownarrows: downdownarrows,
    	downharpoonleft: downharpoonleft,
    	downharpoonright: downharpoonright,
    	DownLeftRightVector: DownLeftRightVector,
    	DownLeftTeeVector: DownLeftTeeVector,
    	DownLeftVectorBar: DownLeftVectorBar,
    	DownLeftVector: DownLeftVector,
    	DownRightTeeVector: DownRightTeeVector,
    	DownRightVectorBar: DownRightVectorBar,
    	DownRightVector: DownRightVector,
    	DownTeeArrow: DownTeeArrow,
    	DownTee: DownTee,
    	drbkarow: drbkarow,
    	drcorn: drcorn,
    	drcrop: drcrop,
    	Dscr: Dscr,
    	dscr: dscr,
    	DScy: DScy,
    	dscy: dscy,
    	dsol: dsol,
    	Dstrok: Dstrok,
    	dstrok: dstrok,
    	dtdot: dtdot,
    	dtri: dtri,
    	dtrif: dtrif,
    	duarr: duarr,
    	duhar: duhar,
    	dwangle: dwangle,
    	DZcy: DZcy,
    	dzcy: dzcy,
    	dzigrarr: dzigrarr,
    	Eacute: Eacute$1,
    	eacute: eacute$1,
    	easter: easter,
    	Ecaron: Ecaron,
    	ecaron: ecaron,
    	Ecirc: Ecirc$1,
    	ecirc: ecirc$1,
    	ecir: ecir,
    	ecolon: ecolon,
    	Ecy: Ecy,
    	ecy: ecy,
    	eDDot: eDDot,
    	Edot: Edot,
    	edot: edot,
    	eDot: eDot,
    	ee: ee,
    	efDot: efDot,
    	Efr: Efr,
    	efr: efr,
    	eg: eg,
    	Egrave: Egrave$1,
    	egrave: egrave$1,
    	egs: egs,
    	egsdot: egsdot,
    	el: el,
    	Element: Element,
    	elinters: elinters,
    	ell: ell,
    	els: els,
    	elsdot: elsdot,
    	Emacr: Emacr,
    	emacr: emacr,
    	empty: empty,
    	emptyset: emptyset,
    	EmptySmallSquare: EmptySmallSquare,
    	emptyv: emptyv,
    	EmptyVerySmallSquare: EmptyVerySmallSquare,
    	emsp13: emsp13,
    	emsp14: emsp14,
    	emsp: emsp,
    	ENG: ENG,
    	eng: eng,
    	ensp: ensp,
    	Eogon: Eogon,
    	eogon: eogon,
    	Eopf: Eopf,
    	eopf: eopf,
    	epar: epar,
    	eparsl: eparsl,
    	eplus: eplus,
    	epsi: epsi,
    	Epsilon: Epsilon,
    	epsilon: epsilon,
    	epsiv: epsiv,
    	eqcirc: eqcirc,
    	eqcolon: eqcolon,
    	eqsim: eqsim,
    	eqslantgtr: eqslantgtr,
    	eqslantless: eqslantless,
    	Equal: Equal,
    	equals: equals,
    	EqualTilde: EqualTilde,
    	equest: equest,
    	Equilibrium: Equilibrium,
    	equiv: equiv,
    	equivDD: equivDD,
    	eqvparsl: eqvparsl,
    	erarr: erarr,
    	erDot: erDot,
    	escr: escr,
    	Escr: Escr,
    	esdot: esdot,
    	Esim: Esim,
    	esim: esim,
    	Eta: Eta,
    	eta: eta,
    	ETH: ETH$1,
    	eth: eth$1,
    	Euml: Euml$1,
    	euml: euml$1,
    	euro: euro,
    	excl: excl,
    	exist: exist,
    	Exists: Exists,
    	expectation: expectation,
    	exponentiale: exponentiale,
    	ExponentialE: ExponentialE,
    	fallingdotseq: fallingdotseq,
    	Fcy: Fcy,
    	fcy: fcy,
    	female: female,
    	ffilig: ffilig,
    	fflig: fflig,
    	ffllig: ffllig,
    	Ffr: Ffr,
    	ffr: ffr,
    	filig: filig,
    	FilledSmallSquare: FilledSmallSquare,
    	FilledVerySmallSquare: FilledVerySmallSquare,
    	fjlig: fjlig,
    	flat: flat,
    	fllig: fllig,
    	fltns: fltns,
    	fnof: fnof,
    	Fopf: Fopf,
    	fopf: fopf,
    	forall: forall,
    	ForAll: ForAll,
    	fork: fork,
    	forkv: forkv,
    	Fouriertrf: Fouriertrf,
    	fpartint: fpartint,
    	frac12: frac12$1,
    	frac13: frac13,
    	frac14: frac14$1,
    	frac15: frac15,
    	frac16: frac16,
    	frac18: frac18,
    	frac23: frac23,
    	frac25: frac25,
    	frac34: frac34$1,
    	frac35: frac35,
    	frac38: frac38,
    	frac45: frac45,
    	frac56: frac56,
    	frac58: frac58,
    	frac78: frac78,
    	frasl: frasl,
    	frown: frown,
    	fscr: fscr,
    	Fscr: Fscr,
    	gacute: gacute,
    	Gamma: Gamma,
    	gamma: gamma,
    	Gammad: Gammad,
    	gammad: gammad,
    	gap: gap,
    	Gbreve: Gbreve,
    	gbreve: gbreve,
    	Gcedil: Gcedil,
    	Gcirc: Gcirc,
    	gcirc: gcirc,
    	Gcy: Gcy,
    	gcy: gcy,
    	Gdot: Gdot,
    	gdot: gdot,
    	ge: ge,
    	gE: gE,
    	gEl: gEl,
    	gel: gel,
    	geq: geq,
    	geqq: geqq,
    	geqslant: geqslant,
    	gescc: gescc,
    	ges: ges,
    	gesdot: gesdot,
    	gesdoto: gesdoto,
    	gesdotol: gesdotol,
    	gesl: gesl,
    	gesles: gesles,
    	Gfr: Gfr,
    	gfr: gfr,
    	gg: gg,
    	Gg: Gg,
    	ggg: ggg,
    	gimel: gimel,
    	GJcy: GJcy,
    	gjcy: gjcy,
    	gla: gla,
    	gl: gl,
    	glE: glE,
    	glj: glj,
    	gnap: gnap,
    	gnapprox: gnapprox,
    	gne: gne,
    	gnE: gnE,
    	gneq: gneq,
    	gneqq: gneqq,
    	gnsim: gnsim,
    	Gopf: Gopf,
    	gopf: gopf,
    	grave: grave,
    	GreaterEqual: GreaterEqual,
    	GreaterEqualLess: GreaterEqualLess,
    	GreaterFullEqual: GreaterFullEqual,
    	GreaterGreater: GreaterGreater,
    	GreaterLess: GreaterLess,
    	GreaterSlantEqual: GreaterSlantEqual,
    	GreaterTilde: GreaterTilde,
    	Gscr: Gscr,
    	gscr: gscr,
    	gsim: gsim,
    	gsime: gsime,
    	gsiml: gsiml,
    	gtcc: gtcc,
    	gtcir: gtcir,
    	gt: gt$2,
    	GT: GT$1,
    	Gt: Gt,
    	gtdot: gtdot,
    	gtlPar: gtlPar,
    	gtquest: gtquest,
    	gtrapprox: gtrapprox,
    	gtrarr: gtrarr,
    	gtrdot: gtrdot,
    	gtreqless: gtreqless,
    	gtreqqless: gtreqqless,
    	gtrless: gtrless,
    	gtrsim: gtrsim,
    	gvertneqq: gvertneqq,
    	gvnE: gvnE,
    	Hacek: Hacek,
    	hairsp: hairsp,
    	half: half,
    	hamilt: hamilt,
    	HARDcy: HARDcy,
    	hardcy: hardcy,
    	harrcir: harrcir,
    	harr: harr,
    	hArr: hArr,
    	harrw: harrw,
    	Hat: Hat,
    	hbar: hbar,
    	Hcirc: Hcirc,
    	hcirc: hcirc,
    	hearts: hearts,
    	heartsuit: heartsuit,
    	hellip: hellip,
    	hercon: hercon,
    	hfr: hfr,
    	Hfr: Hfr,
    	HilbertSpace: HilbertSpace,
    	hksearow: hksearow,
    	hkswarow: hkswarow,
    	hoarr: hoarr,
    	homtht: homtht,
    	hookleftarrow: hookleftarrow,
    	hookrightarrow: hookrightarrow,
    	hopf: hopf,
    	Hopf: Hopf,
    	horbar: horbar,
    	HorizontalLine: HorizontalLine,
    	hscr: hscr,
    	Hscr: Hscr,
    	hslash: hslash,
    	Hstrok: Hstrok,
    	hstrok: hstrok,
    	HumpDownHump: HumpDownHump,
    	HumpEqual: HumpEqual,
    	hybull: hybull,
    	hyphen: hyphen,
    	Iacute: Iacute$1,
    	iacute: iacute$1,
    	ic: ic,
    	Icirc: Icirc$1,
    	icirc: icirc$1,
    	Icy: Icy,
    	icy: icy,
    	Idot: Idot,
    	IEcy: IEcy,
    	iecy: iecy,
    	iexcl: iexcl$1,
    	iff: iff,
    	ifr: ifr,
    	Ifr: Ifr,
    	Igrave: Igrave$1,
    	igrave: igrave$1,
    	ii: ii,
    	iiiint: iiiint,
    	iiint: iiint,
    	iinfin: iinfin,
    	iiota: iiota,
    	IJlig: IJlig,
    	ijlig: ijlig,
    	Imacr: Imacr,
    	imacr: imacr,
    	image: image,
    	ImaginaryI: ImaginaryI,
    	imagline: imagline,
    	imagpart: imagpart,
    	imath: imath,
    	Im: Im,
    	imof: imof,
    	imped: imped,
    	Implies: Implies,
    	incare: incare,
    	"in": "∈",
    	infin: infin,
    	infintie: infintie,
    	inodot: inodot,
    	intcal: intcal,
    	int: int,
    	Int: Int,
    	integers: integers,
    	Integral: Integral,
    	intercal: intercal,
    	Intersection: Intersection,
    	intlarhk: intlarhk,
    	intprod: intprod,
    	InvisibleComma: InvisibleComma,
    	InvisibleTimes: InvisibleTimes,
    	IOcy: IOcy,
    	iocy: iocy,
    	Iogon: Iogon,
    	iogon: iogon,
    	Iopf: Iopf,
    	iopf: iopf,
    	Iota: Iota,
    	iota: iota,
    	iprod: iprod,
    	iquest: iquest$1,
    	iscr: iscr,
    	Iscr: Iscr,
    	isin: isin,
    	isindot: isindot,
    	isinE: isinE,
    	isins: isins,
    	isinsv: isinsv,
    	isinv: isinv,
    	it: it,
    	Itilde: Itilde,
    	itilde: itilde,
    	Iukcy: Iukcy,
    	iukcy: iukcy,
    	Iuml: Iuml$1,
    	iuml: iuml$1,
    	Jcirc: Jcirc,
    	jcirc: jcirc,
    	Jcy: Jcy,
    	jcy: jcy,
    	Jfr: Jfr,
    	jfr: jfr,
    	jmath: jmath,
    	Jopf: Jopf,
    	jopf: jopf,
    	Jscr: Jscr,
    	jscr: jscr,
    	Jsercy: Jsercy,
    	jsercy: jsercy,
    	Jukcy: Jukcy,
    	jukcy: jukcy,
    	Kappa: Kappa,
    	kappa: kappa,
    	kappav: kappav,
    	Kcedil: Kcedil,
    	kcedil: kcedil,
    	Kcy: Kcy,
    	kcy: kcy,
    	Kfr: Kfr,
    	kfr: kfr,
    	kgreen: kgreen,
    	KHcy: KHcy,
    	khcy: khcy,
    	KJcy: KJcy,
    	kjcy: kjcy,
    	Kopf: Kopf,
    	kopf: kopf,
    	Kscr: Kscr,
    	kscr: kscr,
    	lAarr: lAarr,
    	Lacute: Lacute,
    	lacute: lacute,
    	laemptyv: laemptyv,
    	lagran: lagran,
    	Lambda: Lambda,
    	lambda: lambda,
    	lang: lang,
    	Lang: Lang,
    	langd: langd,
    	langle: langle,
    	lap: lap,
    	Laplacetrf: Laplacetrf,
    	laquo: laquo$1,
    	larrb: larrb,
    	larrbfs: larrbfs,
    	larr: larr,
    	Larr: Larr,
    	lArr: lArr,
    	larrfs: larrfs,
    	larrhk: larrhk,
    	larrlp: larrlp,
    	larrpl: larrpl,
    	larrsim: larrsim,
    	larrtl: larrtl,
    	latail: latail,
    	lAtail: lAtail,
    	lat: lat,
    	late: late,
    	lates: lates,
    	lbarr: lbarr,
    	lBarr: lBarr,
    	lbbrk: lbbrk,
    	lbrace: lbrace,
    	lbrack: lbrack,
    	lbrke: lbrke,
    	lbrksld: lbrksld,
    	lbrkslu: lbrkslu,
    	Lcaron: Lcaron,
    	lcaron: lcaron,
    	Lcedil: Lcedil,
    	lcedil: lcedil,
    	lceil: lceil,
    	lcub: lcub,
    	Lcy: Lcy,
    	lcy: lcy,
    	ldca: ldca,
    	ldquo: ldquo,
    	ldquor: ldquor,
    	ldrdhar: ldrdhar,
    	ldrushar: ldrushar,
    	ldsh: ldsh,
    	le: le,
    	lE: lE,
    	LeftAngleBracket: LeftAngleBracket,
    	LeftArrowBar: LeftArrowBar,
    	leftarrow: leftarrow,
    	LeftArrow: LeftArrow,
    	Leftarrow: Leftarrow,
    	LeftArrowRightArrow: LeftArrowRightArrow,
    	leftarrowtail: leftarrowtail,
    	LeftCeiling: LeftCeiling,
    	LeftDoubleBracket: LeftDoubleBracket,
    	LeftDownTeeVector: LeftDownTeeVector,
    	LeftDownVectorBar: LeftDownVectorBar,
    	LeftDownVector: LeftDownVector,
    	LeftFloor: LeftFloor,
    	leftharpoondown: leftharpoondown,
    	leftharpoonup: leftharpoonup,
    	leftleftarrows: leftleftarrows,
    	leftrightarrow: leftrightarrow,
    	LeftRightArrow: LeftRightArrow,
    	Leftrightarrow: Leftrightarrow,
    	leftrightarrows: leftrightarrows,
    	leftrightharpoons: leftrightharpoons,
    	leftrightsquigarrow: leftrightsquigarrow,
    	LeftRightVector: LeftRightVector,
    	LeftTeeArrow: LeftTeeArrow,
    	LeftTee: LeftTee,
    	LeftTeeVector: LeftTeeVector,
    	leftthreetimes: leftthreetimes,
    	LeftTriangleBar: LeftTriangleBar,
    	LeftTriangle: LeftTriangle,
    	LeftTriangleEqual: LeftTriangleEqual,
    	LeftUpDownVector: LeftUpDownVector,
    	LeftUpTeeVector: LeftUpTeeVector,
    	LeftUpVectorBar: LeftUpVectorBar,
    	LeftUpVector: LeftUpVector,
    	LeftVectorBar: LeftVectorBar,
    	LeftVector: LeftVector,
    	lEg: lEg,
    	leg: leg,
    	leq: leq,
    	leqq: leqq,
    	leqslant: leqslant,
    	lescc: lescc,
    	les: les,
    	lesdot: lesdot,
    	lesdoto: lesdoto,
    	lesdotor: lesdotor,
    	lesg: lesg,
    	lesges: lesges,
    	lessapprox: lessapprox,
    	lessdot: lessdot,
    	lesseqgtr: lesseqgtr,
    	lesseqqgtr: lesseqqgtr,
    	LessEqualGreater: LessEqualGreater,
    	LessFullEqual: LessFullEqual,
    	LessGreater: LessGreater,
    	lessgtr: lessgtr,
    	LessLess: LessLess,
    	lesssim: lesssim,
    	LessSlantEqual: LessSlantEqual,
    	LessTilde: LessTilde,
    	lfisht: lfisht,
    	lfloor: lfloor,
    	Lfr: Lfr,
    	lfr: lfr,
    	lg: lg,
    	lgE: lgE,
    	lHar: lHar,
    	lhard: lhard,
    	lharu: lharu,
    	lharul: lharul,
    	lhblk: lhblk,
    	LJcy: LJcy,
    	ljcy: ljcy,
    	llarr: llarr,
    	ll: ll,
    	Ll: Ll,
    	llcorner: llcorner,
    	Lleftarrow: Lleftarrow,
    	llhard: llhard,
    	lltri: lltri,
    	Lmidot: Lmidot,
    	lmidot: lmidot,
    	lmoustache: lmoustache,
    	lmoust: lmoust,
    	lnap: lnap,
    	lnapprox: lnapprox,
    	lne: lne,
    	lnE: lnE,
    	lneq: lneq,
    	lneqq: lneqq,
    	lnsim: lnsim,
    	loang: loang,
    	loarr: loarr,
    	lobrk: lobrk,
    	longleftarrow: longleftarrow,
    	LongLeftArrow: LongLeftArrow,
    	Longleftarrow: Longleftarrow,
    	longleftrightarrow: longleftrightarrow,
    	LongLeftRightArrow: LongLeftRightArrow,
    	Longleftrightarrow: Longleftrightarrow,
    	longmapsto: longmapsto,
    	longrightarrow: longrightarrow,
    	LongRightArrow: LongRightArrow,
    	Longrightarrow: Longrightarrow,
    	looparrowleft: looparrowleft,
    	looparrowright: looparrowright,
    	lopar: lopar,
    	Lopf: Lopf,
    	lopf: lopf,
    	loplus: loplus,
    	lotimes: lotimes,
    	lowast: lowast,
    	lowbar: lowbar,
    	LowerLeftArrow: LowerLeftArrow,
    	LowerRightArrow: LowerRightArrow,
    	loz: loz,
    	lozenge: lozenge,
    	lozf: lozf,
    	lpar: lpar,
    	lparlt: lparlt,
    	lrarr: lrarr,
    	lrcorner: lrcorner,
    	lrhar: lrhar,
    	lrhard: lrhard,
    	lrm: lrm,
    	lrtri: lrtri,
    	lsaquo: lsaquo,
    	lscr: lscr,
    	Lscr: Lscr,
    	lsh: lsh,
    	Lsh: Lsh,
    	lsim: lsim,
    	lsime: lsime,
    	lsimg: lsimg,
    	lsqb: lsqb,
    	lsquo: lsquo,
    	lsquor: lsquor,
    	Lstrok: Lstrok,
    	lstrok: lstrok,
    	ltcc: ltcc,
    	ltcir: ltcir,
    	lt: lt$2,
    	LT: LT$1,
    	Lt: Lt,
    	ltdot: ltdot,
    	lthree: lthree,
    	ltimes: ltimes,
    	ltlarr: ltlarr,
    	ltquest: ltquest,
    	ltri: ltri,
    	ltrie: ltrie,
    	ltrif: ltrif,
    	ltrPar: ltrPar,
    	lurdshar: lurdshar,
    	luruhar: luruhar,
    	lvertneqq: lvertneqq,
    	lvnE: lvnE,
    	macr: macr$1,
    	male: male,
    	malt: malt,
    	maltese: maltese,
    	"Map": "⤅",
    	map: map,
    	mapsto: mapsto,
    	mapstodown: mapstodown,
    	mapstoleft: mapstoleft,
    	mapstoup: mapstoup,
    	marker: marker,
    	mcomma: mcomma,
    	Mcy: Mcy,
    	mcy: mcy,
    	mdash: mdash,
    	mDDot: mDDot,
    	measuredangle: measuredangle,
    	MediumSpace: MediumSpace,
    	Mellintrf: Mellintrf,
    	Mfr: Mfr,
    	mfr: mfr,
    	mho: mho,
    	micro: micro$1,
    	midast: midast,
    	midcir: midcir,
    	mid: mid,
    	middot: middot$1,
    	minusb: minusb,
    	minus: minus,
    	minusd: minusd,
    	minusdu: minusdu,
    	MinusPlus: MinusPlus,
    	mlcp: mlcp,
    	mldr: mldr,
    	mnplus: mnplus,
    	models: models,
    	Mopf: Mopf,
    	mopf: mopf,
    	mp: mp,
    	mscr: mscr,
    	Mscr: Mscr,
    	mstpos: mstpos,
    	Mu: Mu,
    	mu: mu,
    	multimap: multimap,
    	mumap: mumap,
    	nabla: nabla,
    	Nacute: Nacute,
    	nacute: nacute,
    	nang: nang,
    	nap: nap,
    	napE: napE,
    	napid: napid,
    	napos: napos,
    	napprox: napprox,
    	natural: natural,
    	naturals: naturals,
    	natur: natur,
    	nbsp: nbsp$1,
    	nbump: nbump,
    	nbumpe: nbumpe,
    	ncap: ncap,
    	Ncaron: Ncaron,
    	ncaron: ncaron,
    	Ncedil: Ncedil,
    	ncedil: ncedil,
    	ncong: ncong,
    	ncongdot: ncongdot,
    	ncup: ncup,
    	Ncy: Ncy,
    	ncy: ncy,
    	ndash: ndash,
    	nearhk: nearhk,
    	nearr: nearr,
    	neArr: neArr,
    	nearrow: nearrow,
    	ne: ne,
    	nedot: nedot,
    	NegativeMediumSpace: NegativeMediumSpace,
    	NegativeThickSpace: NegativeThickSpace,
    	NegativeThinSpace: NegativeThinSpace,
    	NegativeVeryThinSpace: NegativeVeryThinSpace,
    	nequiv: nequiv,
    	nesear: nesear,
    	nesim: nesim,
    	NestedGreaterGreater: NestedGreaterGreater,
    	NestedLessLess: NestedLessLess,
    	NewLine: NewLine,
    	nexist: nexist,
    	nexists: nexists,
    	Nfr: Nfr,
    	nfr: nfr,
    	ngE: ngE,
    	nge: nge,
    	ngeq: ngeq,
    	ngeqq: ngeqq,
    	ngeqslant: ngeqslant,
    	nges: nges,
    	nGg: nGg,
    	ngsim: ngsim,
    	nGt: nGt,
    	ngt: ngt,
    	ngtr: ngtr,
    	nGtv: nGtv,
    	nharr: nharr,
    	nhArr: nhArr,
    	nhpar: nhpar,
    	ni: ni,
    	nis: nis,
    	nisd: nisd,
    	niv: niv,
    	NJcy: NJcy,
    	njcy: njcy,
    	nlarr: nlarr,
    	nlArr: nlArr,
    	nldr: nldr,
    	nlE: nlE,
    	nle: nle,
    	nleftarrow: nleftarrow,
    	nLeftarrow: nLeftarrow,
    	nleftrightarrow: nleftrightarrow,
    	nLeftrightarrow: nLeftrightarrow,
    	nleq: nleq,
    	nleqq: nleqq,
    	nleqslant: nleqslant,
    	nles: nles,
    	nless: nless,
    	nLl: nLl,
    	nlsim: nlsim,
    	nLt: nLt,
    	nlt: nlt,
    	nltri: nltri,
    	nltrie: nltrie,
    	nLtv: nLtv,
    	nmid: nmid,
    	NoBreak: NoBreak,
    	NonBreakingSpace: NonBreakingSpace,
    	nopf: nopf,
    	Nopf: Nopf,
    	Not: Not,
    	not: not$1,
    	NotCongruent: NotCongruent,
    	NotCupCap: NotCupCap,
    	NotDoubleVerticalBar: NotDoubleVerticalBar,
    	NotElement: NotElement,
    	NotEqual: NotEqual,
    	NotEqualTilde: NotEqualTilde,
    	NotExists: NotExists,
    	NotGreater: NotGreater,
    	NotGreaterEqual: NotGreaterEqual,
    	NotGreaterFullEqual: NotGreaterFullEqual,
    	NotGreaterGreater: NotGreaterGreater,
    	NotGreaterLess: NotGreaterLess,
    	NotGreaterSlantEqual: NotGreaterSlantEqual,
    	NotGreaterTilde: NotGreaterTilde,
    	NotHumpDownHump: NotHumpDownHump,
    	NotHumpEqual: NotHumpEqual,
    	notin: notin,
    	notindot: notindot,
    	notinE: notinE,
    	notinva: notinva,
    	notinvb: notinvb,
    	notinvc: notinvc,
    	NotLeftTriangleBar: NotLeftTriangleBar,
    	NotLeftTriangle: NotLeftTriangle,
    	NotLeftTriangleEqual: NotLeftTriangleEqual,
    	NotLess: NotLess,
    	NotLessEqual: NotLessEqual,
    	NotLessGreater: NotLessGreater,
    	NotLessLess: NotLessLess,
    	NotLessSlantEqual: NotLessSlantEqual,
    	NotLessTilde: NotLessTilde,
    	NotNestedGreaterGreater: NotNestedGreaterGreater,
    	NotNestedLessLess: NotNestedLessLess,
    	notni: notni,
    	notniva: notniva,
    	notnivb: notnivb,
    	notnivc: notnivc,
    	NotPrecedes: NotPrecedes,
    	NotPrecedesEqual: NotPrecedesEqual,
    	NotPrecedesSlantEqual: NotPrecedesSlantEqual,
    	NotReverseElement: NotReverseElement,
    	NotRightTriangleBar: NotRightTriangleBar,
    	NotRightTriangle: NotRightTriangle,
    	NotRightTriangleEqual: NotRightTriangleEqual,
    	NotSquareSubset: NotSquareSubset,
    	NotSquareSubsetEqual: NotSquareSubsetEqual,
    	NotSquareSuperset: NotSquareSuperset,
    	NotSquareSupersetEqual: NotSquareSupersetEqual,
    	NotSubset: NotSubset,
    	NotSubsetEqual: NotSubsetEqual,
    	NotSucceeds: NotSucceeds,
    	NotSucceedsEqual: NotSucceedsEqual,
    	NotSucceedsSlantEqual: NotSucceedsSlantEqual,
    	NotSucceedsTilde: NotSucceedsTilde,
    	NotSuperset: NotSuperset,
    	NotSupersetEqual: NotSupersetEqual,
    	NotTilde: NotTilde,
    	NotTildeEqual: NotTildeEqual,
    	NotTildeFullEqual: NotTildeFullEqual,
    	NotTildeTilde: NotTildeTilde,
    	NotVerticalBar: NotVerticalBar,
    	nparallel: nparallel,
    	npar: npar,
    	nparsl: nparsl,
    	npart: npart,
    	npolint: npolint,
    	npr: npr,
    	nprcue: nprcue,
    	nprec: nprec,
    	npreceq: npreceq,
    	npre: npre,
    	nrarrc: nrarrc,
    	nrarr: nrarr,
    	nrArr: nrArr,
    	nrarrw: nrarrw,
    	nrightarrow: nrightarrow,
    	nRightarrow: nRightarrow,
    	nrtri: nrtri,
    	nrtrie: nrtrie,
    	nsc: nsc,
    	nsccue: nsccue,
    	nsce: nsce,
    	Nscr: Nscr,
    	nscr: nscr,
    	nshortmid: nshortmid,
    	nshortparallel: nshortparallel,
    	nsim: nsim,
    	nsime: nsime,
    	nsimeq: nsimeq,
    	nsmid: nsmid,
    	nspar: nspar,
    	nsqsube: nsqsube,
    	nsqsupe: nsqsupe,
    	nsub: nsub,
    	nsubE: nsubE,
    	nsube: nsube,
    	nsubset: nsubset,
    	nsubseteq: nsubseteq,
    	nsubseteqq: nsubseteqq,
    	nsucc: nsucc,
    	nsucceq: nsucceq,
    	nsup: nsup,
    	nsupE: nsupE,
    	nsupe: nsupe,
    	nsupset: nsupset,
    	nsupseteq: nsupseteq,
    	nsupseteqq: nsupseteqq,
    	ntgl: ntgl,
    	Ntilde: Ntilde$1,
    	ntilde: ntilde$1,
    	ntlg: ntlg,
    	ntriangleleft: ntriangleleft,
    	ntrianglelefteq: ntrianglelefteq,
    	ntriangleright: ntriangleright,
    	ntrianglerighteq: ntrianglerighteq,
    	Nu: Nu,
    	nu: nu,
    	num: num,
    	numero: numero,
    	numsp: numsp,
    	nvap: nvap,
    	nvdash: nvdash,
    	nvDash: nvDash,
    	nVdash: nVdash,
    	nVDash: nVDash,
    	nvge: nvge,
    	nvgt: nvgt,
    	nvHarr: nvHarr,
    	nvinfin: nvinfin,
    	nvlArr: nvlArr,
    	nvle: nvle,
    	nvlt: nvlt,
    	nvltrie: nvltrie,
    	nvrArr: nvrArr,
    	nvrtrie: nvrtrie,
    	nvsim: nvsim,
    	nwarhk: nwarhk,
    	nwarr: nwarr,
    	nwArr: nwArr,
    	nwarrow: nwarrow,
    	nwnear: nwnear,
    	Oacute: Oacute$1,
    	oacute: oacute$1,
    	oast: oast,
    	Ocirc: Ocirc$1,
    	ocirc: ocirc$1,
    	ocir: ocir,
    	Ocy: Ocy,
    	ocy: ocy,
    	odash: odash,
    	Odblac: Odblac,
    	odblac: odblac,
    	odiv: odiv,
    	odot: odot,
    	odsold: odsold,
    	OElig: OElig,
    	oelig: oelig,
    	ofcir: ofcir,
    	Ofr: Ofr,
    	ofr: ofr,
    	ogon: ogon,
    	Ograve: Ograve$1,
    	ograve: ograve$1,
    	ogt: ogt,
    	ohbar: ohbar,
    	ohm: ohm,
    	oint: oint,
    	olarr: olarr,
    	olcir: olcir,
    	olcross: olcross,
    	oline: oline,
    	olt: olt,
    	Omacr: Omacr,
    	omacr: omacr,
    	Omega: Omega,
    	omega: omega,
    	Omicron: Omicron,
    	omicron: omicron,
    	omid: omid,
    	ominus: ominus,
    	Oopf: Oopf,
    	oopf: oopf,
    	opar: opar,
    	OpenCurlyDoubleQuote: OpenCurlyDoubleQuote,
    	OpenCurlyQuote: OpenCurlyQuote,
    	operp: operp,
    	oplus: oplus,
    	orarr: orarr,
    	Or: Or,
    	or: or,
    	ord: ord,
    	order: order,
    	orderof: orderof,
    	ordf: ordf$1,
    	ordm: ordm$1,
    	origof: origof,
    	oror: oror,
    	orslope: orslope,
    	orv: orv,
    	oS: oS,
    	Oscr: Oscr,
    	oscr: oscr,
    	Oslash: Oslash$1,
    	oslash: oslash$1,
    	osol: osol,
    	Otilde: Otilde$1,
    	otilde: otilde$1,
    	otimesas: otimesas,
    	Otimes: Otimes,
    	otimes: otimes,
    	Ouml: Ouml$1,
    	ouml: ouml$1,
    	ovbar: ovbar,
    	OverBar: OverBar,
    	OverBrace: OverBrace,
    	OverBracket: OverBracket,
    	OverParenthesis: OverParenthesis,
    	para: para$1,
    	parallel: parallel,
    	par: par,
    	parsim: parsim,
    	parsl: parsl,
    	part: part,
    	PartialD: PartialD,
    	Pcy: Pcy,
    	pcy: pcy,
    	percnt: percnt,
    	period: period,
    	permil: permil,
    	perp: perp,
    	pertenk: pertenk,
    	Pfr: Pfr,
    	pfr: pfr,
    	Phi: Phi,
    	phi: phi,
    	phiv: phiv,
    	phmmat: phmmat,
    	phone: phone,
    	Pi: Pi,
    	pi: pi,
    	pitchfork: pitchfork,
    	piv: piv,
    	planck: planck,
    	planckh: planckh,
    	plankv: plankv,
    	plusacir: plusacir,
    	plusb: plusb,
    	pluscir: pluscir,
    	plus: plus,
    	plusdo: plusdo,
    	plusdu: plusdu,
    	pluse: pluse,
    	PlusMinus: PlusMinus,
    	plusmn: plusmn$1,
    	plussim: plussim,
    	plustwo: plustwo,
    	pm: pm,
    	Poincareplane: Poincareplane,
    	pointint: pointint,
    	popf: popf,
    	Popf: Popf,
    	pound: pound$1,
    	prap: prap,
    	Pr: Pr,
    	pr: pr,
    	prcue: prcue,
    	precapprox: precapprox,
    	prec: prec,
    	preccurlyeq: preccurlyeq,
    	Precedes: Precedes,
    	PrecedesEqual: PrecedesEqual,
    	PrecedesSlantEqual: PrecedesSlantEqual,
    	PrecedesTilde: PrecedesTilde,
    	preceq: preceq,
    	precnapprox: precnapprox,
    	precneqq: precneqq,
    	precnsim: precnsim,
    	pre: pre,
    	prE: prE,
    	precsim: precsim,
    	prime: prime,
    	Prime: Prime,
    	primes: primes,
    	prnap: prnap,
    	prnE: prnE,
    	prnsim: prnsim,
    	prod: prod,
    	Product: Product,
    	profalar: profalar,
    	profline: profline,
    	profsurf: profsurf,
    	prop: prop,
    	Proportional: Proportional,
    	Proportion: Proportion,
    	propto: propto,
    	prsim: prsim,
    	prurel: prurel,
    	Pscr: Pscr,
    	pscr: pscr,
    	Psi: Psi,
    	psi: psi,
    	puncsp: puncsp,
    	Qfr: Qfr,
    	qfr: qfr,
    	qint: qint,
    	qopf: qopf,
    	Qopf: Qopf,
    	qprime: qprime,
    	Qscr: Qscr,
    	qscr: qscr,
    	quaternions: quaternions,
    	quatint: quatint,
    	quest: quest,
    	questeq: questeq,
    	quot: quot$2,
    	QUOT: QUOT$1,
    	rAarr: rAarr,
    	race: race,
    	Racute: Racute,
    	racute: racute,
    	radic: radic,
    	raemptyv: raemptyv,
    	rang: rang,
    	Rang: Rang,
    	rangd: rangd,
    	range: range,
    	rangle: rangle,
    	raquo: raquo$1,
    	rarrap: rarrap,
    	rarrb: rarrb,
    	rarrbfs: rarrbfs,
    	rarrc: rarrc,
    	rarr: rarr,
    	Rarr: Rarr,
    	rArr: rArr,
    	rarrfs: rarrfs,
    	rarrhk: rarrhk,
    	rarrlp: rarrlp,
    	rarrpl: rarrpl,
    	rarrsim: rarrsim,
    	Rarrtl: Rarrtl,
    	rarrtl: rarrtl,
    	rarrw: rarrw,
    	ratail: ratail,
    	rAtail: rAtail,
    	ratio: ratio,
    	rationals: rationals,
    	rbarr: rbarr,
    	rBarr: rBarr,
    	RBarr: RBarr,
    	rbbrk: rbbrk,
    	rbrace: rbrace,
    	rbrack: rbrack,
    	rbrke: rbrke,
    	rbrksld: rbrksld,
    	rbrkslu: rbrkslu,
    	Rcaron: Rcaron,
    	rcaron: rcaron,
    	Rcedil: Rcedil,
    	rcedil: rcedil,
    	rceil: rceil,
    	rcub: rcub,
    	Rcy: Rcy,
    	rcy: rcy,
    	rdca: rdca,
    	rdldhar: rdldhar,
    	rdquo: rdquo,
    	rdquor: rdquor,
    	rdsh: rdsh,
    	real: real,
    	realine: realine,
    	realpart: realpart,
    	reals: reals,
    	Re: Re,
    	rect: rect,
    	reg: reg$1,
    	REG: REG$1,
    	ReverseElement: ReverseElement,
    	ReverseEquilibrium: ReverseEquilibrium,
    	ReverseUpEquilibrium: ReverseUpEquilibrium,
    	rfisht: rfisht,
    	rfloor: rfloor,
    	rfr: rfr,
    	Rfr: Rfr,
    	rHar: rHar,
    	rhard: rhard,
    	rharu: rharu,
    	rharul: rharul,
    	Rho: Rho,
    	rho: rho,
    	rhov: rhov,
    	RightAngleBracket: RightAngleBracket,
    	RightArrowBar: RightArrowBar,
    	rightarrow: rightarrow,
    	RightArrow: RightArrow,
    	Rightarrow: Rightarrow,
    	RightArrowLeftArrow: RightArrowLeftArrow,
    	rightarrowtail: rightarrowtail,
    	RightCeiling: RightCeiling,
    	RightDoubleBracket: RightDoubleBracket,
    	RightDownTeeVector: RightDownTeeVector,
    	RightDownVectorBar: RightDownVectorBar,
    	RightDownVector: RightDownVector,
    	RightFloor: RightFloor,
    	rightharpoondown: rightharpoondown,
    	rightharpoonup: rightharpoonup,
    	rightleftarrows: rightleftarrows,
    	rightleftharpoons: rightleftharpoons,
    	rightrightarrows: rightrightarrows,
    	rightsquigarrow: rightsquigarrow,
    	RightTeeArrow: RightTeeArrow,
    	RightTee: RightTee,
    	RightTeeVector: RightTeeVector,
    	rightthreetimes: rightthreetimes,
    	RightTriangleBar: RightTriangleBar,
    	RightTriangle: RightTriangle,
    	RightTriangleEqual: RightTriangleEqual,
    	RightUpDownVector: RightUpDownVector,
    	RightUpTeeVector: RightUpTeeVector,
    	RightUpVectorBar: RightUpVectorBar,
    	RightUpVector: RightUpVector,
    	RightVectorBar: RightVectorBar,
    	RightVector: RightVector,
    	ring: ring,
    	risingdotseq: risingdotseq,
    	rlarr: rlarr,
    	rlhar: rlhar,
    	rlm: rlm,
    	rmoustache: rmoustache,
    	rmoust: rmoust,
    	rnmid: rnmid,
    	roang: roang,
    	roarr: roarr,
    	robrk: robrk,
    	ropar: ropar,
    	ropf: ropf,
    	Ropf: Ropf,
    	roplus: roplus,
    	rotimes: rotimes,
    	RoundImplies: RoundImplies,
    	rpar: rpar,
    	rpargt: rpargt,
    	rppolint: rppolint,
    	rrarr: rrarr,
    	Rrightarrow: Rrightarrow,
    	rsaquo: rsaquo,
    	rscr: rscr,
    	Rscr: Rscr,
    	rsh: rsh,
    	Rsh: Rsh,
    	rsqb: rsqb,
    	rsquo: rsquo,
    	rsquor: rsquor,
    	rthree: rthree,
    	rtimes: rtimes,
    	rtri: rtri,
    	rtrie: rtrie,
    	rtrif: rtrif,
    	rtriltri: rtriltri,
    	RuleDelayed: RuleDelayed,
    	ruluhar: ruluhar,
    	rx: rx,
    	Sacute: Sacute,
    	sacute: sacute,
    	sbquo: sbquo,
    	scap: scap,
    	Scaron: Scaron,
    	scaron: scaron,
    	Sc: Sc,
    	sc: sc,
    	sccue: sccue,
    	sce: sce,
    	scE: scE,
    	Scedil: Scedil,
    	scedil: scedil,
    	Scirc: Scirc,
    	scirc: scirc,
    	scnap: scnap,
    	scnE: scnE,
    	scnsim: scnsim,
    	scpolint: scpolint,
    	scsim: scsim,
    	Scy: Scy,
    	scy: scy,
    	sdotb: sdotb,
    	sdot: sdot,
    	sdote: sdote,
    	searhk: searhk,
    	searr: searr,
    	seArr: seArr,
    	searrow: searrow,
    	sect: sect$1,
    	semi: semi,
    	seswar: seswar,
    	setminus: setminus,
    	setmn: setmn,
    	sext: sext,
    	Sfr: Sfr,
    	sfr: sfr,
    	sfrown: sfrown,
    	sharp: sharp,
    	SHCHcy: SHCHcy,
    	shchcy: shchcy,
    	SHcy: SHcy,
    	shcy: shcy,
    	ShortDownArrow: ShortDownArrow,
    	ShortLeftArrow: ShortLeftArrow,
    	shortmid: shortmid,
    	shortparallel: shortparallel,
    	ShortRightArrow: ShortRightArrow,
    	ShortUpArrow: ShortUpArrow,
    	shy: shy$1,
    	Sigma: Sigma,
    	sigma: sigma,
    	sigmaf: sigmaf,
    	sigmav: sigmav,
    	sim: sim,
    	simdot: simdot,
    	sime: sime,
    	simeq: simeq,
    	simg: simg,
    	simgE: simgE,
    	siml: siml,
    	simlE: simlE,
    	simne: simne,
    	simplus: simplus,
    	simrarr: simrarr,
    	slarr: slarr,
    	SmallCircle: SmallCircle,
    	smallsetminus: smallsetminus,
    	smashp: smashp,
    	smeparsl: smeparsl,
    	smid: smid,
    	smile: smile,
    	smt: smt,
    	smte: smte,
    	smtes: smtes,
    	SOFTcy: SOFTcy,
    	softcy: softcy,
    	solbar: solbar,
    	solb: solb,
    	sol: sol,
    	Sopf: Sopf,
    	sopf: sopf,
    	spades: spades,
    	spadesuit: spadesuit,
    	spar: spar,
    	sqcap: sqcap,
    	sqcaps: sqcaps,
    	sqcup: sqcup,
    	sqcups: sqcups,
    	Sqrt: Sqrt,
    	sqsub: sqsub,
    	sqsube: sqsube,
    	sqsubset: sqsubset,
    	sqsubseteq: sqsubseteq,
    	sqsup: sqsup,
    	sqsupe: sqsupe,
    	sqsupset: sqsupset,
    	sqsupseteq: sqsupseteq,
    	square: square,
    	Square: Square,
    	SquareIntersection: SquareIntersection,
    	SquareSubset: SquareSubset,
    	SquareSubsetEqual: SquareSubsetEqual,
    	SquareSuperset: SquareSuperset,
    	SquareSupersetEqual: SquareSupersetEqual,
    	SquareUnion: SquareUnion,
    	squarf: squarf,
    	squ: squ,
    	squf: squf,
    	srarr: srarr,
    	Sscr: Sscr,
    	sscr: sscr,
    	ssetmn: ssetmn,
    	ssmile: ssmile,
    	sstarf: sstarf,
    	Star: Star,
    	star: star,
    	starf: starf,
    	straightepsilon: straightepsilon,
    	straightphi: straightphi,
    	strns: strns,
    	sub: sub,
    	Sub: Sub,
    	subdot: subdot,
    	subE: subE,
    	sube: sube,
    	subedot: subedot,
    	submult: submult,
    	subnE: subnE,
    	subne: subne,
    	subplus: subplus,
    	subrarr: subrarr,
    	subset: subset,
    	Subset: Subset,
    	subseteq: subseteq,
    	subseteqq: subseteqq,
    	SubsetEqual: SubsetEqual,
    	subsetneq: subsetneq,
    	subsetneqq: subsetneqq,
    	subsim: subsim,
    	subsub: subsub,
    	subsup: subsup,
    	succapprox: succapprox,
    	succ: succ,
    	succcurlyeq: succcurlyeq,
    	Succeeds: Succeeds,
    	SucceedsEqual: SucceedsEqual,
    	SucceedsSlantEqual: SucceedsSlantEqual,
    	SucceedsTilde: SucceedsTilde,
    	succeq: succeq,
    	succnapprox: succnapprox,
    	succneqq: succneqq,
    	succnsim: succnsim,
    	succsim: succsim,
    	SuchThat: SuchThat,
    	sum: sum,
    	Sum: Sum,
    	sung: sung,
    	sup1: sup1$1,
    	sup2: sup2$1,
    	sup3: sup3$1,
    	sup: sup,
    	Sup: Sup,
    	supdot: supdot,
    	supdsub: supdsub,
    	supE: supE,
    	supe: supe,
    	supedot: supedot,
    	Superset: Superset,
    	SupersetEqual: SupersetEqual,
    	suphsol: suphsol,
    	suphsub: suphsub,
    	suplarr: suplarr,
    	supmult: supmult,
    	supnE: supnE,
    	supne: supne,
    	supplus: supplus,
    	supset: supset,
    	Supset: Supset,
    	supseteq: supseteq,
    	supseteqq: supseteqq,
    	supsetneq: supsetneq,
    	supsetneqq: supsetneqq,
    	supsim: supsim,
    	supsub: supsub,
    	supsup: supsup,
    	swarhk: swarhk,
    	swarr: swarr,
    	swArr: swArr,
    	swarrow: swarrow,
    	swnwar: swnwar,
    	szlig: szlig$1,
    	Tab: Tab,
    	target: target,
    	Tau: Tau,
    	tau: tau,
    	tbrk: tbrk,
    	Tcaron: Tcaron,
    	tcaron: tcaron,
    	Tcedil: Tcedil,
    	tcedil: tcedil,
    	Tcy: Tcy,
    	tcy: tcy,
    	tdot: tdot,
    	telrec: telrec,
    	Tfr: Tfr,
    	tfr: tfr,
    	there4: there4,
    	therefore: therefore,
    	Therefore: Therefore,
    	Theta: Theta,
    	theta: theta,
    	thetasym: thetasym,
    	thetav: thetav,
    	thickapprox: thickapprox,
    	thicksim: thicksim,
    	ThickSpace: ThickSpace,
    	ThinSpace: ThinSpace,
    	thinsp: thinsp,
    	thkap: thkap,
    	thksim: thksim,
    	THORN: THORN$1,
    	thorn: thorn$1,
    	tilde: tilde,
    	Tilde: Tilde,
    	TildeEqual: TildeEqual,
    	TildeFullEqual: TildeFullEqual,
    	TildeTilde: TildeTilde,
    	timesbar: timesbar,
    	timesb: timesb,
    	times: times$1,
    	timesd: timesd,
    	tint: tint,
    	toea: toea,
    	topbot: topbot,
    	topcir: topcir,
    	top: top,
    	Topf: Topf,
    	topf: topf,
    	topfork: topfork,
    	tosa: tosa,
    	tprime: tprime,
    	trade: trade,
    	TRADE: TRADE,
    	triangle: triangle,
    	triangledown: triangledown,
    	triangleleft: triangleleft,
    	trianglelefteq: trianglelefteq,
    	triangleq: triangleq,
    	triangleright: triangleright,
    	trianglerighteq: trianglerighteq,
    	tridot: tridot,
    	trie: trie,
    	triminus: triminus,
    	TripleDot: TripleDot,
    	triplus: triplus,
    	trisb: trisb,
    	tritime: tritime,
    	trpezium: trpezium,
    	Tscr: Tscr,
    	tscr: tscr,
    	TScy: TScy,
    	tscy: tscy,
    	TSHcy: TSHcy,
    	tshcy: tshcy,
    	Tstrok: Tstrok,
    	tstrok: tstrok,
    	twixt: twixt,
    	twoheadleftarrow: twoheadleftarrow,
    	twoheadrightarrow: twoheadrightarrow,
    	Uacute: Uacute$1,
    	uacute: uacute$1,
    	uarr: uarr,
    	Uarr: Uarr,
    	uArr: uArr,
    	Uarrocir: Uarrocir,
    	Ubrcy: Ubrcy,
    	ubrcy: ubrcy,
    	Ubreve: Ubreve,
    	ubreve: ubreve,
    	Ucirc: Ucirc$1,
    	ucirc: ucirc$1,
    	Ucy: Ucy,
    	ucy: ucy,
    	udarr: udarr,
    	Udblac: Udblac,
    	udblac: udblac,
    	udhar: udhar,
    	ufisht: ufisht,
    	Ufr: Ufr,
    	ufr: ufr,
    	Ugrave: Ugrave$1,
    	ugrave: ugrave$1,
    	uHar: uHar,
    	uharl: uharl,
    	uharr: uharr,
    	uhblk: uhblk,
    	ulcorn: ulcorn,
    	ulcorner: ulcorner,
    	ulcrop: ulcrop,
    	ultri: ultri,
    	Umacr: Umacr,
    	umacr: umacr,
    	uml: uml$1,
    	UnderBar: UnderBar,
    	UnderBrace: UnderBrace,
    	UnderBracket: UnderBracket,
    	UnderParenthesis: UnderParenthesis,
    	Union: Union,
    	UnionPlus: UnionPlus,
    	Uogon: Uogon,
    	uogon: uogon,
    	Uopf: Uopf,
    	uopf: uopf,
    	UpArrowBar: UpArrowBar,
    	uparrow: uparrow,
    	UpArrow: UpArrow,
    	Uparrow: Uparrow,
    	UpArrowDownArrow: UpArrowDownArrow,
    	updownarrow: updownarrow,
    	UpDownArrow: UpDownArrow,
    	Updownarrow: Updownarrow,
    	UpEquilibrium: UpEquilibrium,
    	upharpoonleft: upharpoonleft,
    	upharpoonright: upharpoonright,
    	uplus: uplus,
    	UpperLeftArrow: UpperLeftArrow,
    	UpperRightArrow: UpperRightArrow,
    	upsi: upsi,
    	Upsi: Upsi,
    	upsih: upsih,
    	Upsilon: Upsilon,
    	upsilon: upsilon,
    	UpTeeArrow: UpTeeArrow,
    	UpTee: UpTee,
    	upuparrows: upuparrows,
    	urcorn: urcorn,
    	urcorner: urcorner,
    	urcrop: urcrop,
    	Uring: Uring,
    	uring: uring,
    	urtri: urtri,
    	Uscr: Uscr,
    	uscr: uscr,
    	utdot: utdot,
    	Utilde: Utilde,
    	utilde: utilde,
    	utri: utri,
    	utrif: utrif,
    	uuarr: uuarr,
    	Uuml: Uuml$1,
    	uuml: uuml$1,
    	uwangle: uwangle,
    	vangrt: vangrt,
    	varepsilon: varepsilon,
    	varkappa: varkappa,
    	varnothing: varnothing,
    	varphi: varphi,
    	varpi: varpi,
    	varpropto: varpropto,
    	varr: varr,
    	vArr: vArr,
    	varrho: varrho,
    	varsigma: varsigma,
    	varsubsetneq: varsubsetneq,
    	varsubsetneqq: varsubsetneqq,
    	varsupsetneq: varsupsetneq,
    	varsupsetneqq: varsupsetneqq,
    	vartheta: vartheta,
    	vartriangleleft: vartriangleleft,
    	vartriangleright: vartriangleright,
    	vBar: vBar,
    	Vbar: Vbar,
    	vBarv: vBarv,
    	Vcy: Vcy,
    	vcy: vcy,
    	vdash: vdash,
    	vDash: vDash,
    	Vdash: Vdash,
    	VDash: VDash,
    	Vdashl: Vdashl,
    	veebar: veebar,
    	vee: vee,
    	Vee: Vee,
    	veeeq: veeeq,
    	vellip: vellip,
    	verbar: verbar,
    	Verbar: Verbar,
    	vert: vert,
    	Vert: Vert,
    	VerticalBar: VerticalBar,
    	VerticalLine: VerticalLine,
    	VerticalSeparator: VerticalSeparator,
    	VerticalTilde: VerticalTilde,
    	VeryThinSpace: VeryThinSpace,
    	Vfr: Vfr,
    	vfr: vfr,
    	vltri: vltri,
    	vnsub: vnsub,
    	vnsup: vnsup,
    	Vopf: Vopf,
    	vopf: vopf,
    	vprop: vprop,
    	vrtri: vrtri,
    	Vscr: Vscr,
    	vscr: vscr,
    	vsubnE: vsubnE,
    	vsubne: vsubne,
    	vsupnE: vsupnE,
    	vsupne: vsupne,
    	Vvdash: Vvdash,
    	vzigzag: vzigzag,
    	Wcirc: Wcirc,
    	wcirc: wcirc,
    	wedbar: wedbar,
    	wedge: wedge,
    	Wedge: Wedge,
    	wedgeq: wedgeq,
    	weierp: weierp,
    	Wfr: Wfr,
    	wfr: wfr,
    	Wopf: Wopf,
    	wopf: wopf,
    	wp: wp,
    	wr: wr,
    	wreath: wreath,
    	Wscr: Wscr,
    	wscr: wscr,
    	xcap: xcap,
    	xcirc: xcirc,
    	xcup: xcup,
    	xdtri: xdtri,
    	Xfr: Xfr,
    	xfr: xfr,
    	xharr: xharr,
    	xhArr: xhArr,
    	Xi: Xi,
    	xi: xi,
    	xlarr: xlarr,
    	xlArr: xlArr,
    	xmap: xmap,
    	xnis: xnis,
    	xodot: xodot,
    	Xopf: Xopf,
    	xopf: xopf,
    	xoplus: xoplus,
    	xotime: xotime,
    	xrarr: xrarr,
    	xrArr: xrArr,
    	Xscr: Xscr,
    	xscr: xscr,
    	xsqcup: xsqcup,
    	xuplus: xuplus,
    	xutri: xutri,
    	xvee: xvee,
    	xwedge: xwedge,
    	Yacute: Yacute$1,
    	yacute: yacute$1,
    	YAcy: YAcy,
    	yacy: yacy,
    	Ycirc: Ycirc,
    	ycirc: ycirc,
    	Ycy: Ycy,
    	ycy: ycy,
    	yen: yen$1,
    	Yfr: Yfr,
    	yfr: yfr,
    	YIcy: YIcy,
    	yicy: yicy,
    	Yopf: Yopf,
    	yopf: yopf,
    	Yscr: Yscr,
    	yscr: yscr,
    	YUcy: YUcy,
    	yucy: yucy,
    	yuml: yuml$1,
    	Yuml: Yuml,
    	Zacute: Zacute,
    	zacute: zacute,
    	Zcaron: Zcaron,
    	zcaron: zcaron,
    	Zcy: Zcy,
    	zcy: zcy,
    	Zdot: Zdot,
    	zdot: zdot,
    	zeetrf: zeetrf,
    	ZeroWidthSpace: ZeroWidthSpace,
    	Zeta: Zeta,
    	zeta: zeta,
    	zfr: zfr,
    	Zfr: Zfr,
    	ZHcy: ZHcy,
    	zhcy: zhcy,
    	zigrarr: zigrarr,
    	zopf: zopf,
    	Zopf: Zopf,
    	Zscr: Zscr,
    	zscr: zscr,
    	zwj: zwj,
    	zwnj: zwnj
    };

    var Aacute = "Á";
    var aacute = "á";
    var Acirc = "Â";
    var acirc = "â";
    var acute = "´";
    var AElig = "Æ";
    var aelig = "æ";
    var Agrave = "À";
    var agrave = "à";
    var amp$1 = "&";
    var AMP = "&";
    var Aring = "Å";
    var aring = "å";
    var Atilde = "Ã";
    var atilde = "ã";
    var Auml = "Ä";
    var auml = "ä";
    var brvbar = "¦";
    var Ccedil = "Ç";
    var ccedil = "ç";
    var cedil = "¸";
    var cent = "¢";
    var copy = "©";
    var COPY = "©";
    var curren = "¤";
    var deg = "°";
    var divide = "÷";
    var Eacute = "É";
    var eacute = "é";
    var Ecirc = "Ê";
    var ecirc = "ê";
    var Egrave = "È";
    var egrave = "è";
    var ETH = "Ð";
    var eth = "ð";
    var Euml = "Ë";
    var euml = "ë";
    var frac12 = "½";
    var frac14 = "¼";
    var frac34 = "¾";
    var gt$1 = ">";
    var GT = ">";
    var Iacute = "Í";
    var iacute = "í";
    var Icirc = "Î";
    var icirc = "î";
    var iexcl = "¡";
    var Igrave = "Ì";
    var igrave = "ì";
    var iquest = "¿";
    var Iuml = "Ï";
    var iuml = "ï";
    var laquo = "«";
    var lt$1 = "<";
    var LT = "<";
    var macr = "¯";
    var micro = "µ";
    var middot = "·";
    var nbsp = " ";
    var not = "¬";
    var Ntilde = "Ñ";
    var ntilde = "ñ";
    var Oacute = "Ó";
    var oacute = "ó";
    var Ocirc = "Ô";
    var ocirc = "ô";
    var Ograve = "Ò";
    var ograve = "ò";
    var ordf = "ª";
    var ordm = "º";
    var Oslash = "Ø";
    var oslash = "ø";
    var Otilde = "Õ";
    var otilde = "õ";
    var Ouml = "Ö";
    var ouml = "ö";
    var para = "¶";
    var plusmn = "±";
    var pound = "£";
    var quot$1 = "\"";
    var QUOT = "\"";
    var raquo = "»";
    var reg = "®";
    var REG = "®";
    var sect = "§";
    var shy = "­";
    var sup1 = "¹";
    var sup2 = "²";
    var sup3 = "³";
    var szlig = "ß";
    var THORN = "Þ";
    var thorn = "þ";
    var times = "×";
    var Uacute = "Ú";
    var uacute = "ú";
    var Ucirc = "Û";
    var ucirc = "û";
    var Ugrave = "Ù";
    var ugrave = "ù";
    var uml = "¨";
    var Uuml = "Ü";
    var uuml = "ü";
    var Yacute = "Ý";
    var yacute = "ý";
    var yen = "¥";
    var yuml = "ÿ";
    var require$$1 = {
    	Aacute: Aacute,
    	aacute: aacute,
    	Acirc: Acirc,
    	acirc: acirc,
    	acute: acute,
    	AElig: AElig,
    	aelig: aelig,
    	Agrave: Agrave,
    	agrave: agrave,
    	amp: amp$1,
    	AMP: AMP,
    	Aring: Aring,
    	aring: aring,
    	Atilde: Atilde,
    	atilde: atilde,
    	Auml: Auml,
    	auml: auml,
    	brvbar: brvbar,
    	Ccedil: Ccedil,
    	ccedil: ccedil,
    	cedil: cedil,
    	cent: cent,
    	copy: copy,
    	COPY: COPY,
    	curren: curren,
    	deg: deg,
    	divide: divide,
    	Eacute: Eacute,
    	eacute: eacute,
    	Ecirc: Ecirc,
    	ecirc: ecirc,
    	Egrave: Egrave,
    	egrave: egrave,
    	ETH: ETH,
    	eth: eth,
    	Euml: Euml,
    	euml: euml,
    	frac12: frac12,
    	frac14: frac14,
    	frac34: frac34,
    	gt: gt$1,
    	GT: GT,
    	Iacute: Iacute,
    	iacute: iacute,
    	Icirc: Icirc,
    	icirc: icirc,
    	iexcl: iexcl,
    	Igrave: Igrave,
    	igrave: igrave,
    	iquest: iquest,
    	Iuml: Iuml,
    	iuml: iuml,
    	laquo: laquo,
    	lt: lt$1,
    	LT: LT,
    	macr: macr,
    	micro: micro,
    	middot: middot,
    	nbsp: nbsp,
    	not: not,
    	Ntilde: Ntilde,
    	ntilde: ntilde,
    	Oacute: Oacute,
    	oacute: oacute,
    	Ocirc: Ocirc,
    	ocirc: ocirc,
    	Ograve: Ograve,
    	ograve: ograve,
    	ordf: ordf,
    	ordm: ordm,
    	Oslash: Oslash,
    	oslash: oslash,
    	Otilde: Otilde,
    	otilde: otilde,
    	Ouml: Ouml,
    	ouml: ouml,
    	para: para,
    	plusmn: plusmn,
    	pound: pound,
    	quot: quot$1,
    	QUOT: QUOT,
    	raquo: raquo,
    	reg: reg,
    	REG: REG,
    	sect: sect,
    	shy: shy,
    	sup1: sup1,
    	sup2: sup2,
    	sup3: sup3,
    	szlig: szlig,
    	THORN: THORN,
    	thorn: thorn,
    	times: times,
    	Uacute: Uacute,
    	uacute: uacute,
    	Ucirc: Ucirc,
    	ucirc: ucirc,
    	Ugrave: Ugrave,
    	ugrave: ugrave,
    	uml: uml,
    	Uuml: Uuml,
    	uuml: uuml,
    	Yacute: Yacute,
    	yacute: yacute,
    	yen: yen,
    	yuml: yuml
    };

    var amp = "&";
    var apos = "'";
    var gt = ">";
    var lt = "<";
    var quot = "\"";
    var require$$0 = {
    	amp: amp,
    	apos: apos,
    	gt: gt,
    	lt: lt,
    	quot: quot
    };

    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    var decode_codepoint_1 = __importDefault(decode_codepoint);
    var entities_json_1 = __importDefault(require$$1$1);
    var legacy_json_1 = __importDefault(require$$1);
    var xml_json_1 = __importDefault(require$$0);
    function whitespace(c) {
        return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
    }
    function isASCIIAlpha(c) {
        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
    }
    function ifElseState(upper, SUCCESS, FAILURE) {
        var lower = upper.toLowerCase();
        if (upper === lower) {
            return function (t, c) {
                if (c === lower) {
                    t._state = SUCCESS;
                }
                else {
                    t._state = FAILURE;
                    t._index--;
                }
            };
        }
        return function (t, c) {
            if (c === lower || c === upper) {
                t._state = SUCCESS;
            }
            else {
                t._state = FAILURE;
                t._index--;
            }
        };
    }
    function consumeSpecialNameChar(upper, NEXT_STATE) {
        var lower = upper.toLowerCase();
        return function (t, c) {
            if (c === lower || c === upper) {
                t._state = NEXT_STATE;
            }
            else {
                t._state = 3 /* InTagName */;
                t._index--; // Consume the token again
            }
        };
    }
    var stateBeforeCdata1 = ifElseState("C", 24 /* BeforeCdata2 */, 16 /* InDeclaration */);
    var stateBeforeCdata2 = ifElseState("D", 25 /* BeforeCdata3 */, 16 /* InDeclaration */);
    var stateBeforeCdata3 = ifElseState("A", 26 /* BeforeCdata4 */, 16 /* InDeclaration */);
    var stateBeforeCdata4 = ifElseState("T", 27 /* BeforeCdata5 */, 16 /* InDeclaration */);
    var stateBeforeCdata5 = ifElseState("A", 28 /* BeforeCdata6 */, 16 /* InDeclaration */);
    var stateBeforeScript1 = consumeSpecialNameChar("R", 35 /* BeforeScript2 */);
    var stateBeforeScript2 = consumeSpecialNameChar("I", 36 /* BeforeScript3 */);
    var stateBeforeScript3 = consumeSpecialNameChar("P", 37 /* BeforeScript4 */);
    var stateBeforeScript4 = consumeSpecialNameChar("T", 38 /* BeforeScript5 */);
    var stateAfterScript1 = ifElseState("R", 40 /* AfterScript2 */, 1 /* Text */);
    var stateAfterScript2 = ifElseState("I", 41 /* AfterScript3 */, 1 /* Text */);
    var stateAfterScript3 = ifElseState("P", 42 /* AfterScript4 */, 1 /* Text */);
    var stateAfterScript4 = ifElseState("T", 43 /* AfterScript5 */, 1 /* Text */);
    var stateBeforeStyle1 = consumeSpecialNameChar("Y", 45 /* BeforeStyle2 */);
    var stateBeforeStyle2 = consumeSpecialNameChar("L", 46 /* BeforeStyle3 */);
    var stateBeforeStyle3 = consumeSpecialNameChar("E", 47 /* BeforeStyle4 */);
    var stateAfterStyle1 = ifElseState("Y", 49 /* AfterStyle2 */, 1 /* Text */);
    var stateAfterStyle2 = ifElseState("L", 50 /* AfterStyle3 */, 1 /* Text */);
    var stateAfterStyle3 = ifElseState("E", 51 /* AfterStyle4 */, 1 /* Text */);
    var stateBeforeSpecialT = consumeSpecialNameChar("I", 54 /* BeforeTitle1 */);
    var stateBeforeTitle1 = consumeSpecialNameChar("T", 55 /* BeforeTitle2 */);
    var stateBeforeTitle2 = consumeSpecialNameChar("L", 56 /* BeforeTitle3 */);
    var stateBeforeTitle3 = consumeSpecialNameChar("E", 57 /* BeforeTitle4 */);
    var stateAfterSpecialTEnd = ifElseState("I", 58 /* AfterTitle1 */, 1 /* Text */);
    var stateAfterTitle1 = ifElseState("T", 59 /* AfterTitle2 */, 1 /* Text */);
    var stateAfterTitle2 = ifElseState("L", 60 /* AfterTitle3 */, 1 /* Text */);
    var stateAfterTitle3 = ifElseState("E", 61 /* AfterTitle4 */, 1 /* Text */);
    var stateBeforeEntity = ifElseState("#", 63 /* BeforeNumericEntity */, 64 /* InNamedEntity */);
    var stateBeforeNumericEntity = ifElseState("X", 66 /* InHexEntity */, 65 /* InNumericEntity */);
    var Tokenizer = /** @class */ (function () {
        function Tokenizer(options, cbs) {
            var _a;
            /** The current state the tokenizer is in. */
            this._state = 1 /* Text */;
            /** The read buffer. */
            this.buffer = "";
            /** The beginning of the section that is currently being read. */
            this.sectionStart = 0;
            /** The index within the buffer that we are currently looking at. */
            this._index = 0;
            /**
             * Data that has already been processed will be removed from the buffer occasionally.
             * `_bufferOffset` keeps track of how many characters have been removed, to make sure position information is accurate.
             */
            this.bufferOffset = 0;
            /** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
            this.baseState = 1 /* Text */;
            /** For special parsing behavior inside of script and style tags. */
            this.special = 1 /* None */;
            /** Indicates whether the tokenizer has been paused. */
            this.running = true;
            /** Indicates whether the tokenizer has finished running / `.end` has been called. */
            this.ended = false;
            this.cbs = cbs;
            this.xmlMode = !!(options === null || options === void 0 ? void 0 : options.xmlMode);
            this.decodeEntities = (_a = options === null || options === void 0 ? void 0 : options.decodeEntities) !== null && _a !== void 0 ? _a : true;
        }
        Tokenizer.prototype.reset = function () {
            this._state = 1 /* Text */;
            this.buffer = "";
            this.sectionStart = 0;
            this._index = 0;
            this.bufferOffset = 0;
            this.baseState = 1 /* Text */;
            this.special = 1 /* None */;
            this.running = true;
            this.ended = false;
        };
        Tokenizer.prototype.write = function (chunk) {
            if (this.ended)
                this.cbs.onerror(Error(".write() after done!"));
            this.buffer += chunk;
            this.parse();
        };
        Tokenizer.prototype.end = function (chunk) {
            if (this.ended)
                this.cbs.onerror(Error(".end() after done!"));
            if (chunk)
                this.write(chunk);
            this.ended = true;
            if (this.running)
                this.finish();
        };
        Tokenizer.prototype.pause = function () {
            this.running = false;
        };
        Tokenizer.prototype.resume = function () {
            this.running = true;
            if (this._index < this.buffer.length) {
                this.parse();
            }
            if (this.ended) {
                this.finish();
            }
        };
        /**
         * The current index within all of the written data.
         */
        Tokenizer.prototype.getAbsoluteIndex = function () {
            return this.bufferOffset + this._index;
        };
        Tokenizer.prototype.stateText = function (c) {
            if (c === "<") {
                if (this._index > this.sectionStart) {
                    this.cbs.ontext(this.getSection());
                }
                this._state = 2 /* BeforeTagName */;
                this.sectionStart = this._index;
            }
            else if (this.decodeEntities &&
                c === "&" &&
                (this.special === 1 /* None */ || this.special === 4 /* Title */)) {
                if (this._index > this.sectionStart) {
                    this.cbs.ontext(this.getSection());
                }
                this.baseState = 1 /* Text */;
                this._state = 62 /* BeforeEntity */;
                this.sectionStart = this._index;
            }
        };
        /**
         * HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
         *
         * XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
         * We allow anything that wouldn't end the tag.
         */
        Tokenizer.prototype.isTagStartChar = function (c) {
            return (isASCIIAlpha(c) ||
                (this.xmlMode && !whitespace(c) && c !== "/" && c !== ">"));
        };
        Tokenizer.prototype.stateBeforeTagName = function (c) {
            if (c === "/") {
                this._state = 5 /* BeforeClosingTagName */;
            }
            else if (c === "<") {
                this.cbs.ontext(this.getSection());
                this.sectionStart = this._index;
            }
            else if (c === ">" ||
                this.special !== 1 /* None */ ||
                whitespace(c)) {
                this._state = 1 /* Text */;
            }
            else if (c === "!") {
                this._state = 15 /* BeforeDeclaration */;
                this.sectionStart = this._index + 1;
            }
            else if (c === "?") {
                this._state = 17 /* InProcessingInstruction */;
                this.sectionStart = this._index + 1;
            }
            else if (!this.isTagStartChar(c)) {
                this._state = 1 /* Text */;
            }
            else {
                this._state =
                    !this.xmlMode && (c === "s" || c === "S")
                        ? 32 /* BeforeSpecialS */
                        : !this.xmlMode && (c === "t" || c === "T")
                            ? 52 /* BeforeSpecialT */
                            : 3 /* InTagName */;
                this.sectionStart = this._index;
            }
        };
        Tokenizer.prototype.stateInTagName = function (c) {
            if (c === "/" || c === ">" || whitespace(c)) {
                this.emitToken("onopentagname");
                this._state = 8 /* BeforeAttributeName */;
                this._index--;
            }
        };
        Tokenizer.prototype.stateBeforeClosingTagName = function (c) {
            if (whitespace(c)) ;
            else if (c === ">") {
                this._state = 1 /* Text */;
            }
            else if (this.special !== 1 /* None */) {
                if (this.special !== 4 /* Title */ && (c === "s" || c === "S")) {
                    this._state = 33 /* BeforeSpecialSEnd */;
                }
                else if (this.special === 4 /* Title */ &&
                    (c === "t" || c === "T")) {
                    this._state = 53 /* BeforeSpecialTEnd */;
                }
                else {
                    this._state = 1 /* Text */;
                    this._index--;
                }
            }
            else if (!this.isTagStartChar(c)) {
                this._state = 20 /* InSpecialComment */;
                this.sectionStart = this._index;
            }
            else {
                this._state = 6 /* InClosingTagName */;
                this.sectionStart = this._index;
            }
        };
        Tokenizer.prototype.stateInClosingTagName = function (c) {
            if (c === ">" || whitespace(c)) {
                this.emitToken("onclosetag");
                this._state = 7 /* AfterClosingTagName */;
                this._index--;
            }
        };
        Tokenizer.prototype.stateAfterClosingTagName = function (c) {
            // Skip everything until ">"
            if (c === ">") {
                this._state = 1 /* Text */;
                this.sectionStart = this._index + 1;
            }
        };
        Tokenizer.prototype.stateBeforeAttributeName = function (c) {
            if (c === ">") {
                this.cbs.onopentagend();
                this._state = 1 /* Text */;
                this.sectionStart = this._index + 1;
            }
            else if (c === "/") {
                this._state = 4 /* InSelfClosingTag */;
            }
            else if (!whitespace(c)) {
                this._state = 9 /* InAttributeName */;
                this.sectionStart = this._index;
            }
        };
        Tokenizer.prototype.stateInSelfClosingTag = function (c) {
            if (c === ">") {
                this.cbs.onselfclosingtag();
                this._state = 1 /* Text */;
                this.sectionStart = this._index + 1;
                this.special = 1 /* None */; // Reset special state, in case of self-closing special tags
            }
            else if (!whitespace(c)) {
                this._state = 8 /* BeforeAttributeName */;
                this._index--;
            }
        };
        Tokenizer.prototype.stateInAttributeName = function (c) {
            if (c === "=" || c === "/" || c === ">" || whitespace(c)) {
                this.cbs.onattribname(this.getSection());
                this.sectionStart = -1;
                this._state = 10 /* AfterAttributeName */;
                this._index--;
            }
        };
        Tokenizer.prototype.stateAfterAttributeName = function (c) {
            if (c === "=") {
                this._state = 11 /* BeforeAttributeValue */;
            }
            else if (c === "/" || c === ">") {
                this.cbs.onattribend(undefined);
                this._state = 8 /* BeforeAttributeName */;
                this._index--;
            }
            else if (!whitespace(c)) {
                this.cbs.onattribend(undefined);
                this._state = 9 /* InAttributeName */;
                this.sectionStart = this._index;
            }
        };
        Tokenizer.prototype.stateBeforeAttributeValue = function (c) {
            if (c === '"') {
                this._state = 12 /* InAttributeValueDq */;
                this.sectionStart = this._index + 1;
            }
            else if (c === "'") {
                this._state = 13 /* InAttributeValueSq */;
                this.sectionStart = this._index + 1;
            }
            else if (!whitespace(c)) {
                this._state = 14 /* InAttributeValueNq */;
                this.sectionStart = this._index;
                this._index--; // Reconsume token
            }
        };
        Tokenizer.prototype.handleInAttributeValue = function (c, quote) {
            if (c === quote) {
                this.emitToken("onattribdata");
                this.cbs.onattribend(quote);
                this._state = 8 /* BeforeAttributeName */;
            }
            else if (this.decodeEntities && c === "&") {
                this.emitToken("onattribdata");
                this.baseState = this._state;
                this._state = 62 /* BeforeEntity */;
                this.sectionStart = this._index;
            }
        };
        Tokenizer.prototype.stateInAttributeValueDoubleQuotes = function (c) {
            this.handleInAttributeValue(c, '"');
        };
        Tokenizer.prototype.stateInAttributeValueSingleQuotes = function (c) {
            this.handleInAttributeValue(c, "'");
        };
        Tokenizer.prototype.stateInAttributeValueNoQuotes = function (c) {
            if (whitespace(c) || c === ">") {
                this.emitToken("onattribdata");
                this.cbs.onattribend(null);
                this._state = 8 /* BeforeAttributeName */;
                this._index--;
            }
            else if (this.decodeEntities && c === "&") {
                this.emitToken("onattribdata");
                this.baseState = this._state;
                this._state = 62 /* BeforeEntity */;
                this.sectionStart = this._index;
            }
        };
        Tokenizer.prototype.stateBeforeDeclaration = function (c) {
            this._state =
                c === "["
                    ? 23 /* BeforeCdata1 */
                    : c === "-"
                        ? 18 /* BeforeComment */
                        : 16 /* InDeclaration */;
        };
        Tokenizer.prototype.stateInDeclaration = function (c) {
            if (c === ">") {
                this.cbs.ondeclaration(this.getSection());
                this._state = 1 /* Text */;
                this.sectionStart = this._index + 1;
            }
        };
        Tokenizer.prototype.stateInProcessingInstruction = function (c) {
            if (c === ">") {
                this.cbs.onprocessinginstruction(this.getSection());
                this._state = 1 /* Text */;
                this.sectionStart = this._index + 1;
            }
        };
        Tokenizer.prototype.stateBeforeComment = function (c) {
            if (c === "-") {
                this._state = 19 /* InComment */;
                this.sectionStart = this._index + 1;
            }
            else {
                this._state = 16 /* InDeclaration */;
            }
        };
        Tokenizer.prototype.stateInComment = function (c) {
            if (c === "-")
                this._state = 21 /* AfterComment1 */;
        };
        Tokenizer.prototype.stateInSpecialComment = function (c) {
            if (c === ">") {
                this.cbs.oncomment(this.buffer.substring(this.sectionStart, this._index));
                this._state = 1 /* Text */;
                this.sectionStart = this._index + 1;
            }
        };
        Tokenizer.prototype.stateAfterComment1 = function (c) {
            if (c === "-") {
                this._state = 22 /* AfterComment2 */;
            }
            else {
                this._state = 19 /* InComment */;
            }
        };
        Tokenizer.prototype.stateAfterComment2 = function (c) {
            if (c === ">") {
                // Remove 2 trailing chars
                this.cbs.oncomment(this.buffer.substring(this.sectionStart, this._index - 2));
                this._state = 1 /* Text */;
                this.sectionStart = this._index + 1;
            }
            else if (c !== "-") {
                this._state = 19 /* InComment */;
            }
            // Else: stay in AFTER_COMMENT_2 (`--->`)
        };
        Tokenizer.prototype.stateBeforeCdata6 = function (c) {
            if (c === "[") {
                this._state = 29 /* InCdata */;
                this.sectionStart = this._index + 1;
            }
            else {
                this._state = 16 /* InDeclaration */;
                this._index--;
            }
        };
        Tokenizer.prototype.stateInCdata = function (c) {
            if (c === "]")
                this._state = 30 /* AfterCdata1 */;
        };
        Tokenizer.prototype.stateAfterCdata1 = function (c) {
            if (c === "]")
                this._state = 31 /* AfterCdata2 */;
            else
                this._state = 29 /* InCdata */;
        };
        Tokenizer.prototype.stateAfterCdata2 = function (c) {
            if (c === ">") {
                // Remove 2 trailing chars
                this.cbs.oncdata(this.buffer.substring(this.sectionStart, this._index - 2));
                this._state = 1 /* Text */;
                this.sectionStart = this._index + 1;
            }
            else if (c !== "]") {
                this._state = 29 /* InCdata */;
            }
            // Else: stay in AFTER_CDATA_2 (`]]]>`)
        };
        Tokenizer.prototype.stateBeforeSpecialS = function (c) {
            if (c === "c" || c === "C") {
                this._state = 34 /* BeforeScript1 */;
            }
            else if (c === "t" || c === "T") {
                this._state = 44 /* BeforeStyle1 */;
            }
            else {
                this._state = 3 /* InTagName */;
                this._index--; // Consume the token again
            }
        };
        Tokenizer.prototype.stateBeforeSpecialSEnd = function (c) {
            if (this.special === 2 /* Script */ && (c === "c" || c === "C")) {
                this._state = 39 /* AfterScript1 */;
            }
            else if (this.special === 3 /* Style */ && (c === "t" || c === "T")) {
                this._state = 48 /* AfterStyle1 */;
            }
            else
                this._state = 1 /* Text */;
        };
        Tokenizer.prototype.stateBeforeSpecialLast = function (c, special) {
            if (c === "/" || c === ">" || whitespace(c)) {
                this.special = special;
            }
            this._state = 3 /* InTagName */;
            this._index--; // Consume the token again
        };
        Tokenizer.prototype.stateAfterSpecialLast = function (c, sectionStartOffset) {
            if (c === ">" || whitespace(c)) {
                this.special = 1 /* None */;
                this._state = 6 /* InClosingTagName */;
                this.sectionStart = this._index - sectionStartOffset;
                this._index--; // Reconsume the token
            }
            else
                this._state = 1 /* Text */;
        };
        // For entities terminated with a semicolon
        Tokenizer.prototype.parseFixedEntity = function (map) {
            if (map === void 0) { map = this.xmlMode ? xml_json_1.default : entities_json_1.default; }
            // Offset = 1
            if (this.sectionStart + 1 < this._index) {
                var entity = this.buffer.substring(this.sectionStart + 1, this._index);
                if (Object.prototype.hasOwnProperty.call(map, entity)) {
                    this.emitPartial(map[entity]);
                    this.sectionStart = this._index + 1;
                }
            }
        };
        // Parses legacy entities (without trailing semicolon)
        Tokenizer.prototype.parseLegacyEntity = function () {
            var start = this.sectionStart + 1;
            // The max length of legacy entities is 6
            var limit = Math.min(this._index - start, 6);
            while (limit >= 2) {
                // The min length of legacy entities is 2
                var entity = this.buffer.substr(start, limit);
                if (Object.prototype.hasOwnProperty.call(legacy_json_1.default, entity)) {
                    this.emitPartial(legacy_json_1.default[entity]);
                    this.sectionStart += limit + 1;
                    return;
                }
                limit--;
            }
        };
        Tokenizer.prototype.stateInNamedEntity = function (c) {
            if (c === ";") {
                this.parseFixedEntity();
                // Retry as legacy entity if entity wasn't parsed
                if (this.baseState === 1 /* Text */ &&
                    this.sectionStart + 1 < this._index &&
                    !this.xmlMode) {
                    this.parseLegacyEntity();
                }
                this._state = this.baseState;
            }
            else if ((c < "0" || c > "9") && !isASCIIAlpha(c)) {
                if (this.xmlMode || this.sectionStart + 1 === this._index) ;
                else if (this.baseState !== 1 /* Text */) {
                    if (c !== "=") {
                        // Parse as legacy entity, without allowing additional characters.
                        this.parseFixedEntity(legacy_json_1.default);
                    }
                }
                else {
                    this.parseLegacyEntity();
                }
                this._state = this.baseState;
                this._index--;
            }
        };
        Tokenizer.prototype.decodeNumericEntity = function (offset, base, strict) {
            var sectionStart = this.sectionStart + offset;
            if (sectionStart !== this._index) {
                // Parse entity
                var entity = this.buffer.substring(sectionStart, this._index);
                var parsed = parseInt(entity, base);
                this.emitPartial(decode_codepoint_1.default(parsed));
                this.sectionStart = strict ? this._index + 1 : this._index;
            }
            this._state = this.baseState;
        };
        Tokenizer.prototype.stateInNumericEntity = function (c) {
            if (c === ";") {
                this.decodeNumericEntity(2, 10, true);
            }
            else if (c < "0" || c > "9") {
                if (!this.xmlMode) {
                    this.decodeNumericEntity(2, 10, false);
                }
                else {
                    this._state = this.baseState;
                }
                this._index--;
            }
        };
        Tokenizer.prototype.stateInHexEntity = function (c) {
            if (c === ";") {
                this.decodeNumericEntity(3, 16, true);
            }
            else if ((c < "a" || c > "f") &&
                (c < "A" || c > "F") &&
                (c < "0" || c > "9")) {
                if (!this.xmlMode) {
                    this.decodeNumericEntity(3, 16, false);
                }
                else {
                    this._state = this.baseState;
                }
                this._index--;
            }
        };
        Tokenizer.prototype.cleanup = function () {
            if (this.sectionStart < 0) {
                this.buffer = "";
                this.bufferOffset += this._index;
                this._index = 0;
            }
            else if (this.running) {
                if (this._state === 1 /* Text */) {
                    if (this.sectionStart !== this._index) {
                        this.cbs.ontext(this.buffer.substr(this.sectionStart));
                    }
                    this.buffer = "";
                    this.bufferOffset += this._index;
                    this._index = 0;
                }
                else if (this.sectionStart === this._index) {
                    // The section just started
                    this.buffer = "";
                    this.bufferOffset += this._index;
                    this._index = 0;
                }
                else {
                    // Remove everything unnecessary
                    this.buffer = this.buffer.substr(this.sectionStart);
                    this._index -= this.sectionStart;
                    this.bufferOffset += this.sectionStart;
                }
                this.sectionStart = 0;
            }
        };
        /**
         * Iterates through the buffer, calling the function corresponding to the current state.
         *
         * States that are more likely to be hit are higher up, as a performance improvement.
         */
        Tokenizer.prototype.parse = function () {
            while (this._index < this.buffer.length && this.running) {
                var c = this.buffer.charAt(this._index);
                if (this._state === 1 /* Text */) {
                    this.stateText(c);
                }
                else if (this._state === 12 /* InAttributeValueDq */) {
                    this.stateInAttributeValueDoubleQuotes(c);
                }
                else if (this._state === 9 /* InAttributeName */) {
                    this.stateInAttributeName(c);
                }
                else if (this._state === 19 /* InComment */) {
                    this.stateInComment(c);
                }
                else if (this._state === 20 /* InSpecialComment */) {
                    this.stateInSpecialComment(c);
                }
                else if (this._state === 8 /* BeforeAttributeName */) {
                    this.stateBeforeAttributeName(c);
                }
                else if (this._state === 3 /* InTagName */) {
                    this.stateInTagName(c);
                }
                else if (this._state === 6 /* InClosingTagName */) {
                    this.stateInClosingTagName(c);
                }
                else if (this._state === 2 /* BeforeTagName */) {
                    this.stateBeforeTagName(c);
                }
                else if (this._state === 10 /* AfterAttributeName */) {
                    this.stateAfterAttributeName(c);
                }
                else if (this._state === 13 /* InAttributeValueSq */) {
                    this.stateInAttributeValueSingleQuotes(c);
                }
                else if (this._state === 11 /* BeforeAttributeValue */) {
                    this.stateBeforeAttributeValue(c);
                }
                else if (this._state === 5 /* BeforeClosingTagName */) {
                    this.stateBeforeClosingTagName(c);
                }
                else if (this._state === 7 /* AfterClosingTagName */) {
                    this.stateAfterClosingTagName(c);
                }
                else if (this._state === 32 /* BeforeSpecialS */) {
                    this.stateBeforeSpecialS(c);
                }
                else if (this._state === 21 /* AfterComment1 */) {
                    this.stateAfterComment1(c);
                }
                else if (this._state === 14 /* InAttributeValueNq */) {
                    this.stateInAttributeValueNoQuotes(c);
                }
                else if (this._state === 4 /* InSelfClosingTag */) {
                    this.stateInSelfClosingTag(c);
                }
                else if (this._state === 16 /* InDeclaration */) {
                    this.stateInDeclaration(c);
                }
                else if (this._state === 15 /* BeforeDeclaration */) {
                    this.stateBeforeDeclaration(c);
                }
                else if (this._state === 22 /* AfterComment2 */) {
                    this.stateAfterComment2(c);
                }
                else if (this._state === 18 /* BeforeComment */) {
                    this.stateBeforeComment(c);
                }
                else if (this._state === 33 /* BeforeSpecialSEnd */) {
                    this.stateBeforeSpecialSEnd(c);
                }
                else if (this._state === 53 /* BeforeSpecialTEnd */) {
                    stateAfterSpecialTEnd(this, c);
                }
                else if (this._state === 39 /* AfterScript1 */) {
                    stateAfterScript1(this, c);
                }
                else if (this._state === 40 /* AfterScript2 */) {
                    stateAfterScript2(this, c);
                }
                else if (this._state === 41 /* AfterScript3 */) {
                    stateAfterScript3(this, c);
                }
                else if (this._state === 34 /* BeforeScript1 */) {
                    stateBeforeScript1(this, c);
                }
                else if (this._state === 35 /* BeforeScript2 */) {
                    stateBeforeScript2(this, c);
                }
                else if (this._state === 36 /* BeforeScript3 */) {
                    stateBeforeScript3(this, c);
                }
                else if (this._state === 37 /* BeforeScript4 */) {
                    stateBeforeScript4(this, c);
                }
                else if (this._state === 38 /* BeforeScript5 */) {
                    this.stateBeforeSpecialLast(c, 2 /* Script */);
                }
                else if (this._state === 42 /* AfterScript4 */) {
                    stateAfterScript4(this, c);
                }
                else if (this._state === 43 /* AfterScript5 */) {
                    this.stateAfterSpecialLast(c, 6);
                }
                else if (this._state === 44 /* BeforeStyle1 */) {
                    stateBeforeStyle1(this, c);
                }
                else if (this._state === 29 /* InCdata */) {
                    this.stateInCdata(c);
                }
                else if (this._state === 45 /* BeforeStyle2 */) {
                    stateBeforeStyle2(this, c);
                }
                else if (this._state === 46 /* BeforeStyle3 */) {
                    stateBeforeStyle3(this, c);
                }
                else if (this._state === 47 /* BeforeStyle4 */) {
                    this.stateBeforeSpecialLast(c, 3 /* Style */);
                }
                else if (this._state === 48 /* AfterStyle1 */) {
                    stateAfterStyle1(this, c);
                }
                else if (this._state === 49 /* AfterStyle2 */) {
                    stateAfterStyle2(this, c);
                }
                else if (this._state === 50 /* AfterStyle3 */) {
                    stateAfterStyle3(this, c);
                }
                else if (this._state === 51 /* AfterStyle4 */) {
                    this.stateAfterSpecialLast(c, 5);
                }
                else if (this._state === 52 /* BeforeSpecialT */) {
                    stateBeforeSpecialT(this, c);
                }
                else if (this._state === 54 /* BeforeTitle1 */) {
                    stateBeforeTitle1(this, c);
                }
                else if (this._state === 55 /* BeforeTitle2 */) {
                    stateBeforeTitle2(this, c);
                }
                else if (this._state === 56 /* BeforeTitle3 */) {
                    stateBeforeTitle3(this, c);
                }
                else if (this._state === 57 /* BeforeTitle4 */) {
                    this.stateBeforeSpecialLast(c, 4 /* Title */);
                }
                else if (this._state === 58 /* AfterTitle1 */) {
                    stateAfterTitle1(this, c);
                }
                else if (this._state === 59 /* AfterTitle2 */) {
                    stateAfterTitle2(this, c);
                }
                else if (this._state === 60 /* AfterTitle3 */) {
                    stateAfterTitle3(this, c);
                }
                else if (this._state === 61 /* AfterTitle4 */) {
                    this.stateAfterSpecialLast(c, 5);
                }
                else if (this._state === 17 /* InProcessingInstruction */) {
                    this.stateInProcessingInstruction(c);
                }
                else if (this._state === 64 /* InNamedEntity */) {
                    this.stateInNamedEntity(c);
                }
                else if (this._state === 23 /* BeforeCdata1 */) {
                    stateBeforeCdata1(this, c);
                }
                else if (this._state === 62 /* BeforeEntity */) {
                    stateBeforeEntity(this, c);
                }
                else if (this._state === 24 /* BeforeCdata2 */) {
                    stateBeforeCdata2(this, c);
                }
                else if (this._state === 25 /* BeforeCdata3 */) {
                    stateBeforeCdata3(this, c);
                }
                else if (this._state === 30 /* AfterCdata1 */) {
                    this.stateAfterCdata1(c);
                }
                else if (this._state === 31 /* AfterCdata2 */) {
                    this.stateAfterCdata2(c);
                }
                else if (this._state === 26 /* BeforeCdata4 */) {
                    stateBeforeCdata4(this, c);
                }
                else if (this._state === 27 /* BeforeCdata5 */) {
                    stateBeforeCdata5(this, c);
                }
                else if (this._state === 28 /* BeforeCdata6 */) {
                    this.stateBeforeCdata6(c);
                }
                else if (this._state === 66 /* InHexEntity */) {
                    this.stateInHexEntity(c);
                }
                else if (this._state === 65 /* InNumericEntity */) {
                    this.stateInNumericEntity(c);
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                }
                else if (this._state === 63 /* BeforeNumericEntity */) {
                    stateBeforeNumericEntity(this, c);
                }
                else {
                    this.cbs.onerror(Error("unknown _state"), this._state);
                }
                this._index++;
            }
            this.cleanup();
        };
        Tokenizer.prototype.finish = function () {
            // If there is remaining data, emit it in a reasonable way
            if (this.sectionStart < this._index) {
                this.handleTrailingData();
            }
            this.cbs.onend();
        };
        Tokenizer.prototype.handleTrailingData = function () {
            var data = this.buffer.substr(this.sectionStart);
            if (this._state === 29 /* InCdata */ ||
                this._state === 30 /* AfterCdata1 */ ||
                this._state === 31 /* AfterCdata2 */) {
                this.cbs.oncdata(data);
            }
            else if (this._state === 19 /* InComment */ ||
                this._state === 21 /* AfterComment1 */ ||
                this._state === 22 /* AfterComment2 */) {
                this.cbs.oncomment(data);
            }
            else if (this._state === 64 /* InNamedEntity */ && !this.xmlMode) {
                this.parseLegacyEntity();
                if (this.sectionStart < this._index) {
                    this._state = this.baseState;
                    this.handleTrailingData();
                }
            }
            else if (this._state === 65 /* InNumericEntity */ && !this.xmlMode) {
                this.decodeNumericEntity(2, 10, false);
                if (this.sectionStart < this._index) {
                    this._state = this.baseState;
                    this.handleTrailingData();
                }
            }
            else if (this._state === 66 /* InHexEntity */ && !this.xmlMode) {
                this.decodeNumericEntity(3, 16, false);
                if (this.sectionStart < this._index) {
                    this._state = this.baseState;
                    this.handleTrailingData();
                }
            }
            else if (this._state !== 3 /* InTagName */ &&
                this._state !== 8 /* BeforeAttributeName */ &&
                this._state !== 11 /* BeforeAttributeValue */ &&
                this._state !== 10 /* AfterAttributeName */ &&
                this._state !== 9 /* InAttributeName */ &&
                this._state !== 13 /* InAttributeValueSq */ &&
                this._state !== 12 /* InAttributeValueDq */ &&
                this._state !== 14 /* InAttributeValueNq */ &&
                this._state !== 6 /* InClosingTagName */) {
                this.cbs.ontext(data);
            }
            /*
             * Else, ignore remaining data
             * TODO add a way to remove current tag
             */
        };
        Tokenizer.prototype.getSection = function () {
            return this.buffer.substring(this.sectionStart, this._index);
        };
        Tokenizer.prototype.emitToken = function (name) {
            this.cbs[name](this.getSection());
            this.sectionStart = -1;
        };
        Tokenizer.prototype.emitPartial = function (value) {
            if (this.baseState !== 1 /* Text */) {
                this.cbs.onattribdata(value); // TODO implement the new event
            }
            else {
                this.cbs.ontext(value);
            }
        };
        return Tokenizer;
    }());
    var _default$1 = Tokenizer;

    var Tokenizer_1 = /*#__PURE__*/Object.defineProperty({
    	default: _default$1
    }, '__esModule', {value: true});

    var Parser_1 = createCommonjsModule(function (module, exports) {
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var Tokenizer_1$1 = __importDefault(Tokenizer_1);
    var formTags = new Set([
        "input",
        "option",
        "optgroup",
        "select",
        "button",
        "datalist",
        "textarea",
    ]);
    var pTag = new Set(["p"]);
    var openImpliesClose = {
        tr: new Set(["tr", "th", "td"]),
        th: new Set(["th"]),
        td: new Set(["thead", "th", "td"]),
        body: new Set(["head", "link", "script"]),
        li: new Set(["li"]),
        p: pTag,
        h1: pTag,
        h2: pTag,
        h3: pTag,
        h4: pTag,
        h5: pTag,
        h6: pTag,
        select: formTags,
        input: formTags,
        output: formTags,
        button: formTags,
        datalist: formTags,
        textarea: formTags,
        option: new Set(["option"]),
        optgroup: new Set(["optgroup", "option"]),
        dd: new Set(["dt", "dd"]),
        dt: new Set(["dt", "dd"]),
        address: pTag,
        article: pTag,
        aside: pTag,
        blockquote: pTag,
        details: pTag,
        div: pTag,
        dl: pTag,
        fieldset: pTag,
        figcaption: pTag,
        figure: pTag,
        footer: pTag,
        form: pTag,
        header: pTag,
        hr: pTag,
        main: pTag,
        nav: pTag,
        ol: pTag,
        pre: pTag,
        section: pTag,
        table: pTag,
        ul: pTag,
        rt: new Set(["rt", "rp"]),
        rp: new Set(["rt", "rp"]),
        tbody: new Set(["thead", "tbody"]),
        tfoot: new Set(["thead", "tbody"]),
    };
    var voidElements = new Set([
        "area",
        "base",
        "basefont",
        "br",
        "col",
        "command",
        "embed",
        "frame",
        "hr",
        "img",
        "input",
        "isindex",
        "keygen",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    ]);
    var foreignContextElements = new Set(["math", "svg"]);
    var htmlIntegrationElements = new Set([
        "mi",
        "mo",
        "mn",
        "ms",
        "mtext",
        "annotation-xml",
        "foreignObject",
        "desc",
        "title",
    ]);
    var reNameEnd = /\s|\//;
    var Parser = /** @class */ (function () {
        function Parser(cbs, options) {
            if (options === void 0) { options = {}; }
            var _a, _b, _c, _d, _e;
            /** The start index of the last event. */
            this.startIndex = 0;
            /** The end index of the last event. */
            this.endIndex = null;
            this.tagname = "";
            this.attribname = "";
            this.attribvalue = "";
            this.attribs = null;
            this.stack = [];
            this.foreignContext = [];
            this.options = options;
            this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
            this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== void 0 ? _a : !options.xmlMode;
            this.lowerCaseAttributeNames =
                (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : !options.xmlMode;
            this.tokenizer = new ((_c = options.Tokenizer) !== null && _c !== void 0 ? _c : Tokenizer_1$1.default)(this.options, this);
            (_e = (_d = this.cbs).onparserinit) === null || _e === void 0 ? void 0 : _e.call(_d, this);
        }
        Parser.prototype.updatePosition = function (initialOffset) {
            if (this.endIndex === null) {
                if (this.tokenizer.sectionStart <= initialOffset) {
                    this.startIndex = 0;
                }
                else {
                    this.startIndex = this.tokenizer.sectionStart - initialOffset;
                }
            }
            else {
                this.startIndex = this.endIndex + 1;
            }
            this.endIndex = this.tokenizer.getAbsoluteIndex();
        };
        // Tokenizer event handlers
        Parser.prototype.ontext = function (data) {
            var _a, _b;
            this.updatePosition(1);
            this.endIndex--;
            (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        };
        Parser.prototype.onopentagname = function (name) {
            var _a, _b;
            if (this.lowerCaseTagNames) {
                name = name.toLowerCase();
            }
            this.tagname = name;
            if (!this.options.xmlMode &&
                Object.prototype.hasOwnProperty.call(openImpliesClose, name)) {
                var el = void 0;
                while (this.stack.length > 0 &&
                    openImpliesClose[name].has((el = this.stack[this.stack.length - 1]))) {
                    this.onclosetag(el);
                }
            }
            if (this.options.xmlMode || !voidElements.has(name)) {
                this.stack.push(name);
                if (foreignContextElements.has(name)) {
                    this.foreignContext.push(true);
                }
                else if (htmlIntegrationElements.has(name)) {
                    this.foreignContext.push(false);
                }
            }
            (_b = (_a = this.cbs).onopentagname) === null || _b === void 0 ? void 0 : _b.call(_a, name);
            if (this.cbs.onopentag)
                this.attribs = {};
        };
        Parser.prototype.onopentagend = function () {
            var _a, _b;
            this.updatePosition(1);
            if (this.attribs) {
                (_b = (_a = this.cbs).onopentag) === null || _b === void 0 ? void 0 : _b.call(_a, this.tagname, this.attribs);
                this.attribs = null;
            }
            if (!this.options.xmlMode &&
                this.cbs.onclosetag &&
                voidElements.has(this.tagname)) {
                this.cbs.onclosetag(this.tagname);
            }
            this.tagname = "";
        };
        Parser.prototype.onclosetag = function (name) {
            this.updatePosition(1);
            if (this.lowerCaseTagNames) {
                name = name.toLowerCase();
            }
            if (foreignContextElements.has(name) ||
                htmlIntegrationElements.has(name)) {
                this.foreignContext.pop();
            }
            if (this.stack.length &&
                (this.options.xmlMode || !voidElements.has(name))) {
                var pos = this.stack.lastIndexOf(name);
                if (pos !== -1) {
                    if (this.cbs.onclosetag) {
                        pos = this.stack.length - pos;
                        while (pos--) {
                            // We know the stack has sufficient elements.
                            this.cbs.onclosetag(this.stack.pop());
                        }
                    }
                    else
                        this.stack.length = pos;
                }
                else if (name === "p" && !this.options.xmlMode) {
                    this.onopentagname(name);
                    this.closeCurrentTag();
                }
            }
            else if (!this.options.xmlMode && (name === "br" || name === "p")) {
                this.onopentagname(name);
                this.closeCurrentTag();
            }
        };
        Parser.prototype.onselfclosingtag = function () {
            if (this.options.xmlMode ||
                this.options.recognizeSelfClosing ||
                this.foreignContext[this.foreignContext.length - 1]) {
                this.closeCurrentTag();
            }
            else {
                this.onopentagend();
            }
        };
        Parser.prototype.closeCurrentTag = function () {
            var _a, _b;
            var name = this.tagname;
            this.onopentagend();
            /*
             * Self-closing tags will be on the top of the stack
             * (cheaper check than in onclosetag)
             */
            if (this.stack[this.stack.length - 1] === name) {
                (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, name);
                this.stack.pop();
            }
        };
        Parser.prototype.onattribname = function (name) {
            if (this.lowerCaseAttributeNames) {
                name = name.toLowerCase();
            }
            this.attribname = name;
        };
        Parser.prototype.onattribdata = function (value) {
            this.attribvalue += value;
        };
        Parser.prototype.onattribend = function (quote) {
            var _a, _b;
            (_b = (_a = this.cbs).onattribute) === null || _b === void 0 ? void 0 : _b.call(_a, this.attribname, this.attribvalue, quote);
            if (this.attribs &&
                !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
                this.attribs[this.attribname] = this.attribvalue;
            }
            this.attribname = "";
            this.attribvalue = "";
        };
        Parser.prototype.getInstructionName = function (value) {
            var idx = value.search(reNameEnd);
            var name = idx < 0 ? value : value.substr(0, idx);
            if (this.lowerCaseTagNames) {
                name = name.toLowerCase();
            }
            return name;
        };
        Parser.prototype.ondeclaration = function (value) {
            if (this.cbs.onprocessinginstruction) {
                var name_1 = this.getInstructionName(value);
                this.cbs.onprocessinginstruction("!" + name_1, "!" + value);
            }
        };
        Parser.prototype.onprocessinginstruction = function (value) {
            if (this.cbs.onprocessinginstruction) {
                var name_2 = this.getInstructionName(value);
                this.cbs.onprocessinginstruction("?" + name_2, "?" + value);
            }
        };
        Parser.prototype.oncomment = function (value) {
            var _a, _b, _c, _d;
            this.updatePosition(4);
            (_b = (_a = this.cbs).oncomment) === null || _b === void 0 ? void 0 : _b.call(_a, value);
            (_d = (_c = this.cbs).oncommentend) === null || _d === void 0 ? void 0 : _d.call(_c);
        };
        Parser.prototype.oncdata = function (value) {
            var _a, _b, _c, _d, _e, _f;
            this.updatePosition(1);
            if (this.options.xmlMode || this.options.recognizeCDATA) {
                (_b = (_a = this.cbs).oncdatastart) === null || _b === void 0 ? void 0 : _b.call(_a);
                (_d = (_c = this.cbs).ontext) === null || _d === void 0 ? void 0 : _d.call(_c, value);
                (_f = (_e = this.cbs).oncdataend) === null || _f === void 0 ? void 0 : _f.call(_e);
            }
            else {
                this.oncomment("[CDATA[" + value + "]]");
            }
        };
        Parser.prototype.onerror = function (err) {
            var _a, _b;
            (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, err);
        };
        Parser.prototype.onend = function () {
            var _a, _b;
            if (this.cbs.onclosetag) {
                for (var i = this.stack.length; i > 0; this.cbs.onclosetag(this.stack[--i]))
                    ;
            }
            (_b = (_a = this.cbs).onend) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        /**
         * Resets the parser to a blank state, ready to parse a new HTML document
         */
        Parser.prototype.reset = function () {
            var _a, _b, _c, _d;
            (_b = (_a = this.cbs).onreset) === null || _b === void 0 ? void 0 : _b.call(_a);
            this.tokenizer.reset();
            this.tagname = "";
            this.attribname = "";
            this.attribs = null;
            this.stack = [];
            (_d = (_c = this.cbs).onparserinit) === null || _d === void 0 ? void 0 : _d.call(_c, this);
        };
        /**
         * Resets the parser, then parses a complete document and
         * pushes it to the handler.
         *
         * @param data Document to parse.
         */
        Parser.prototype.parseComplete = function (data) {
            this.reset();
            this.end(data);
        };
        /**
         * Parses a chunk of data and calls the corresponding callbacks.
         *
         * @param chunk Chunk to parse.
         */
        Parser.prototype.write = function (chunk) {
            this.tokenizer.write(chunk);
        };
        /**
         * Parses the end of the buffer and clears the stack, calls onend.
         *
         * @param chunk Optional final chunk to parse.
         */
        Parser.prototype.end = function (chunk) {
            this.tokenizer.end(chunk);
        };
        /**
         * Pauses parsing. The parser won't emit events until `resume` is called.
         */
        Parser.prototype.pause = function () {
            this.tokenizer.pause();
        };
        /**
         * Resumes parsing after `pause` was called.
         */
        Parser.prototype.resume = function () {
            this.tokenizer.resume();
        };
        /**
         * Alias of `write`, for backwards compatibility.
         *
         * @param chunk Chunk to parse.
         * @deprecated
         */
        Parser.prototype.parseChunk = function (chunk) {
            this.write(chunk);
        };
        /**
         * Alias of `end`, for backwards compatibility.
         *
         * @param chunk Optional final chunk to parse.
         * @deprecated
         */
        Parser.prototype.done = function (chunk) {
            this.end(chunk);
        };
        return Parser;
    }());
    exports.Parser = Parser;
    });

    var lib$5 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Doctype = exports.CDATA = exports.Tag = exports.Style = exports.Script = exports.Comment = exports.Directive = exports.Text = exports.Root = exports.isTag = exports.ElementType = void 0;
    /** Types of elements found in htmlparser2's DOM */
    var ElementType;
    (function (ElementType) {
        /** Type for the root element of a document */
        ElementType["Root"] = "root";
        /** Type for Text */
        ElementType["Text"] = "text";
        /** Type for <? ... ?> */
        ElementType["Directive"] = "directive";
        /** Type for <!-- ... --> */
        ElementType["Comment"] = "comment";
        /** Type for <script> tags */
        ElementType["Script"] = "script";
        /** Type for <style> tags */
        ElementType["Style"] = "style";
        /** Type for Any tag */
        ElementType["Tag"] = "tag";
        /** Type for <![CDATA[ ... ]]> */
        ElementType["CDATA"] = "cdata";
        /** Type for <!doctype ...> */
        ElementType["Doctype"] = "doctype";
    })(ElementType = exports.ElementType || (exports.ElementType = {}));
    /**
     * Tests whether an element is a tag or not.
     *
     * @param elem Element to test
     */
    function isTag(elem) {
        return (elem.type === ElementType.Tag ||
            elem.type === ElementType.Script ||
            elem.type === ElementType.Style);
    }
    exports.isTag = isTag;
    // Exports for backwards compatibility
    /** Type for the root element of a document */
    exports.Root = ElementType.Root;
    /** Type for Text */
    exports.Text = ElementType.Text;
    /** Type for <? ... ?> */
    exports.Directive = ElementType.Directive;
    /** Type for <!-- ... --> */
    exports.Comment = ElementType.Comment;
    /** Type for <script> tags */
    exports.Script = ElementType.Script;
    /** Type for <style> tags */
    exports.Style = ElementType.Style;
    /** Type for Any tag */
    exports.Tag = ElementType.Tag;
    /** Type for <![CDATA[ ... ]]> */
    exports.CDATA = ElementType.CDATA;
    /** Type for <!doctype ...> */
    exports.Doctype = ElementType.Doctype;
    });

    var node = createCommonjsModule(function (module, exports) {
    var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            if (typeof b !== "function" && b !== null)
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cloneNode = exports.hasChildren = exports.isDocument = exports.isDirective = exports.isComment = exports.isText = exports.isCDATA = exports.isTag = exports.Element = exports.Document = exports.NodeWithChildren = exports.ProcessingInstruction = exports.Comment = exports.Text = exports.DataNode = exports.Node = void 0;

    var nodeTypes = new Map([
        [lib$5.ElementType.Tag, 1],
        [lib$5.ElementType.Script, 1],
        [lib$5.ElementType.Style, 1],
        [lib$5.ElementType.Directive, 1],
        [lib$5.ElementType.Text, 3],
        [lib$5.ElementType.CDATA, 4],
        [lib$5.ElementType.Comment, 8],
        [lib$5.ElementType.Root, 9],
    ]);
    /**
     * This object will be used as the prototype for Nodes when creating a
     * DOM-Level-1-compliant structure.
     */
    var Node = /** @class */ (function () {
        /**
         *
         * @param type The type of the node.
         */
        function Node(type) {
            this.type = type;
            /** Parent of the node */
            this.parent = null;
            /** Previous sibling */
            this.prev = null;
            /** Next sibling */
            this.next = null;
            /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
            this.startIndex = null;
            /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
            this.endIndex = null;
        }
        Object.defineProperty(Node.prototype, "nodeType", {
            // Read-only aliases
            get: function () {
                var _a;
                return (_a = nodeTypes.get(this.type)) !== null && _a !== void 0 ? _a : 1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Node.prototype, "parentNode", {
            // Read-write aliases for properties
            get: function () {
                return this.parent;
            },
            set: function (parent) {
                this.parent = parent;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Node.prototype, "previousSibling", {
            get: function () {
                return this.prev;
            },
            set: function (prev) {
                this.prev = prev;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Node.prototype, "nextSibling", {
            get: function () {
                return this.next;
            },
            set: function (next) {
                this.next = next;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Clone this node, and optionally its children.
         *
         * @param recursive Clone child nodes as well.
         * @returns A clone of the node.
         */
        Node.prototype.cloneNode = function (recursive) {
            if (recursive === void 0) { recursive = false; }
            return cloneNode(this, recursive);
        };
        return Node;
    }());
    exports.Node = Node;
    var DataNode = /** @class */ (function (_super) {
        __extends(DataNode, _super);
        /**
         * @param type The type of the node
         * @param data The content of the data node
         */
        function DataNode(type, data) {
            var _this = _super.call(this, type) || this;
            _this.data = data;
            return _this;
        }
        Object.defineProperty(DataNode.prototype, "nodeValue", {
            get: function () {
                return this.data;
            },
            set: function (data) {
                this.data = data;
            },
            enumerable: false,
            configurable: true
        });
        return DataNode;
    }(Node));
    exports.DataNode = DataNode;
    var Text = /** @class */ (function (_super) {
        __extends(Text, _super);
        function Text(data) {
            return _super.call(this, lib$5.ElementType.Text, data) || this;
        }
        return Text;
    }(DataNode));
    exports.Text = Text;
    var Comment = /** @class */ (function (_super) {
        __extends(Comment, _super);
        function Comment(data) {
            return _super.call(this, lib$5.ElementType.Comment, data) || this;
        }
        return Comment;
    }(DataNode));
    exports.Comment = Comment;
    var ProcessingInstruction = /** @class */ (function (_super) {
        __extends(ProcessingInstruction, _super);
        function ProcessingInstruction(name, data) {
            var _this = _super.call(this, lib$5.ElementType.Directive, data) || this;
            _this.name = name;
            return _this;
        }
        return ProcessingInstruction;
    }(DataNode));
    exports.ProcessingInstruction = ProcessingInstruction;
    /**
     * A `Node` that can have children.
     */
    var NodeWithChildren = /** @class */ (function (_super) {
        __extends(NodeWithChildren, _super);
        /**
         * @param type Type of the node.
         * @param children Children of the node. Only certain node types can have children.
         */
        function NodeWithChildren(type, children) {
            var _this = _super.call(this, type) || this;
            _this.children = children;
            return _this;
        }
        Object.defineProperty(NodeWithChildren.prototype, "firstChild", {
            // Aliases
            get: function () {
                var _a;
                return (_a = this.children[0]) !== null && _a !== void 0 ? _a : null;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(NodeWithChildren.prototype, "lastChild", {
            get: function () {
                return this.children.length > 0
                    ? this.children[this.children.length - 1]
                    : null;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(NodeWithChildren.prototype, "childNodes", {
            get: function () {
                return this.children;
            },
            set: function (children) {
                this.children = children;
            },
            enumerable: false,
            configurable: true
        });
        return NodeWithChildren;
    }(Node));
    exports.NodeWithChildren = NodeWithChildren;
    var Document = /** @class */ (function (_super) {
        __extends(Document, _super);
        function Document(children) {
            return _super.call(this, lib$5.ElementType.Root, children) || this;
        }
        return Document;
    }(NodeWithChildren));
    exports.Document = Document;
    var Element = /** @class */ (function (_super) {
        __extends(Element, _super);
        /**
         * @param name Name of the tag, eg. `div`, `span`.
         * @param attribs Object mapping attribute names to attribute values.
         * @param children Children of the node.
         */
        function Element(name, attribs, children, type) {
            if (children === void 0) { children = []; }
            if (type === void 0) { type = name === "script"
                ? lib$5.ElementType.Script
                : name === "style"
                    ? lib$5.ElementType.Style
                    : lib$5.ElementType.Tag; }
            var _this = _super.call(this, type, children) || this;
            _this.name = name;
            _this.attribs = attribs;
            return _this;
        }
        Object.defineProperty(Element.prototype, "tagName", {
            // DOM Level 1 aliases
            get: function () {
                return this.name;
            },
            set: function (name) {
                this.name = name;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Element.prototype, "attributes", {
            get: function () {
                var _this = this;
                return Object.keys(this.attribs).map(function (name) {
                    var _a, _b;
                    return ({
                        name: name,
                        value: _this.attribs[name],
                        namespace: (_a = _this["x-attribsNamespace"]) === null || _a === void 0 ? void 0 : _a[name],
                        prefix: (_b = _this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name],
                    });
                });
            },
            enumerable: false,
            configurable: true
        });
        return Element;
    }(NodeWithChildren));
    exports.Element = Element;
    /**
     * @param node Node to check.
     * @returns `true` if the node is a `Element`, `false` otherwise.
     */
    function isTag(node) {
        return lib$5.isTag(node);
    }
    exports.isTag = isTag;
    /**
     * @param node Node to check.
     * @returns `true` if the node has the type `CDATA`, `false` otherwise.
     */
    function isCDATA(node) {
        return node.type === lib$5.ElementType.CDATA;
    }
    exports.isCDATA = isCDATA;
    /**
     * @param node Node to check.
     * @returns `true` if the node has the type `Text`, `false` otherwise.
     */
    function isText(node) {
        return node.type === lib$5.ElementType.Text;
    }
    exports.isText = isText;
    /**
     * @param node Node to check.
     * @returns `true` if the node has the type `Comment`, `false` otherwise.
     */
    function isComment(node) {
        return node.type === lib$5.ElementType.Comment;
    }
    exports.isComment = isComment;
    /**
     * @param node Node to check.
     * @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
     */
    function isDirective(node) {
        return node.type === lib$5.ElementType.Directive;
    }
    exports.isDirective = isDirective;
    /**
     * @param node Node to check.
     * @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
     */
    function isDocument(node) {
        return node.type === lib$5.ElementType.Root;
    }
    exports.isDocument = isDocument;
    /**
     * @param node Node to check.
     * @returns `true` if the node is a `NodeWithChildren` (has children), `false` otherwise.
     */
    function hasChildren(node) {
        return Object.prototype.hasOwnProperty.call(node, "children");
    }
    exports.hasChildren = hasChildren;
    /**
     * Clone a node, and optionally its children.
     *
     * @param recursive Clone child nodes as well.
     * @returns A clone of the node.
     */
    function cloneNode(node, recursive) {
        if (recursive === void 0) { recursive = false; }
        var result;
        if (isText(node)) {
            result = new Text(node.data);
        }
        else if (isComment(node)) {
            result = new Comment(node.data);
        }
        else if (isTag(node)) {
            var children = recursive ? cloneChildren(node.children) : [];
            var clone_1 = new Element(node.name, __assign({}, node.attribs), children);
            children.forEach(function (child) { return (child.parent = clone_1); });
            if (node["x-attribsNamespace"]) {
                clone_1["x-attribsNamespace"] = __assign({}, node["x-attribsNamespace"]);
            }
            if (node["x-attribsPrefix"]) {
                clone_1["x-attribsPrefix"] = __assign({}, node["x-attribsPrefix"]);
            }
            result = clone_1;
        }
        else if (isCDATA(node)) {
            var children = recursive ? cloneChildren(node.children) : [];
            var clone_2 = new NodeWithChildren(lib$5.ElementType.CDATA, children);
            children.forEach(function (child) { return (child.parent = clone_2); });
            result = clone_2;
        }
        else if (isDocument(node)) {
            var children = recursive ? cloneChildren(node.children) : [];
            var clone_3 = new Document(children);
            children.forEach(function (child) { return (child.parent = clone_3); });
            if (node["x-mode"]) {
                clone_3["x-mode"] = node["x-mode"];
            }
            result = clone_3;
        }
        else if (isDirective(node)) {
            var instruction = new ProcessingInstruction(node.name, node.data);
            if (node["x-name"] != null) {
                instruction["x-name"] = node["x-name"];
                instruction["x-publicId"] = node["x-publicId"];
                instruction["x-systemId"] = node["x-systemId"];
            }
            result = instruction;
        }
        else {
            throw new Error("Not implemented yet: " + node.type);
        }
        result.startIndex = node.startIndex;
        result.endIndex = node.endIndex;
        return result;
    }
    exports.cloneNode = cloneNode;
    function cloneChildren(childs) {
        var children = childs.map(function (child) { return cloneNode(child, true); });
        for (var i = 1; i < children.length; i++) {
            children[i].prev = children[i - 1];
            children[i - 1].next = children[i];
        }
        return children;
    }
    });

    var lib$4 = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DomHandler = void 0;


    __exportStar(node, exports);
    var reWhitespace = /\s+/g;
    // Default options
    var defaultOpts = {
        normalizeWhitespace: false,
        withStartIndices: false,
        withEndIndices: false,
    };
    var DomHandler = /** @class */ (function () {
        /**
         * @param callback Called once parsing has completed.
         * @param options Settings for the handler.
         * @param elementCB Callback whenever a tag is closed.
         */
        function DomHandler(callback, options, elementCB) {
            /** The elements of the DOM */
            this.dom = [];
            /** The root element for the DOM */
            this.root = new node.Document(this.dom);
            /** Indicated whether parsing has been completed. */
            this.done = false;
            /** Stack of open tags. */
            this.tagStack = [this.root];
            /** A data node that is still being written to. */
            this.lastNode = null;
            /** Reference to the parser instance. Used for location information. */
            this.parser = null;
            // Make it possible to skip arguments, for backwards-compatibility
            if (typeof options === "function") {
                elementCB = options;
                options = defaultOpts;
            }
            if (typeof callback === "object") {
                options = callback;
                callback = undefined;
            }
            this.callback = callback !== null && callback !== void 0 ? callback : null;
            this.options = options !== null && options !== void 0 ? options : defaultOpts;
            this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
        }
        DomHandler.prototype.onparserinit = function (parser) {
            this.parser = parser;
        };
        // Resets the handler back to starting state
        DomHandler.prototype.onreset = function () {
            var _a;
            this.dom = [];
            this.root = new node.Document(this.dom);
            this.done = false;
            this.tagStack = [this.root];
            this.lastNode = null;
            this.parser = (_a = this.parser) !== null && _a !== void 0 ? _a : null;
        };
        // Signals the handler that parsing is done
        DomHandler.prototype.onend = function () {
            if (this.done)
                return;
            this.done = true;
            this.parser = null;
            this.handleCallback(null);
        };
        DomHandler.prototype.onerror = function (error) {
            this.handleCallback(error);
        };
        DomHandler.prototype.onclosetag = function () {
            this.lastNode = null;
            var elem = this.tagStack.pop();
            if (this.options.withEndIndices) {
                elem.endIndex = this.parser.endIndex;
            }
            if (this.elementCB)
                this.elementCB(elem);
        };
        DomHandler.prototype.onopentag = function (name, attribs) {
            var type = this.options.xmlMode ? lib$5.ElementType.Tag : undefined;
            var element = new node.Element(name, attribs, undefined, type);
            this.addNode(element);
            this.tagStack.push(element);
        };
        DomHandler.prototype.ontext = function (data) {
            var normalizeWhitespace = this.options.normalizeWhitespace;
            var lastNode = this.lastNode;
            if (lastNode && lastNode.type === lib$5.ElementType.Text) {
                if (normalizeWhitespace) {
                    lastNode.data = (lastNode.data + data).replace(reWhitespace, " ");
                }
                else {
                    lastNode.data += data;
                }
            }
            else {
                if (normalizeWhitespace) {
                    data = data.replace(reWhitespace, " ");
                }
                var node$1 = new node.Text(data);
                this.addNode(node$1);
                this.lastNode = node$1;
            }
        };
        DomHandler.prototype.oncomment = function (data) {
            if (this.lastNode && this.lastNode.type === lib$5.ElementType.Comment) {
                this.lastNode.data += data;
                return;
            }
            var node$1 = new node.Comment(data);
            this.addNode(node$1);
            this.lastNode = node$1;
        };
        DomHandler.prototype.oncommentend = function () {
            this.lastNode = null;
        };
        DomHandler.prototype.oncdatastart = function () {
            var text = new node.Text("");
            var node$1 = new node.NodeWithChildren(lib$5.ElementType.CDATA, [text]);
            this.addNode(node$1);
            text.parent = node$1;
            this.lastNode = text;
        };
        DomHandler.prototype.oncdataend = function () {
            this.lastNode = null;
        };
        DomHandler.prototype.onprocessinginstruction = function (name, data) {
            var node$1 = new node.ProcessingInstruction(name, data);
            this.addNode(node$1);
        };
        DomHandler.prototype.handleCallback = function (error) {
            if (typeof this.callback === "function") {
                this.callback(error, this.dom);
            }
            else if (error) {
                throw error;
            }
        };
        DomHandler.prototype.addNode = function (node) {
            var parent = this.tagStack[this.tagStack.length - 1];
            var previousSibling = parent.children[parent.children.length - 1];
            if (this.options.withStartIndices) {
                node.startIndex = this.parser.startIndex;
            }
            if (this.options.withEndIndices) {
                node.endIndex = this.parser.endIndex;
            }
            parent.children.push(node);
            if (previousSibling) {
                node.prev = previousSibling;
                previousSibling.next = node;
            }
            node.parent = parent;
            this.lastNode = null;
        };
        return DomHandler;
    }());
    exports.DomHandler = DomHandler;
    exports.default = DomHandler;
    });

    var decode = createCommonjsModule(function (module, exports) {
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
    var entities_json_1 = __importDefault(require$$1$1);
    var legacy_json_1 = __importDefault(require$$1);
    var xml_json_1 = __importDefault(require$$0);
    var decode_codepoint_1 = __importDefault(decode_codepoint);
    var strictEntityRe = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
    exports.decodeXML = getStrictDecoder(xml_json_1.default);
    exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
    function getStrictDecoder(map) {
        var replace = getReplacer(map);
        return function (str) { return String(str).replace(strictEntityRe, replace); };
    }
    var sorter = function (a, b) { return (a < b ? 1 : -1); };
    exports.decodeHTML = (function () {
        var legacy = Object.keys(legacy_json_1.default).sort(sorter);
        var keys = Object.keys(entities_json_1.default).sort(sorter);
        for (var i = 0, j = 0; i < keys.length; i++) {
            if (legacy[j] === keys[i]) {
                keys[i] += ";?";
                j++;
            }
            else {
                keys[i] += ";";
            }
        }
        var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
        var replace = getReplacer(entities_json_1.default);
        function replacer(str) {
            if (str.substr(-1) !== ";")
                str += ";";
            return replace(str);
        }
        // TODO consider creating a merged map
        return function (str) { return String(str).replace(re, replacer); };
    })();
    function getReplacer(map) {
        return function replace(str) {
            if (str.charAt(1) === "#") {
                var secondChar = str.charAt(2);
                if (secondChar === "X" || secondChar === "x") {
                    return decode_codepoint_1.default(parseInt(str.substr(3), 16));
                }
                return decode_codepoint_1.default(parseInt(str.substr(2), 10));
            }
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            return map[str.slice(1, -1)] || str;
        };
    }
    });

    var encode = createCommonjsModule(function (module, exports) {
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = void 0;
    var xml_json_1 = __importDefault(require$$0);
    var inverseXML = getInverseObj(xml_json_1.default);
    var xmlReplacer = getInverseReplacer(inverseXML);
    /**
     * Encodes all non-ASCII characters, as well as characters not valid in XML
     * documents using XML entities.
     *
     * If a character has no equivalent entity, a
     * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
     */
    exports.encodeXML = getASCIIEncoder(inverseXML);
    var entities_json_1 = __importDefault(require$$1$1);
    var inverseHTML = getInverseObj(entities_json_1.default);
    var htmlReplacer = getInverseReplacer(inverseHTML);
    /**
     * Encodes all entities and non-ASCII characters in the input.
     *
     * This includes characters that are valid ASCII characters in HTML documents.
     * For example `#` will be encoded as `&num;`. To get a more compact output,
     * consider using the `encodeNonAsciiHTML` function.
     *
     * If a character has no equivalent entity, a
     * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
     */
    exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
    /**
     * Encodes all non-ASCII characters, as well as characters not valid in HTML
     * documents using HTML entities.
     *
     * If a character has no equivalent entity, a
     * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
     */
    exports.encodeNonAsciiHTML = getASCIIEncoder(inverseHTML);
    function getInverseObj(obj) {
        return Object.keys(obj)
            .sort()
            .reduce(function (inverse, name) {
            inverse[obj[name]] = "&" + name + ";";
            return inverse;
        }, {});
    }
    function getInverseReplacer(inverse) {
        var single = [];
        var multiple = [];
        for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
            var k = _a[_i];
            if (k.length === 1) {
                // Add value to single array
                single.push("\\" + k);
            }
            else {
                // Add value to multiple array
                multiple.push(k);
            }
        }
        // Add ranges to single characters.
        single.sort();
        for (var start = 0; start < single.length - 1; start++) {
            // Find the end of a run of characters
            var end = start;
            while (end < single.length - 1 &&
                single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
                end += 1;
            }
            var count = 1 + end - start;
            // We want to replace at least three characters
            if (count < 3)
                continue;
            single.splice(start, count, single[start] + "-" + single[end]);
        }
        multiple.unshift("[" + single.join("") + "]");
        return new RegExp(multiple.join("|"), "g");
    }
    // /[^\0-\x7F]/gu
    var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
    var getCodePoint = 
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.prototype.codePointAt != null
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            function (str) { return str.codePointAt(0); }
        : // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            function (c) {
                return (c.charCodeAt(0) - 0xd800) * 0x400 +
                    c.charCodeAt(1) -
                    0xdc00 +
                    0x10000;
            };
    function singleCharReplacer(c) {
        return "&#x" + (c.length > 1 ? getCodePoint(c) : c.charCodeAt(0))
            .toString(16)
            .toUpperCase() + ";";
    }
    function getInverse(inverse, re) {
        return function (data) {
            return data
                .replace(re, function (name) { return inverse[name]; })
                .replace(reNonASCII, singleCharReplacer);
        };
    }
    var reEscapeChars = new RegExp(xmlReplacer.source + "|" + reNonASCII.source, "g");
    /**
     * Encodes all non-ASCII characters, as well as characters not valid in XML
     * documents using numeric hexadecimal reference (eg. `&#xfc;`).
     *
     * Have a look at `escapeUTF8` if you want a more concise output at the expense
     * of reduced transportability.
     *
     * @param data String to escape.
     */
    function escape(data) {
        return data.replace(reEscapeChars, singleCharReplacer);
    }
    exports.escape = escape;
    /**
     * Encodes all characters not valid in XML documents using numeric hexadecimal
     * reference (eg. `&#xfc;`).
     *
     * Note that the output will be character-set dependent.
     *
     * @param data String to escape.
     */
    function escapeUTF8(data) {
        return data.replace(xmlReplacer, singleCharReplacer);
    }
    exports.escapeUTF8 = escapeUTF8;
    function getASCIIEncoder(obj) {
        return function (data) {
            return data.replace(reEscapeChars, function (c) { return obj[c] || singleCharReplacer(c); });
        };
    }
    });

    var lib$3 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.encodeHTML5 = exports.encodeHTML4 = exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = void 0;


    /**
     * Decodes a string with entities.
     *
     * @param data String to decode.
     * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
     * @deprecated Use `decodeXML` or `decodeHTML` directly.
     */
    function decode$1(data, level) {
        return (!level || level <= 0 ? decode.decodeXML : decode.decodeHTML)(data);
    }
    exports.decode = decode$1;
    /**
     * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
     *
     * @param data String to decode.
     * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
     * @deprecated Use `decodeHTMLStrict` or `decodeXML` directly.
     */
    function decodeStrict(data, level) {
        return (!level || level <= 0 ? decode.decodeXML : decode.decodeHTMLStrict)(data);
    }
    exports.decodeStrict = decodeStrict;
    /**
     * Encodes a string with entities.
     *
     * @param data String to encode.
     * @param level Optional level to encode at. 0 = XML, 1 = HTML. Default is 0.
     * @deprecated Use `encodeHTML`, `encodeXML` or `encodeNonAsciiHTML` directly.
     */
    function encode$1(data, level) {
        return (!level || level <= 0 ? encode.encodeXML : encode.encodeHTML)(data);
    }
    exports.encode = encode$1;
    var encode_2 = encode;
    Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return encode_2.encodeXML; } });
    Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
    Object.defineProperty(exports, "encodeNonAsciiHTML", { enumerable: true, get: function () { return encode_2.encodeNonAsciiHTML; } });
    Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return encode_2.escape; } });
    Object.defineProperty(exports, "escapeUTF8", { enumerable: true, get: function () { return encode_2.escapeUTF8; } });
    // Legacy aliases (deprecated)
    Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
    Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
    var decode_2 = decode;
    Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_2.decodeXML; } });
    Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
    Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
    // Legacy aliases (deprecated)
    Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
    Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
    Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
    Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
    Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_2.decodeXML; } });
    });

    var foreignNames = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.attributeNames = exports.elementNames = void 0;
    exports.elementNames = new Map([
        ["altglyph", "altGlyph"],
        ["altglyphdef", "altGlyphDef"],
        ["altglyphitem", "altGlyphItem"],
        ["animatecolor", "animateColor"],
        ["animatemotion", "animateMotion"],
        ["animatetransform", "animateTransform"],
        ["clippath", "clipPath"],
        ["feblend", "feBlend"],
        ["fecolormatrix", "feColorMatrix"],
        ["fecomponenttransfer", "feComponentTransfer"],
        ["fecomposite", "feComposite"],
        ["feconvolvematrix", "feConvolveMatrix"],
        ["fediffuselighting", "feDiffuseLighting"],
        ["fedisplacementmap", "feDisplacementMap"],
        ["fedistantlight", "feDistantLight"],
        ["fedropshadow", "feDropShadow"],
        ["feflood", "feFlood"],
        ["fefunca", "feFuncA"],
        ["fefuncb", "feFuncB"],
        ["fefuncg", "feFuncG"],
        ["fefuncr", "feFuncR"],
        ["fegaussianblur", "feGaussianBlur"],
        ["feimage", "feImage"],
        ["femerge", "feMerge"],
        ["femergenode", "feMergeNode"],
        ["femorphology", "feMorphology"],
        ["feoffset", "feOffset"],
        ["fepointlight", "fePointLight"],
        ["fespecularlighting", "feSpecularLighting"],
        ["fespotlight", "feSpotLight"],
        ["fetile", "feTile"],
        ["feturbulence", "feTurbulence"],
        ["foreignobject", "foreignObject"],
        ["glyphref", "glyphRef"],
        ["lineargradient", "linearGradient"],
        ["radialgradient", "radialGradient"],
        ["textpath", "textPath"],
    ]);
    exports.attributeNames = new Map([
        ["definitionurl", "definitionURL"],
        ["attributename", "attributeName"],
        ["attributetype", "attributeType"],
        ["basefrequency", "baseFrequency"],
        ["baseprofile", "baseProfile"],
        ["calcmode", "calcMode"],
        ["clippathunits", "clipPathUnits"],
        ["diffuseconstant", "diffuseConstant"],
        ["edgemode", "edgeMode"],
        ["filterunits", "filterUnits"],
        ["glyphref", "glyphRef"],
        ["gradienttransform", "gradientTransform"],
        ["gradientunits", "gradientUnits"],
        ["kernelmatrix", "kernelMatrix"],
        ["kernelunitlength", "kernelUnitLength"],
        ["keypoints", "keyPoints"],
        ["keysplines", "keySplines"],
        ["keytimes", "keyTimes"],
        ["lengthadjust", "lengthAdjust"],
        ["limitingconeangle", "limitingConeAngle"],
        ["markerheight", "markerHeight"],
        ["markerunits", "markerUnits"],
        ["markerwidth", "markerWidth"],
        ["maskcontentunits", "maskContentUnits"],
        ["maskunits", "maskUnits"],
        ["numoctaves", "numOctaves"],
        ["pathlength", "pathLength"],
        ["patterncontentunits", "patternContentUnits"],
        ["patterntransform", "patternTransform"],
        ["patternunits", "patternUnits"],
        ["pointsatx", "pointsAtX"],
        ["pointsaty", "pointsAtY"],
        ["pointsatz", "pointsAtZ"],
        ["preservealpha", "preserveAlpha"],
        ["preserveaspectratio", "preserveAspectRatio"],
        ["primitiveunits", "primitiveUnits"],
        ["refx", "refX"],
        ["refy", "refY"],
        ["repeatcount", "repeatCount"],
        ["repeatdur", "repeatDur"],
        ["requiredextensions", "requiredExtensions"],
        ["requiredfeatures", "requiredFeatures"],
        ["specularconstant", "specularConstant"],
        ["specularexponent", "specularExponent"],
        ["spreadmethod", "spreadMethod"],
        ["startoffset", "startOffset"],
        ["stddeviation", "stdDeviation"],
        ["stitchtiles", "stitchTiles"],
        ["surfacescale", "surfaceScale"],
        ["systemlanguage", "systemLanguage"],
        ["tablevalues", "tableValues"],
        ["targetx", "targetX"],
        ["targety", "targetY"],
        ["textlength", "textLength"],
        ["viewbox", "viewBox"],
        ["viewtarget", "viewTarget"],
        ["xchannelselector", "xChannelSelector"],
        ["ychannelselector", "yChannelSelector"],
        ["zoomandpan", "zoomAndPan"],
    ]);
    });

    var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    });
    var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };

    /*
     * Module dependencies
     */
    var ElementType = __importStar(lib$5);

    /**
     * Mixed-case SVG and MathML tags & attributes
     * recognized by the HTML parser.
     *
     * @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
     */

    var unencodedElements = new Set([
        "style",
        "script",
        "xmp",
        "iframe",
        "noembed",
        "noframes",
        "plaintext",
        "noscript",
    ]);
    /**
     * Format attributes
     */
    function formatAttributes(attributes, opts) {
        if (!attributes)
            return;
        return Object.keys(attributes)
            .map(function (key) {
            var _a, _b;
            var value = (_a = attributes[key]) !== null && _a !== void 0 ? _a : "";
            if (opts.xmlMode === "foreign") {
                /* Fix up mixed-case attribute names */
                key = (_b = foreignNames.attributeNames.get(key)) !== null && _b !== void 0 ? _b : key;
            }
            if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
                return key;
            }
            return key + "=\"" + (opts.decodeEntities !== false
                ? lib$3.encodeXML(value)
                : value.replace(/"/g, "&quot;")) + "\"";
        })
            .join(" ");
    }
    /**
     * Self-enclosing tags
     */
    var singleTag = new Set([
        "area",
        "base",
        "basefont",
        "br",
        "col",
        "command",
        "embed",
        "frame",
        "hr",
        "img",
        "input",
        "isindex",
        "keygen",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    ]);
    /**
     * Renders a DOM node or an array of DOM nodes to a string.
     *
     * Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
     *
     * @param node Node to be rendered.
     * @param options Changes serialization behavior
     */
    function render(node, options) {
        if (options === void 0) { options = {}; }
        var nodes = "length" in node ? node : [node];
        var output = "";
        for (var i = 0; i < nodes.length; i++) {
            output += renderNode(nodes[i], options);
        }
        return output;
    }
    var _default = render;
    function renderNode(node, options) {
        switch (node.type) {
            case ElementType.Root:
                return render(node.children, options);
            case ElementType.Directive:
            case ElementType.Doctype:
                return renderDirective(node);
            case ElementType.Comment:
                return renderComment(node);
            case ElementType.CDATA:
                return renderCdata(node);
            case ElementType.Script:
            case ElementType.Style:
            case ElementType.Tag:
                return renderTag(node, options);
            case ElementType.Text:
                return renderText(node, options);
        }
    }
    var foreignModeIntegrationPoints = new Set([
        "mi",
        "mo",
        "mn",
        "ms",
        "mtext",
        "annotation-xml",
        "foreignObject",
        "desc",
        "title",
    ]);
    var foreignElements = new Set(["svg", "math"]);
    function renderTag(elem, opts) {
        var _a;
        // Handle SVG / MathML in HTML
        if (opts.xmlMode === "foreign") {
            /* Fix up mixed-case element names */
            elem.name = (_a = foreignNames.elementNames.get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
            /* Exit foreign mode at integration points */
            if (elem.parent &&
                foreignModeIntegrationPoints.has(elem.parent.name)) {
                opts = __assign(__assign({}, opts), { xmlMode: false });
            }
        }
        if (!opts.xmlMode && foreignElements.has(elem.name)) {
            opts = __assign(__assign({}, opts), { xmlMode: "foreign" });
        }
        var tag = "<" + elem.name;
        var attribs = formatAttributes(elem.attribs, opts);
        if (attribs) {
            tag += " " + attribs;
        }
        if (elem.children.length === 0 &&
            (opts.xmlMode
                ? // In XML mode or foreign mode, and user hasn't explicitly turned off self-closing tags
                    opts.selfClosingTags !== false
                : // User explicitly asked for self-closing tags, even in HTML mode
                    opts.selfClosingTags && singleTag.has(elem.name))) {
            if (!opts.xmlMode)
                tag += " ";
            tag += "/>";
        }
        else {
            tag += ">";
            if (elem.children.length > 0) {
                tag += render(elem.children, opts);
            }
            if (opts.xmlMode || !singleTag.has(elem.name)) {
                tag += "</" + elem.name + ">";
            }
        }
        return tag;
    }
    function renderDirective(elem) {
        return "<" + elem.data + ">";
    }
    function renderText(elem, opts) {
        var data = elem.data || "";
        // If entities weren't decoded, no need to encode them back
        if (opts.decodeEntities !== false &&
            !(!opts.xmlMode &&
                elem.parent &&
                unencodedElements.has(elem.parent.name))) {
            data = lib$3.encodeXML(data);
        }
        return data;
    }
    function renderCdata(elem) {
        return "<![CDATA[" + elem.children[0].data + "]]>";
    }
    function renderComment(elem) {
        return "<!--" + elem.data + "-->";
    }

    var lib$2 = /*#__PURE__*/Object.defineProperty({
    	default: _default
    }, '__esModule', {value: true});

    var stringify$1 = createCommonjsModule(function (module, exports) {
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getText = exports.getInnerHTML = exports.getOuterHTML = void 0;

    var dom_serializer_1 = __importDefault(lib$2);
    /**
     * @param node Node to get the outer HTML of.
     * @param options Options for serialization.
     * @deprecated Use the `dom-serializer` module directly.
     * @returns `node`'s outer HTML.
     */
    function getOuterHTML(node, options) {
        return dom_serializer_1.default(node, options);
    }
    exports.getOuterHTML = getOuterHTML;
    /**
     * @param node Node to get the inner HTML of.
     * @param options Options for serialization.
     * @deprecated Use the `dom-serializer` module directly.
     * @returns `node`'s inner HTML.
     */
    function getInnerHTML(node, options) {
        return lib$4.hasChildren(node)
            ? node.children.map(function (node) { return getOuterHTML(node, options); }).join("")
            : "";
    }
    exports.getInnerHTML = getInnerHTML;
    /**
     * Get a node's inner text.
     *
     * @param node Node to get the inner text of.
     * @returns `node`'s inner text.
     */
    function getText(node) {
        if (Array.isArray(node))
            return node.map(getText).join("");
        if (lib$4.isTag(node))
            return node.name === "br" ? "\n" : getText(node.children);
        if (lib$4.isCDATA(node))
            return getText(node.children);
        if (lib$4.isText(node))
            return node.data;
        return "";
    }
    exports.getText = getText;
    });

    var traversal = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prevElementSibling = exports.nextElementSibling = exports.getName = exports.hasAttrib = exports.getAttributeValue = exports.getSiblings = exports.getParent = exports.getChildren = void 0;

    var emptyArray = [];
    /**
     * Get a node's children.
     *
     * @param elem Node to get the children of.
     * @returns `elem`'s children, or an empty array.
     */
    function getChildren(elem) {
        var _a;
        return (_a = elem.children) !== null && _a !== void 0 ? _a : emptyArray;
    }
    exports.getChildren = getChildren;
    /**
     * Get a node's parent.
     *
     * @param elem Node to get the parent of.
     * @returns `elem`'s parent node.
     */
    function getParent(elem) {
        return elem.parent || null;
    }
    exports.getParent = getParent;
    /**
     * Gets an elements siblings, including the element itself.
     *
     * Attempts to get the children through the element's parent first.
     * If we don't have a parent (the element is a root node),
     * we walk the element's `prev` & `next` to get all remaining nodes.
     *
     * @param elem Element to get the siblings of.
     * @returns `elem`'s siblings.
     */
    function getSiblings(elem) {
        var _a, _b;
        var parent = getParent(elem);
        if (parent != null)
            return getChildren(parent);
        var siblings = [elem];
        var prev = elem.prev, next = elem.next;
        while (prev != null) {
            siblings.unshift(prev);
            (_a = prev, prev = _a.prev);
        }
        while (next != null) {
            siblings.push(next);
            (_b = next, next = _b.next);
        }
        return siblings;
    }
    exports.getSiblings = getSiblings;
    /**
     * Gets an attribute from an element.
     *
     * @param elem Element to check.
     * @param name Attribute name to retrieve.
     * @returns The element's attribute value, or `undefined`.
     */
    function getAttributeValue(elem, name) {
        var _a;
        return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
    }
    exports.getAttributeValue = getAttributeValue;
    /**
     * Checks whether an element has an attribute.
     *
     * @param elem Element to check.
     * @param name Attribute name to look for.
     * @returns Returns whether `elem` has the attribute `name`.
     */
    function hasAttrib(elem, name) {
        return (elem.attribs != null &&
            Object.prototype.hasOwnProperty.call(elem.attribs, name) &&
            elem.attribs[name] != null);
    }
    exports.hasAttrib = hasAttrib;
    /**
     * Get the tag name of an element.
     *
     * @param elem The element to get the name for.
     * @returns The tag name of `elem`.
     */
    function getName(elem) {
        return elem.name;
    }
    exports.getName = getName;
    /**
     * Returns the next element sibling of a node.
     *
     * @param elem The element to get the next sibling of.
     * @returns `elem`'s next sibling that is a tag.
     */
    function nextElementSibling(elem) {
        var _a;
        var next = elem.next;
        while (next !== null && !lib$4.isTag(next))
            (_a = next, next = _a.next);
        return next;
    }
    exports.nextElementSibling = nextElementSibling;
    /**
     * Returns the previous element sibling of a node.
     *
     * @param elem The element to get the previous sibling of.
     * @returns `elem`'s previous sibling that is a tag.
     */
    function prevElementSibling(elem) {
        var _a;
        var prev = elem.prev;
        while (prev !== null && !lib$4.isTag(prev))
            (_a = prev, prev = _a.prev);
        return prev;
    }
    exports.prevElementSibling = prevElementSibling;
    });

    var manipulation = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prepend = exports.prependChild = exports.append = exports.appendChild = exports.replaceElement = exports.removeElement = void 0;
    /**
     * Remove an element from the dom
     *
     * @param elem The element to be removed
     */
    function removeElement(elem) {
        if (elem.prev)
            elem.prev.next = elem.next;
        if (elem.next)
            elem.next.prev = elem.prev;
        if (elem.parent) {
            var childs = elem.parent.children;
            childs.splice(childs.lastIndexOf(elem), 1);
        }
    }
    exports.removeElement = removeElement;
    /**
     * Replace an element in the dom
     *
     * @param elem The element to be replaced
     * @param replacement The element to be added
     */
    function replaceElement(elem, replacement) {
        var prev = (replacement.prev = elem.prev);
        if (prev) {
            prev.next = replacement;
        }
        var next = (replacement.next = elem.next);
        if (next) {
            next.prev = replacement;
        }
        var parent = (replacement.parent = elem.parent);
        if (parent) {
            var childs = parent.children;
            childs[childs.lastIndexOf(elem)] = replacement;
        }
    }
    exports.replaceElement = replaceElement;
    /**
     * Append a child to an element.
     *
     * @param elem The element to append to.
     * @param child The element to be added as a child.
     */
    function appendChild(elem, child) {
        removeElement(child);
        child.next = null;
        child.parent = elem;
        if (elem.children.push(child) > 1) {
            var sibling = elem.children[elem.children.length - 2];
            sibling.next = child;
            child.prev = sibling;
        }
        else {
            child.prev = null;
        }
    }
    exports.appendChild = appendChild;
    /**
     * Append an element after another.
     *
     * @param elem The element to append after.
     * @param next The element be added.
     */
    function append(elem, next) {
        removeElement(next);
        var parent = elem.parent;
        var currNext = elem.next;
        next.next = currNext;
        next.prev = elem;
        elem.next = next;
        next.parent = parent;
        if (currNext) {
            currNext.prev = next;
            if (parent) {
                var childs = parent.children;
                childs.splice(childs.lastIndexOf(currNext), 0, next);
            }
        }
        else if (parent) {
            parent.children.push(next);
        }
    }
    exports.append = append;
    /**
     * Prepend a child to an element.
     *
     * @param elem The element to prepend before.
     * @param child The element to be added as a child.
     */
    function prependChild(elem, child) {
        removeElement(child);
        child.parent = elem;
        child.prev = null;
        if (elem.children.unshift(child) !== 1) {
            var sibling = elem.children[1];
            sibling.prev = child;
            child.next = sibling;
        }
        else {
            child.next = null;
        }
    }
    exports.prependChild = prependChild;
    /**
     * Prepend an element before another.
     *
     * @param elem The element to prepend before.
     * @param prev The element be added.
     */
    function prepend(elem, prev) {
        removeElement(prev);
        var parent = elem.parent;
        if (parent) {
            var childs = parent.children;
            childs.splice(childs.indexOf(elem), 0, prev);
        }
        if (elem.prev) {
            elem.prev.next = prev;
        }
        prev.parent = parent;
        prev.prev = elem.prev;
        prev.next = elem;
        elem.prev = prev;
    }
    exports.prepend = prepend;
    });

    var querying = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findAll = exports.existsOne = exports.findOne = exports.findOneChild = exports.find = exports.filter = void 0;

    /**
     * Search a node and its children for nodes passing a test function.
     *
     * @param test Function to test nodes on.
     * @param node Node to search. Will be included in the result set if it matches.
     * @param recurse Also consider child nodes.
     * @param limit Maximum number of nodes to return.
     * @returns All nodes passing `test`.
     */
    function filter(test, node, recurse, limit) {
        if (recurse === void 0) { recurse = true; }
        if (limit === void 0) { limit = Infinity; }
        if (!Array.isArray(node))
            node = [node];
        return find(test, node, recurse, limit);
    }
    exports.filter = filter;
    /**
     * Search an array of node and its children for nodes passing a test function.
     *
     * @param test Function to test nodes on.
     * @param nodes Array of nodes to search.
     * @param recurse Also consider child nodes.
     * @param limit Maximum number of nodes to return.
     * @returns All nodes passing `test`.
     */
    function find(test, nodes, recurse, limit) {
        var result = [];
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var elem = nodes_1[_i];
            if (test(elem)) {
                result.push(elem);
                if (--limit <= 0)
                    break;
            }
            if (recurse && lib$4.hasChildren(elem) && elem.children.length > 0) {
                var children = find(test, elem.children, recurse, limit);
                result.push.apply(result, children);
                limit -= children.length;
                if (limit <= 0)
                    break;
            }
        }
        return result;
    }
    exports.find = find;
    /**
     * Finds the first element inside of an array that matches a test function.
     *
     * @param test Function to test nodes on.
     * @param nodes Array of nodes to search.
     * @returns The first node in the array that passes `test`.
     */
    function findOneChild(test, nodes) {
        return nodes.find(test);
    }
    exports.findOneChild = findOneChild;
    /**
     * Finds one element in a tree that passes a test.
     *
     * @param test Function to test nodes on.
     * @param nodes Array of nodes to search.
     * @param recurse Also consider child nodes.
     * @returns The first child node that passes `test`.
     */
    function findOne(test, nodes, recurse) {
        if (recurse === void 0) { recurse = true; }
        var elem = null;
        for (var i = 0; i < nodes.length && !elem; i++) {
            var checked = nodes[i];
            if (!lib$4.isTag(checked)) {
                continue;
            }
            else if (test(checked)) {
                elem = checked;
            }
            else if (recurse && checked.children.length > 0) {
                elem = findOne(test, checked.children);
            }
        }
        return elem;
    }
    exports.findOne = findOne;
    /**
     * @param test Function to test nodes on.
     * @param nodes Array of nodes to search.
     * @returns Whether a tree of nodes contains at least one node passing a test.
     */
    function existsOne(test, nodes) {
        return nodes.some(function (checked) {
            return lib$4.isTag(checked) &&
                (test(checked) ||
                    (checked.children.length > 0 &&
                        existsOne(test, checked.children)));
        });
    }
    exports.existsOne = existsOne;
    /**
     * Search and array of nodes and its children for nodes passing a test function.
     *
     * Same as `find`, only with less options, leading to reduced complexity.
     *
     * @param test Function to test nodes on.
     * @param nodes Array of nodes to search.
     * @returns All nodes passing `test`.
     */
    function findAll(test, nodes) {
        var _a;
        var result = [];
        var stack = nodes.filter(lib$4.isTag);
        var elem;
        while ((elem = stack.shift())) {
            var children = (_a = elem.children) === null || _a === void 0 ? void 0 : _a.filter(lib$4.isTag);
            if (children && children.length > 0) {
                stack.unshift.apply(stack, children);
            }
            if (test(elem))
                result.push(elem);
        }
        return result;
    }
    exports.findAll = findAll;
    });

    var legacy = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getElementsByTagType = exports.getElementsByTagName = exports.getElementById = exports.getElements = exports.testElement = void 0;


    var Checks = {
        tag_name: function (name) {
            if (typeof name === "function") {
                return function (elem) { return lib$4.isTag(elem) && name(elem.name); };
            }
            else if (name === "*") {
                return lib$4.isTag;
            }
            return function (elem) { return lib$4.isTag(elem) && elem.name === name; };
        },
        tag_type: function (type) {
            if (typeof type === "function") {
                return function (elem) { return type(elem.type); };
            }
            return function (elem) { return elem.type === type; };
        },
        tag_contains: function (data) {
            if (typeof data === "function") {
                return function (elem) { return lib$4.isText(elem) && data(elem.data); };
            }
            return function (elem) { return lib$4.isText(elem) && elem.data === data; };
        },
    };
    /**
     * @param attrib Attribute to check.
     * @param value Attribute value to look for.
     * @returns A function to check whether the a node has an attribute with a particular value.
     */
    function getAttribCheck(attrib, value) {
        if (typeof value === "function") {
            return function (elem) { return lib$4.isTag(elem) && value(elem.attribs[attrib]); };
        }
        return function (elem) { return lib$4.isTag(elem) && elem.attribs[attrib] === value; };
    }
    /**
     * @param a First function to combine.
     * @param b Second function to combine.
     * @returns A function taking a node and returning `true` if either
     * of the input functions returns `true` for the node.
     */
    function combineFuncs(a, b) {
        return function (elem) { return a(elem) || b(elem); };
    }
    /**
     * @param options An object describing nodes to look for.
     * @returns A function executing all checks in `options` and returning `true`
     * if any of them match a node.
     */
    function compileTest(options) {
        var funcs = Object.keys(options).map(function (key) {
            var value = options[key];
            return key in Checks
                ? Checks[key](value)
                : getAttribCheck(key, value);
        });
        return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
    }
    /**
     * @param options An object describing nodes to look for.
     * @param node The element to test.
     * @returns Whether the element matches the description in `options`.
     */
    function testElement(options, node) {
        var test = compileTest(options);
        return test ? test(node) : true;
    }
    exports.testElement = testElement;
    /**
     * @param options An object describing nodes to look for.
     * @param nodes Nodes to search through.
     * @param recurse Also consider child nodes.
     * @param limit Maximum number of nodes to return.
     * @returns All nodes that match `options`.
     */
    function getElements(options, nodes, recurse, limit) {
        if (limit === void 0) { limit = Infinity; }
        var test = compileTest(options);
        return test ? querying.filter(test, nodes, recurse, limit) : [];
    }
    exports.getElements = getElements;
    /**
     * @param id The unique ID attribute value to look for.
     * @param nodes Nodes to search through.
     * @param recurse Also consider child nodes.
     * @returns The node with the supplied ID.
     */
    function getElementById(id, nodes, recurse) {
        if (recurse === void 0) { recurse = true; }
        if (!Array.isArray(nodes))
            nodes = [nodes];
        return querying.findOne(getAttribCheck("id", id), nodes, recurse);
    }
    exports.getElementById = getElementById;
    /**
     * @param tagName Tag name to search for.
     * @param nodes Nodes to search through.
     * @param recurse Also consider child nodes.
     * @param limit Maximum number of nodes to return.
     * @returns All nodes with the supplied `tagName`.
     */
    function getElementsByTagName(tagName, nodes, recurse, limit) {
        if (recurse === void 0) { recurse = true; }
        if (limit === void 0) { limit = Infinity; }
        return querying.filter(Checks.tag_name(tagName), nodes, recurse, limit);
    }
    exports.getElementsByTagName = getElementsByTagName;
    /**
     * @param type Element type to look for.
     * @param nodes Nodes to search through.
     * @param recurse Also consider child nodes.
     * @param limit Maximum number of nodes to return.
     * @returns All nodes with the supplied `type`.
     */
    function getElementsByTagType(type, nodes, recurse, limit) {
        if (recurse === void 0) { recurse = true; }
        if (limit === void 0) { limit = Infinity; }
        return querying.filter(Checks.tag_type(type), nodes, recurse, limit);
    }
    exports.getElementsByTagType = getElementsByTagType;
    });

    var helpers = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.uniqueSort = exports.compareDocumentPosition = exports.removeSubsets = void 0;

    /**
     * Given an array of nodes, remove any member that is contained by another.
     *
     * @param nodes Nodes to filter.
     * @returns Remaining nodes that aren't subtrees of each other.
     */
    function removeSubsets(nodes) {
        var idx = nodes.length;
        /*
         * Check if each node (or one of its ancestors) is already contained in the
         * array.
         */
        while (--idx >= 0) {
            var node = nodes[idx];
            /*
             * Remove the node if it is not unique.
             * We are going through the array from the end, so we only
             * have to check nodes that preceed the node under consideration in the array.
             */
            if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
                nodes.splice(idx, 1);
                continue;
            }
            for (var ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
                if (nodes.includes(ancestor)) {
                    nodes.splice(idx, 1);
                    break;
                }
            }
        }
        return nodes;
    }
    exports.removeSubsets = removeSubsets;
    /**
     * Compare the position of one node against another node in any other document.
     * The return value is a bitmask with the following values:
     *
     * Document order:
     * > There is an ordering, document order, defined on all the nodes in the
     * > document corresponding to the order in which the first character of the
     * > XML representation of each node occurs in the XML representation of the
     * > document after expansion of general entities. Thus, the document element
     * > node will be the first node. Element nodes occur before their children.
     * > Thus, document order orders element nodes in order of the occurrence of
     * > their start-tag in the XML (after expansion of entities). The attribute
     * > nodes of an element occur after the element and before its children. The
     * > relative order of attribute nodes is implementation-dependent./
     *
     * Source:
     * http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
     *
     * @param nodeA The first node to use in the comparison
     * @param nodeB The second node to use in the comparison
     * @returns A bitmask describing the input nodes' relative position.
     *
     * See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
     * a description of these values.
     */
    function compareDocumentPosition(nodeA, nodeB) {
        var aParents = [];
        var bParents = [];
        if (nodeA === nodeB) {
            return 0;
        }
        var current = lib$4.hasChildren(nodeA) ? nodeA : nodeA.parent;
        while (current) {
            aParents.unshift(current);
            current = current.parent;
        }
        current = lib$4.hasChildren(nodeB) ? nodeB : nodeB.parent;
        while (current) {
            bParents.unshift(current);
            current = current.parent;
        }
        var maxIdx = Math.min(aParents.length, bParents.length);
        var idx = 0;
        while (idx < maxIdx && aParents[idx] === bParents[idx]) {
            idx++;
        }
        if (idx === 0) {
            return 1 /* DISCONNECTED */;
        }
        var sharedParent = aParents[idx - 1];
        var siblings = sharedParent.children;
        var aSibling = aParents[idx];
        var bSibling = bParents[idx];
        if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
            if (sharedParent === nodeB) {
                return 4 /* FOLLOWING */ | 16 /* CONTAINED_BY */;
            }
            return 4 /* FOLLOWING */;
        }
        if (sharedParent === nodeA) {
            return 2 /* PRECEDING */ | 8 /* CONTAINS */;
        }
        return 2 /* PRECEDING */;
    }
    exports.compareDocumentPosition = compareDocumentPosition;
    /**
     * Sort an array of nodes based on their relative position in the document and
     * remove any duplicate nodes. If the array contains nodes that do not belong
     * to the same document, sort order is unspecified.
     *
     * @param nodes Array of DOM nodes.
     * @returns Collection of unique nodes, sorted in document order.
     */
    function uniqueSort(nodes) {
        nodes = nodes.filter(function (node, i, arr) { return !arr.includes(node, i + 1); });
        nodes.sort(function (a, b) {
            var relative = compareDocumentPosition(a, b);
            if (relative & 2 /* PRECEDING */) {
                return -1;
            }
            else if (relative & 4 /* FOLLOWING */) {
                return 1;
            }
            return 0;
        });
        return nodes;
    }
    exports.uniqueSort = uniqueSort;
    });

    var lib$1 = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasChildren = exports.isDocument = exports.isComment = exports.isText = exports.isCDATA = exports.isTag = void 0;
    __exportStar(stringify$1, exports);
    __exportStar(traversal, exports);
    __exportStar(manipulation, exports);
    __exportStar(querying, exports);
    __exportStar(legacy, exports);
    __exportStar(helpers, exports);

    Object.defineProperty(exports, "isTag", { enumerable: true, get: function () { return lib$4.isTag; } });
    Object.defineProperty(exports, "isCDATA", { enumerable: true, get: function () { return lib$4.isCDATA; } });
    Object.defineProperty(exports, "isText", { enumerable: true, get: function () { return lib$4.isText; } });
    Object.defineProperty(exports, "isComment", { enumerable: true, get: function () { return lib$4.isComment; } });
    Object.defineProperty(exports, "isDocument", { enumerable: true, get: function () { return lib$4.isDocument; } });
    Object.defineProperty(exports, "hasChildren", { enumerable: true, get: function () { return lib$4.hasChildren; } });
    });

    var FeedHandler_1 = createCommonjsModule(function (module, exports) {
    var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            if (typeof b !== "function" && b !== null)
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    });
    var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseFeed = exports.FeedHandler = void 0;
    var domhandler_1 = __importDefault(lib$4);
    var DomUtils = __importStar(lib$1);

    var FeedItemMediaMedium;
    (function (FeedItemMediaMedium) {
        FeedItemMediaMedium[FeedItemMediaMedium["image"] = 0] = "image";
        FeedItemMediaMedium[FeedItemMediaMedium["audio"] = 1] = "audio";
        FeedItemMediaMedium[FeedItemMediaMedium["video"] = 2] = "video";
        FeedItemMediaMedium[FeedItemMediaMedium["document"] = 3] = "document";
        FeedItemMediaMedium[FeedItemMediaMedium["executable"] = 4] = "executable";
    })(FeedItemMediaMedium || (FeedItemMediaMedium = {}));
    var FeedItemMediaExpression;
    (function (FeedItemMediaExpression) {
        FeedItemMediaExpression[FeedItemMediaExpression["sample"] = 0] = "sample";
        FeedItemMediaExpression[FeedItemMediaExpression["full"] = 1] = "full";
        FeedItemMediaExpression[FeedItemMediaExpression["nonstop"] = 2] = "nonstop";
    })(FeedItemMediaExpression || (FeedItemMediaExpression = {}));
    // TODO: Consume data as it is coming in
    var FeedHandler = /** @class */ (function (_super) {
        __extends(FeedHandler, _super);
        /**
         *
         * @param callback
         * @param options
         */
        function FeedHandler(callback, options) {
            var _this = this;
            if (typeof callback === "object") {
                callback = undefined;
                options = callback;
            }
            _this = _super.call(this, callback, options) || this;
            return _this;
        }
        FeedHandler.prototype.onend = function () {
            var _a, _b;
            var feedRoot = getOneElement(isValidFeed, this.dom);
            if (!feedRoot) {
                this.handleCallback(new Error("couldn't find root of feed"));
                return;
            }
            var feed = {};
            if (feedRoot.name === "feed") {
                var childs = feedRoot.children;
                feed.type = "atom";
                addConditionally(feed, "id", "id", childs);
                addConditionally(feed, "title", "title", childs);
                var href = getAttribute("href", getOneElement("link", childs));
                if (href) {
                    feed.link = href;
                }
                addConditionally(feed, "description", "subtitle", childs);
                var updated = fetch("updated", childs);
                if (updated) {
                    feed.updated = new Date(updated);
                }
                addConditionally(feed, "author", "email", childs, true);
                feed.items = getElements("entry", childs).map(function (item) {
                    var entry = {};
                    var children = item.children;
                    addConditionally(entry, "id", "id", children);
                    addConditionally(entry, "title", "title", children);
                    var href = getAttribute("href", getOneElement("link", children));
                    if (href) {
                        entry.link = href;
                    }
                    var description = fetch("summary", children) || fetch("content", children);
                    if (description) {
                        entry.description = description;
                    }
                    var pubDate = fetch("updated", children);
                    if (pubDate) {
                        entry.pubDate = new Date(pubDate);
                    }
                    entry.media = getMediaElements(children);
                    return entry;
                });
            }
            else {
                var childs = (_b = (_a = getOneElement("channel", feedRoot.children)) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : [];
                feed.type = feedRoot.name.substr(0, 3);
                feed.id = "";
                addConditionally(feed, "title", "title", childs);
                addConditionally(feed, "link", "link", childs);
                addConditionally(feed, "description", "description", childs);
                var updated = fetch("lastBuildDate", childs);
                if (updated) {
                    feed.updated = new Date(updated);
                }
                addConditionally(feed, "author", "managingEditor", childs, true);
                feed.items = getElements("item", feedRoot.children).map(function (item) {
                    var entry = {};
                    var children = item.children;
                    addConditionally(entry, "id", "guid", children);
                    addConditionally(entry, "title", "title", children);
                    addConditionally(entry, "link", "link", children);
                    addConditionally(entry, "description", "description", children);
                    var pubDate = fetch("pubDate", children);
                    if (pubDate)
                        entry.pubDate = new Date(pubDate);
                    entry.media = getMediaElements(children);
                    return entry;
                });
            }
            this.feed = feed;
            this.handleCallback(null);
        };
        return FeedHandler;
    }(domhandler_1.default));
    exports.FeedHandler = FeedHandler;
    function getMediaElements(where) {
        return getElements("media:content", where).map(function (elem) {
            var media = {
                medium: elem.attribs.medium,
                isDefault: !!elem.attribs.isDefault,
            };
            if (elem.attribs.url) {
                media.url = elem.attribs.url;
            }
            if (elem.attribs.fileSize) {
                media.fileSize = parseInt(elem.attribs.fileSize, 10);
            }
            if (elem.attribs.type) {
                media.type = elem.attribs.type;
            }
            if (elem.attribs.expression) {
                media.expression = elem.attribs
                    .expression;
            }
            if (elem.attribs.bitrate) {
                media.bitrate = parseInt(elem.attribs.bitrate, 10);
            }
            if (elem.attribs.framerate) {
                media.framerate = parseInt(elem.attribs.framerate, 10);
            }
            if (elem.attribs.samplingrate) {
                media.samplingrate = parseInt(elem.attribs.samplingrate, 10);
            }
            if (elem.attribs.channels) {
                media.channels = parseInt(elem.attribs.channels, 10);
            }
            if (elem.attribs.duration) {
                media.duration = parseInt(elem.attribs.duration, 10);
            }
            if (elem.attribs.height) {
                media.height = parseInt(elem.attribs.height, 10);
            }
            if (elem.attribs.width) {
                media.width = parseInt(elem.attribs.width, 10);
            }
            if (elem.attribs.lang) {
                media.lang = elem.attribs.lang;
            }
            return media;
        });
    }
    function getElements(tagName, where) {
        return DomUtils.getElementsByTagName(tagName, where, true);
    }
    function getOneElement(tagName, node) {
        return DomUtils.getElementsByTagName(tagName, node, true, 1)[0];
    }
    function fetch(tagName, where, recurse) {
        if (recurse === void 0) { recurse = false; }
        return DomUtils.getText(DomUtils.getElementsByTagName(tagName, where, recurse, 1)).trim();
    }
    function getAttribute(name, elem) {
        if (!elem) {
            return null;
        }
        var attribs = elem.attribs;
        return attribs[name];
    }
    function addConditionally(obj, prop, what, where, recurse) {
        if (recurse === void 0) { recurse = false; }
        var tmp = fetch(what, where, recurse);
        if (tmp)
            obj[prop] = tmp;
    }
    function isValidFeed(value) {
        return value === "rss" || value === "feed" || value === "rdf:RDF";
    }
    /**
     * Parse a feed.
     *
     * @param feed The feed that should be parsed, as a string.
     * @param options Optionally, options for parsing. When using this option, you should set `xmlMode` to `true`.
     */
    function parseFeed(feed, options) {
        if (options === void 0) { options = { xmlMode: true }; }
        var handler = new FeedHandler(options);
        new Parser_1.Parser(handler, options).end(feed);
        return handler.feed;
    }
    exports.parseFeed = parseFeed;
    });

    var lib = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    });
    var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
    var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
    };
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RssHandler = exports.DefaultHandler = exports.DomUtils = exports.ElementType = exports.Tokenizer = exports.createDomStream = exports.parseDOM = exports.parseDocument = exports.DomHandler = exports.Parser = void 0;

    Object.defineProperty(exports, "Parser", { enumerable: true, get: function () { return Parser_1.Parser; } });

    Object.defineProperty(exports, "DomHandler", { enumerable: true, get: function () { return lib$4.DomHandler; } });
    Object.defineProperty(exports, "DefaultHandler", { enumerable: true, get: function () { return lib$4.DomHandler; } });
    // Helper methods
    /**
     * Parses the data, returns the resulting document.
     *
     * @param data The data that should be parsed.
     * @param options Optional options for the parser and DOM builder.
     */
    function parseDocument(data, options) {
        var handler = new lib$4.DomHandler(undefined, options);
        new Parser_1.Parser(handler, options).end(data);
        return handler.root;
    }
    exports.parseDocument = parseDocument;
    /**
     * Parses data, returns an array of the root nodes.
     *
     * Note that the root nodes still have a `Document` node as their parent.
     * Use `parseDocument` to get the `Document` node instead.
     *
     * @param data The data that should be parsed.
     * @param options Optional options for the parser and DOM builder.
     * @deprecated Use `parseDocument` instead.
     */
    function parseDOM(data, options) {
        return parseDocument(data, options).children;
    }
    exports.parseDOM = parseDOM;
    /**
     * Creates a parser instance, with an attached DOM handler.
     *
     * @param cb A callback that will be called once parsing has been completed.
     * @param options Optional options for the parser and DOM builder.
     * @param elementCb An optional callback that will be called every time a tag has been completed inside of the DOM.
     */
    function createDomStream(cb, options, elementCb) {
        var handler = new lib$4.DomHandler(cb, options, elementCb);
        return new Parser_1.Parser(handler, options);
    }
    exports.createDomStream = createDomStream;

    Object.defineProperty(exports, "Tokenizer", { enumerable: true, get: function () { return __importDefault(Tokenizer_1).default; } });
    var ElementType = __importStar(lib$5);
    exports.ElementType = ElementType;
    /*
     * All of the following exports exist for backwards-compatibility.
     * They should probably be removed eventually.
     */
    __exportStar(FeedHandler_1, exports);
    exports.DomUtils = __importStar(lib$1);

    Object.defineProperty(exports, "RssHandler", { enumerable: true, get: function () { return FeedHandler_1.FeedHandler; } });
    });

    var escapeStringRegexp = string => {
    	if (typeof string !== 'string') {
    		throw new TypeError('Expected a string');
    	}

    	// Escape characters with special meaning either inside or outside character sets.
    	// Use a simple backslash escape when it’s always valid, and a \unnnn escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
    	return string
    		.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    		.replace(/-/g, '\\x2d');
    };

    function klona$1(x) {
    	if (typeof x !== 'object') return x;

    	var k, tmp, str=Object.prototype.toString.call(x);

    	if (str === '[object Object]') {
    		if (x.constructor !== Object && typeof x.constructor === 'function') {
    			tmp = new x.constructor();
    			for (k in x) {
    				if (tmp.hasOwnProperty(k) && tmp[k] !== x[k]) {
    					tmp[k] = klona$1(x[k]);
    				}
    			}
    		} else {
    			tmp = {}; // null
    			for (k in x) {
    				if (k === '__proto__') {
    					Object.defineProperty(tmp, k, {
    						value: klona$1(x[k]),
    						configurable: true,
    						enumerable: true,
    						writable: true,
    					});
    				} else {
    					tmp[k] = klona$1(x[k]);
    				}
    			}
    		}
    		return tmp;
    	}

    	if (str === '[object Array]') {
    		k = x.length;
    		for (tmp=Array(k); k--;) {
    			tmp[k] = klona$1(x[k]);
    		}
    		return tmp;
    	}

    	if (str === '[object Set]') {
    		tmp = new Set;
    		x.forEach(function (val) {
    			tmp.add(klona$1(val));
    		});
    		return tmp;
    	}

    	if (str === '[object Map]') {
    		tmp = new Map;
    		x.forEach(function (val, key) {
    			tmp.set(klona$1(key), klona$1(val));
    		});
    		return tmp;
    	}

    	if (str === '[object Date]') {
    		return new Date(+x);
    	}

    	if (str === '[object RegExp]') {
    		tmp = new RegExp(x.source, x.flags);
    		tmp.lastIndex = x.lastIndex;
    		return tmp;
    	}

    	if (str === '[object DataView]') {
    		return new x.constructor( klona$1(x.buffer) );
    	}

    	if (str === '[object ArrayBuffer]') {
    		return x.slice(0);
    	}

    	// ArrayBuffer.isView(x)
    	// ~> `new` bcuz `Buffer.slice` => ref
    	if (str.slice(-6) === 'Array]') {
    		return new x.constructor(x);
    	}

    	return x;
    }

    var klona_1 = klona$1;

    var dist = {
    	klona: klona_1
    };

    /*!
     * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
     *
     * Copyright (c) 2014-2017, Jon Schlinkert.
     * Released under the MIT License.
     */

    function isObject(o) {
      return Object.prototype.toString.call(o) === '[object Object]';
    }

    function isPlainObject$1(o) {
      var ctor,prot;

      if (isObject(o) === false) return false;

      // If has modified constructor
      ctor = o.constructor;
      if (ctor === undefined) return true;

      // If has modified prototype
      prot = ctor.prototype;
      if (isObject(prot) === false) return false;

      // If constructor does not have an Object-specific method
      if (prot.hasOwnProperty('isPrototypeOf') === false) {
        return false;
      }

      // Most likely a plain Object
      return true;
    }

    var isPlainObject_2 = isPlainObject$1;

    var isPlainObject_1 = /*#__PURE__*/Object.defineProperty({
    	isPlainObject: isPlainObject_2
    }, '__esModule', {value: true});

    var isMergeableObject = function isMergeableObject(value) {
    	return isNonNullObject(value)
    		&& !isSpecial(value)
    };

    function isNonNullObject(value) {
    	return !!value && typeof value === 'object'
    }

    function isSpecial(value) {
    	var stringValue = Object.prototype.toString.call(value);

    	return stringValue === '[object RegExp]'
    		|| stringValue === '[object Date]'
    		|| isReactElement(value)
    }

    // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
    var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
    var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

    function isReactElement(value) {
    	return value.$$typeof === REACT_ELEMENT_TYPE
    }

    function emptyTarget(val) {
    	return Array.isArray(val) ? [] : {}
    }

    function cloneUnlessOtherwiseSpecified(value, options) {
    	return (options.clone !== false && options.isMergeableObject(value))
    		? deepmerge(emptyTarget(value), value, options)
    		: value
    }

    function defaultArrayMerge(target, source, options) {
    	return target.concat(source).map(function(element) {
    		return cloneUnlessOtherwiseSpecified(element, options)
    	})
    }

    function getMergeFunction(key, options) {
    	if (!options.customMerge) {
    		return deepmerge
    	}
    	var customMerge = options.customMerge(key);
    	return typeof customMerge === 'function' ? customMerge : deepmerge
    }

    function getEnumerableOwnPropertySymbols(target) {
    	return Object.getOwnPropertySymbols
    		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
    			return target.propertyIsEnumerable(symbol)
    		})
    		: []
    }

    function getKeys(target) {
    	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
    }

    function propertyIsOnObject(object, property) {
    	try {
    		return property in object
    	} catch(_) {
    		return false
    	}
    }

    // Protects from prototype poisoning and unexpected merging up the prototype chain.
    function propertyIsUnsafe(target, key) {
    	return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
    		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
    			&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
    }

    function mergeObject(target, source, options) {
    	var destination = {};
    	if (options.isMergeableObject(target)) {
    		getKeys(target).forEach(function(key) {
    			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    		});
    	}
    	getKeys(source).forEach(function(key) {
    		if (propertyIsUnsafe(target, key)) {
    			return
    		}

    		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
    			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
    		} else {
    			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    		}
    	});
    	return destination
    }

    function deepmerge(target, source, options) {
    	options = options || {};
    	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
    	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
    	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
    	// implementations can use it. The caller may not replace it.
    	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

    	var sourceIsArray = Array.isArray(source);
    	var targetIsArray = Array.isArray(target);
    	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

    	if (!sourceAndTargetTypesMatch) {
    		return cloneUnlessOtherwiseSpecified(source, options)
    	} else if (sourceIsArray) {
    		return options.arrayMerge(target, source, options)
    	} else {
    		return mergeObject(target, source, options)
    	}
    }

    deepmerge.all = function deepmergeAll(array, options) {
    	if (!Array.isArray(array)) {
    		throw new Error('first argument should be an array')
    	}

    	return array.reduce(function(prev, next) {
    		return deepmerge(prev, next, options)
    	}, {})
    };

    var deepmerge_1 = deepmerge;

    var cjs = deepmerge_1;

    /**
     * Srcset Parser
     *
     * By Alex Bell |  MIT License
     *
     * JS Parser for the string value that appears in markup <img srcset="here">
     *
     * @returns Array [{url: _, d: _, w: _, h:_}, ...]
     *
     * Based super duper closely on the reference algorithm at:
     * https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-srcset-attribute
     *
     * Most comments are copied in directly from the spec
     * (except for comments in parens).
     */

    var parseSrcset = createCommonjsModule(function (module) {
    (function (root, factory) {
    	if (module.exports) {
    		// Node. Does not work with strict CommonJS, but
    		// only CommonJS-like environments that support module.exports,
    		// like Node.
    		module.exports = factory();
    	} else {
    		// Browser globals (root is window)
    		root.parseSrcset = factory();
    	}
    }(commonjsGlobal, function () {

    	// 1. Let input be the value passed to this algorithm.
    	return function (input) {

    		// UTILITY FUNCTIONS

    		// Manual is faster than RegEx
    		// http://bjorn.tipling.com/state-and-regular-expressions-in-javascript
    		// http://jsperf.com/whitespace-character/5
    		function isSpace(c) {
    			return (c === "\u0020" || // space
    			c === "\u0009" || // horizontal tab
    			c === "\u000A" || // new line
    			c === "\u000C" || // form feed
    			c === "\u000D");  // carriage return
    		}

    		function collectCharacters(regEx) {
    			var chars,
    				match = regEx.exec(input.substring(pos));
    			if (match) {
    				chars = match[ 0 ];
    				pos += chars.length;
    				return chars;
    			}
    		}

    		var inputLength = input.length,

    			// (Don't use \s, to avoid matching non-breaking space)
    			regexLeadingSpaces = /^[ \t\n\r\u000c]+/,
    			regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/,
    			regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/,
    			regexTrailingCommas = /[,]+$/,
    			regexNonNegativeInteger = /^\d+$/,

    			// ( Positive or negative or unsigned integers or decimals, without or without exponents.
    			// Must include at least one digit.
    			// According to spec tests any decimal point must be followed by a digit.
    			// No leading plus sign is allowed.)
    			// https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
    			regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/,

    			url,
    			descriptors,
    			currentDescriptor,
    			state,
    			c,

    			// 2. Let position be a pointer into input, initially pointing at the start
    			//    of the string.
    			pos = 0,

    			// 3. Let candidates be an initially empty source set.
    			candidates = [];

    		// 4. Splitting loop: Collect a sequence of characters that are space
    		//    characters or U+002C COMMA characters. If any U+002C COMMA characters
    		//    were collected, that is a parse error.
    		while (true) {
    			collectCharacters(regexLeadingCommasOrSpaces);

    			// 5. If position is past the end of input, return candidates and abort these steps.
    			if (pos >= inputLength) {
    				return candidates; // (we're done, this is the sole return path)
    			}

    			// 6. Collect a sequence of characters that are not space characters,
    			//    and let that be url.
    			url = collectCharacters(regexLeadingNotSpaces);

    			// 7. Let descriptors be a new empty list.
    			descriptors = [];

    			// 8. If url ends with a U+002C COMMA character (,), follow these substeps:
    			//		(1). Remove all trailing U+002C COMMA characters from url. If this removed
    			//         more than one character, that is a parse error.
    			if (url.slice(-1) === ",") {
    				url = url.replace(regexTrailingCommas, "");
    				// (Jump ahead to step 9 to skip tokenization and just push the candidate).
    				parseDescriptors();

    				//	Otherwise, follow these substeps:
    			} else {
    				tokenize();
    			} // (close else of step 8)

    			// 16. Return to the step labeled splitting loop.
    		} // (Close of big while loop.)

    		/**
    		 * Tokenizes descriptor properties prior to parsing
    		 * Returns undefined.
    		 */
    		function tokenize() {

    			// 8.1. Descriptor tokeniser: Skip whitespace
    			collectCharacters(regexLeadingSpaces);

    			// 8.2. Let current descriptor be the empty string.
    			currentDescriptor = "";

    			// 8.3. Let state be in descriptor.
    			state = "in descriptor";

    			while (true) {

    				// 8.4. Let c be the character at position.
    				c = input.charAt(pos);

    				//  Do the following depending on the value of state.
    				//  For the purpose of this step, "EOF" is a special character representing
    				//  that position is past the end of input.

    				// In descriptor
    				if (state === "in descriptor") {
    					// Do the following, depending on the value of c:

    					// Space character
    					// If current descriptor is not empty, append current descriptor to
    					// descriptors and let current descriptor be the empty string.
    					// Set state to after descriptor.
    					if (isSpace(c)) {
    						if (currentDescriptor) {
    							descriptors.push(currentDescriptor);
    							currentDescriptor = "";
    							state = "after descriptor";
    						}

    						// U+002C COMMA (,)
    						// Advance position to the next character in input. If current descriptor
    						// is not empty, append current descriptor to descriptors. Jump to the step
    						// labeled descriptor parser.
    					} else if (c === ",") {
    						pos += 1;
    						if (currentDescriptor) {
    							descriptors.push(currentDescriptor);
    						}
    						parseDescriptors();
    						return;

    						// U+0028 LEFT PARENTHESIS (()
    						// Append c to current descriptor. Set state to in parens.
    					} else if (c === "\u0028") {
    						currentDescriptor = currentDescriptor + c;
    						state = "in parens";

    						// EOF
    						// If current descriptor is not empty, append current descriptor to
    						// descriptors. Jump to the step labeled descriptor parser.
    					} else if (c === "") {
    						if (currentDescriptor) {
    							descriptors.push(currentDescriptor);
    						}
    						parseDescriptors();
    						return;

    						// Anything else
    						// Append c to current descriptor.
    					} else {
    						currentDescriptor = currentDescriptor + c;
    					}
    					// (end "in descriptor"

    					// In parens
    				} else if (state === "in parens") {

    					// U+0029 RIGHT PARENTHESIS ())
    					// Append c to current descriptor. Set state to in descriptor.
    					if (c === ")") {
    						currentDescriptor = currentDescriptor + c;
    						state = "in descriptor";

    						// EOF
    						// Append current descriptor to descriptors. Jump to the step labeled
    						// descriptor parser.
    					} else if (c === "") {
    						descriptors.push(currentDescriptor);
    						parseDescriptors();
    						return;

    						// Anything else
    						// Append c to current descriptor.
    					} else {
    						currentDescriptor = currentDescriptor + c;
    					}

    					// After descriptor
    				} else if (state === "after descriptor") {

    					// Do the following, depending on the value of c:
    					// Space character: Stay in this state.
    					if (isSpace(c)) ; else if (c === "") {
    						parseDescriptors();
    						return;

    						// Anything else
    						// Set state to in descriptor. Set position to the previous character in input.
    					} else {
    						state = "in descriptor";
    						pos -= 1;

    					}
    				}

    				// Advance position to the next character in input.
    				pos += 1;

    				// Repeat this step.
    			} // (close while true loop)
    		}

    		/**
    		 * Adds descriptor properties to a candidate, pushes to the candidates array
    		 * @return undefined
    		 */
    		// Declared outside of the while loop so that it's only created once.
    		function parseDescriptors() {

    			// 9. Descriptor parser: Let error be no.
    			var pError = false,

    				// 10. Let width be absent.
    				// 11. Let density be absent.
    				// 12. Let future-compat-h be absent. (We're implementing it now as h)
    				w, d, h, i,
    				candidate = {},
    				desc, lastChar, value, intVal, floatVal;

    			// 13. For each descriptor in descriptors, run the appropriate set of steps
    			// from the following list:
    			for (i = 0 ; i < descriptors.length; i++) {
    				desc = descriptors[ i ];

    				lastChar = desc[ desc.length - 1 ];
    				value = desc.substring(0, desc.length - 1);
    				intVal = parseInt(value, 10);
    				floatVal = parseFloat(value);

    				// If the descriptor consists of a valid non-negative integer followed by
    				// a U+0077 LATIN SMALL LETTER W character
    				if (regexNonNegativeInteger.test(value) && (lastChar === "w")) {

    					// If width and density are not both absent, then let error be yes.
    					if (w || d) {pError = true;}

    					// Apply the rules for parsing non-negative integers to the descriptor.
    					// If the result is zero, let error be yes.
    					// Otherwise, let width be the result.
    					if (intVal === 0) {pError = true;} else {w = intVal;}

    					// If the descriptor consists of a valid floating-point number followed by
    					// a U+0078 LATIN SMALL LETTER X character
    				} else if (regexFloatingPoint.test(value) && (lastChar === "x")) {

    					// If width, density and future-compat-h are not all absent, then let error
    					// be yes.
    					if (w || d || h) {pError = true;}

    					// Apply the rules for parsing floating-point number values to the descriptor.
    					// If the result is less than zero, let error be yes. Otherwise, let density
    					// be the result.
    					if (floatVal < 0) {pError = true;} else {d = floatVal;}

    					// If the descriptor consists of a valid non-negative integer followed by
    					// a U+0068 LATIN SMALL LETTER H character
    				} else if (regexNonNegativeInteger.test(value) && (lastChar === "h")) {

    					// If height and density are not both absent, then let error be yes.
    					if (h || d) {pError = true;}

    					// Apply the rules for parsing non-negative integers to the descriptor.
    					// If the result is zero, let error be yes. Otherwise, let future-compat-h
    					// be the result.
    					if (intVal === 0) {pError = true;} else {h = intVal;}

    					// Anything else, Let error be yes.
    				} else {pError = true;}
    			} // (close step 13 for loop)

    			// 15. If error is still no, then append a new image source to candidates whose
    			// URL is url, associated with a width width if not absent and a pixel
    			// density density if not absent. Otherwise, there is a parse error.
    			if (!pError) {
    				candidate.url = url;
    				if (w) { candidate.w = w;}
    				if (d) { candidate.d = d;}
    				if (h) { candidate.h = h;}
    				candidates.push(candidate);
    			} else if (console && console.log) {
    				console.log("Invalid srcset descriptor found in '" +
    					input + "' at '" + desc + "'.");
    			}
    		} // (close parseDescriptors fn)

    	}
    }));
    });

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var terminalHighlight = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    let { red, bold, gray, options: colorette } = terminalHighlight;



    class CssSyntaxError extends Error {
      constructor(message, line, column, source, file, plugin) {
        super(message);
        this.name = 'CssSyntaxError';
        this.reason = message;

        if (file) {
          this.file = file;
        }
        if (source) {
          this.source = source;
        }
        if (plugin) {
          this.plugin = plugin;
        }
        if (typeof line !== 'undefined' && typeof column !== 'undefined') {
          this.line = line;
          this.column = column;
        }

        this.setMessage();

        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, CssSyntaxError);
        }
      }

      setMessage() {
        this.message = this.plugin ? this.plugin + ': ' : '';
        this.message += this.file ? this.file : '<css input>';
        if (typeof this.line !== 'undefined') {
          this.message += ':' + this.line + ':' + this.column;
        }
        this.message += ': ' + this.reason;
      }

      showSourceCode(color) {
        if (!this.source) return ''

        let css = this.source;
        if (color == null) color = colorette.enabled;
        if (terminalHighlight) {
          if (color) css = terminalHighlight(css);
        }

        let lines = css.split(/\r?\n/);
        let start = Math.max(this.line - 3, 0);
        let end = Math.min(this.line + 2, lines.length);

        let maxWidth = String(end).length;

        let mark, aside;
        if (color) {
          mark = text => bold(red(text));
          aside = text => gray(text);
        } else {
          mark = aside = str => str;
        }

        return lines
          .slice(start, end)
          .map((line, index) => {
            let number = start + 1 + index;
            let gutter = ' ' + (' ' + number).slice(-maxWidth) + ' | ';
            if (number === this.line) {
              let spacing =
                aside(gutter.replace(/\d/g, ' ')) +
                line.slice(0, this.column - 1).replace(/[^\t]/g, ' ');
              return mark('>') + aside(gutter) + line + '\n ' + spacing + mark('^')
            }
            return ' ' + aside(gutter) + line
          })
          .join('\n')
      }

      toString() {
        let code = this.showSourceCode();
        if (code) {
          code = '\n\n' + code + '\n';
        }
        return this.name + ': ' + this.message + code
      }
    }

    var cssSyntaxError = CssSyntaxError;
    CssSyntaxError.default = CssSyntaxError;

    const DEFAULT_RAW = {
      colon: ': ',
      indent: '    ',
      beforeDecl: '\n',
      beforeRule: '\n',
      beforeOpen: ' ',
      beforeClose: '\n',
      beforeComment: '\n',
      after: '\n',
      emptyBody: '',
      commentLeft: ' ',
      commentRight: ' ',
      semicolon: false
    };

    function capitalize(str) {
      return str[0].toUpperCase() + str.slice(1)
    }

    class Stringifier {
      constructor(builder) {
        this.builder = builder;
      }

      stringify(node, semicolon) {
        /* istanbul ignore if */
        if (!this[node.type]) {
          throw new Error(
            'Unknown AST node type ' +
              node.type +
              '. ' +
              'Maybe you need to change PostCSS stringifier.'
          )
        }
        this[node.type](node, semicolon);
      }

      document(node) {
        this.body(node);
      }

      root(node) {
        this.body(node);
        if (node.raws.after) this.builder(node.raws.after);
      }

      comment(node) {
        let left = this.raw(node, 'left', 'commentLeft');
        let right = this.raw(node, 'right', 'commentRight');
        this.builder('/*' + left + node.text + right + '*/', node);
      }

      decl(node, semicolon) {
        let between = this.raw(node, 'between', 'colon');
        let string = node.prop + between + this.rawValue(node, 'value');

        if (node.important) {
          string += node.raws.important || ' !important';
        }

        if (semicolon) string += ';';
        this.builder(string, node);
      }

      rule(node) {
        this.block(node, this.rawValue(node, 'selector'));
        if (node.raws.ownSemicolon) {
          this.builder(node.raws.ownSemicolon, node, 'end');
        }
      }

      atrule(node, semicolon) {
        let name = '@' + node.name;
        let params = node.params ? this.rawValue(node, 'params') : '';

        if (typeof node.raws.afterName !== 'undefined') {
          name += node.raws.afterName;
        } else if (params) {
          name += ' ';
        }

        if (node.nodes) {
          this.block(node, name + params);
        } else {
          let end = (node.raws.between || '') + (semicolon ? ';' : '');
          this.builder(name + params + end, node);
        }
      }

      body(node) {
        let last = node.nodes.length - 1;
        while (last > 0) {
          if (node.nodes[last].type !== 'comment') break
          last -= 1;
        }

        let semicolon = this.raw(node, 'semicolon');
        for (let i = 0; i < node.nodes.length; i++) {
          let child = node.nodes[i];
          let before = this.raw(child, 'before');
          if (before) this.builder(before);
          this.stringify(child, last !== i || semicolon);
        }
      }

      block(node, start) {
        let between = this.raw(node, 'between', 'beforeOpen');
        this.builder(start + between + '{', node, 'start');

        let after;
        if (node.nodes && node.nodes.length) {
          this.body(node);
          after = this.raw(node, 'after');
        } else {
          after = this.raw(node, 'after', 'emptyBody');
        }

        if (after) this.builder(after);
        this.builder('}', node, 'end');
      }

      raw(node, own, detect) {
        let value;
        if (!detect) detect = own;

        // Already had
        if (own) {
          value = node.raws[own];
          if (typeof value !== 'undefined') return value
        }

        let parent = node.parent;

        if (detect === 'before') {
          // Hack for first rule in CSS
          if (!parent || (parent.type === 'root' && parent.first === node)) {
            return ''
          }

          // `root` nodes in `document` should use only their own raws
          if (parent && parent.type === 'document') {
            return ''
          }
        }

        // Floating child without parent
        if (!parent) return DEFAULT_RAW[detect]

        // Detect style by other nodes
        let root = node.root();
        if (!root.rawCache) root.rawCache = {};
        if (typeof root.rawCache[detect] !== 'undefined') {
          return root.rawCache[detect]
        }

        if (detect === 'before' || detect === 'after') {
          return this.beforeAfter(node, detect)
        } else {
          let method = 'raw' + capitalize(detect);
          if (this[method]) {
            value = this[method](root, node);
          } else {
            root.walk(i => {
              value = i.raws[own];
              if (typeof value !== 'undefined') return false
            });
          }
        }

        if (typeof value === 'undefined') value = DEFAULT_RAW[detect];

        root.rawCache[detect] = value;
        return value
      }

      rawSemicolon(root) {
        let value;
        root.walk(i => {
          if (i.nodes && i.nodes.length && i.last.type === 'decl') {
            value = i.raws.semicolon;
            if (typeof value !== 'undefined') return false
          }
        });
        return value
      }

      rawEmptyBody(root) {
        let value;
        root.walk(i => {
          if (i.nodes && i.nodes.length === 0) {
            value = i.raws.after;
            if (typeof value !== 'undefined') return false
          }
        });
        return value
      }

      rawIndent(root) {
        if (root.raws.indent) return root.raws.indent
        let value;
        root.walk(i => {
          let p = i.parent;
          if (p && p !== root && p.parent && p.parent === root) {
            if (typeof i.raws.before !== 'undefined') {
              let parts = i.raws.before.split('\n');
              value = parts[parts.length - 1];
              value = value.replace(/\S/g, '');
              return false
            }
          }
        });
        return value
      }

      rawBeforeComment(root, node) {
        let value;
        root.walkComments(i => {
          if (typeof i.raws.before !== 'undefined') {
            value = i.raws.before;
            if (value.includes('\n')) {
              value = value.replace(/[^\n]+$/, '');
            }
            return false
          }
        });
        if (typeof value === 'undefined') {
          value = this.raw(node, null, 'beforeDecl');
        } else if (value) {
          value = value.replace(/\S/g, '');
        }
        return value
      }

      rawBeforeDecl(root, node) {
        let value;
        root.walkDecls(i => {
          if (typeof i.raws.before !== 'undefined') {
            value = i.raws.before;
            if (value.includes('\n')) {
              value = value.replace(/[^\n]+$/, '');
            }
            return false
          }
        });
        if (typeof value === 'undefined') {
          value = this.raw(node, null, 'beforeRule');
        } else if (value) {
          value = value.replace(/\S/g, '');
        }
        return value
      }

      rawBeforeRule(root) {
        let value;
        root.walk(i => {
          if (i.nodes && (i.parent !== root || root.first !== i)) {
            if (typeof i.raws.before !== 'undefined') {
              value = i.raws.before;
              if (value.includes('\n')) {
                value = value.replace(/[^\n]+$/, '');
              }
              return false
            }
          }
        });
        if (value) value = value.replace(/\S/g, '');
        return value
      }

      rawBeforeClose(root) {
        let value;
        root.walk(i => {
          if (i.nodes && i.nodes.length > 0) {
            if (typeof i.raws.after !== 'undefined') {
              value = i.raws.after;
              if (value.includes('\n')) {
                value = value.replace(/[^\n]+$/, '');
              }
              return false
            }
          }
        });
        if (value) value = value.replace(/\S/g, '');
        return value
      }

      rawBeforeOpen(root) {
        let value;
        root.walk(i => {
          if (i.type !== 'decl') {
            value = i.raws.between;
            if (typeof value !== 'undefined') return false
          }
        });
        return value
      }

      rawColon(root) {
        let value;
        root.walkDecls(i => {
          if (typeof i.raws.between !== 'undefined') {
            value = i.raws.between.replace(/[^\s:]/g, '');
            return false
          }
        });
        return value
      }

      beforeAfter(node, detect) {
        let value;
        if (node.type === 'decl') {
          value = this.raw(node, null, 'beforeDecl');
        } else if (node.type === 'comment') {
          value = this.raw(node, null, 'beforeComment');
        } else if (detect === 'before') {
          value = this.raw(node, null, 'beforeRule');
        } else {
          value = this.raw(node, null, 'beforeClose');
        }

        let buf = node.parent;
        let depth = 0;
        while (buf && buf.type !== 'root') {
          depth += 1;
          buf = buf.parent;
        }

        if (value.includes('\n')) {
          let indent = this.raw(node, null, 'indent');
          if (indent.length) {
            for (let step = 0; step < depth; step++) value += indent;
          }
        }

        return value
      }

      rawValue(node, prop) {
        let value = node[prop];
        let raw = node.raws[prop];
        if (raw && raw.value === value) {
          return raw.raw
        }

        return value
      }
    }

    var stringifier = Stringifier;

    var isClean$3 = Symbol('isClean');

    var symbols = {
    	isClean: isClean$3
    };

    function stringify(node, builder) {
      let str = new stringifier(builder);
      str.stringify(node);
    }

    var stringify_1 = stringify;
    stringify.default = stringify;

    let { isClean: isClean$2 } = symbols;


    function cloneNode(obj, parent) {
      let cloned = new obj.constructor();

      for (let i in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, i)) {
          // istanbul ignore next
          continue
        }
        if (i === 'proxyCache') continue
        let value = obj[i];
        let type = typeof value;

        if (i === 'parent' && type === 'object') {
          if (parent) cloned[i] = parent;
        } else if (i === 'source') {
          cloned[i] = value;
        } else if (Array.isArray(value)) {
          cloned[i] = value.map(j => cloneNode(j, cloned));
        } else {
          if (type === 'object' && value !== null) value = cloneNode(value);
          cloned[i] = value;
        }
      }

      return cloned
    }

    class Node {
      constructor(defaults = {}) {
        this.raws = {};
        this[isClean$2] = false;

        for (let name in defaults) {
          if (name === 'nodes') {
            this.nodes = [];
            for (let node of defaults[name]) {
              if (typeof node.clone === 'function') {
                this.append(node.clone());
              } else {
                this.append(node);
              }
            }
          } else {
            this[name] = defaults[name];
          }
        }
      }

      error(message, opts = {}) {
        if (this.source) {
          let pos = this.positionBy(opts);
          return this.source.input.error(message, pos.line, pos.column, opts)
        }
        return new cssSyntaxError(message)
      }

      warn(result, text, opts) {
        let data = { node: this };
        for (let i in opts) data[i] = opts[i];
        return result.warn(text, data)
      }

      remove() {
        if (this.parent) {
          this.parent.removeChild(this);
        }
        this.parent = undefined;
        return this
      }

      toString(stringifier = stringify_1) {
        if (stringifier.stringify) stringifier = stringifier.stringify;
        let result = '';
        stringifier(this, i => {
          result += i;
        });
        return result
      }

      assign(overrides = {}) {
        for (let name in overrides) {
          this[name] = overrides[name];
        }
        return this
      }

      clone(overrides = {}) {
        let cloned = cloneNode(this);
        for (let name in overrides) {
          cloned[name] = overrides[name];
        }
        return cloned
      }

      cloneBefore(overrides = {}) {
        let cloned = this.clone(overrides);
        this.parent.insertBefore(this, cloned);
        return cloned
      }

      cloneAfter(overrides = {}) {
        let cloned = this.clone(overrides);
        this.parent.insertAfter(this, cloned);
        return cloned
      }

      replaceWith(...nodes) {
        if (this.parent) {
          let bookmark = this;
          let foundSelf = false;
          for (let node of nodes) {
            if (node === this) {
              foundSelf = true;
            } else if (foundSelf) {
              this.parent.insertAfter(bookmark, node);
              bookmark = node;
            } else {
              this.parent.insertBefore(bookmark, node);
            }
          }

          if (!foundSelf) {
            this.remove();
          }
        }

        return this
      }

      next() {
        if (!this.parent) return undefined
        let index = this.parent.index(this);
        return this.parent.nodes[index + 1]
      }

      prev() {
        if (!this.parent) return undefined
        let index = this.parent.index(this);
        return this.parent.nodes[index - 1]
      }

      before(add) {
        this.parent.insertBefore(this, add);
        return this
      }

      after(add) {
        this.parent.insertAfter(this, add);
        return this
      }

      root() {
        let result = this;
        while (result.parent && result.parent.type !== 'document') {
          result = result.parent;
        }
        return result
      }

      raw(prop, defaultType) {
        let str = new stringifier();
        return str.raw(this, prop, defaultType)
      }

      cleanRaws(keepBetween) {
        delete this.raws.before;
        delete this.raws.after;
        if (!keepBetween) delete this.raws.between;
      }

      toJSON(_, inputs) {
        let fixed = {};
        let emitInputs = inputs == null;
        inputs = inputs || new Map();
        let inputsNextIndex = 0;

        for (let name in this) {
          if (!Object.prototype.hasOwnProperty.call(this, name)) {
            // istanbul ignore next
            continue
          }
          if (name === 'parent' || name === 'proxyCache') continue
          let value = this[name];

          if (Array.isArray(value)) {
            fixed[name] = value.map(i => {
              if (typeof i === 'object' && i.toJSON) {
                return i.toJSON(null, inputs)
              } else {
                return i
              }
            });
          } else if (typeof value === 'object' && value.toJSON) {
            fixed[name] = value.toJSON(null, inputs);
          } else if (name === 'source') {
            let inputId = inputs.get(value.input);
            if (inputId == null) {
              inputId = inputsNextIndex;
              inputs.set(value.input, inputsNextIndex);
              inputsNextIndex++;
            }
            fixed[name] = {
              inputId,
              start: value.start,
              end: value.end
            };
          } else {
            fixed[name] = value;
          }
        }

        if (emitInputs) {
          fixed.inputs = [...inputs.keys()].map(input => input.toJSON());
        }

        return fixed
      }

      positionInside(index) {
        let string = this.toString();
        let column = this.source.start.column;
        let line = this.source.start.line;

        for (let i = 0; i < index; i++) {
          if (string[i] === '\n') {
            column = 1;
            line += 1;
          } else {
            column += 1;
          }
        }

        return { line, column }
      }

      positionBy(opts) {
        let pos = this.source.start;
        if (opts.index) {
          pos = this.positionInside(opts.index);
        } else if (opts.word) {
          let index = this.toString().indexOf(opts.word);
          if (index !== -1) pos = this.positionInside(index);
        }
        return pos
      }

      getProxyProcessor() {
        return {
          set(node, prop, value) {
            if (node[prop] === value) return true
            node[prop] = value;
            if (
              prop === 'prop' ||
              prop === 'value' ||
              prop === 'name' ||
              prop === 'params' ||
              prop === 'important' ||
              prop === 'text'
            ) {
              node.markDirty();
            }
            return true
          },

          get(node, prop) {
            if (prop === 'proxyOf') {
              return node
            } else if (prop === 'root') {
              return () => node.root().toProxy()
            } else {
              return node[prop]
            }
          }
        }
      }

      toProxy() {
        if (!this.proxyCache) {
          this.proxyCache = new Proxy(this, this.getProxyProcessor());
        }
        return this.proxyCache
      }

      addToError(error) {
        error.postcssNode = this;
        if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
          let s = this.source;
          error.stack = error.stack.replace(
            /\n\s{4}at /,
            `$&${s.input.from}:${s.start.line}:${s.start.column}$&`
          );
        }
        return error
      }

      markDirty() {
        if (this[isClean$2]) {
          this[isClean$2] = false;
          let next = this;
          while ((next = next.parent)) {
            next[isClean$2] = false;
          }
        }
      }

      get proxyOf() {
        return this
      }
    }

    var node_1 = Node;
    Node.default = Node;

    class Declaration extends node_1 {
      constructor(defaults) {
        if (
          defaults &&
          typeof defaults.value !== 'undefined' &&
          typeof defaults.value !== 'string'
        ) {
          defaults = { ...defaults, value: String(defaults.value) };
        }
        super(defaults);
        this.type = 'decl';
      }

      get variable() {
        return this.prop.startsWith('--') || this.prop[0] === '$'
      }
    }

    var declaration = Declaration;
    Declaration.default = Declaration;

    let { SourceMapConsumer: SourceMapConsumer$2, SourceMapGenerator: SourceMapGenerator$2 } = terminalHighlight;
    let { dirname: dirname$1, resolve: resolve$1, relative, sep } = terminalHighlight;
    let { pathToFileURL: pathToFileURL$1 } = terminalHighlight;

    let sourceMapAvailable$1 = Boolean(SourceMapConsumer$2 && SourceMapGenerator$2);
    let pathAvailable$1 = Boolean(dirname$1 && resolve$1 && relative && sep);

    class MapGenerator {
      constructor(stringify, root, opts) {
        this.stringify = stringify;
        this.mapOpts = opts.map || {};
        this.root = root;
        this.opts = opts;
      }

      isMap() {
        if (typeof this.opts.map !== 'undefined') {
          return !!this.opts.map
        }
        return this.previous().length > 0
      }

      previous() {
        if (!this.previousMaps) {
          this.previousMaps = [];
          this.root.walk(node => {
            if (node.source && node.source.input.map) {
              let map = node.source.input.map;
              if (!this.previousMaps.includes(map)) {
                this.previousMaps.push(map);
              }
            }
          });
        }

        return this.previousMaps
      }

      isInline() {
        if (typeof this.mapOpts.inline !== 'undefined') {
          return this.mapOpts.inline
        }

        let annotation = this.mapOpts.annotation;
        if (typeof annotation !== 'undefined' && annotation !== true) {
          return false
        }

        if (this.previous().length) {
          return this.previous().some(i => i.inline)
        }
        return true
      }

      isSourcesContent() {
        if (typeof this.mapOpts.sourcesContent !== 'undefined') {
          return this.mapOpts.sourcesContent
        }
        if (this.previous().length) {
          return this.previous().some(i => i.withContent())
        }
        return true
      }

      clearAnnotation() {
        if (this.mapOpts.annotation === false) return

        let node;
        for (let i = this.root.nodes.length - 1; i >= 0; i--) {
          node = this.root.nodes[i];
          if (node.type !== 'comment') continue
          if (node.text.indexOf('# sourceMappingURL=') === 0) {
            this.root.removeChild(i);
          }
        }
      }

      setSourcesContent() {
        let already = {};
        this.root.walk(node => {
          if (node.source) {
            let from = node.source.input.from;
            if (from && !already[from]) {
              already[from] = true;
              this.map.setSourceContent(
                this.toUrl(this.path(from)),
                node.source.input.css
              );
            }
          }
        });
      }

      applyPrevMaps() {
        for (let prev of this.previous()) {
          let from = this.toUrl(this.path(prev.file));
          let root = prev.root || dirname$1(prev.file);
          let map;

          if (this.mapOpts.sourcesContent === false) {
            map = new SourceMapConsumer$2(prev.text);
            if (map.sourcesContent) {
              map.sourcesContent = map.sourcesContent.map(() => null);
            }
          } else {
            map = prev.consumer();
          }

          this.map.applySourceMap(map, from, this.toUrl(this.path(root)));
        }
      }

      isAnnotation() {
        if (this.isInline()) {
          return true
        }
        if (typeof this.mapOpts.annotation !== 'undefined') {
          return this.mapOpts.annotation
        }
        if (this.previous().length) {
          return this.previous().some(i => i.annotation)
        }
        return true
      }

      toBase64(str) {
        if (Buffer) {
          return Buffer.from(str).toString('base64')
        } else {
          // istanbul ignore next
          return window.btoa(unescape(encodeURIComponent(str)))
        }
      }

      addAnnotation() {
        let content;

        if (this.isInline()) {
          content =
            'data:application/json;base64,' + this.toBase64(this.map.toString());
        } else if (typeof this.mapOpts.annotation === 'string') {
          content = this.mapOpts.annotation;
        } else if (typeof this.mapOpts.annotation === 'function') {
          content = this.mapOpts.annotation(this.opts.to, this.root);
        } else {
          content = this.outputFile() + '.map';
        }

        let eol = '\n';
        if (this.css.includes('\r\n')) eol = '\r\n';

        this.css += eol + '/*# sourceMappingURL=' + content + ' */';
      }

      outputFile() {
        if (this.opts.to) {
          return this.path(this.opts.to)
        }
        if (this.opts.from) {
          return this.path(this.opts.from)
        }
        return 'to.css'
      }

      generateMap() {
        this.generateString();
        if (this.isSourcesContent()) this.setSourcesContent();
        if (this.previous().length > 0) this.applyPrevMaps();
        if (this.isAnnotation()) this.addAnnotation();

        if (this.isInline()) {
          return [this.css]
        }
        return [this.css, this.map]
      }

      path(file) {
        if (file.indexOf('<') === 0) return file
        if (/^\w+:\/\//.test(file)) return file
        if (this.mapOpts.absolute) return file

        let from = this.opts.to ? dirname$1(this.opts.to) : '.';

        if (typeof this.mapOpts.annotation === 'string') {
          from = dirname$1(resolve$1(from, this.mapOpts.annotation));
        }

        file = relative(from, file);
        return file
      }

      toUrl(path) {
        if (sep === '\\') {
          // istanbul ignore next
          path = path.replace(/\\/g, '/');
        }
        return encodeURI(path).replace(/[#?]/g, encodeURIComponent)
      }

      sourcePath(node) {
        if (this.mapOpts.from) {
          return this.toUrl(this.mapOpts.from)
        } else if (this.mapOpts.absolute) {
          if (pathToFileURL$1) {
            return pathToFileURL$1(node.source.input.from).toString()
          } else {
            // istanbul ignore next
            throw new Error(
              '`map.absolute` option is not available in this PostCSS build'
            )
          }
        } else {
          return this.toUrl(this.path(node.source.input.from))
        }
      }

      generateString() {
        this.css = '';
        this.map = new SourceMapGenerator$2({ file: this.outputFile() });

        let line = 1;
        let column = 1;

        let noSource = '<no source>';
        let mapping = {
          source: '',
          generated: { line: 0, column: 0 },
          original: { line: 0, column: 0 }
        };

        let lines, last;
        this.stringify(this.root, (str, node, type) => {
          this.css += str;

          if (node && type !== 'end') {
            mapping.generated.line = line;
            mapping.generated.column = column - 1;
            if (node.source && node.source.start) {
              mapping.source = this.sourcePath(node);
              mapping.original.line = node.source.start.line;
              mapping.original.column = node.source.start.column - 1;
              this.map.addMapping(mapping);
            } else {
              mapping.source = noSource;
              mapping.original.line = 1;
              mapping.original.column = 0;
              this.map.addMapping(mapping);
            }
          }

          lines = str.match(/\n/g);
          if (lines) {
            line += lines.length;
            last = str.lastIndexOf('\n');
            column = str.length - last;
          } else {
            column += str.length;
          }

          if (node && type !== 'start') {
            let p = node.parent || { raws: {} };
            if (node.type !== 'decl' || node !== p.last || p.raws.semicolon) {
              if (node.source && node.source.end) {
                mapping.source = this.sourcePath(node);
                mapping.original.line = node.source.end.line;
                mapping.original.column = node.source.end.column - 1;
                mapping.generated.line = line;
                mapping.generated.column = column - 2;
                this.map.addMapping(mapping);
              } else {
                mapping.source = noSource;
                mapping.original.line = 1;
                mapping.original.column = 0;
                mapping.generated.line = line;
                mapping.generated.column = column - 1;
                this.map.addMapping(mapping);
              }
            }
          }
        });
      }

      generate() {
        this.clearAnnotation();

        if (pathAvailable$1 && sourceMapAvailable$1 && this.isMap()) {
          return this.generateMap()
        }

        let result = '';
        this.stringify(this.root, i => {
          result += i;
        });
        return [result]
      }
    }

    var mapGenerator = MapGenerator;

    let printed = {};

    var warnOnce = function warnOnce(message) {
      if (printed[message]) return
      printed[message] = true;

      if (typeof console !== 'undefined' && console.warn) {
        console.warn(message);
      }
    };

    class Warning {
      constructor(text, opts = {}) {
        this.type = 'warning';
        this.text = text;

        if (opts.node && opts.node.source) {
          let pos = opts.node.positionBy(opts);
          this.line = pos.line;
          this.column = pos.column;
        }

        for (let opt in opts) this[opt] = opts[opt];
      }

      toString() {
        if (this.node) {
          return this.node.error(this.text, {
            plugin: this.plugin,
            index: this.index,
            word: this.word
          }).message
        }

        if (this.plugin) {
          return this.plugin + ': ' + this.text
        }

        return this.text
      }
    }

    var warning = Warning;
    Warning.default = Warning;

    class Result {
      constructor(processor, root, opts) {
        this.processor = processor;
        this.messages = [];
        this.root = root;
        this.opts = opts;
        this.css = undefined;
        this.map = undefined;
      }

      toString() {
        return this.css
      }

      warn(text, opts = {}) {
        if (!opts.plugin) {
          if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
            opts.plugin = this.lastPlugin.postcssPlugin;
          }
        }

        let warning$1 = new warning(text, opts);
        this.messages.push(warning$1);

        return warning$1
      }

      warnings() {
        return this.messages.filter(i => i.type === 'warning')
      }

      get content() {
        return this.css
      }
    }

    var result = Result;
    Result.default = Result;

    class Comment extends node_1 {
      constructor(defaults) {
        super(defaults);
        this.type = 'comment';
      }
    }

    var comment = Comment;
    Comment.default = Comment;

    let { isClean: isClean$1 } = symbols;



    let parse$1, Rule$1, AtRule$1;

    function cleanSource(nodes) {
      return nodes.map(i => {
        if (i.nodes) i.nodes = cleanSource(i.nodes);
        delete i.source;
        return i
      })
    }

    function markDirtyUp(node) {
      node[isClean$1] = false;
      if (node.proxyOf.nodes) {
        for (let i of node.proxyOf.nodes) {
          markDirtyUp(i);
        }
      }
    }

    // istanbul ignore next
    function rebuild(node) {
      if (node.type === 'atrule') {
        Object.setPrototypeOf(node, AtRule$1.prototype);
      } else if (node.type === 'rule') {
        Object.setPrototypeOf(node, Rule$1.prototype);
      } else if (node.type === 'decl') {
        Object.setPrototypeOf(node, declaration.prototype);
      } else if (node.type === 'comment') {
        Object.setPrototypeOf(node, comment.prototype);
      }

      if (node.nodes) {
        node.nodes.forEach(child => {
          rebuild(child);
        });
      }
    }

    class Container extends node_1 {
      push(child) {
        child.parent = this;
        this.proxyOf.nodes.push(child);
        return this
      }

      each(callback) {
        if (!this.proxyOf.nodes) return undefined
        let iterator = this.getIterator();

        let index, result;
        while (this.indexes[iterator] < this.proxyOf.nodes.length) {
          index = this.indexes[iterator];
          result = callback(this.proxyOf.nodes[index], index);
          if (result === false) break

          this.indexes[iterator] += 1;
        }

        delete this.indexes[iterator];
        return result
      }

      walk(callback) {
        return this.each((child, i) => {
          let result;
          try {
            result = callback(child, i);
          } catch (e) {
            throw child.addToError(e)
          }
          if (result !== false && child.walk) {
            result = child.walk(callback);
          }

          return result
        })
      }

      walkDecls(prop, callback) {
        if (!callback) {
          callback = prop;
          return this.walk((child, i) => {
            if (child.type === 'decl') {
              return callback(child, i)
            }
          })
        }
        if (prop instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === 'decl' && prop.test(child.prop)) {
              return callback(child, i)
            }
          })
        }
        return this.walk((child, i) => {
          if (child.type === 'decl' && child.prop === prop) {
            return callback(child, i)
          }
        })
      }

      walkRules(selector, callback) {
        if (!callback) {
          callback = selector;

          return this.walk((child, i) => {
            if (child.type === 'rule') {
              return callback(child, i)
            }
          })
        }
        if (selector instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === 'rule' && selector.test(child.selector)) {
              return callback(child, i)
            }
          })
        }
        return this.walk((child, i) => {
          if (child.type === 'rule' && child.selector === selector) {
            return callback(child, i)
          }
        })
      }

      walkAtRules(name, callback) {
        if (!callback) {
          callback = name;
          return this.walk((child, i) => {
            if (child.type === 'atrule') {
              return callback(child, i)
            }
          })
        }
        if (name instanceof RegExp) {
          return this.walk((child, i) => {
            if (child.type === 'atrule' && name.test(child.name)) {
              return callback(child, i)
            }
          })
        }
        return this.walk((child, i) => {
          if (child.type === 'atrule' && child.name === name) {
            return callback(child, i)
          }
        })
      }

      walkComments(callback) {
        return this.walk((child, i) => {
          if (child.type === 'comment') {
            return callback(child, i)
          }
        })
      }

      append(...children) {
        for (let child of children) {
          let nodes = this.normalize(child, this.last);
          for (let node of nodes) this.proxyOf.nodes.push(node);
        }

        this.markDirty();

        return this
      }

      prepend(...children) {
        children = children.reverse();
        for (let child of children) {
          let nodes = this.normalize(child, this.first, 'prepend').reverse();
          for (let node of nodes) this.proxyOf.nodes.unshift(node);
          for (let id in this.indexes) {
            this.indexes[id] = this.indexes[id] + nodes.length;
          }
        }

        this.markDirty();

        return this
      }

      cleanRaws(keepBetween) {
        super.cleanRaws(keepBetween);
        if (this.nodes) {
          for (let node of this.nodes) node.cleanRaws(keepBetween);
        }
      }

      insertBefore(exist, add) {
        exist = this.index(exist);

        let type = exist === 0 ? 'prepend' : false;
        let nodes = this.normalize(add, this.proxyOf.nodes[exist], type).reverse();
        for (let node of nodes) this.proxyOf.nodes.splice(exist, 0, node);

        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (exist <= index) {
            this.indexes[id] = index + nodes.length;
          }
        }

        this.markDirty();

        return this
      }

      insertAfter(exist, add) {
        exist = this.index(exist);

        let nodes = this.normalize(add, this.proxyOf.nodes[exist]).reverse();
        for (let node of nodes) this.proxyOf.nodes.splice(exist + 1, 0, node);

        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (exist < index) {
            this.indexes[id] = index + nodes.length;
          }
        }

        this.markDirty();

        return this
      }

      removeChild(child) {
        child = this.index(child);
        this.proxyOf.nodes[child].parent = undefined;
        this.proxyOf.nodes.splice(child, 1);

        let index;
        for (let id in this.indexes) {
          index = this.indexes[id];
          if (index >= child) {
            this.indexes[id] = index - 1;
          }
        }

        this.markDirty();

        return this
      }

      removeAll() {
        for (let node of this.proxyOf.nodes) node.parent = undefined;
        this.proxyOf.nodes = [];

        this.markDirty();

        return this
      }

      replaceValues(pattern, opts, callback) {
        if (!callback) {
          callback = opts;
          opts = {};
        }

        this.walkDecls(decl => {
          if (opts.props && !opts.props.includes(decl.prop)) return
          if (opts.fast && !decl.value.includes(opts.fast)) return

          decl.value = decl.value.replace(pattern, callback);
        });

        this.markDirty();

        return this
      }

      every(condition) {
        return this.nodes.every(condition)
      }

      some(condition) {
        return this.nodes.some(condition)
      }

      index(child) {
        if (typeof child === 'number') return child
        if (child.proxyOf) child = child.proxyOf;
        return this.proxyOf.nodes.indexOf(child)
      }

      get first() {
        if (!this.proxyOf.nodes) return undefined
        return this.proxyOf.nodes[0]
      }

      get last() {
        if (!this.proxyOf.nodes) return undefined
        return this.proxyOf.nodes[this.proxyOf.nodes.length - 1]
      }

      normalize(nodes, sample) {
        if (typeof nodes === 'string') {
          nodes = cleanSource(parse$1(nodes).nodes);
        } else if (Array.isArray(nodes)) {
          nodes = nodes.slice(0);
          for (let i of nodes) {
            if (i.parent) i.parent.removeChild(i, 'ignore');
          }
        } else if (nodes.type === 'root' && this.type !== 'document') {
          nodes = nodes.nodes.slice(0);
          for (let i of nodes) {
            if (i.parent) i.parent.removeChild(i, 'ignore');
          }
        } else if (nodes.type) {
          nodes = [nodes];
        } else if (nodes.prop) {
          if (typeof nodes.value === 'undefined') {
            throw new Error('Value field is missed in node creation')
          } else if (typeof nodes.value !== 'string') {
            nodes.value = String(nodes.value);
          }
          nodes = [new declaration(nodes)];
        } else if (nodes.selector) {
          nodes = [new Rule$1(nodes)];
        } else if (nodes.name) {
          nodes = [new AtRule$1(nodes)];
        } else if (nodes.text) {
          nodes = [new comment(nodes)];
        } else {
          throw new Error('Unknown node type in node creation')
        }

        let processed = nodes.map(i => {
          // istanbul ignore next
          if (typeof i.markDirty !== 'function') rebuild(i);
          i = i.proxyOf;
          if (i.parent) i.parent.removeChild(i);
          if (i[isClean$1]) markDirtyUp(i);
          if (typeof i.raws.before === 'undefined') {
            if (sample && typeof sample.raws.before !== 'undefined') {
              i.raws.before = sample.raws.before.replace(/\S/g, '');
            }
          }
          i.parent = this;
          return i
        });

        return processed
      }

      getProxyProcessor() {
        return {
          set(node, prop, value) {
            if (node[prop] === value) return true
            node[prop] = value;
            if (prop === 'name' || prop === 'params' || prop === 'selector') {
              node.markDirty();
            }
            return true
          },

          get(node, prop) {
            if (prop === 'proxyOf') {
              return node
            } else if (!node[prop]) {
              return node[prop]
            } else if (
              prop === 'each' ||
              (typeof prop === 'string' && prop.startsWith('walk'))
            ) {
              return (...args) => {
                return node[prop](
                  ...args.map(i => {
                    if (typeof i === 'function') {
                      return (child, index) => i(child.toProxy(), index)
                    } else {
                      return i
                    }
                  })
                )
              }
            } else if (prop === 'every' || prop === 'some') {
              return cb => {
                return node[prop]((child, ...other) =>
                  cb(child.toProxy(), ...other)
                )
              }
            } else if (prop === 'root') {
              return () => node.root().toProxy()
            } else if (prop === 'nodes') {
              return node.nodes.map(i => i.toProxy())
            } else if (prop === 'first' || prop === 'last') {
              return node[prop].toProxy()
            } else {
              return node[prop]
            }
          }
        }
      }

      getIterator() {
        if (!this.lastEach) this.lastEach = 0;
        if (!this.indexes) this.indexes = {};

        this.lastEach += 1;
        let iterator = this.lastEach;
        this.indexes[iterator] = 0;

        return iterator
      }
    }

    Container.registerParse = dependant => {
      parse$1 = dependant;
    };

    Container.registerRule = dependant => {
      Rule$1 = dependant;
    };

    Container.registerAtRule = dependant => {
      AtRule$1 = dependant;
    };

    var container = Container;
    Container.default = Container;

    const SINGLE_QUOTE = "'".charCodeAt(0);
    const DOUBLE_QUOTE = '"'.charCodeAt(0);
    const BACKSLASH = '\\'.charCodeAt(0);
    const SLASH = '/'.charCodeAt(0);
    const NEWLINE = '\n'.charCodeAt(0);
    const SPACE = ' '.charCodeAt(0);
    const FEED = '\f'.charCodeAt(0);
    const TAB = '\t'.charCodeAt(0);
    const CR = '\r'.charCodeAt(0);
    const OPEN_SQUARE = '['.charCodeAt(0);
    const CLOSE_SQUARE = ']'.charCodeAt(0);
    const OPEN_PARENTHESES = '('.charCodeAt(0);
    const CLOSE_PARENTHESES = ')'.charCodeAt(0);
    const OPEN_CURLY = '{'.charCodeAt(0);
    const CLOSE_CURLY = '}'.charCodeAt(0);
    const SEMICOLON = ';'.charCodeAt(0);
    const ASTERISK = '*'.charCodeAt(0);
    const COLON = ':'.charCodeAt(0);
    const AT = '@'.charCodeAt(0);

    const RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g;
    const RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
    const RE_BAD_BRACKET = /.[\n"'(/\\]/;
    const RE_HEX_ESCAPE = /[\da-f]/i;

    var tokenize = function tokenizer(input, options = {}) {
      let css = input.css.valueOf();
      let ignore = options.ignoreErrors;

      let code, next, quote, content, escape;
      let escaped, escapePos, prev, n, currentToken;

      let length = css.length;
      let pos = 0;
      let buffer = [];
      let returned = [];

      function position() {
        return pos
      }

      function unclosed(what) {
        throw input.error('Unclosed ' + what, pos)
      }

      function endOfFile() {
        return returned.length === 0 && pos >= length
      }

      function nextToken(opts) {
        if (returned.length) return returned.pop()
        if (pos >= length) return

        let ignoreUnclosed = opts ? opts.ignoreUnclosed : false;

        code = css.charCodeAt(pos);

        switch (code) {
          case NEWLINE:
          case SPACE:
          case TAB:
          case CR:
          case FEED: {
            next = pos;
            do {
              next += 1;
              code = css.charCodeAt(next);
            } while (
              code === SPACE ||
              code === NEWLINE ||
              code === TAB ||
              code === CR ||
              code === FEED
            )

            currentToken = ['space', css.slice(pos, next)];
            pos = next - 1;
            break
          }

          case OPEN_SQUARE:
          case CLOSE_SQUARE:
          case OPEN_CURLY:
          case CLOSE_CURLY:
          case COLON:
          case SEMICOLON:
          case CLOSE_PARENTHESES: {
            let controlChar = String.fromCharCode(code);
            currentToken = [controlChar, controlChar, pos];
            break
          }

          case OPEN_PARENTHESES: {
            prev = buffer.length ? buffer.pop()[1] : '';
            n = css.charCodeAt(pos + 1);
            if (
              prev === 'url' &&
              n !== SINGLE_QUOTE &&
              n !== DOUBLE_QUOTE &&
              n !== SPACE &&
              n !== NEWLINE &&
              n !== TAB &&
              n !== FEED &&
              n !== CR
            ) {
              next = pos;
              do {
                escaped = false;
                next = css.indexOf(')', next + 1);
                if (next === -1) {
                  if (ignore || ignoreUnclosed) {
                    next = pos;
                    break
                  } else {
                    unclosed('bracket');
                  }
                }
                escapePos = next;
                while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                  escapePos -= 1;
                  escaped = !escaped;
                }
              } while (escaped)

              currentToken = ['brackets', css.slice(pos, next + 1), pos, next];

              pos = next;
            } else {
              next = css.indexOf(')', pos + 1);
              content = css.slice(pos, next + 1);

              if (next === -1 || RE_BAD_BRACKET.test(content)) {
                currentToken = ['(', '(', pos];
              } else {
                currentToken = ['brackets', content, pos, next];
                pos = next;
              }
            }

            break
          }

          case SINGLE_QUOTE:
          case DOUBLE_QUOTE: {
            quote = code === SINGLE_QUOTE ? "'" : '"';
            next = pos;
            do {
              escaped = false;
              next = css.indexOf(quote, next + 1);
              if (next === -1) {
                if (ignore || ignoreUnclosed) {
                  next = pos + 1;
                  break
                } else {
                  unclosed('string');
                }
              }
              escapePos = next;
              while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                escapePos -= 1;
                escaped = !escaped;
              }
            } while (escaped)

            currentToken = ['string', css.slice(pos, next + 1), pos, next];
            pos = next;
            break
          }

          case AT: {
            RE_AT_END.lastIndex = pos + 1;
            RE_AT_END.test(css);
            if (RE_AT_END.lastIndex === 0) {
              next = css.length - 1;
            } else {
              next = RE_AT_END.lastIndex - 2;
            }

            currentToken = ['at-word', css.slice(pos, next + 1), pos, next];

            pos = next;
            break
          }

          case BACKSLASH: {
            next = pos;
            escape = true;
            while (css.charCodeAt(next + 1) === BACKSLASH) {
              next += 1;
              escape = !escape;
            }
            code = css.charCodeAt(next + 1);
            if (
              escape &&
              code !== SLASH &&
              code !== SPACE &&
              code !== NEWLINE &&
              code !== TAB &&
              code !== CR &&
              code !== FEED
            ) {
              next += 1;
              if (RE_HEX_ESCAPE.test(css.charAt(next))) {
                while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                  next += 1;
                }
                if (css.charCodeAt(next + 1) === SPACE) {
                  next += 1;
                }
              }
            }

            currentToken = ['word', css.slice(pos, next + 1), pos, next];

            pos = next;
            break
          }

          default: {
            if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
              next = css.indexOf('*/', pos + 2) + 1;
              if (next === 0) {
                if (ignore || ignoreUnclosed) {
                  next = css.length;
                } else {
                  unclosed('comment');
                }
              }

              currentToken = ['comment', css.slice(pos, next + 1), pos, next];
              pos = next;
            } else {
              RE_WORD_END.lastIndex = pos + 1;
              RE_WORD_END.test(css);
              if (RE_WORD_END.lastIndex === 0) {
                next = css.length - 1;
              } else {
                next = RE_WORD_END.lastIndex - 2;
              }

              currentToken = ['word', css.slice(pos, next + 1), pos, next];
              buffer.push(currentToken);
              pos = next;
            }

            break
          }
        }

        pos++;
        return currentToken
      }

      function back(token) {
        returned.push(token);
      }

      return {
        back,
        nextToken,
        endOfFile,
        position
      }
    };

    class AtRule extends container {
      constructor(defaults) {
        super(defaults);
        this.type = 'atrule';
      }

      append(...children) {
        if (!this.proxyOf.nodes) this.nodes = [];
        return super.append(...children)
      }

      prepend(...children) {
        if (!this.proxyOf.nodes) this.nodes = [];
        return super.prepend(...children)
      }
    }

    var atRule = AtRule;
    AtRule.default = AtRule;

    container.registerAtRule(AtRule);

    let LazyResult$2, Processor$2;

    class Root extends container {
      constructor(defaults) {
        super(defaults);
        this.type = 'root';
        if (!this.nodes) this.nodes = [];
      }

      removeChild(child, ignore) {
        let index = this.index(child);

        if (!ignore && index === 0 && this.nodes.length > 1) {
          this.nodes[1].raws.before = this.nodes[index].raws.before;
        }

        return super.removeChild(child)
      }

      normalize(child, sample, type) {
        let nodes = super.normalize(child);

        if (sample) {
          if (type === 'prepend') {
            if (this.nodes.length > 1) {
              sample.raws.before = this.nodes[1].raws.before;
            } else {
              delete sample.raws.before;
            }
          } else if (this.first !== sample) {
            for (let node of nodes) {
              node.raws.before = sample.raws.before;
            }
          }
        }

        return nodes
      }

      toResult(opts = {}) {
        let lazy = new LazyResult$2(new Processor$2(), this, opts);
        return lazy.stringify()
      }
    }

    Root.registerLazyResult = dependant => {
      LazyResult$2 = dependant;
    };

    Root.registerProcessor = dependant => {
      Processor$2 = dependant;
    };

    var root = Root;
    Root.default = Root;

    let list = {
      split(string, separators, last) {
        let array = [];
        let current = '';
        let split = false;

        let func = 0;
        let quote = false;
        let escape = false;

        for (let letter of string) {
          if (escape) {
            escape = false;
          } else if (letter === '\\') {
            escape = true;
          } else if (quote) {
            if (letter === quote) {
              quote = false;
            }
          } else if (letter === '"' || letter === "'") {
            quote = letter;
          } else if (letter === '(') {
            func += 1;
          } else if (letter === ')') {
            if (func > 0) func -= 1;
          } else if (func === 0) {
            if (separators.includes(letter)) split = true;
          }

          if (split) {
            if (current !== '') array.push(current.trim());
            current = '';
            split = false;
          } else {
            current += letter;
          }
        }

        if (last || current !== '') array.push(current.trim());
        return array
      },

      space(string) {
        let spaces = [' ', '\n', '\t'];
        return list.split(string, spaces)
      },

      comma(string) {
        return list.split(string, [','], true)
      }
    };

    var list_1 = list;
    list.default = list;

    class Rule extends container {
      constructor(defaults) {
        super(defaults);
        this.type = 'rule';
        if (!this.nodes) this.nodes = [];
      }

      get selectors() {
        return list_1.comma(this.selector)
      }

      set selectors(values) {
        let match = this.selector ? this.selector.match(/,\s*/) : null;
        let sep = match ? match[0] : ',' + this.raw('between', 'beforeOpen');
        this.selector = values.join(sep);
      }
    }

    var rule = Rule;
    Rule.default = Rule;

    container.registerRule(Rule);

    class Parser {
      constructor(input) {
        this.input = input;

        this.root = new root();
        this.current = this.root;
        this.spaces = '';
        this.semicolon = false;
        this.customProperty = false;

        this.createTokenizer();
        this.root.source = { input, start: { offset: 0, line: 1, column: 1 } };
      }

      createTokenizer() {
        this.tokenizer = tokenize(this.input);
      }

      parse() {
        let token;
        while (!this.tokenizer.endOfFile()) {
          token = this.tokenizer.nextToken();

          switch (token[0]) {
            case 'space':
              this.spaces += token[1];
              break

            case ';':
              this.freeSemicolon(token);
              break

            case '}':
              this.end(token);
              break

            case 'comment':
              this.comment(token);
              break

            case 'at-word':
              this.atrule(token);
              break

            case '{':
              this.emptyRule(token);
              break

            default:
              this.other(token);
              break
          }
        }
        this.endFile();
      }

      comment(token) {
        let node = new comment();
        this.init(node, token[2]);
        node.source.end = this.getPosition(token[3] || token[2]);

        let text = token[1].slice(2, -2);
        if (/^\s*$/.test(text)) {
          node.text = '';
          node.raws.left = text;
          node.raws.right = '';
        } else {
          let match = text.match(/^(\s*)([^]*\S)(\s*)$/);
          node.text = match[2];
          node.raws.left = match[1];
          node.raws.right = match[3];
        }
      }

      emptyRule(token) {
        let node = new rule();
        this.init(node, token[2]);
        node.selector = '';
        node.raws.between = '';
        this.current = node;
      }

      other(start) {
        let end = false;
        let type = null;
        let colon = false;
        let bracket = null;
        let brackets = [];
        let customProperty = start[1].startsWith('--');

        let tokens = [];
        let token = start;
        while (token) {
          type = token[0];
          tokens.push(token);

          if (type === '(' || type === '[') {
            if (!bracket) bracket = token;
            brackets.push(type === '(' ? ')' : ']');
          } else if (customProperty && colon && type === '{') {
            if (!bracket) bracket = token;
            brackets.push('}');
          } else if (brackets.length === 0) {
            if (type === ';') {
              if (colon) {
                this.decl(tokens, customProperty);
                return
              } else {
                break
              }
            } else if (type === '{') {
              this.rule(tokens);
              return
            } else if (type === '}') {
              this.tokenizer.back(tokens.pop());
              end = true;
              break
            } else if (type === ':') {
              colon = true;
            }
          } else if (type === brackets[brackets.length - 1]) {
            brackets.pop();
            if (brackets.length === 0) bracket = null;
          }

          token = this.tokenizer.nextToken();
        }

        if (this.tokenizer.endOfFile()) end = true;
        if (brackets.length > 0) this.unclosedBracket(bracket);

        if (end && colon) {
          while (tokens.length) {
            token = tokens[tokens.length - 1][0];
            if (token !== 'space' && token !== 'comment') break
            this.tokenizer.back(tokens.pop());
          }
          this.decl(tokens, customProperty);
        } else {
          this.unknownWord(tokens);
        }
      }

      rule(tokens) {
        tokens.pop();

        let node = new rule();
        this.init(node, tokens[0][2]);

        node.raws.between = this.spacesAndCommentsFromEnd(tokens);
        this.raw(node, 'selector', tokens);
        this.current = node;
      }

      decl(tokens, customProperty) {
        let node = new declaration();
        this.init(node, tokens[0][2]);

        let last = tokens[tokens.length - 1];
        if (last[0] === ';') {
          this.semicolon = true;
          tokens.pop();
        }
        node.source.end = this.getPosition(last[3] || last[2]);

        while (tokens[0][0] !== 'word') {
          if (tokens.length === 1) this.unknownWord(tokens);
          node.raws.before += tokens.shift()[1];
        }
        node.source.start = this.getPosition(tokens[0][2]);

        node.prop = '';
        while (tokens.length) {
          let type = tokens[0][0];
          if (type === ':' || type === 'space' || type === 'comment') {
            break
          }
          node.prop += tokens.shift()[1];
        }

        node.raws.between = '';

        let token;
        while (tokens.length) {
          token = tokens.shift();

          if (token[0] === ':') {
            node.raws.between += token[1];
            break
          } else {
            if (token[0] === 'word' && /\w/.test(token[1])) {
              this.unknownWord([token]);
            }
            node.raws.between += token[1];
          }
        }

        if (node.prop[0] === '_' || node.prop[0] === '*') {
          node.raws.before += node.prop[0];
          node.prop = node.prop.slice(1);
        }
        let firstSpaces = this.spacesAndCommentsFromStart(tokens);
        this.precheckMissedSemicolon(tokens);

        for (let i = tokens.length - 1; i >= 0; i--) {
          token = tokens[i];
          if (token[1].toLowerCase() === '!important') {
            node.important = true;
            let string = this.stringFrom(tokens, i);
            string = this.spacesFromEnd(tokens) + string;
            if (string !== ' !important') node.raws.important = string;
            break
          } else if (token[1].toLowerCase() === 'important') {
            let cache = tokens.slice(0);
            let str = '';
            for (let j = i; j > 0; j--) {
              let type = cache[j][0];
              if (str.trim().indexOf('!') === 0 && type !== 'space') {
                break
              }
              str = cache.pop()[1] + str;
            }
            if (str.trim().indexOf('!') === 0) {
              node.important = true;
              node.raws.important = str;
              tokens = cache;
            }
          }

          if (token[0] !== 'space' && token[0] !== 'comment') {
            break
          }
        }

        let hasWord = tokens.some(i => i[0] !== 'space' && i[0] !== 'comment');
        this.raw(node, 'value', tokens);
        if (hasWord) {
          node.raws.between += firstSpaces;
        } else {
          node.value = firstSpaces + node.value;
        }

        if (node.value.includes(':') && !customProperty) {
          this.checkMissedSemicolon(tokens);
        }
      }

      atrule(token) {
        let node = new atRule();
        node.name = token[1].slice(1);
        if (node.name === '') {
          this.unnamedAtrule(node, token);
        }
        this.init(node, token[2]);

        let type;
        let prev;
        let shift;
        let last = false;
        let open = false;
        let params = [];
        let brackets = [];

        while (!this.tokenizer.endOfFile()) {
          token = this.tokenizer.nextToken();
          type = token[0];

          if (type === '(' || type === '[') {
            brackets.push(type === '(' ? ')' : ']');
          } else if (type === '{' && brackets.length > 0) {
            brackets.push('}');
          } else if (type === brackets[brackets.length - 1]) {
            brackets.pop();
          }

          if (brackets.length === 0) {
            if (type === ';') {
              node.source.end = this.getPosition(token[2]);
              this.semicolon = true;
              break
            } else if (type === '{') {
              open = true;
              break
            } else if (type === '}') {
              if (params.length > 0) {
                shift = params.length - 1;
                prev = params[shift];
                while (prev && prev[0] === 'space') {
                  prev = params[--shift];
                }
                if (prev) {
                  node.source.end = this.getPosition(prev[3] || prev[2]);
                }
              }
              this.end(token);
              break
            } else {
              params.push(token);
            }
          } else {
            params.push(token);
          }

          if (this.tokenizer.endOfFile()) {
            last = true;
            break
          }
        }

        node.raws.between = this.spacesAndCommentsFromEnd(params);
        if (params.length) {
          node.raws.afterName = this.spacesAndCommentsFromStart(params);
          this.raw(node, 'params', params);
          if (last) {
            token = params[params.length - 1];
            node.source.end = this.getPosition(token[3] || token[2]);
            this.spaces = node.raws.between;
            node.raws.between = '';
          }
        } else {
          node.raws.afterName = '';
          node.params = '';
        }

        if (open) {
          node.nodes = [];
          this.current = node;
        }
      }

      end(token) {
        if (this.current.nodes && this.current.nodes.length) {
          this.current.raws.semicolon = this.semicolon;
        }
        this.semicolon = false;

        this.current.raws.after = (this.current.raws.after || '') + this.spaces;
        this.spaces = '';

        if (this.current.parent) {
          this.current.source.end = this.getPosition(token[2]);
          this.current = this.current.parent;
        } else {
          this.unexpectedClose(token);
        }
      }

      endFile() {
        if (this.current.parent) this.unclosedBlock();
        if (this.current.nodes && this.current.nodes.length) {
          this.current.raws.semicolon = this.semicolon;
        }
        this.current.raws.after = (this.current.raws.after || '') + this.spaces;
      }

      freeSemicolon(token) {
        this.spaces += token[1];
        if (this.current.nodes) {
          let prev = this.current.nodes[this.current.nodes.length - 1];
          if (prev && prev.type === 'rule' && !prev.raws.ownSemicolon) {
            prev.raws.ownSemicolon = this.spaces;
            this.spaces = '';
          }
        }
      }

      // Helpers

      getPosition(offset) {
        let pos = this.input.fromOffset(offset);
        return {
          offset,
          line: pos.line,
          column: pos.col
        }
      }

      init(node, offset) {
        this.current.push(node);
        node.source = {
          start: this.getPosition(offset),
          input: this.input
        };
        node.raws.before = this.spaces;
        this.spaces = '';
        if (node.type !== 'comment') this.semicolon = false;
      }

      raw(node, prop, tokens) {
        let token, type;
        let length = tokens.length;
        let value = '';
        let clean = true;
        let next, prev;
        let pattern = /^([#.|])?(\w)+/i;

        for (let i = 0; i < length; i += 1) {
          token = tokens[i];
          type = token[0];

          if (type === 'comment' && node.type === 'rule') {
            prev = tokens[i - 1];
            next = tokens[i + 1];

            if (
              prev[0] !== 'space' &&
              next[0] !== 'space' &&
              pattern.test(prev[1]) &&
              pattern.test(next[1])
            ) {
              value += token[1];
            } else {
              clean = false;
            }

            continue
          }

          if (type === 'comment' || (type === 'space' && i === length - 1)) {
            clean = false;
          } else {
            value += token[1];
          }
        }
        if (!clean) {
          let raw = tokens.reduce((all, i) => all + i[1], '');
          node.raws[prop] = { value, raw };
        }
        node[prop] = value;
      }

      spacesAndCommentsFromEnd(tokens) {
        let lastTokenType;
        let spaces = '';
        while (tokens.length) {
          lastTokenType = tokens[tokens.length - 1][0];
          if (lastTokenType !== 'space' && lastTokenType !== 'comment') break
          spaces = tokens.pop()[1] + spaces;
        }
        return spaces
      }

      spacesAndCommentsFromStart(tokens) {
        let next;
        let spaces = '';
        while (tokens.length) {
          next = tokens[0][0];
          if (next !== 'space' && next !== 'comment') break
          spaces += tokens.shift()[1];
        }
        return spaces
      }

      spacesFromEnd(tokens) {
        let lastTokenType;
        let spaces = '';
        while (tokens.length) {
          lastTokenType = tokens[tokens.length - 1][0];
          if (lastTokenType !== 'space') break
          spaces = tokens.pop()[1] + spaces;
        }
        return spaces
      }

      stringFrom(tokens, from) {
        let result = '';
        for (let i = from; i < tokens.length; i++) {
          result += tokens[i][1];
        }
        tokens.splice(from, tokens.length - from);
        return result
      }

      colon(tokens) {
        let brackets = 0;
        let token, type, prev;
        for (let [i, element] of tokens.entries()) {
          token = element;
          type = token[0];

          if (type === '(') {
            brackets += 1;
          }
          if (type === ')') {
            brackets -= 1;
          }
          if (brackets === 0 && type === ':') {
            if (!prev) {
              this.doubleColon(token);
            } else if (prev[0] === 'word' && prev[1] === 'progid') {
              continue
            } else {
              return i
            }
          }

          prev = token;
        }
        return false
      }

      // Errors

      unclosedBracket(bracket) {
        throw this.input.error('Unclosed bracket', bracket[2])
      }

      unknownWord(tokens) {
        throw this.input.error('Unknown word', tokens[0][2])
      }

      unexpectedClose(token) {
        throw this.input.error('Unexpected }', token[2])
      }

      unclosedBlock() {
        let pos = this.current.source.start;
        throw this.input.error('Unclosed block', pos.line, pos.column)
      }

      doubleColon(token) {
        throw this.input.error('Double colon', token[2])
      }

      unnamedAtrule(node, token) {
        throw this.input.error('At-rule without name', token[2])
      }

      precheckMissedSemicolon(/* tokens */) {
        // Hook for Safe Parser
      }

      checkMissedSemicolon(tokens) {
        let colon = this.colon(tokens);
        if (colon === false) return

        let founded = 0;
        let token;
        for (let j = colon - 1; j >= 0; j--) {
          token = tokens[j];
          if (token[0] !== 'space') {
            founded += 1;
            if (founded === 2) break
          }
        }
        throw this.input.error('Missed semicolon', token[2])
      }
    }

    var parser = Parser;

    // This alphabet uses `A-Za-z0-9_-` symbols. The genetic algorithm helped
    // optimize the gzip compression for this alphabet.
    let urlAlphabet =
      'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW';

    let customAlphabet = (alphabet, size) => {
      return () => {
        let id = '';
        // A compact alternative for `for (var i = 0; i < step; i++)`.
        let i = size;
        while (i--) {
          // `| 0` is more compact and faster than `Math.floor()`.
          id += alphabet[(Math.random() * alphabet.length) | 0];
        }
        return id
      }
    };

    let nanoid$1 = (size = 21) => {
      let id = '';
      // A compact alternative for `for (var i = 0; i < step; i++)`.
      let i = size;
      while (i--) {
        // `| 0` is more compact and faster than `Math.floor()`.
        id += urlAlphabet[(Math.random() * 64) | 0];
      }
      return id
    };

    var nonSecure = { nanoid: nanoid$1, customAlphabet };

    let { existsSync, readFileSync } = terminalHighlight;
    let { dirname, join } = terminalHighlight;
    let { SourceMapConsumer: SourceMapConsumer$1, SourceMapGenerator: SourceMapGenerator$1 } = terminalHighlight;

    function fromBase64(str) {
      if (Buffer) {
        return Buffer.from(str, 'base64').toString()
      } else {
        // istanbul ignore next
        return window.atob(str)
      }
    }

    class PreviousMap {
      constructor(css, opts) {
        if (opts.map === false) return
        this.loadAnnotation(css);
        this.inline = this.startWith(this.annotation, 'data:');

        let prev = opts.map ? opts.map.prev : undefined;
        let text = this.loadMap(opts.from, prev);
        if (!this.mapFile && opts.from) {
          this.mapFile = opts.from;
        }
        if (this.mapFile) this.root = dirname(this.mapFile);
        if (text) this.text = text;
      }

      consumer() {
        if (!this.consumerCache) {
          this.consumerCache = new SourceMapConsumer$1(this.text);
        }
        return this.consumerCache
      }

      withContent() {
        return !!(
          this.consumer().sourcesContent &&
          this.consumer().sourcesContent.length > 0
        )
      }

      startWith(string, start) {
        if (!string) return false
        return string.substr(0, start.length) === start
      }

      getAnnotationURL(sourceMapString) {
        return sourceMapString
          .match(/\/\*\s*# sourceMappingURL=((?:(?!sourceMappingURL=).)*)\*\//)[1]
          .trim()
      }

      loadAnnotation(css) {
        let annotations = css.match(
          /\/\*\s*# sourceMappingURL=(?:(?!sourceMappingURL=).)*\*\//gm
        );

        if (annotations && annotations.length > 0) {
          // Locate the last sourceMappingURL to avoid picking up
          // sourceMappingURLs from comments, strings, etc.
          let lastAnnotation = annotations[annotations.length - 1];
          if (lastAnnotation) {
            this.annotation = this.getAnnotationURL(lastAnnotation);
          }
        }
      }

      decodeInline(text) {
        let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
        let baseUri = /^data:application\/json;base64,/;
        let charsetUri = /^data:application\/json;charset=utf-?8,/;
        let uri = /^data:application\/json,/;

        if (charsetUri.test(text) || uri.test(text)) {
          return decodeURIComponent(text.substr(RegExp.lastMatch.length))
        }

        if (baseCharsetUri.test(text) || baseUri.test(text)) {
          return fromBase64(text.substr(RegExp.lastMatch.length))
        }

        let encoding = text.match(/data:application\/json;([^,]+),/)[1];
        throw new Error('Unsupported source map encoding ' + encoding)
      }

      loadFile(path) {
        this.root = dirname(path);
        if (existsSync(path)) {
          this.mapFile = path;
          return readFileSync(path, 'utf-8').toString().trim()
        }
      }

      loadMap(file, prev) {
        if (prev === false) return false

        if (prev) {
          if (typeof prev === 'string') {
            return prev
          } else if (typeof prev === 'function') {
            let prevPath = prev(file);
            if (prevPath) {
              let map = this.loadFile(prevPath);
              if (!map) {
                throw new Error(
                  'Unable to load previous source map: ' + prevPath.toString()
                )
              }
              return map
            }
          } else if (prev instanceof SourceMapConsumer$1) {
            return SourceMapGenerator$1.fromSourceMap(prev).toString()
          } else if (prev instanceof SourceMapGenerator$1) {
            return prev.toString()
          } else if (this.isMap(prev)) {
            return JSON.stringify(prev)
          } else {
            throw new Error(
              'Unsupported previous source map format: ' + prev.toString()
            )
          }
        } else if (this.inline) {
          return this.decodeInline(this.annotation)
        } else if (this.annotation) {
          let map = this.annotation;
          if (file) map = join(dirname(file), map);
          return this.loadFile(map)
        }
      }

      isMap(map) {
        if (typeof map !== 'object') return false
        return (
          typeof map.mappings === 'string' ||
          typeof map._mappings === 'string' ||
          Array.isArray(map.sections)
        )
      }
    }

    var previousMap = PreviousMap;
    PreviousMap.default = PreviousMap;

    let { SourceMapConsumer, SourceMapGenerator } = terminalHighlight;
    let { fileURLToPath, pathToFileURL } = terminalHighlight;
    let { resolve, isAbsolute } = terminalHighlight;
    let { nanoid } = nonSecure;





    let fromOffsetCache = Symbol('fromOffset cache');

    let sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
    let pathAvailable = Boolean(resolve && isAbsolute);

    class Input {
      constructor(css, opts = {}) {
        if (
          css === null ||
          typeof css === 'undefined' ||
          (typeof css === 'object' && !css.toString)
        ) {
          throw new Error(`PostCSS received ${css} instead of CSS string`)
        }

        this.css = css.toString();

        if (this.css[0] === '\uFEFF' || this.css[0] === '\uFFFE') {
          this.hasBOM = true;
          this.css = this.css.slice(1);
        } else {
          this.hasBOM = false;
        }

        if (opts.from) {
          if (
            !pathAvailable ||
            /^\w+:\/\//.test(opts.from) ||
            isAbsolute(opts.from)
          ) {
            this.file = opts.from;
          } else {
            this.file = resolve(opts.from);
          }
        }

        if (pathAvailable && sourceMapAvailable) {
          let map = new previousMap(this.css, opts);
          if (map.text) {
            this.map = map;
            let file = map.consumer().file;
            if (!this.file && file) this.file = this.mapResolve(file);
          }
        }

        if (!this.file) {
          this.id = '<input css ' + nanoid(6) + '>';
        }
        if (this.map) this.map.file = this.from;
      }

      fromOffset(offset) {
        let lastLine, lineToIndex;
        if (!this[fromOffsetCache]) {
          let lines = this.css.split('\n');
          lineToIndex = new Array(lines.length);
          let prevIndex = 0;

          for (let i = 0, l = lines.length; i < l; i++) {
            lineToIndex[i] = prevIndex;
            prevIndex += lines[i].length + 1;
          }

          this[fromOffsetCache] = lineToIndex;
        } else {
          lineToIndex = this[fromOffsetCache];
        }
        lastLine = lineToIndex[lineToIndex.length - 1];

        let min = 0;
        if (offset >= lastLine) {
          min = lineToIndex.length - 1;
        } else {
          let max = lineToIndex.length - 2;
          let mid;
          while (min < max) {
            mid = min + ((max - min) >> 1);
            if (offset < lineToIndex[mid]) {
              max = mid - 1;
            } else if (offset >= lineToIndex[mid + 1]) {
              min = mid + 1;
            } else {
              min = mid;
              break
            }
          }
        }
        return {
          line: min + 1,
          col: offset - lineToIndex[min] + 1
        }
      }

      error(message, line, column, opts = {}) {
        let result;
        if (!column) {
          let pos = this.fromOffset(line);
          line = pos.line;
          column = pos.col;
        }
        let origin = this.origin(line, column);
        if (origin) {
          result = new cssSyntaxError(
            message,
            origin.line,
            origin.column,
            origin.source,
            origin.file,
            opts.plugin
          );
        } else {
          result = new cssSyntaxError(
            message,
            line,
            column,
            this.css,
            this.file,
            opts.plugin
          );
        }

        result.input = { line, column, source: this.css };
        if (this.file) {
          if (pathToFileURL) {
            result.input.url = pathToFileURL(this.file).toString();
          }
          result.input.file = this.file;
        }

        return result
      }

      origin(line, column) {
        if (!this.map) return false
        let consumer = this.map.consumer();

        let from = consumer.originalPositionFor({ line, column });
        if (!from.source) return false

        let fromUrl;

        if (isAbsolute(from.source)) {
          fromUrl = pathToFileURL(from.source);
        } else {
          fromUrl = new URL(
            from.source,
            this.map.consumer().sourceRoot || pathToFileURL(this.map.mapFile)
          );
        }

        let result = {
          url: fromUrl.toString(),
          line: from.line,
          column: from.column
        };

        if (fromUrl.protocol === 'file:') {
          if (fileURLToPath) {
            result.file = fileURLToPath(fromUrl);
          } else {
            // istanbul ignore next
            throw new Error(`file: protocol is not available in this PostCSS build`)
          }
        }

        let source = consumer.sourceContentFor(from.source);
        if (source) result.source = source;

        return result
      }

      mapResolve(file) {
        if (/^\w+:\/\//.test(file)) {
          return file
        }
        return resolve(this.map.consumer().sourceRoot || this.map.root || '.', file)
      }

      get from() {
        return this.file || this.id
      }

      toJSON() {
        let json = {};
        for (let name of ['hasBOM', 'css', 'file', 'id']) {
          if (this[name] != null) {
            json[name] = this[name];
          }
        }
        if (this.map) {
          json.map = { ...this.map };
          if (json.map.consumerCache) {
            json.map.consumerCache = undefined;
          }
        }
        return json
      }
    }

    var input = Input;
    Input.default = Input;

    if (terminalHighlight && terminalHighlight.registerInput) {
      terminalHighlight.registerInput(Input);
    }

    function parse(css, opts) {
      let input$1 = new input(css, opts);
      let parser$1 = new parser(input$1);
      try {
        parser$1.parse();
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          if (e.name === 'CssSyntaxError' && opts && opts.from) {
            if (/\.scss$/i.test(opts.from)) {
              e.message +=
                '\nYou tried to parse SCSS with ' +
                'the standard CSS parser; ' +
                'try again with the postcss-scss parser';
            } else if (/\.sass/i.test(opts.from)) {
              e.message +=
                '\nYou tried to parse Sass with ' +
                'the standard CSS parser; ' +
                'try again with the postcss-sass parser';
            } else if (/\.less$/i.test(opts.from)) {
              e.message +=
                '\nYou tried to parse Less with ' +
                'the standard CSS parser; ' +
                'try again with the postcss-less parser';
            }
          }
        }
        throw e
      }

      return parser$1.root
    }

    var parse_1 = parse;
    parse.default = parse;

    container.registerParse(parse);

    let LazyResult$1, Processor$1;

    class Document extends container {
      constructor(defaults) {
        // type needs to be passed to super, otherwise child roots won't be normalized correctly
        super({ type: 'document', ...defaults });

        if (!this.nodes) {
          this.nodes = [];
        }
      }

      toResult(opts = {}) {
        let lazy = new LazyResult$1(new Processor$1(), this, opts);

        return lazy.stringify()
      }
    }

    Document.registerLazyResult = dependant => {
      LazyResult$1 = dependant;
    };

    Document.registerProcessor = dependant => {
      Processor$1 = dependant;
    };

    var document$1 = Document;
    Document.default = Document;

    let { isClean } = symbols;







    const TYPE_TO_CLASS_NAME = {
      document: 'Document',
      root: 'Root',
      atrule: 'AtRule',
      rule: 'Rule',
      decl: 'Declaration',
      comment: 'Comment'
    };

    const PLUGIN_PROPS = {
      postcssPlugin: true,
      prepare: true,
      Once: true,
      Document: true,
      Root: true,
      Declaration: true,
      Rule: true,
      AtRule: true,
      Comment: true,
      DeclarationExit: true,
      RuleExit: true,
      AtRuleExit: true,
      CommentExit: true,
      RootExit: true,
      DocumentExit: true,
      OnceExit: true
    };

    const NOT_VISITORS = {
      postcssPlugin: true,
      prepare: true,
      Once: true
    };

    const CHILDREN = 0;

    function isPromise(obj) {
      return typeof obj === 'object' && typeof obj.then === 'function'
    }

    function getEvents(node) {
      let key = false;
      let type = TYPE_TO_CLASS_NAME[node.type];
      if (node.type === 'decl') {
        key = node.prop.toLowerCase();
      } else if (node.type === 'atrule') {
        key = node.name.toLowerCase();
      }

      if (key && node.append) {
        return [
          type,
          type + '-' + key,
          CHILDREN,
          type + 'Exit',
          type + 'Exit-' + key
        ]
      } else if (key) {
        return [type, type + '-' + key, type + 'Exit', type + 'Exit-' + key]
      } else if (node.append) {
        return [type, CHILDREN, type + 'Exit']
      } else {
        return [type, type + 'Exit']
      }
    }

    function toStack(node) {
      let events;
      if (node.type === 'document') {
        events = ['Document', CHILDREN, 'DocumentExit'];
      } else if (node.type === 'root') {
        events = ['Root', CHILDREN, 'RootExit'];
      } else {
        events = getEvents(node);
      }

      return {
        node,
        events,
        eventIndex: 0,
        visitors: [],
        visitorIndex: 0,
        iterator: 0
      }
    }

    function cleanMarks(node) {
      node[isClean] = false;
      if (node.nodes) node.nodes.forEach(i => cleanMarks(i));
      return node
    }

    let postcss$1 = {};

    class LazyResult {
      constructor(processor, css, opts) {
        this.stringified = false;
        this.processed = false;

        let root;
        if (
          typeof css === 'object' &&
          css !== null &&
          (css.type === 'root' || css.type === 'document')
        ) {
          root = cleanMarks(css);
        } else if (css instanceof LazyResult || css instanceof result) {
          root = cleanMarks(css.root);
          if (css.map) {
            if (typeof opts.map === 'undefined') opts.map = {};
            if (!opts.map.inline) opts.map.inline = false;
            opts.map.prev = css.map;
          }
        } else {
          let parser = parse_1;
          if (opts.syntax) parser = opts.syntax.parse;
          if (opts.parser) parser = opts.parser;
          if (parser.parse) parser = parser.parse;

          try {
            root = parser(css, opts);
          } catch (error) {
            this.processed = true;
            this.error = error;
          }
        }

        this.result = new result(processor, root, opts);
        this.helpers = { ...postcss$1, result: this.result, postcss: postcss$1 };
        this.plugins = this.processor.plugins.map(plugin => {
          if (typeof plugin === 'object' && plugin.prepare) {
            return { ...plugin, ...plugin.prepare(this.result) }
          } else {
            return plugin
          }
        });
      }

      get [Symbol.toStringTag]() {
        return 'LazyResult'
      }

      get processor() {
        return this.result.processor
      }

      get opts() {
        return this.result.opts
      }

      get css() {
        return this.stringify().css
      }

      get content() {
        return this.stringify().content
      }

      get map() {
        return this.stringify().map
      }

      get root() {
        return this.sync().root
      }

      get messages() {
        return this.sync().messages
      }

      warnings() {
        return this.sync().warnings()
      }

      toString() {
        return this.css
      }

      then(onFulfilled, onRejected) {
        if (process.env.NODE_ENV !== 'production') {
          if (!('from' in this.opts)) {
            warnOnce(
              'Without `from` option PostCSS could generate wrong source map ' +
                'and will not find Browserslist config. Set it to CSS file path ' +
                'or to `undefined` to prevent this warning.'
            );
          }
        }
        return this.async().then(onFulfilled, onRejected)
      }

      catch(onRejected) {
        return this.async().catch(onRejected)
      }

      finally(onFinally) {
        return this.async().then(onFinally, onFinally)
      }

      async() {
        if (this.error) return Promise.reject(this.error)
        if (this.processed) return Promise.resolve(this.result)
        if (!this.processing) {
          this.processing = this.runAsync();
        }
        return this.processing
      }

      sync() {
        if (this.error) throw this.error
        if (this.processed) return this.result
        this.processed = true;

        if (this.processing) {
          throw this.getAsyncError()
        }

        for (let plugin of this.plugins) {
          let promise = this.runOnRoot(plugin);
          if (isPromise(promise)) {
            throw this.getAsyncError()
          }
        }

        this.prepareVisitors();
        if (this.hasListener) {
          let root = this.result.root;
          while (!root[isClean]) {
            root[isClean] = true;
            this.walkSync(root);
          }
          if (this.listeners.OnceExit) {
            if (root.type === 'document') {
              for (let subRoot of root.nodes) {
                this.visitSync(this.listeners.OnceExit, subRoot);
              }
            } else {
              this.visitSync(this.listeners.OnceExit, root);
            }
          }
        }

        return this.result
      }

      stringify() {
        if (this.error) throw this.error
        if (this.stringified) return this.result
        this.stringified = true;

        this.sync();

        let opts = this.result.opts;
        let str = stringify_1;
        if (opts.syntax) str = opts.syntax.stringify;
        if (opts.stringifier) str = opts.stringifier;
        if (str.stringify) str = str.stringify;

        let map = new mapGenerator(str, this.result.root, this.result.opts);
        let data = map.generate();
        this.result.css = data[0];
        this.result.map = data[1];

        return this.result
      }

      walkSync(node) {
        node[isClean] = true;
        let events = getEvents(node);
        for (let event of events) {
          if (event === CHILDREN) {
            if (node.nodes) {
              node.each(child => {
                if (!child[isClean]) this.walkSync(child);
              });
            }
          } else {
            let visitors = this.listeners[event];
            if (visitors) {
              if (this.visitSync(visitors, node.toProxy())) return
            }
          }
        }
      }

      visitSync(visitors, node) {
        for (let [plugin, visitor] of visitors) {
          this.result.lastPlugin = plugin;
          let promise;
          try {
            promise = visitor(node, this.helpers);
          } catch (e) {
            throw this.handleError(e, node.proxyOf)
          }
          if (node.type !== 'root' && node.type !== 'document' && !node.parent) {
            return true
          }
          if (isPromise(promise)) {
            throw this.getAsyncError()
          }
        }
      }

      runOnRoot(plugin) {
        this.result.lastPlugin = plugin;
        try {
          if (typeof plugin === 'object' && plugin.Once) {
            if (this.result.root.type === 'document') {
              let roots = this.result.root.nodes.map(root =>
                plugin.Once(root, this.helpers)
              );

              if (isPromise(roots[0])) {
                return Promise.all(roots)
              }

              return roots
            }

            return plugin.Once(this.result.root, this.helpers)
          } else if (typeof plugin === 'function') {
            return plugin(this.result.root, this.result)
          }
        } catch (error) {
          throw this.handleError(error)
        }
      }

      getAsyncError() {
        throw new Error('Use process(css).then(cb) to work with async plugins')
      }

      handleError(error, node) {
        let plugin = this.result.lastPlugin;
        try {
          if (node) node.addToError(error);
          this.error = error;
          if (error.name === 'CssSyntaxError' && !error.plugin) {
            error.plugin = plugin.postcssPlugin;
            error.setMessage();
          } else if (plugin.postcssVersion) {
            if (process.env.NODE_ENV !== 'production') {
              let pluginName = plugin.postcssPlugin;
              let pluginVer = plugin.postcssVersion;
              let runtimeVer = this.result.processor.version;
              let a = pluginVer.split('.');
              let b = runtimeVer.split('.');

              if (a[0] !== b[0] || parseInt(a[1]) > parseInt(b[1])) {
                console.error(
                  'Unknown error from PostCSS plugin. Your current PostCSS ' +
                    'version is ' +
                    runtimeVer +
                    ', but ' +
                    pluginName +
                    ' uses ' +
                    pluginVer +
                    '. Perhaps this is the source of the error below.'
                );
              }
            }
          }
        } catch (err) {
          // istanbul ignore next
          if (console && console.error) console.error(err);
        }
        return error
      }

      async runAsync() {
        this.plugin = 0;
        for (let i = 0; i < this.plugins.length; i++) {
          let plugin = this.plugins[i];
          let promise = this.runOnRoot(plugin);
          if (isPromise(promise)) {
            try {
              await promise;
            } catch (error) {
              throw this.handleError(error)
            }
          }
        }

        this.prepareVisitors();
        if (this.hasListener) {
          let root = this.result.root;
          while (!root[isClean]) {
            root[isClean] = true;
            let stack = [toStack(root)];
            while (stack.length > 0) {
              let promise = this.visitTick(stack);
              if (isPromise(promise)) {
                try {
                  await promise;
                } catch (e) {
                  let node = stack[stack.length - 1].node;
                  throw this.handleError(e, node)
                }
              }
            }
          }

          if (this.listeners.OnceExit) {
            for (let [plugin, visitor] of this.listeners.OnceExit) {
              this.result.lastPlugin = plugin;
              try {
                if (root.type === 'document') {
                  let roots = root.nodes.map(subRoot =>
                    visitor(subRoot, this.helpers)
                  );

                  await Promise.all(roots);
                } else {
                  await visitor(root, this.helpers);
                }
              } catch (e) {
                throw this.handleError(e)
              }
            }
          }
        }

        this.processed = true;
        return this.stringify()
      }

      prepareVisitors() {
        this.listeners = {};
        let add = (plugin, type, cb) => {
          if (!this.listeners[type]) this.listeners[type] = [];
          this.listeners[type].push([plugin, cb]);
        };
        for (let plugin of this.plugins) {
          if (typeof plugin === 'object') {
            for (let event in plugin) {
              if (!PLUGIN_PROPS[event] && /^[A-Z]/.test(event)) {
                throw new Error(
                  `Unknown event ${event} in ${plugin.postcssPlugin}. ` +
                    `Try to update PostCSS (${this.processor.version} now).`
                )
              }
              if (!NOT_VISITORS[event]) {
                if (typeof plugin[event] === 'object') {
                  for (let filter in plugin[event]) {
                    if (filter === '*') {
                      add(plugin, event, plugin[event][filter]);
                    } else {
                      add(
                        plugin,
                        event + '-' + filter.toLowerCase(),
                        plugin[event][filter]
                      );
                    }
                  }
                } else if (typeof plugin[event] === 'function') {
                  add(plugin, event, plugin[event]);
                }
              }
            }
          }
        }
        this.hasListener = Object.keys(this.listeners).length > 0;
      }

      visitTick(stack) {
        let visit = stack[stack.length - 1];
        let { node, visitors } = visit;

        if (node.type !== 'root' && node.type !== 'document' && !node.parent) {
          stack.pop();
          return
        }

        if (visitors.length > 0 && visit.visitorIndex < visitors.length) {
          let [plugin, visitor] = visitors[visit.visitorIndex];
          visit.visitorIndex += 1;
          if (visit.visitorIndex === visitors.length) {
            visit.visitors = [];
            visit.visitorIndex = 0;
          }
          this.result.lastPlugin = plugin;
          try {
            return visitor(node.toProxy(), this.helpers)
          } catch (e) {
            throw this.handleError(e, node)
          }
        }

        if (visit.iterator !== 0) {
          let iterator = visit.iterator;
          let child;
          while ((child = node.nodes[node.indexes[iterator]])) {
            node.indexes[iterator] += 1;
            if (!child[isClean]) {
              child[isClean] = true;
              stack.push(toStack(child));
              return
            }
          }
          visit.iterator = 0;
          delete node.indexes[iterator];
        }

        let events = visit.events;
        while (visit.eventIndex < events.length) {
          let event = events[visit.eventIndex];
          visit.eventIndex += 1;
          if (event === CHILDREN) {
            if (node.nodes && node.nodes.length) {
              node[isClean] = true;
              visit.iterator = node.getIterator();
            }
            return
          } else if (this.listeners[event]) {
            visit.visitors = this.listeners[event];
            return
          }
        }
        stack.pop();
      }
    }

    LazyResult.registerPostcss = dependant => {
      postcss$1 = dependant;
    };

    var lazyResult = LazyResult;
    LazyResult.default = LazyResult;

    root.registerLazyResult(LazyResult);
    document$1.registerLazyResult(LazyResult);

    class Processor {
      constructor(plugins = []) {
        this.version = '8.3.0';
        this.plugins = this.normalize(plugins);
      }

      use(plugin) {
        this.plugins = this.plugins.concat(this.normalize([plugin]));
        return this
      }

      process(css, opts = {}) {
        if (
          this.plugins.length === 0 &&
          opts.parser === opts.stringifier &&
          !opts.hideNothingWarning
        ) {
          if (process.env.NODE_ENV !== 'production') {
            if (typeof console !== 'undefined' && console.warn) {
              console.warn(
                'You did not set any plugins, parser, or stringifier. ' +
                  'Right now, PostCSS does nothing. Pick plugins for your case ' +
                  'on https://www.postcss.parts/ and use them in postcss.config.js.'
              );
            }
          }
        }
        return new lazyResult(this, css, opts)
      }

      normalize(plugins) {
        let normalized = [];
        for (let i of plugins) {
          if (i.postcss === true) {
            i = i();
          } else if (i.postcss) {
            i = i.postcss;
          }

          if (typeof i === 'object' && Array.isArray(i.plugins)) {
            normalized = normalized.concat(i.plugins);
          } else if (typeof i === 'object' && i.postcssPlugin) {
            normalized.push(i);
          } else if (typeof i === 'function') {
            normalized.push(i);
          } else if (typeof i === 'object' && (i.parse || i.stringify)) {
            if (process.env.NODE_ENV !== 'production') {
              throw new Error(
                'PostCSS syntaxes cannot be used as plugins. Instead, please use ' +
                  'one of the syntax/parser/stringifier options as outlined ' +
                  'in your PostCSS runner documentation.'
              )
            }
          } else {
            throw new Error(i + ' is not a PostCSS plugin')
          }
        }
        return normalized
      }
    }

    var processor = Processor;
    Processor.default = Processor;

    root.registerProcessor(Processor);
    document$1.registerProcessor(Processor);

    function fromJSON(json, inputs) {
      if (Array.isArray(json)) return json.map(n => fromJSON(n))

      let { inputs: ownInputs, ...defaults } = json;
      if (ownInputs) {
        inputs = [];
        for (let input$1 of ownInputs) {
          let inputHydrated = { ...input$1, __proto__: input.prototype };
          if (inputHydrated.map) {
            inputHydrated.map = {
              ...inputHydrated.map,
              __proto__: previousMap.prototype
            };
          }
          inputs.push(inputHydrated);
        }
      }
      if (defaults.nodes) {
        defaults.nodes = json.nodes.map(n => fromJSON(n, inputs));
      }
      if (defaults.source) {
        let { inputId, ...source } = defaults.source;
        defaults.source = source;
        if (inputId != null) {
          defaults.source.input = inputs[inputId];
        }
      }
      if (defaults.type === 'root') {
        return new root(defaults)
      } else if (defaults.type === 'decl') {
        return new declaration(defaults)
      } else if (defaults.type === 'rule') {
        return new rule(defaults)
      } else if (defaults.type === 'comment') {
        return new comment(defaults)
      } else if (defaults.type === 'atrule') {
        return new atRule(defaults)
      } else {
        throw new Error('Unknown node type: ' + json.type)
      }
    }

    var fromJSON_1 = fromJSON;
    fromJSON.default = fromJSON;

    function postcss(...plugins) {
      if (plugins.length === 1 && Array.isArray(plugins[0])) {
        plugins = plugins[0];
      }
      return new processor(plugins)
    }

    postcss.plugin = function plugin(name, initializer) {
      if (console && console.warn) {
        console.warn(
          name +
            ': postcss.plugin was deprecated. Migration guide:\n' +
            'https://evilmartians.com/chronicles/postcss-8-plugin-migration'
        );
        if (process.env.LANG && process.env.LANG.startsWith('cn')) {
          // istanbul ignore next
          console.warn(
            name +
              ': 里面 postcss.plugin 被弃用. 迁移指南:\n' +
              'https://www.w3ctech.com/topic/2226'
          );
        }
      }
      function creator(...args) {
        let transformer = initializer(...args);
        transformer.postcssPlugin = name;
        transformer.postcssVersion = new processor().version;
        return transformer
      }

      let cache;
      Object.defineProperty(creator, 'postcss', {
        get() {
          if (!cache) cache = creator();
          return cache
        }
      });

      creator.process = function (css, processOpts, pluginOpts) {
        return postcss([creator(pluginOpts)]).process(css, processOpts)
      };

      return creator
    };

    postcss.stringify = stringify_1;
    postcss.parse = parse_1;
    postcss.fromJSON = fromJSON_1;
    postcss.list = list_1;

    postcss.comment = defaults => new comment(defaults);
    postcss.atRule = defaults => new atRule(defaults);
    postcss.decl = defaults => new declaration(defaults);
    postcss.rule = defaults => new rule(defaults);
    postcss.root = defaults => new root(defaults);
    postcss.document = defaults => new document$1(defaults);

    postcss.CssSyntaxError = cssSyntaxError;
    postcss.Declaration = declaration;
    postcss.Container = container;
    postcss.Document = document$1;
    postcss.Comment = comment;
    postcss.Warning = warning;
    postcss.AtRule = atRule;
    postcss.Result = result;
    postcss.Input = input;
    postcss.Rule = rule;
    postcss.Root = root;
    postcss.Node = node_1;

    lazyResult.registerPostcss(postcss);

    var postcss_1 = postcss;
    postcss.default = postcss;

    const { klona } = dist;
    const { isPlainObject } = isPlainObject_1;


    const { parse: postcssParse } = postcss_1;
    // Tags that can conceivably represent stand-alone media.
    const mediaTags = [
      'img', 'audio', 'video', 'picture', 'svg',
      'object', 'map', 'iframe', 'embed'
    ];
    // Tags that are inherently vulnerable to being used in XSS attacks.
    const vulnerableTags = [ 'script', 'style' ];

    function each(obj, cb) {
      if (obj) {
        Object.keys(obj).forEach(function (key) {
          cb(obj[key], key);
        });
      }
    }

    // Avoid false positives with .__proto__, .hasOwnProperty, etc.
    function has(obj, key) {
      return ({}).hasOwnProperty.call(obj, key);
    }

    // Returns those elements of `a` for which `cb(a)` returns truthy
    function filter(a, cb) {
      const n = [];
      each(a, function(v) {
        if (cb(v)) {
          n.push(v);
        }
      });
      return n;
    }

    function isEmptyObject(obj) {
      for (const key in obj) {
        if (has(obj, key)) {
          return false;
        }
      }
      return true;
    }

    function stringifySrcset(parsedSrcset) {
      return parsedSrcset.map(function(part) {
        if (!part.url) {
          throw new Error('URL missing');
        }

        return (
          part.url +
          (part.w ? ` ${part.w}w` : '') +
          (part.h ? ` ${part.h}h` : '') +
          (part.d ? ` ${part.d}x` : '')
        );
      }).join(', ');
    }

    var sanitizeHtml_1 = sanitizeHtml;

    // A valid attribute name.
    // We use a tolerant definition based on the set of strings defined by
    // html.spec.whatwg.org/multipage/parsing.html#before-attribute-name-state
    // and html.spec.whatwg.org/multipage/parsing.html#attribute-name-state .
    // The characters accepted are ones which can be appended to the attribute
    // name buffer without triggering a parse error:
    //   * unexpected-equals-sign-before-attribute-name
    //   * unexpected-null-character
    //   * unexpected-character-in-attribute-name
    // We exclude the empty string because it's impossible to get to the after
    // attribute name state with an empty attribute name buffer.
    const VALID_HTML_ATTRIBUTE_NAME = /^[^\0\t\n\f\r /<=>]+$/;

    // Ignore the _recursing flag; it's there for recursive
    // invocation as a guard against this exploit:
    // https://github.com/fb55/htmlparser2/issues/105

    function sanitizeHtml(html, options, _recursing) {
      let result = '';
      // Used for hot swapping the result variable with an empty string in order to "capture" the text written to it.
      let tempResult = '';

      function Frame(tag, attribs) {
        const that = this;
        this.tag = tag;
        this.attribs = attribs || {};
        this.tagPosition = result.length;
        this.text = ''; // Node inner text
        this.mediaChildren = [];

        this.updateParentNodeText = function() {
          if (stack.length) {
            const parentFrame = stack[stack.length - 1];
            parentFrame.text += that.text;
          }
        };

        this.updateParentNodeMediaChildren = function() {
          if (stack.length && mediaTags.includes(this.tag)) {
            const parentFrame = stack[stack.length - 1];
            parentFrame.mediaChildren.push(this.tag);
          }
        };
      }

      options = Object.assign({}, sanitizeHtml.defaults, options);
      options.parser = Object.assign({}, htmlParserDefaults, options.parser);

      // vulnerableTags
      vulnerableTags.forEach(function (tag) {
        if (
          options.allowedTags && options.allowedTags.indexOf(tag) > -1 &&
          !options.allowVulnerableTags
        ) {
          console.warn(`\n\n⚠️ Your \`allowedTags\` option includes, \`${tag}\`, which is inherently\nvulnerable to XSS attacks. Please remove it from \`allowedTags\`.\nOr, to disable this warning, add the \`allowVulnerableTags\` option\nand ensure you are accounting for this risk.\n\n`);
        }
      });

      // Tags that contain something other than HTML, or where discarding
      // the text when the tag is disallowed makes sense for other reasons.
      // If we are not allowing these tags, we should drop their content too.
      // For other tags you would drop the tag but keep its content.
      const nonTextTagsArray = options.nonTextTags || [
        'script',
        'style',
        'textarea',
        'option'
      ];
      let allowedAttributesMap;
      let allowedAttributesGlobMap;
      if (options.allowedAttributes) {
        allowedAttributesMap = {};
        allowedAttributesGlobMap = {};
        each(options.allowedAttributes, function(attributes, tag) {
          allowedAttributesMap[tag] = [];
          const globRegex = [];
          attributes.forEach(function(obj) {
            if (typeof obj === 'string' && obj.indexOf('*') >= 0) {
              globRegex.push(escapeStringRegexp(obj).replace(/\\\*/g, '.*'));
            } else {
              allowedAttributesMap[tag].push(obj);
            }
          });
          if (globRegex.length) {
            allowedAttributesGlobMap[tag] = new RegExp('^(' + globRegex.join('|') + ')$');
          }
        });
      }
      const allowedClassesMap = {};
      const allowedClassesGlobMap = {};
      each(options.allowedClasses, function(classes, tag) {
        // Implicitly allows the class attribute
        if (allowedAttributesMap) {
          if (!has(allowedAttributesMap, tag)) {
            allowedAttributesMap[tag] = [];
          }
          allowedAttributesMap[tag].push('class');
        }

        allowedClassesMap[tag] = [];
        const globRegex = [];
        classes.forEach(function(obj) {
          if (typeof obj === 'string' && obj.indexOf('*') >= 0) {
            globRegex.push(escapeStringRegexp(obj).replace(/\\\*/g, '.*'));
          } else {
            allowedClassesMap[tag].push(obj);
          }
        });
        if (globRegex.length) {
          allowedClassesGlobMap[tag] = new RegExp('^(' + globRegex.join('|') + ')$');
        }
      });

      const transformTagsMap = {};
      let transformTagsAll;
      each(options.transformTags, function(transform, tag) {
        let transFun;
        if (typeof transform === 'function') {
          transFun = transform;
        } else if (typeof transform === 'string') {
          transFun = sanitizeHtml.simpleTransform(transform);
        }
        if (tag === '*') {
          transformTagsAll = transFun;
        } else {
          transformTagsMap[tag] = transFun;
        }
      });

      let depth;
      let stack;
      let skipMap;
      let transformMap;
      let skipText;
      let skipTextDepth;
      let addedText = false;

      initializeState();

      const parser = new lib.Parser({
        onopentag: function(name, attribs) {
          // If `enforceHtmlBoundary` is `true` and this has found the opening
          // `html` tag, reset the state.
          if (options.enforceHtmlBoundary && name === 'html') {
            initializeState();
          }

          if (skipText) {
            skipTextDepth++;
            return;
          }
          const frame = new Frame(name, attribs);
          stack.push(frame);

          let skip = false;
          const hasText = !!frame.text;
          let transformedTag;
          if (has(transformTagsMap, name)) {
            transformedTag = transformTagsMap[name](name, attribs);

            frame.attribs = attribs = transformedTag.attribs;

            if (transformedTag.text !== undefined) {
              frame.innerText = transformedTag.text;
            }

            if (name !== transformedTag.tagName) {
              frame.name = name = transformedTag.tagName;
              transformMap[depth] = transformedTag.tagName;
            }
          }
          if (transformTagsAll) {
            transformedTag = transformTagsAll(name, attribs);

            frame.attribs = attribs = transformedTag.attribs;
            if (name !== transformedTag.tagName) {
              frame.name = name = transformedTag.tagName;
              transformMap[depth] = transformedTag.tagName;
            }
          }

          if ((options.allowedTags && options.allowedTags.indexOf(name) === -1) || (options.disallowedTagsMode === 'recursiveEscape' && !isEmptyObject(skipMap)) || (options.nestingLimit != null && depth >= options.nestingLimit)) {
            skip = true;
            skipMap[depth] = true;
            if (options.disallowedTagsMode === 'discard') {
              if (nonTextTagsArray.indexOf(name) !== -1) {
                skipText = true;
                skipTextDepth = 1;
              }
            }
            skipMap[depth] = true;
          }
          depth++;
          if (skip) {
            if (options.disallowedTagsMode === 'discard') {
              // We want the contents but not this tag
              return;
            }
            tempResult = result;
            result = '';
          }
          result += '<' + name;
          if (!allowedAttributesMap || has(allowedAttributesMap, name) || allowedAttributesMap['*']) {
            each(attribs, function(value, a) {
              if (!VALID_HTML_ATTRIBUTE_NAME.test(a)) {
                // This prevents part of an attribute name in the output from being
                // interpreted as the end of an attribute, or end of a tag.
                delete frame.attribs[a];
                return;
              }
              let parsed;
              // check allowedAttributesMap for the element and attribute and modify the value
              // as necessary if there are specific values defined.
              let passedAllowedAttributesMapCheck = false;
              if (!allowedAttributesMap ||
                (has(allowedAttributesMap, name) && allowedAttributesMap[name].indexOf(a) !== -1) ||
                (allowedAttributesMap['*'] && allowedAttributesMap['*'].indexOf(a) !== -1) ||
                (has(allowedAttributesGlobMap, name) && allowedAttributesGlobMap[name].test(a)) ||
                (allowedAttributesGlobMap['*'] && allowedAttributesGlobMap['*'].test(a))) {
                passedAllowedAttributesMapCheck = true;
              } else if (allowedAttributesMap && allowedAttributesMap[name]) {
                for (const o of allowedAttributesMap[name]) {
                  if (isPlainObject(o) && o.name && (o.name === a)) {
                    passedAllowedAttributesMapCheck = true;
                    let newValue = '';
                    if (o.multiple === true) {
                      // verify the values that are allowed
                      const splitStrArray = value.split(' ');
                      for (const s of splitStrArray) {
                        if (o.values.indexOf(s) !== -1) {
                          if (newValue === '') {
                            newValue = s;
                          } else {
                            newValue += ' ' + s;
                          }
                        }
                      }
                    } else if (o.values.indexOf(value) >= 0) {
                      // verified an allowed value matches the entire attribute value
                      newValue = value;
                    }
                    value = newValue;
                  }
                }
              }
              if (passedAllowedAttributesMapCheck) {
                if (options.allowedSchemesAppliedToAttributes.indexOf(a) !== -1) {
                  if (naughtyHref(name, value)) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (name === 'iframe' && a === 'src') {
                  let allowed = true;
                  try {
                    // Chrome accepts \ as a substitute for / in the // at the
                    // start of a URL, so rewrite accordingly to prevent exploit.
                    // Also drop any whitespace at that point in the URL
                    value = value.replace(/^(\w+:)?\s*[\\/]\s*[\\/]/, '$1//');
                    if (value.startsWith('relative:')) {
                      // An attempt to exploit our workaround for base URLs being
                      // mandatory for relative URL validation in the WHATWG
                      // URL parser, reject it
                      throw new Error('relative: exploit attempt');
                    }
                    // naughtyHref is in charge of whether protocol relative URLs
                    // are cool. Here we are concerned just with allowed hostnames and
                    // whether to allow relative URLs.
                    //
                    // Build a placeholder "base URL" against which any reasonable
                    // relative URL may be parsed successfully
                    let base = 'relative://relative-site';
                    for (let i = 0; (i < 100); i++) {
                      base += `/${i}`;
                    }
                    const parsed = new URL(value, base);
                    const isRelativeUrl = parsed && parsed.hostname === 'relative-site' && parsed.protocol === 'relative:';
                    if (isRelativeUrl) {
                      // default value of allowIframeRelativeUrls is true
                      // unless allowedIframeHostnames or allowedIframeDomains specified
                      allowed = has(options, 'allowIframeRelativeUrls')
                        ? options.allowIframeRelativeUrls
                        : (!options.allowedIframeHostnames && !options.allowedIframeDomains);
                    } else if (options.allowedIframeHostnames || options.allowedIframeDomains) {
                      const allowedHostname = (options.allowedIframeHostnames || []).find(function (hostname) {
                        return hostname === parsed.hostname;
                      });
                      const allowedDomain = (options.allowedIframeDomains || []).find(function(domain) {
                        return parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`);
                      });
                      allowed = allowedHostname || allowedDomain;
                    }
                  } catch (e) {
                    // Unparseable iframe src
                    allowed = false;
                  }
                  if (!allowed) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (a === 'srcset') {
                  try {
                    parsed = parseSrcset(value);
                    parsed.forEach(function(value) {
                      if (naughtyHref('srcset', value.url)) {
                        value.evil = true;
                      }
                    });
                    parsed = filter(parsed, function(v) {
                      return !v.evil;
                    });
                    if (!parsed.length) {
                      delete frame.attribs[a];
                      return;
                    } else {
                      value = stringifySrcset(filter(parsed, function(v) {
                        return !v.evil;
                      }));
                      frame.attribs[a] = value;
                    }
                  } catch (e) {
                    // Unparseable srcset
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (a === 'class') {
                  const allowedSpecificClasses = allowedClassesMap[name];
                  const allowedWildcardClasses = allowedClassesMap['*'];
                  const allowedSpecificClassesGlob = allowedClassesGlobMap[name];
                  const allowedWildcardClassesGlob = allowedClassesGlobMap['*'];
                  const allowedClassesGlobs = [ allowedSpecificClassesGlob, allowedWildcardClassesGlob ].filter(
                    function(t) {
                      return t;
                    }
                  );
                  if (allowedSpecificClasses && allowedWildcardClasses) {
                    value = filterClasses(value, cjs(allowedSpecificClasses, allowedWildcardClasses), allowedClassesGlobs);
                  } else {
                    value = filterClasses(value, allowedSpecificClasses || allowedWildcardClasses, allowedClassesGlobs);
                  }
                  if (!value.length) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                if (a === 'style') {
                  try {
                    const abstractSyntaxTree = postcssParse(name + ' {' + value + '}');
                    const filteredAST = filterCss(abstractSyntaxTree, options.allowedStyles);

                    value = stringifyStyleAttributes(filteredAST);

                    if (value.length === 0) {
                      delete frame.attribs[a];
                      return;
                    }
                  } catch (e) {
                    delete frame.attribs[a];
                    return;
                  }
                }
                result += ' ' + a;
                if (value && value.length) {
                  result += '="' + escapeHtml(value, true) + '"';
                }
              } else {
                delete frame.attribs[a];
              }
            });
          }
          if (options.selfClosing.indexOf(name) !== -1) {
            result += ' />';
          } else {
            result += '>';
            if (frame.innerText && !hasText && !options.textFilter) {
              result += escapeHtml(frame.innerText);
              addedText = true;
            }
          }
          if (skip) {
            result = tempResult + escapeHtml(result);
            tempResult = '';
          }
        },
        ontext: function(text) {
          if (skipText) {
            return;
          }
          const lastFrame = stack[stack.length - 1];
          let tag;

          if (lastFrame) {
            tag = lastFrame.tag;
            // If inner text was set by transform function then let's use it
            text = lastFrame.innerText !== undefined ? lastFrame.innerText : text;
          }

          if (options.disallowedTagsMode === 'discard' && ((tag === 'script') || (tag === 'style'))) {
            // htmlparser2 gives us these as-is. Escaping them ruins the content. Allowing
            // script tags is, by definition, game over for XSS protection, so if that's
            // your concern, don't allow them. The same is essentially true for style tags
            // which have their own collection of XSS vectors.
            result += text;
          } else {
            const escaped = escapeHtml(text, false);
            if (options.textFilter && !addedText) {
              result += options.textFilter(escaped, tag);
            } else if (!addedText) {
              result += escaped;
            }
          }
          if (stack.length) {
            const frame = stack[stack.length - 1];
            frame.text += text;
          }
        },
        onclosetag: function(name) {

          if (skipText) {
            skipTextDepth--;
            if (!skipTextDepth) {
              skipText = false;
            } else {
              return;
            }
          }

          const frame = stack.pop();
          if (!frame) {
            // Do not crash on bad markup
            return;
          }
          skipText = options.enforceHtmlBoundary ? name === 'html' : false;
          depth--;
          const skip = skipMap[depth];
          if (skip) {
            delete skipMap[depth];
            if (options.disallowedTagsMode === 'discard') {
              frame.updateParentNodeText();
              return;
            }
            tempResult = result;
            result = '';
          }

          if (transformMap[depth]) {
            name = transformMap[depth];
            delete transformMap[depth];
          }

          if (options.exclusiveFilter && options.exclusiveFilter(frame)) {
            result = result.substr(0, frame.tagPosition);
            return;
          }

          frame.updateParentNodeMediaChildren();
          frame.updateParentNodeText();

          if (options.selfClosing.indexOf(name) !== -1) {
            // Already output />
            if (skip) {
              result = tempResult;
              tempResult = '';
            }
            return;
          }

          result += '</' + name + '>';
          if (skip) {
            result = tempResult + escapeHtml(result);
            tempResult = '';
          }
        }
      }, options.parser);
      parser.write(html);
      parser.end();

      return result;

      function initializeState() {
        result = '';
        depth = 0;
        stack = [];
        skipMap = {};
        transformMap = {};
        skipText = false;
        skipTextDepth = 0;
      }

      function escapeHtml(s, quote) {
        if (typeof (s) !== 'string') {
          s = s + '';
        }
        if (options.parser.decodeEntities) {
          s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (quote) {
            s = s.replace(/"/g, '&quot;');
          }
        }
        // TODO: this is inadequate because it will pass `&0;`. This approach
        // will not work, each & must be considered with regard to whether it
        // is followed by a 100% syntactically valid entity or not, and escaped
        // if it is not. If this bothers you, don't set parser.decodeEntities
        // to false. (The default is true.)
        s = s.replace(/&(?![a-zA-Z0-9#]{1,20};)/g, '&amp;') // Match ampersands not part of existing HTML entity
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        if (quote) {
          s = s.replace(/"/g, '&quot;');
        }
        return s;
      }

      function naughtyHref(name, href) {
        // Browsers ignore character codes of 32 (space) and below in a surprising
        // number of situations. Start reading here:
        // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet#Embedded_tab
        // eslint-disable-next-line no-control-regex
        href = href.replace(/[\x00-\x20]+/g, '');
        // Clobber any comments in URLs, which the browser might
        // interpret inside an XML data island, allowing
        // a javascript: URL to be snuck through
        href = href.replace(/<!--.*?-->/g, '');
        // Case insensitive so we don't get faked out by JAVASCRIPT #1
        // Allow more characters after the first so we don't get faked
        // out by certain schemes browsers accept
        const matches = href.match(/^([a-zA-Z][a-zA-Z0-9.\-+]*):/);
        if (!matches) {
          // Protocol-relative URL starting with any combination of '/' and '\'
          if (href.match(/^[/\\]{2}/)) {
            return !options.allowProtocolRelative;
          }

          // No scheme
          return false;
        }
        const scheme = matches[1].toLowerCase();

        if (has(options.allowedSchemesByTag, name)) {
          return options.allowedSchemesByTag[name].indexOf(scheme) === -1;
        }

        return !options.allowedSchemes || options.allowedSchemes.indexOf(scheme) === -1;
      }

      /**
       * Filters user input css properties by whitelisted regex attributes.
       *
       * @param {object} abstractSyntaxTree  - Object representation of CSS attributes.
       * @property {array[Declaration]} abstractSyntaxTree.nodes[0] - Each object cointains prop and value key, i.e { prop: 'color', value: 'red' }.
       * @param {object} allowedStyles       - Keys are properties (i.e color), value is list of permitted regex rules (i.e /green/i).
       * @return {object}                    - Abstract Syntax Tree with filtered style attributes.
       */
      function filterCss(abstractSyntaxTree, allowedStyles) {
        if (!allowedStyles) {
          return abstractSyntaxTree;
        }

        const filteredAST = klona(abstractSyntaxTree);
        const astRules = abstractSyntaxTree.nodes[0];
        let selectedRule;

        // Merge global and tag-specific styles into new AST.
        if (allowedStyles[astRules.selector] && allowedStyles['*']) {
          selectedRule = cjs(
            allowedStyles[astRules.selector],
            allowedStyles['*']
          );
        } else {
          selectedRule = allowedStyles[astRules.selector] || allowedStyles['*'];
        }

        if (selectedRule) {
          filteredAST.nodes[0].nodes = astRules.nodes.reduce(filterDeclarations(selectedRule), []);
        }

        return filteredAST;
      }

      /**
       * Extracts the style attribues from an AbstractSyntaxTree and formats those
       * values in the inline style attribute format.
       *
       * @param  {AbstractSyntaxTree} filteredAST
       * @return {string}             - Example: "color:yellow;text-align:center;font-family:helvetica;"
       */
      function stringifyStyleAttributes(filteredAST) {
        return filteredAST.nodes[0].nodes
          .reduce(function(extractedAttributes, attributeObject) {
            extractedAttributes.push(
              attributeObject.prop + ':' + attributeObject.value
            );
            return extractedAttributes;
          }, [])
          .join(';');
      }

      /**
        * Filters the existing attributes for the given property. Discards any attributes
        * which don't match the whitelist.
        *
        * @param  {object} selectedRule             - Example: { color: red, font-family: helvetica }
        * @param  {array} allowedDeclarationsList   - List of declarations which pass whitelisting.
        * @param  {object} attributeObject          - Object representing the current css property.
        * @property {string} attributeObject.type   - Typically 'declaration'.
        * @property {string} attributeObject.prop   - The CSS property, i.e 'color'.
        * @property {string} attributeObject.value  - The corresponding value to the css property, i.e 'red'.
        * @return {function}                        - When used in Array.reduce, will return an array of Declaration objects
        */
      function filterDeclarations(selectedRule) {
        return function (allowedDeclarationsList, attributeObject) {
          // If this property is whitelisted...
          if (has(selectedRule, attributeObject.prop)) {
            const matchesRegex = selectedRule[attributeObject.prop].some(function(regularExpression) {
              return regularExpression.test(attributeObject.value);
            });

            if (matchesRegex) {
              allowedDeclarationsList.push(attributeObject);
            }
          }
          return allowedDeclarationsList;
        };
      }

      function filterClasses(classes, allowed, allowedGlobs) {
        if (!allowed) {
          // The class attribute is allowed without filtering on this tag
          return classes;
        }
        classes = classes.split(/\s+/);
        return classes.filter(function(clss) {
          return allowed.indexOf(clss) !== -1 || allowedGlobs.some(function(glob) {
            return glob.test(clss);
          });
        }).join(' ');
      }
    }

    // Defaults are accessible to you so that you can use them as a starting point
    // programmatically if you wish

    const htmlParserDefaults = {
      decodeEntities: true
    };
    sanitizeHtml.defaults = {
      allowedTags: [
        // Sections derived from MDN element categories and limited to the more
        // benign categories.
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element
        // Content sectioning
        'address', 'article', 'aside', 'footer', 'header',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hgroup',
        'main', 'nav', 'section',
        // Text content
        'blockquote', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure',
        'hr', 'li', 'main', 'ol', 'p', 'pre', 'ul',
        // Inline text semantics
        'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn',
        'em', 'i', 'kbd', 'mark', 'q',
        'rb', 'rp', 'rt', 'rtc', 'ruby',
        's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr',
        // Table content
        'caption', 'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th',
        'thead', 'tr'
      ],
      disallowedTagsMode: 'discard',
      allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        // We don't currently allow img itself by default, but this
        // would make sense if we did. You could add srcset here,
        // and if you do the URL is checked for safety
        img: [ 'src' ]
      },
      // Lots of these won't come up by default because we don't allow them
      selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
      // URL schemes we permit
      allowedSchemes: [ 'http', 'https', 'ftp', 'mailto', 'tel' ],
      allowedSchemesByTag: {},
      allowedSchemesAppliedToAttributes: [ 'href', 'src', 'cite' ],
      allowProtocolRelative: true,
      enforceHtmlBoundary: false
    };

    sanitizeHtml.simpleTransform = function(newTagName, newAttribs, merge) {
      merge = (merge === undefined) ? true : merge;
      newAttribs = newAttribs || {};

      return function(tagName, attribs) {
        let attrib;
        if (merge) {
          for (attrib in newAttribs) {
            attribs[attrib] = newAttribs[attrib];
          }
        } else {
          attribs = newAttribs;
        }

        return {
          tagName: newTagName,
          attribs: attribs
        };
      };
    };

    const sfetch = async (...args) => {
        await delay();
        return await fetch.call(null, ...args);
    };
    const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

    function search(args) {
        var _a;
        const url = new URL("https://restless-mode-a980.arewecoolyet.workers.dev/manga");
        url.searchParams.append("title", args.title);
        url.searchParams.append("limit", String(10));
        url.searchParams.append("offset", String((_a = args.offset) !== null && _a !== void 0 ? _a : 0));
        return sfetch(url.toString())
            .then((response) => response.json())
            .then((response) => {
            return response.results;
        });
    }

    function makeSearchClient() {
        let query;
        let currentOffset = 0;
        return {
            changeSearchQuery: (newQuery) => {
                query = newQuery;
                currentOffset = 0;
            },
            getNextPageOfResults: async () => {
                if (query) {
                    const searchResults = await search(Object.assign(Object.assign({}, query), { offset: currentOffset }));
                    currentOffset += 10;
                    return searchResults.map((searchResult) => ({
                        id: searchResult.data.id,
                        title: searchResult.data.attributes.title.en,
                        description: searchResult.data.attributes.description.en,
                        volumeCount: Number(searchResult.data.attributes.lastVolume ||
                            searchResult.data.attributes.lastChapter ||
                            1),
                    }));
                }
                else {
                    return [];
                }
            },
        };
    }

    /* src/components/Search.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/components/Search.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (51:2) {#each searchResults as result}
    function create_each_block$1(ctx) {
    	let li;
    	let a;
    	let t0_value = /*result*/ ctx[12].title + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let p0;
    	let raw_value = sanitizeHtml_1(/*result*/ ctx[12].description) + "";
    	let t2;
    	let p1;
    	let t3;
    	let t4_value = /*result*/ ctx[12].volumeCount + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*result*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			p0 = element("p");
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Volumes: ");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(a, "href", a_href_value = "#/manga/" + /*result*/ ctx[12].id);
    			attr_dev(a, "class", "svelte-4rf1mh");
    			add_location(a, file$2, 52, 6, 1905);
    			add_location(p0, file$2, 57, 6, 2052);
    			add_location(p1, file$2, 58, 6, 2096);
    			attr_dev(li, "class", "svelte-4rf1mh");
    			add_location(li, file$2, 51, 4, 1894);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    			append_dev(li, p0);
    			p0.innerHTML = raw_value;
    			append_dev(li, t2);
    			append_dev(li, p1);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			append_dev(li, t5);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(click_handler), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*searchResults*/ 2 && t0_value !== (t0_value = /*result*/ ctx[12].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*searchResults*/ 2 && a_href_value !== (a_href_value = "#/manga/" + /*result*/ ctx[12].id)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*searchResults*/ 2 && raw_value !== (raw_value = sanitizeHtml_1(/*result*/ ctx[12].description) + "")) p0.innerHTML = raw_value;			if (dirty & /*searchResults*/ 2 && t4_value !== (t4_value = /*result*/ ctx[12].volumeCount + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(51:2) {#each searchResults as result}",
    		ctx
    	});

    	return block;
    }

    // (63:0) {#if loading}
    function create_if_block_1$2(ctx) {
    	let aside;

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			aside.textContent = "loading...";
    			attr_dev(aside, "class", "ender svelte-4rf1mh");
    			add_location(aside, file$2, 63, 2, 2175);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(63:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (66:0) {#if !loading && searchResults.length > 0}
    function create_if_block$3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "fetch more...";
    			attr_dev(button, "class", "ender svelte-4rf1mh");
    			add_location(button, file$2, 66, 2, 2266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*onFetchMore*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(66:0) {#if !loading && searchResults.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let header;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let ul;
    	let t3;
    	let t4;
    	let if_block1_anchor;
    	let mounted;
    	let dispose;
    	let each_value = /*searchResults*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block0 = /*loading*/ ctx[2] && create_if_block_1$2(ctx);
    	let if_block1 = !/*loading*/ ctx[2] && /*searchResults*/ ctx[1].length > 0 && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "search";
    			t2 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty$1();
    			attr_dev(input, "type", "search");
    			attr_dev(input, "placeholder", "search...");
    			attr_dev(input, "class", "svelte-4rf1mh");
    			add_location(input, file$2, 40, 2, 1649);
    			attr_dev(button, "class", "svelte-4rf1mh");
    			add_location(button, file$2, 46, 2, 1796);
    			attr_dev(header, "class", "svelte-4rf1mh");
    			add_location(header, file$2, 39, 0, 1638);
    			attr_dev(ul, "class", "svelte-4rf1mh");
    			add_location(ul, file$2, 49, 0, 1851);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, input);
    			set_input_value(input, /*searchQuery*/ ctx[0]);
    			append_dev(header, t0);
    			append_dev(header, button);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t3, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(input, "keyup", /*keyup_handler*/ ctx[7], false, false, false),
    					listen_dev(button, "click", /*onSearch*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchQuery*/ 1) {
    				set_input_value(input, /*searchQuery*/ ctx[0]);
    			}

    			if (dirty & /*searchResults, sh, onClickSearchResult*/ 34) {
    				each_value = /*searchResults*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*loading*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(t4.parentNode, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!/*loading*/ ctx[2] && /*searchResults*/ ctx[1].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Search", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	const dispatch = createEventDispatcher();
    	const searchClient = makeSearchClient();
    	let searchQuery = "";
    	let searchResults = [];
    	let loading = false;

    	function onSearch() {
    		return __awaiter(this, void 0, void 0, function* () {
    			$$invalidate(2, loading = true);
    			$$invalidate(1, searchResults = []);
    			searchClient.changeSearchQuery({ title: searchQuery });
    			$$invalidate(1, searchResults = yield searchClient.getNextPageOfResults());
    			$$invalidate(2, loading = false);
    		});
    	}

    	function onFetchMore() {
    		return __awaiter(this, void 0, void 0, function* () {
    			$$invalidate(2, loading = true);
    			$$invalidate(1, searchResults = searchResults.concat(yield searchClient.getNextPageOfResults()));
    			$$invalidate(2, loading = false);
    		});
    	}

    	function onClickSearchResult(searchResult) {
    		dispatch("mangaSelected", { mangaId: searchResult.id });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchQuery = this.value;
    		$$invalidate(0, searchQuery);
    	}

    	const keyup_handler = evt => evt.key === "Enter" && onSearch();
    	const click_handler = result => onClickSearchResult(result);

    	$$self.$capture_state = () => ({
    		__awaiter,
    		sh: sanitizeHtml_1,
    		createEventDispatcher,
    		makeSearchClient,
    		dispatch,
    		searchClient,
    		searchQuery,
    		searchResults,
    		loading,
    		onSearch,
    		onFetchMore,
    		onClickSearchResult
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("searchQuery" in $$props) $$invalidate(0, searchQuery = $$props.searchQuery);
    		if ("searchResults" in $$props) $$invalidate(1, searchResults = $$props.searchResults);
    		if ("loading" in $$props) $$invalidate(2, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		searchQuery,
    		searchResults,
    		loading,
    		onSearch,
    		onFetchMore,
    		onClickSearchResult,
    		input_input_handler,
    		keyup_handler,
    		click_handler
    	];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    function chapter(args) {
        var _a;
        const url = new URL(`https://restless-mode-a980.arewecoolyet.workers.dev/chapter`);
        url.searchParams.append("manga", args.manga);
        args.volume && url.searchParams.append("volume", args.volume);
        args.chapter && url.searchParams.append("chapter", args.chapter);
        url.searchParams.append("limit", String(10));
        url.searchParams.append("offset", String((_a = args.offset) !== null && _a !== void 0 ? _a : 0));
        return sfetch(url.toString())
            .then((response) => response.json())
            .then((response) => {
            return response;
        });
    }

    function makeChapterClient() {
        let query;
        let currentOffset = 0;
        return {
            changeMangaQuery: (newQuery) => {
                query = newQuery;
                currentOffset = 0;
            },
            getNextPageOfResults: async () => {
                if (query) {
                    const chapterResponse = await chapter(Object.assign(Object.assign({}, query), { offset: currentOffset }));
                    currentOffset += 10;
                    return chapterResponse.results.map((chapterResult) => ({
                        id: chapterResult.data.id,
                        title: chapterResult.data.attributes.title,
                        volume: Number(chapterResult.data.attributes.volume || 0),
                        chapter: Number(chapterResult.data.attributes.chapter || 0),
                        hash: chapterResult.data.attributes.hash,
                        dataSaverPageHashes: chapterResult.data.attributes.dataSaver,
                    }));
                }
                else {
                    return [];
                }
            },
        };
    }

    /* src/components/Chapter.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/components/Chapter.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (44:2) {#each chapterResults as result}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0_value = /*result*/ ctx[10].title + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let p;
    	let t2;
    	let t3_value = /*result*/ ctx[10].volume + "";
    	let t3;
    	let t4;
    	let t5_value = /*result*/ ctx[10].chapter + "";
    	let t5;
    	let t6;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*result*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text("Volume #");
    			t3 = text(t3_value);
    			t4 = text(", Chapter #");
    			t5 = text(t5_value);
    			t6 = space();
    			attr_dev(a, "href", a_href_value = "#/manga/" + /*result*/ ctx[10].id);
    			attr_dev(a, "class", "svelte-1qukknv");
    			add_location(a, file$1, 45, 6, 1777);
    			add_location(p, file$1, 50, 6, 1925);
    			attr_dev(li, "class", "svelte-1qukknv");
    			add_location(li, file$1, 44, 4, 1766);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    			append_dev(li, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(li, t6);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(click_handler), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*chapterResults*/ 2 && t0_value !== (t0_value = /*result*/ ctx[10].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*chapterResults*/ 2 && a_href_value !== (a_href_value = "#/manga/" + /*result*/ ctx[10].id)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*chapterResults*/ 2 && t3_value !== (t3_value = /*result*/ ctx[10].volume + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*chapterResults*/ 2 && t5_value !== (t5_value = /*result*/ ctx[10].chapter + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:2) {#each chapterResults as result}",
    		ctx
    	});

    	return block;
    }

    // (55:0) {#if loading}
    function create_if_block_1$1(ctx) {
    	let aside;

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			aside.textContent = "loading...";
    			attr_dev(aside, "class", "ender svelte-1qukknv");
    			add_location(aside, file$1, 55, 2, 2025);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(55:0) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (58:0) {#if !loading && chapterResults.length > 0}
    function create_if_block$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "fetch more...";
    			attr_dev(button, "class", "ender svelte-1qukknv");
    			add_location(button, file$1, 58, 2, 2117);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*onFetchMore*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(58:0) {#if !loading && chapterResults.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let ul;
    	let t0;
    	let t1;
    	let if_block1_anchor;
    	let each_value = /*chapterResults*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block0 = /*loading*/ ctx[0] && create_if_block_1$1(ctx);
    	let if_block1 = !/*loading*/ ctx[0] && /*chapterResults*/ ctx[1].length > 0 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty$1();
    			attr_dev(ul, "class", "svelte-1qukknv");
    			add_location(ul, file$1, 42, 0, 1722);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t0, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*chapterResults, onClickChapterResult*/ 10) {
    				each_value = /*chapterResults*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*loading*/ ctx[0]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(t1.parentNode, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!/*loading*/ ctx[0] && /*chapterResults*/ ctx[1].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chapter", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	let { mangaId = "" } = $$props;
    	const dispatch = createEventDispatcher();
    	const chapterClient = makeChapterClient();
    	let loading = false;
    	let chapterResults = [];

    	function onMangaChanged(newMangaId) {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (!newMangaId) {
    				return;
    			}

    			$$invalidate(0, loading = true);
    			$$invalidate(1, chapterResults = []);
    			chapterClient.changeMangaQuery({ manga: newMangaId });
    			$$invalidate(1, chapterResults = yield chapterClient.getNextPageOfResults());
    			$$invalidate(0, loading = false);
    		});
    	}

    	function onFetchMore() {
    		return __awaiter(this, void 0, void 0, function* () {
    			$$invalidate(0, loading = true);
    			$$invalidate(1, chapterResults = chapterResults.concat(yield chapterClient.getNextPageOfResults()));
    			$$invalidate(0, loading = false);
    		});
    	}

    	function onClickChapterResult(chapterResult) {
    		dispatch("chapterSelected", { chapter: chapterResult });
    	}

    	const writable_props = ["mangaId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chapter> was created with unknown prop '${key}'`);
    	});

    	const click_handler = result => onClickChapterResult(result);

    	$$self.$$set = $$props => {
    		if ("mangaId" in $$props) $$invalidate(4, mangaId = $$props.mangaId);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		createEventDispatcher,
    		makeChapterClient,
    		mangaId,
    		dispatch,
    		chapterClient,
    		loading,
    		chapterResults,
    		onMangaChanged,
    		onFetchMore,
    		onClickChapterResult
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("mangaId" in $$props) $$invalidate(4, mangaId = $$props.mangaId);
    		if ("loading" in $$props) $$invalidate(0, loading = $$props.loading);
    		if ("chapterResults" in $$props) $$invalidate(1, chapterResults = $$props.chapterResults);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*mangaId*/ 16) {
    			onMangaChanged(mangaId);
    		}
    	};

    	return [
    		loading,
    		chapterResults,
    		onFetchMore,
    		onClickChapterResult,
    		mangaId,
    		click_handler
    	];
    }

    class Chapter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { mangaId: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chapter",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get mangaId() {
    		throw new Error("<Chapter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mangaId(value) {
    		throw new Error("<Chapter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function atHomeUrl(chapterId) {
        const url = new URL(`https://restless-mode-a980.arewecoolyet.workers.dev/at-home/server/${chapterId}`);
        return sfetch(url.toString())
            .then((response) => response.json())
            .then((response) => response.baseUrl);
    }

    async function makePageClientFactory(chapter) {
        const homeUri = await atHomeUrl(chapter.id);
        return makePageClient(homeUri, chapter);
    }
    function makePageClient(atHomeUrl, chapter) {
        let currentPageNumber = -1;
        const urlPageMap = {};
        function getPage(pageNumber) {
            pageNumber = Math.min(pageNumber, chapter.dataSaverPageHashes.length - 1);
            pageNumber = Math.max(pageNumber, 0);
            const url = new URL(`${atHomeUrl}/data-saver/${chapter.hash}/${chapter.dataSaverPageHashes[pageNumber]}`);
            if (urlPageMap[url.toString()]) {
                return Promise.resolve(urlPageMap[url.toString()]);
            }
            return sfetch(url.toString()).then((response) => {
                var _a;
                sfetch("https://api.mangadex.network/report", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        url: response.url,
                        success: response.status >= 200 && response.status < 300,
                        bytes: response.headers.get("Content-Length") &&
                            Number.parseInt(response.headers.get("Content-Length")),
                        cached: (_a = response.headers.get("X-Cache")) === null || _a === void 0 ? void 0 : _a.startsWith("HIT"),
                    }),
                });
                urlPageMap[url.toString()] = response.url;
                return response.url;
            });
        }
        return {
            getNextPage: () => getPage(currentPageNumber + 2) && getPage(++currentPageNumber),
            getPreviousPage: () => getPage(--currentPageNumber),
        };
    }

    /* src/components/Page.svelte generated by Svelte v3.38.2 */
    const file = "src/components/Page.svelte";

    // (59:0) {#if currentPage}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let footer;
    	let button0;
    	let t2;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			footer = element("footer");
    			button0 = element("button");
    			button0.textContent = `${"← prev"}`;
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = `${"next →"}`;
    			attr_dev(img, "alt", /*currentPage*/ ctx[0]);
    			if (img.src !== (img_src_value = /*currentPage*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1o3alv5");
    			add_location(img, file, 59, 2, 1951);
    			attr_dev(button0, "id", "prevPage");
    			attr_dev(button0, "class", "svelte-1o3alv5");
    			add_location(button0, file, 61, 4, 2035);
    			attr_dev(button1, "id", "nextPage");
    			attr_dev(button1, "class", "svelte-1o3alv5");
    			add_location(button1, file, 62, 4, 2107);
    			attr_dev(footer, "class", "svelte-1o3alv5");
    			add_location(footer, file, 60, 2, 2022);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, button0);
    			append_dev(footer, t2);
    			append_dev(footer, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "mouseup", /*onPageClick*/ ctx[3], false, false, false),
    					listen_dev(button0, "click", /*onPreviousPage*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*onNextPage*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentPage*/ 1) {
    				attr_dev(img, "alt", /*currentPage*/ ctx[0]);
    			}

    			if (dirty & /*currentPage*/ 1 && img.src !== (img_src_value = /*currentPage*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(59:0) {#if currentPage}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*currentPage*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty$1();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*currentPage*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
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
    	validate_slots("Page", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	
    	let { chapter } = $$props;
    	let pageClient;
    	let currentPage;
    	let loading = false;

    	function onChapterChanged(newChapter) {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (!newChapter) {
    				return;
    			}

    			loading = true;
    			pageClient = yield makePageClientFactory(newChapter);
    			$$invalidate(0, currentPage = yield pageClient.getNextPage());
    			loading = false;
    		});
    	}

    	function onNextPage() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (pageClient) {
    				loading = true;
    				$$invalidate(0, currentPage = yield pageClient.getNextPage());
    				loading = false;
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	function onPreviousPage() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (pageClient) {
    				loading = true;
    				$$invalidate(0, currentPage = yield pageClient.getPreviousPage());
    				loading = false;
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	function onPageClick(evt) {
    		if (evt.pageX >= 3 / 5 * window.innerWidth) {
    			onNextPage();
    		} else {
    			onPreviousPage();
    		}
    	}

    	const writable_props = ["chapter"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Page> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("chapter" in $$props) $$invalidate(4, chapter = $$props.chapter);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		makePageClientFactory,
    		chapter,
    		pageClient,
    		currentPage,
    		loading,
    		onChapterChanged,
    		onNextPage,
    		onPreviousPage,
    		onPageClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("chapter" in $$props) $$invalidate(4, chapter = $$props.chapter);
    		if ("pageClient" in $$props) pageClient = $$props.pageClient;
    		if ("currentPage" in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    		if ("loading" in $$props) loading = $$props.loading;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*chapter*/ 16) {
    			onChapterChanged(chapter);
    		}
    	};

    	return [currentPage, onNextPage, onPreviousPage, onPageClick, chapter];
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { chapter: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*chapter*/ ctx[4] === undefined && !("chapter" in props)) {
    			console.warn("<Page> was created without expected prop 'chapter'");
    		}
    	}

    	get chapter() {
    		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chapter(value) {
    		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */

    // (9:0) {#if focusedChapter}
    function create_if_block_1(ctx) {
    	let page;
    	let current;

    	page = new Page({
    			props: { chapter: /*focusedChapter*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(page.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const page_changes = {};
    			if (dirty & /*focusedChapter*/ 2) page_changes.chapter = /*focusedChapter*/ ctx[1];
    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(9:0) {#if focusedChapter}",
    		ctx
    	});

    	return block;
    }

    // (13:0) {#if focusedMangaId}
    function create_if_block(ctx) {
    	let chapter;
    	let current;

    	chapter = new Chapter({
    			props: { mangaId: /*focusedMangaId*/ ctx[0] },
    			$$inline: true
    		});

    	chapter.$on("chapterSelected", /*chapterSelected_handler*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(chapter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(chapter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const chapter_changes = {};
    			if (dirty & /*focusedMangaId*/ 1) chapter_changes.mangaId = /*focusedMangaId*/ ctx[0];
    			chapter.$set(chapter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chapter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chapter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(chapter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(13:0) {#if focusedMangaId}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let t1;
    	let search;
    	let current;
    	let if_block0 = /*focusedChapter*/ ctx[1] && create_if_block_1(ctx);
    	let if_block1 = /*focusedMangaId*/ ctx[0] && create_if_block(ctx);
    	search = new Search({ $$inline: true });
    	search.$on("mangaSelected", /*mangaSelected_handler*/ ctx[3]);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			create_component(search.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(search, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*focusedChapter*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*focusedChapter*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*focusedMangaId*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*focusedMangaId*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(search.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(search.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(search, detaching);
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
    	validate_slots("App", slots, []);
    	
    	let focusedMangaId;
    	let focusedChapter;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const chapterSelected_handler = evt => $$invalidate(1, focusedChapter = evt.detail.chapter);
    	const mangaSelected_handler = evt => $$invalidate(0, focusedMangaId = evt.detail.mangaId);

    	$$self.$capture_state = () => ({
    		Search,
    		Chapter,
    		Page,
    		focusedMangaId,
    		focusedChapter
    	});

    	$$self.$inject_state = $$props => {
    		if ("focusedMangaId" in $$props) $$invalidate(0, focusedMangaId = $$props.focusedMangaId);
    		if ("focusedChapter" in $$props) $$invalidate(1, focusedChapter = $$props.focusedChapter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [focusedMangaId, focusedChapter, chapterSelected_handler, mangaSelected_handler];
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

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

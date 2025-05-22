// Konbini
// (c) themirrazz, 02 May 2025
(() => {
    navigator.konbini = {
        v: '1.0.2',
        supports: (feature) => [
            'auto-refresh',
            'smart-hooking',
            'dom-shortcut',
            'dom-shortcut-id',
            'dom-shortcut-tag'
        ].includes(feature),
        syntax: 'es2020/chrome',
        model: 'standard'
    };
    var appendChild = Element.prototype.appendChild;
    var replaceChild = Element.prototype.replaceChild;
    var innerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    var id = Object.getOwnPropertyDescriptor(Element.prototype, 'id');
    Element.prototype.replaceChild = function (newChild, oldChild) {
        if(newChild instanceof Element) checkElement(newChild instanceof Element);
        return replaceChild.apply(this, [newChild, oldChild]);
    };
    Element.prototype.appendChild = function (child) {
        if(this.contains(child)) {
            // prevent bad CPU consumption
            // it doesn't need to check if it's already in the document
            throw new Error('This child is already a child?!');
        }
        if(child instanceof Element) checkElement(child);
        return appendChild.apply(this, [child]);
    };
    Object.defineProperty(Element.prototype, 'innerHTML', {
        get: innerHTML.get,
        set: function (html) {
            innerHTML.set.apply(this, [html]);
            checkElement(this, true);
        }
    });
    Object.defineProperty(Element.prototype, 'id', {
        get: id.get,
        set: function (nId) {
            id.set.apply(this, [nId]);
            checkElement(this, false, true);
        }
    });
    var checkElement = function checkElement(elem, childrenOnly, selfOnly) {
        if(!(elem instanceof Element)) throw new TypeError('please put a real element, lol');
        var x = elem.id; // prevent it from causing havoc
        if(!childrenOnly && x && !Object.getOwnPropertyDescriptor(window, '$'+x)) {
            Object.defineProperty(window, '$'+x, {
                get: function () {
                    return document.getElementById(x);
                }
            });
            Object.defineProperty(Document.prototype, '$'+x, {
                get: function () {
                    return this.getElementById(x);
                }
            });
            Object.defineProperty(Element.prototype, '$'+x, {
                get: function () {
                    var z = this.querySelectorAll('*');
                    for(var i = 0; i < z.length; i++) {
                        if(z[i].id === x) {
                            return z[i];
                        }
                    }
                    return null;
                }
            });
        };
        if(selfOnly) return;
        Array.from(elem.children).forEach(f => {
            if(f instanceof Element) checkElement(f);
        });
    };
    // Automatically do all elements
    checkElement(document.documentElement, true);
    Object.defineProperty(window, '$dom', {
        get: function () {
            return window.document
        }
    });
    // tag shortcuts
    [
        'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'pre', 'textarea', 'input', 'select',
        'iframe', 'frame', 'embed', 'source',
        'picture', 'track', 'audio', 'video', 'canvas',
        'img', 'svg', 'table', 'tr', 'th', 'td', 'ruby',
        'rp', 'rt', 'b', 'i', 'u', 's', 'strike', 'font',
        'strong', 'em', 'br', 'hr', 'blockquote', 'form',
        'fieldset', 'legend', 'details', 'summary', 'code'
    ].forEach(tag => {
        Object.defineProperty(Document.prototype, tag, {
            get: function () {
                return document.getElementsByTagName(tag);
            }
        })
    });
})();
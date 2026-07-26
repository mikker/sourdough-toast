// vim: foldmethod=marker

const DEFAULT_OPTIONS = {
  maxToasts: 3,
  duration: 4000,
  width: 356,
  gap: 14,
  theme: "light",
  viewportOffset: 32,
  expandedByDefault: false,
  yPosition: "bottom",
  xPosition: "right",
  closeButton: false,
  richColors: false,
};

// Matches the exit transition duration in the CSS
const REMOVE_DELAY_MS = 400;

// Swiping past either threshold dismisses the toast
const SWIPE_THRESHOLD_PX = 45;
const SWIPE_VELOCITY = 0.11;

let toastsCounter = 0;

// {{{ Helpers
const SVG_NS = "http://www.w3.org/2000/svg";

const svgTags = ["svg", "path", "line", "circle"];

const h = (tag, props = {}, children = []) => {
  const element = svgTags.includes(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (key === "style") {
      if (typeof value === "string") {
        element.style = value;
      } else {
        for (const [k, v] of Object.entries(value)) {
          element.style.setProperty(k, v);
        }
      }
    } else if (key === "dataset") {
      for (const [k, v] of Object.entries(value)) {
        element.dataset[k] = v;
      }
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of [children].flat(Infinity)) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }

  return element;
};

const svgAttrs = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  height: "20",
  width: "20",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.5",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "aria-hidden": "true",
  dataset: { slot: "icon" },
};

// Built lazily so importing this module doesn't require a DOM
let icons;
const getIcons = () => (icons ??= {
  success: h("svg", svgAttrs, [h("path", { d: "M20 6 9 17l-5-5" })]),
  info: h("svg", svgAttrs, [
    h("circle", { cx: "12", cy: "12", r: "10" }),
    h("path", { d: "M12 16v-4" }),
    h("path", { d: "M12 8h.01" }),
  ]),
  warning: h("svg", svgAttrs, [
    h("path", {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
    }),
    h("path", { d: "M12 9v4" }),
    h("path", { d: "M12 17h.01" }),
  ]),
  error: h("svg", svgAttrs, [
    h("circle", { cx: "12", cy: "12", r: "10" }),
    h("path", { d: "m4.9 4.9 14.2 14.2" }),
  ]),
  spinner: h(
    "svg",
    {
      ...svgAttrs,
      viewBox: "0 0 2400 2400",
      stroke: "black",
      "data-sourdough-spinner": "",
      "stroke-width": "200",
      "stroke-linecap": "round",
    },
    [
      h("line", { x1: "1200", y1: "600", x2: "1200", y2: "100" }),
      h("line", {
        opacity: "0.5",
        x1: "1200",
        y1: "2300",
        x2: "1200",
        y2: "1800",
      }),
      h("line", {
        opacity: "0.917",
        x1: "900",
        y1: "680.4",
        x2: "650",
        y2: "247.4",
      }),
      h("line", {
        opacity: "0.417",
        x1: "1750",
        y1: "2152.6",
        x2: "1500",
        y2: "1719.6",
      }),
      h("line", {
        opacity: "0.833",
        x1: "680.4",
        y1: "900",
        x2: "247.4",
        y2: "650",
      }),
      h("line", {
        opacity: "0.333",
        x1: "2152.6",
        y1: "1750",
        x2: "1719.6",
        y2: "1500",
      }),
      h("line", {
        opacity: "0.75",
        x1: "600",
        y1: "1200",
        x2: "100",
        y2: "1200",
      }),
      h("line", {
        opacity: "0.25",
        x1: "2300",
        y1: "1200",
        x2: "1800",
        y2: "1200",
      }),
      h("line", {
        opacity: "0.667",
        x1: "680.4",
        y1: "1500",
        x2: "247.4",
        y2: "1750",
      }),
      h("line", {
        opacity: "0.167",
        x1: "2152.6",
        y1: "650",
        x2: "1719.6",
        y2: "900",
      }),
      h("line", {
        opacity: "0.583",
        x1: "900",
        y1: "1719.6",
        x2: "650",
        y2: "2152.6",
      }),
      h("line", {
        opacity: "0.083",
        x1: "1750",
        y1: "247.4",
        x2: "1500",
        y2: "680.4",
      }),
    ],
  ),
  close: h("svg", svgAttrs, [h("path", { d: "M6 18 18 6M6 6l12 12" })]),
});

function getDocumentDirection() {
  if (typeof window === "undefined") return "ltr";

  const dirAttribute = document.documentElement.getAttribute("dir");

  if (dirAttribute === "auto" || !dirAttribute) {
    return window.getComputedStyle(document.documentElement).direction;
  }

  return dirAttribute;
}
// }}}

// {{{ class Store
class Store {
  #subscribers = [];

  constructor() {
    this.data = {
      toasts: [],
      expanded: false,
      interacting: false,
    };
  }

  subscribe = (fn) => {
    this.#subscribers.push(fn);

    return () => {
      this.#subscribers = this.#subscribers.filter((f) => f !== fn);
    };
  };

  #publish = () => {
    this.#subscribers.forEach((fn) => fn(this.data));
  };

  #set = (fn) => {
    const change = fn({ ...this.data });
    this.data = { ...this.data, ...change };
    this.#publish();
  };

  touch = () => {
    this.#publish();
  };

  create = (opts) => {
    const id = (toastsCounter++).toString();
    const toast = { ...opts, id };

    this.#set((data) => ({
      toasts: [...data.toasts, toast],
    }));

    return id;
  };

  remove = (id) => {
    this.#set((data) => ({
      toasts: data.toasts.filter((t) => t.id !== id),
    }));
  };

  expand = () => {
    this.#set(() => ({ expanded: true }));
  };

  collapse = () => {
    this.#set(() => ({ expanded: false }));
  };

  focus = () => {
    this.#set(() => ({ interacting: true }));
  };

  blur = () => {
    this.#set(() => ({ interacting: false }));
  };
} // }}}

// {{{ class Toast

// Rendered toasts by id, so toast.dismiss() can play the exit animation
const renderedToasts = new Map();

class Toast {
  constructor(sourdough, opts = {}) {
    this.sourdough = sourdough;
    this.opts = opts;

    this.paused = false;

    const children = [];

    const icon = (opts.type && getIcons()[opts.type]) || null;

    if (icon) {
      children.push(
        h("div", { dataset: { icon: "" } }, [icon.cloneNode(true)]),
      );
    }

    const showCloseButton = opts.persist || opts.closeButton === true || (this.sourdough.opts.closeButton === true && opts.closeButton !== false);
    if (showCloseButton) {
      const closeButton = h(
        "button",
        {
          dataset: { closeButton: "" },
          type: "button",
          "aria-label": "Close"
        },
        [getIcons().close.cloneNode(true)],
      );

      closeButton.addEventListener("click", () => {
        this.remove();
      });

      children.push(closeButton);
    }

    const contentChildren = [];

    const title = h("div", { dataset: { title: "" } }, [opts.title]);

    contentChildren.push(title);

    if (opts.description) {
      let description;

      if (opts.html === true) {
        description = h("div", { dataset: { description: "" } }, []);
        description.innerHTML = opts.description;
      } else {
        description = h("div", { dataset: { description: "" } }, [opts.description]);
      }

      description.querySelectorAll("[data-toast-dismiss]").forEach(trigger => {
        trigger.addEventListener("click", (e) => {
          this.remove();
        });
      });

      contentChildren.push(description);
    }

    const content = h("div", { dataset: { content: "" } }, contentChildren);

    children.push(content);

    const liDataset = {
      sourdoughToast: "",
      expanded: sourdough.expanded,
      styled: true,
      swiping: false,
      swipeOut: false,
      yPosition: sourdough.opts.yPosition,
      xPosition: sourdough.opts.xPosition,
    };

    if (opts.type) {
      liDataset.type = opts.type;
    }

    if (opts.persist) {
      liDataset.persist = "true";
    }

    const li = h(
      "li",
      {
        role: "status",
        "aria-live": opts.type === "error" ? "assertive" : "polite",
        "aria-atomic": "true",
        dataset: liDataset,
        style: {},
      },
      [children],
    );

    this.element = li;

    this.setupSwipe();

    renderedToasts.set(opts.id, this);
  }

  setupSwipe = () => {
    let startY, startedAt, delta;

    this.element.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary) return;
      if (event.target.closest("button, a, [data-toast-dismiss]")) return;

      this.element.setPointerCapture(event.pointerId);
      startY = event.clientY;
      startedAt = Date.now();
      delta = 0;
      this.element.dataset.swiping = "true";
      // Touch has no hover to pause the timer, so pause explicitly
      this.pause();
    });

    this.element.addEventListener("pointermove", (event) => {
      if (this.element.dataset.swiping !== "true") return;

      // Only allow movement toward the dismissal edge
      delta = event.clientY - startY;
      if (this.sourdough.opts.yPosition === "top") {
        delta = Math.min(delta, 0);
      } else {
        delta = Math.max(delta, 0);
      }

      this.element.style.setProperty("--swipe-amount", `${delta}px`);
    });

    const endSwipe = () => {
      if (this.element.dataset.swiping !== "true") return;

      const velocity = Math.abs(delta) / (Date.now() - startedAt);

      if (Math.abs(delta) >= SWIPE_THRESHOLD_PX || velocity >= SWIPE_VELOCITY) {
        this.element.dataset.swipeOut = "true";
        this.remove();
      } else {
        this.element.style.removeProperty("--swipe-amount");
        this.element.dataset.swiping = "false";
        if (!state.data.interacting) this.resume();
      }
    };

    this.element.addEventListener("pointerup", endSwipe);
    this.element.addEventListener("pointercancel", endSwipe);
  };

  mount = () => {
    this.element.dataset.mounted = "true";

    this.initialHeight = this.element.offsetHeight;

    state.touch();

    if (!this.opts.persist) {
      this.timeLeft = this.opts.duration ?? this.sourdough.opts.duration;

      if (state.data.interacting) {
        // Resumed by the update loop once interaction ends
        this.paused = true;
      } else {
        this.resume();
      }
    }
  };

  remove = () => {
    if (this.element.dataset.removed) return;

    clearTimeout(this.timer);
    renderedToasts.delete(this.opts.id);
    this.element.dataset.removed = "true";

    setTimeout(() => {
      this.element.remove();
      state.remove(this.opts.id);
    }, REMOVE_DELAY_MS);
  };

  pause = () => {
    if (this.opts.persist) return;
    this.paused = true;
    clearTimeout(this.timer);
    if (this.startedAt) {
      this.timeLeft = this.timeLeft - (Date.now() - this.startedAt);
    }
  };

  resume = () => {
    if (this.opts.persist) return;
    this.paused = false;
    this.startedAt = Date.now();
    this.timer = setTimeout(this.remove, this.timeLeft);
  };
}
// }}}

class Sourdough {
  constructor(opts = {}) {
    this.opts = Object.assign({}, DEFAULT_OPTIONS, opts);

    this.expanded = this.opts.expandedByDefault;
    if (this.opts.expandedByDefault) setTimeout(state.expand);

    // Cache rendered toasts by id
    this.renderedToastsById = {};

    this.list = h("ol", {
      dir: getDocumentDirection(),
      "aria-label": "Notifications",
      dataset: {
        sourdoughToaster: "",
        expanded: this.expanded,
        theme: this.opts.theme,
        richColors: this.opts.richColors,
        yPosition: this.opts.yPosition,
        xPosition: this.opts.xPosition,
      },
      style: {
        "--width": `${this.opts.width}px`,
        "--gap": `${this.opts.gap}px`,
        "--offset": `${this.opts.viewportOffset}px`,
      },
    });

    this.list.addEventListener("mouseenter", state.focus);
    this.list.addEventListener("mouseleave", state.blur);
    this.list.addEventListener("focusin", state.focus);
    this.list.addEventListener("focusout", (event) => {
      if (!this.list.contains(event.relatedTarget)) state.blur();
    });
    this.list.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      const element = event.target.closest("[data-sourdough-toast]");
      const toast = Object.values(this.renderedToastsById).find(
        (t) => t.element === element,
      );
      if (toast) toast.remove();
    });

    this.element = h(
      "div",
      {
        dataset: {
          sourdough: "",
          ...opts.dataset,
        },
      },
      [this.list],
    );

    this.subscription = state.subscribe(this.update.bind(this));
  }

  boot = () => {
    if (document.querySelector("[data-sourdough]")) {
      return;
    }
    document.body.appendChild(this.element);
  };

  update = (data) => {
    this.expanded = data.expanded || data.interacting;
    this.list.dataset.expanded = this.expanded;

    // Get last X toasts, but persisted toasts don't count toward the limit
    const nonPersisted = data.toasts.filter((t) => !t.persist);
    const capped = nonPersisted.slice(-this.opts.maxToasts);
    const cappedIds = new Set(capped.map((t) => t.id));
    const toasts = data.toasts.filter(
      (t) => t.persist || cappedIds.has(t.id),
    );

    // Render and cache toasts that haven't been rendered yet
    const renderedIds = [];
    const toastsToRender = toasts.reduce((coll, t) => {
      renderedIds.push(t.id);
      coll.push(this.renderedToastsById[t.id] || this.createToast(t));
      return coll;
    }, []);

    // Uncache and remove toast elements that are not to be rendered.
    // Deleting from the cache before state.remove keeps the re-entrant
    // update it triggers from finding the toast again.
    Object.keys(this.renderedToastsById).forEach((id) => {
      if (!renderedIds.includes(id)) {
        const evicted = this.renderedToastsById[id];
        delete this.renderedToastsById[id];
        renderedToasts.delete(id);
        clearTimeout(evicted.timer);
        evicted.element.remove();
        state.remove(id);
      }
    });

    const front = toastsToRender[toastsToRender.length - 1];

    if (front) {
      this.list.style.setProperty(
        "--front-toast-height",
        `${front.element.offsetHeight}px`,
      );
    }

    for (const [index, t] of toastsToRender.entries()) {
      // A toast mid-swipe manages its own timer until the swipe ends
      if (!t.element.dataset.removed && t.element.dataset.swiping !== "true") {
        if (t.paused && !data.interacting) {
          t.resume();
        } else if (!t.paused && data.interacting) {
          t.pause();
        }
      }

      t.element.dataset.index = index;
      t.element.dataset.front = t === front;
      t.element.dataset.expanded = this.expanded;

      t.element.style.setProperty("--index", index);
      t.element.style.setProperty(
        "--toasts-before",
        toastsToRender.length - index - 1,
      );
      t.element.style.setProperty("--z-index", index);

      t.element.style.setProperty(
        "--initial-height",
        this.expanded ? "auto" : `${t.initialHeight}px`,
      );

      // Calculate offset by adding all the heights of the toasts before
      // the current one + the gap between them.
      // Note: We're calculating the total height once per loop which is
      // not ideal.
      const [heightBefore, totalHeight] = toastsToRender.reduce(
        ([before, total], t, i) => {
          const boxHeight = t.initialHeight + this.opts.gap;
          if (i < index) before += boxHeight;
          total += boxHeight;
          return [before, total];
        },
        [0, 0],
      );

      const offset =
        totalHeight - heightBefore - t.initialHeight - this.opts.gap;
      t.element.style.setProperty(
        "--offset",
        `${t.element.dataset.removed ? "0" : offset || 0}px`,
      );
    }
  };

  createToast = (opts) => {
    const toast = new Toast(this, opts);
    this.renderedToastsById[opts.id] = toast;
    this.list.appendChild(toast.element);

    setTimeout(toast.mount, 0);

    return toast;
  };
}

const state = new Store();

const toast = (title, opts = {}) => {
  return state.create({ title, ...opts });
};
toast.message = ({ title, description, ...opts }) => {
  return state.create({ title, description, ...opts });
};
toast.success = (title, opts = {}) => {
  return state.create({ title, type: "success", ...opts });
};
toast.info = (title, opts = {}) => {
  return state.create({ title, type: "info", ...opts });
};
toast.warning = (title, opts = {}) => {
  return state.create({ title, type: "warning", ...opts });
};
toast.error = (title, opts = {}) => {
  return state.create({ title, type: "error", ...opts });
};
toast.dismiss = (id) => {
  const rendered = renderedToasts.get(id);

  if (rendered) {
    rendered.remove();
  } else {
    state.remove(id);
  }
};

export { toast, Sourdough, h };

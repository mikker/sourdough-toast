const MAX_TOASTS = 3;
const TOAST_DURATION = 4000; // * 10000;
const WIDTH = 356;
const VIEWPORT_OFFSET = 32;
const GAP = 14;

const SVG_NS = "http://www.w3.org/2000/svg";

let toastsCounter = 0;

const svgTags = ["svg", "path", "line"];
const h = (tag, props = {}, children = [], isSvg = false) => {
  const element =
    svgTags.includes(tag) || isSvg
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

  for (const child of children) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
      continue;
    } else if (Array.isArray(child)) {
      for (const c of child) {
        element.appendChild(c);
      }
      continue;
    } else if (child instanceof HTMLElement || child instanceof SVGElement) {
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
  fill: "currentColor",
  dataset: { slot: "icon" },
};
const pathRules = {
  "fill-rule": "evenodd",
  "clip-rule": "evenodd",
};

const icons = {
  success: h("svg", svgAttrs, [
    h("path", {
      d: "M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z",
      ...pathRules,
    }),
  ]),
  info: h("svg", svgAttrs, [
    h("path", {
      d: "M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
      ...pathRules,
    }),
  ]),
  warning: h("svg", svgAttrs, [
    h("path", {
      d: "M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
      ...pathRules,
    }),
  ]),
  error: h("svg", svgAttrs, [
    h("path", {
      d: "M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
      ...pathRules,
    }),
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
};

function getDocumentDirection() {
  if (typeof window === "undefined") return "ltr";

  const dirAttribute = document.documentElement.getAttribute("dir");

  if (dirAttribute === "auto" || !dirAttribute) {
    return window.getComputedStyle(document.documentElement).direction;
  }

  return dirAttribute;
}

class State {
  constructor() {
    this.subscribers = [];
    this.data = {
      toasts: [],
      expanded: false,
    };
  }

  subscribe = (fn) => {
    this.subscribers.push(fn);

    return () => {
      const index = this.subscribers.indexOf(fn);
      this.subscribers.splice(index, 1);
    };
  };

  publish = (data) => {
    this.subscribers.forEach((fn) => fn(data));
  };

  set = (fn) => {
    const change = fn({ ...this.data });
    this.data = { ...this.data, ...change };
    this.publish(this.data);
  };

  add = (toast) => {
    this.set((data) => ({
      toasts: [...data.toasts, toast].slice(-MAX_TOASTS),
    }));
  };

  removeToast = (id) => {
    this.set((data) => ({
      toasts: data.toasts.filter((t) => t.id !== id),
    }));
  };

  expand = () => {
    this.set(() => ({ expanded: true }));
  };

  collapse = () => {
    this.set(() => ({ expanded: false }));
  };

  create = (opts) => {
    const id = (toastsCounter++).toString();
    const toast = { id, ...opts };

    this.add(toast);

    return id;
  };
}

class Toast {
  constructor(opts = {}) {
    this.opts = opts;

    this.mounted = false;
    this.paused = false;

    const children = [];

    let icon = null;
    if (opts.type) {
      switch (opts.type) {
        case "success":
          icon = icons.success;
          break;
        case "info":
          icon = icons.info;
          break;
        case "warning":
          icon = icons.warning;
          break;
        case "error":
          icon = icons.error;
          break;
      }
    }

    if (icon) {
      children.push(
        h("div", { dataset: { icon: "" } }, [icon.cloneNode(true)]),
      );
    }

    const contentChildren = [];

    const title = h(
      "div",
      { dataset: { title: "" } },
      opts.title + ` ${opts.id}`,
    );

    contentChildren.push(title);

    if (opts.description) {
      const description = h(
        "div",
        { dataset: { description: "" } },
        opts.description,
      );
      contentChildren.push(description);
    }

    const content = h("div", { dataset: { content: "" } }, contentChildren);

    children.push(content);

    const li = h(
      "li",
      {
        dataset: {
          sourdoughToast: "",
          expanded: false,
          styled: true,
          swiping: false,
          type: opts.type,
        },
        style: {},
      },
      [children],
    );

    this.element = li;
  }

  mount = (list) => {
    this.mounted = true;
    this.element.dataset.mounted = "true";
    this.element.dataset.swiping = "false";
    this.element.dataset.yPosition = list.dataset.yPosition;
    this.element.dataset.xPosition = list.dataset.xPosition;

    this.initialHeight = this.element.offsetHeight;
    this.element.style.setProperty(
      "--initial-height",
      `${this.initialHeight}px`,
    );

    this.timeLeft = TOAST_DURATION;
    this.resume();
  };

  remove = () => {
    // if (this.element.dataset.removed) return;

    this.element.dataset.removed = "true";

    setTimeout(() => {
      this.element.remove();
      state.removeToast(this.opts.id);
    }, 400);
  };

  pause = () => {
    this.paused = true;
    this.timeLeft = this.timeLeft - (Date.now() - this.startedAt);
    clearTimeout(this.timer);
  };

  resume = () => {
    this.paused = false;
    this.startedAt = Date.now();
    this.timer = setTimeout(this.remove, this.timeLeft);
  };
}

class Sourdough {
  constructor(opts = {}) {
    this.opts = opts;
    this.expanded = false;
    this.renderedToastsById = {};

    this.list = h("ol", {
      dir: getDocumentDirection(),
      dataset: {
        sourdoughToaster: "",
        expanded: false,
        theme: "light",
        richColors: this.opts.richColors,
        yPosition: "bottom",
        xPosition: "right",
      },
      style: {
        "--width": `${opts.width}px`,
        "--gap": `${opts.gap}px`,
        "--offset": `${opts.offset}px`,
      },
    });

    this.list.addEventListener("mouseenter", state.expand);
    this.list.addEventListener("mouseleave", state.collapse);

    this.element = h(
      "div",
      {
        dataset: { sourdough: "" },
      },
      [this.list],
    );

    this.subscription = state.subscribe(this.update.bind(this));
  }

  boot() {
    document.body.appendChild(this.element);
  }

  update(state) {
    const changedExtended = this.expanded !== state.expanded;
    if (changedExtended) {
      this.expanded = state.expanded;
      this.list.dataset.expanded = this.expanded;
    }

    const renderedIds = [];
    const toasts_to_render = state.toasts.reduce((coll, t) => {
      renderedIds.push(t.id);
      coll.push(this.renderedToastsById[t.id] || this.createToast(t));
      return coll;
    }, []);

    Object.keys(this.renderedToastsById).forEach((id) => {
      if (!renderedIds.includes(id)) {
        this.renderedToastsById[id].remove();
        delete this.renderedToastsById[id];
      }
    });

    const front = toasts_to_render[toasts_to_render.length - 1];

    if (front) {
      this.list.style.setProperty(
        "--front-toast-height",
        `${front.element.offsetHeight}px`,
      );
    }

    for (const [index, t] of toasts_to_render.entries()) {
      if (changedExtended) {
        t.paused ? t.resume() : t.pause();
      }

      t.element.dataset.index = index;
      t.element.dataset.front = t === front;
      t.element.dataset.expanded = state.expanded;

      t.element.style.setProperty("--index", index);
      t.element.style.setProperty(
        "--toasts-before",
        toasts_to_render.length - index - 1,
      );
      t.element.style.setProperty("--z-index", index);

      // Calculate offset by adding all the heights of the toasts before
      // the current one + the gap between them.
      // Note: We're actually calculating the total height once per loop
      // which is not ideal.
      const [heightBefore, totalHeight] = toasts_to_render.reduce(
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
  }

  createToast(opts) {
    const toast = new Toast(opts);
    this.renderedToastsById[opts.id] = toast;
    this.list.appendChild(toast.element);

    setTimeout(() => toast.mount(this.list), 0);

    return toast;
  }
}

const state = new State();

const sourdough = new Sourdough({
  width: WIDTH,
  gap: GAP,
  offset: VIEWPORT_OFFSET,
  richColors: true,
});

const toast = (title) => {
  state.create({ title });
};
toast.message = ({ title, description }) => {
  state.create({ title, description, ...opts });
};
toast.success = (title, opts = {}) => {
  state.create({ title, type: "success", ...opts });
};
toast.info = (title, opts = {}) => {
  state.create({ title, type: "info", ...opts });
};
toast.warning = (title, opts = {}) => {
  state.create({ title, type: "warning", ...opts });
};
toast.error = (title, opts = {}) => {
  state.create({ title, type: "error", ...opts });
};

export { toast, sourdough };

window.addEventListener("DOMContentLoaded", () => {
  sourdough.boot();
});

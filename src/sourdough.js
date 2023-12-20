const MAX_TOASTS = 3;
const TOAST_DURATION = 4000;
const WIDTH = 325;
const OFFSET = 32;
const GAP = 16;

let toastsCounter = 0;

const h = (tag, props = {}, children = []) => {
  const element = document.createElement(tag);

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
      element[key] = value;
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
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  }

  return element;
};

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

  addToast = (toast) => {
    this.set((data) => ({
      toasts: [...data.toasts, toast].slice(-MAX_TOASTS),
    }));
  };

  removeToast = (id) => {
    this.set((data) => ({
      toasts: data.toasts.filter((t) => t.id !== id),
    }));
  };

  setExpanded = (expanded) => {
    this.set(() => ({ expanded }));
  };

  create = (opts) => {
    const id = (toastsCounter++).toString();
    const toast = { id, ...opts };

    this.addToast(toast);

    return id;
  };
}

class Toast {
  constructor(opts = {}) {
    this.opts = opts;

    this.mounted = false;
    this.paused = false;

    const title = h(
      "div",
      { dataset: { title: "" } },
      opts.title + ` ${opts.id}`,
    );
    const children = [title];

    if (opts.description) {
      const description = h(
        "div",
        { dataset: { description: "" } },
        opts.description,
      );
      children.push(description);
    }

    const content = h("div", { dataset: { content: "" } }, children);

    const li = h(
      "li",
      {
        dataset: {
          sourdoughToast: "",
          expanded: false,
          styled: true,
          swiping: false,
        },
        style: {},
      },
      [content],
    );

    this.element = li;
  }

  mount = () => {
    this.mounted = true;
    this.element.dataset.mounted = "true";

    this.initialHeight = this.element.offsetHeight;
    this.element.style.setProperty(
      "--initial-height",
      `${this.initialHeight}px`,
    );

    this.timeLeft = TOAST_DURATION;
    this.resume();
  };

  remove = () => {
    if (this.element.dataset.removed) return;

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
      dataset: { sourdoughToaster: "", expanded: false },
      onmouseenter: () => {
        state.setExpanded(true);
      },
      onmouseleave: () => {
        state.setExpanded(false);
      },
    });
    this.element = h(
      "div",
      {
        dataset: { sourdough: "" },
        style: {
          "--width": `${opts.width}px`,
          "--gap": `${opts.gap}px`,
          "--offset": `${opts.offset}px`,
        },
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
      coll.push(this.renderedToastsById[t.id] || this.addToast(t));
      return coll;
    }, []);

    Object.keys(this.renderedToastsById).forEach((id) => {
      if (!renderedIds.includes(id)) {
        this.renderedToastsById[id].remove();
        delete this.renderedToastsById[id];
      }
    });

    const front = toasts_to_render[toasts_to_render.length - 1];

    console.log("toasts to render", toasts_to_render.length);

    for (const [index, t] of toasts_to_render.entries()) {
      if (changedExtended) {
        t.paused ? t.resume() : t.pause();
      }

      t.element.dataset.front = t === front;
      t.element.dataset.expanded = state.expanded;

      t.element.style.setProperty("--index", index);

      t.element.style.setProperty(
        "--toasts-before",
        toasts_to_render.length - index - 1,
      );

      t.element.style.setProperty(
        "--front-toast-height",
        `${front.element.offsetHeight}px`,
      );

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

      t.element.style.setProperty(
        "--offset",
        `${totalHeight - heightBefore - t.initialHeight - this.opts.gap}px`,
      );
    }
  }

  addToast(opts) {
    const toast = new Toast(opts);
    this.renderedToastsById[opts.id] = toast;
    this.list.appendChild(toast.element);

    setTimeout(toast.mount, 0);

    return toast;
  }
}

const state = new State();
const toast = (textOrObject) => {
  if (typeof textOrObject === "string") {
    textOrObject = { title: textOrObject };
  }

  state.create(textOrObject);
};
const sourdough = new Sourdough({
  width: WIDTH,
  gap: GAP,
  offset: OFFSET,
});

export { toast, sourdough };

window.addEventListener("DOMContentLoaded", () => {
  sourdough.boot();
});

if (!window.toast) {
  window.toast = toast;
}

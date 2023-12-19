const MAX_TOASTS = 3;
const TOAST_DURATION = 2000;
const GAP = 16;

let toastsCounter = 1;

class State {
  constructor() {
    this.subscribers = [];
    this.toasts = [];
    this.expanded = false;
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

  addToast = (toast) => {
    this.toasts = [...this.toasts, toast].slice(-(MAX_TOASTS + 1));
    this.publish(this);
  };

  setExpanded = (expanded) => {
    this.expanded = expanded;
    this.publish(this);
  };

  create = (opts) => {
    const id = toastsCounter++;
    const toast = { id, ...opts };

    this.addToast(toast);

    return id;
  };
}

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

class Toast {
  constructor(opts = {}) {
    this.opts = opts;

    const title = h("div", { dataset: { title: "" } }, opts.title);
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
  };

  remove = () => {
    this.element.dataset.removed = "true";

    setTimeout(() => {
      this.element.remove();
    }, 400);
  };
}

class Sourdough {
  constructor(opts = {}) {
    this.opts = opts;
    this.toasts = [];

    this.list = h("ol", {
      dataset: { sourdoughToaster: "" },
      onmouseenter: () => {
        state.setExpanded(true);
      },
      onmouseleave: () => {
        state.setExpanded(false);
        this.list.dataset.expanded = false;
      },
    });
    this.element = h(
      "div",
      {
        dataset: { sourdough: "" },
        style: {
          "--width": `${opts.width}px`,
          "--gap": `${opts.gap}px`,
        },
      },
      [this.list],
    );

    this.toasts = {};
    this.subscription = state.subscribe(this.update.bind(this));
  }

  boot() {
    console.log("booting");
    document.body.appendChild(this.element);
  }

  update(state) {
    state.toasts.forEach((opts) => {
      if (this.toasts[opts.id]) return;
      this.addToast(opts);
    });

    const toasts = Object.values(this.toasts).slice(-MAX_TOASTS);

    const front = toasts[toasts.length - 1];

    for (const [index, t] of toasts.entries()) {
      t.element.dataset.front = t === front;
      t.element.style.setProperty("--index", index);
      t.element.style.setProperty("--toasts-before", toasts.length - index - 1);
      t.element.style.setProperty(
        "--front-toast-height",
        `${front.element.offsetHeight}px`,
      );
      t.element.style.setProperty(
        "--initial-height",
        `${t.element.offsetHeight}px`,
      );
    }
  }

  addToast(opts) {
    const toast = new Toast(opts);
    this.toasts[opts.id] = toast;
    this.list.appendChild(toast.element);

    setTimeout(toast.mount, 0);
    setTimeout(toast.remove, TOAST_DURATION);
  }

  removeToast(id) {
    const toast = this.toasts[id];
    toast.remove();
    delete this.toasts[id];
  }
}

const state = new State();
const toast = (text_or_opts) => {
  if (typeof text_or_opts === "string") {
    text_or_opts = { title: text_or_opts };
  }

  state.create(text_or_opts);
};
const sourdough = new Sourdough({ width: 325, gap: GAP });

if (!window.toast) {
  window.toast = toast;

  window.addEventListener("DOMContentLoaded", () => {
    sourdough.boot();
  });
}

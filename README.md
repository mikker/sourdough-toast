<img src="docs/title.png" alt="Sourdough Toast" width="500" />

A plain JavaScript toast notification library inspired by [Sonner](https://sonner.emilkowal.ski).

[Demo and usage](https://sourdough-toast.vercel.app/example)

```js
import { Sourdough, toast } from "sourdough-toast";

const sourdough = new Sourdough();
window.addEventListener("DOMContentLoaded", () => sourdough.boot());

toast("Saved");
toast("Pin this until I close it", { persist: true });
```

## License

MIT

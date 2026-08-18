/**
 * Paste this on the WordPress page/template that embeds the visualizer
 * iframe. It listens for height messages from the app (see
 * components/IframeHeightReporter.tsx) and resizes the iframe so there's
 * no double scrollbar / awkward fixed height.
 *
 * Usage in WordPress (Custom HTML block):
 *
 *   <iframe
 *     id="oz-railing-visualizer"
 *     src="https://<your-deployed-app>.vercel.app"
 *     style="width:100%;border:0;min-height:900px;"
 *     loading="lazy"
 *     title="OZ Aluminium Railing Visualizer"
 *   ></iframe>
 *   <script src="https://<your-deployed-app>.vercel.app/embed-resize.js"></script>
 */
(function () {
  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "oz-railing-visualizer:height") return;
    var iframe = document.getElementById("oz-railing-visualizer");
    if (!iframe) return;
    var height = Number(event.data.height);
    if (height && height > 0) {
      iframe.style.height = height + "px";
    }
  });
})();

/* BareMetal.Story — authoring component for interactive stories.
   Stories, interactions (nodes), and options (choices), plus the personas
   and templates an interaction can name.

   Default PicoWAL packs: 1 stories, 2 nodes, 3 choices, 4 personas,
   5 templates, 6 user_progress. Record 0 on each pack is the server's
   id watermark and is never a row.
*/
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.Story = (function () {
  "use strict";

  var PACKS = {
    stories: 1,
    nodes: 2,
    choices: 3,
    personas: 4,
    templates: 5,
    user_progress: 6
  };

  var TABLES = [
    ["stories", PACKS.stories],
    ["nodes", PACKS.nodes],
    ["choices", PACKS.choices],
    ["personas", PACKS.personas],
    ["templates", PACKS.templates],
    ["user_progress", PACKS.user_progress]
  ];

  function emptyDoc() {
    return { stories: [], nodes: [], choices: [], personas: [], templates: [], user_progress: [] };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function strip(row) {
    var out = {};
    Object.keys(row).sort().forEach(function (key) {
      if (key === "id" || typeof row[key] === "function" || row[key] === undefined) return;
      out[key] = row[key];
    });
    return out;
  }

  function same(a, b) {
    return JSON.stringify(strip(a || {})) === JSON.stringify(strip(b || {}));
  }

  function parseJson(text, label) {
    if (text == null || text === "") return { ok: true, value: undefined };
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch (err) {
      return { ok: false, error: label + " must be JSON." };
    }
  }

  function validateConditions(value) {
    var parsed = typeof value === "string" ? parseJson(value, "Conditions") : { ok: true, value: value };
    if (!parsed.ok) return parsed;
    if (parsed.value == null || parsed.value === "") return { ok: true, value: undefined };
    var obj = parsed.value;
    if (typeof obj !== "object" || Array.isArray(obj)) {
      return { ok: false, error: "Conditions must be a JSON object." };
    }
    var keys = Object.keys(obj);
    var i, clause, ops;
    for (i = 0; i < keys.length; i++) {
      clause = obj[keys[i]];
      if (!clause || typeof clause !== "object" || Array.isArray(clause)) {
        return { ok: false, error: "Each condition needs $contains or $gte." };
      }
      ops = Object.keys(clause);
      if (ops.length !== 1 || (ops[0] !== "$contains" && ops[0] !== "$gte")) {
        return { ok: false, error: "The only condition operators are $contains and $gte." };
      }
      if (ops[0] === "$gte" && typeof clause.$gte !== "number") {
        return { ok: false, error: "$gte needs a number." };
      }
    }
    return { ok: true, value: keys.length ? obj : undefined };
  }

  function validateEffects(value) {
    var parsed = typeof value === "string" ? parseJson(value, "Effects") : { ok: true, value: value };
    if (!parsed.ok) return parsed;
    if (parsed.value == null || parsed.value === "") return { ok: true, value: undefined };
    var list = parsed.value;
    if (!Array.isArray(list)) return { ok: false, error: "Effects must be a JSON array." };
    var i, effect;
    for (i = 0; i < list.length; i++) {
      effect = list[i];
      if (!effect || typeof effect !== "object") return { ok: false, error: "Each effect needs an op." };
      if (effect.op === "add" || effect.op === "set" || effect.op === "append") {
        if (!effect.var) return { ok: false, error: effect.op + " needs a var." };
        if (!Object.prototype.hasOwnProperty.call(effect, "value")) {
          return { ok: false, error: effect.op + " needs a value." };
        }
      } else if (effect.op === "add_item" || effect.op === "remove_item") {
        if (typeof effect.item !== "string" || !effect.item) {
          return { ok: false, error: effect.op + " needs an item." };
        }
      } else {
        return { ok: false, error: "Unknown effect. Use add, set, add_item, remove_item, or append." };
      }
      if (effect.op === "add" && typeof effect.value !== "number") {
        return { ok: false, error: "add needs a numeric value." };
      }
    }
    if (!list.length) return { ok: true, value: undefined };
    return { ok: true, value: list };
  }

  function validateTriggers(value) {
    var parsed = typeof value === "string" ? parseJson(value, "Triggers") : { ok: true, value: value };
    if (!parsed.ok) return parsed;
    if (parsed.value == null || parsed.value === "") return { ok: true, value: undefined };
    var list = parsed.value;
    if (!Array.isArray(list)) return { ok: false, error: "Triggers must be a JSON array." };
    var i, item;
    for (i = 0; i < list.length; i++) {
      item = list[i];
      if (!item || typeof item.template !== "string" || !item.template || typeof item.to !== "string" || !item.to) {
        return { ok: false, error: "Each trigger needs a template key and a to address." };
      }
    }
    if (!list.length) return { ok: true, value: undefined };
    return { ok: true, value: list };
  }

  function validateBaseFacts(value) {
    var parsed = typeof value === "string" ? parseJson(value, "Base facts") : { ok: true, value: value };
    if (!parsed.ok) return parsed;
    if (parsed.value == null || parsed.value === "") return { ok: true, value: {} };
    if (typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return { ok: false, error: "Base facts must be a JSON object." };
    }
    return { ok: true, value: parsed.value };
  }

  function jsonText(value) {
    if (value == null || value === "") return "";
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  }

  function graphData(nodes, choices, selectedId, positions) {
    var byKey = {};
    var gnodes = [];
    var edges = [];
    var missing = {};
    var i, n, c, node, target, dst, saved;
    positions = positions || {};
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n.key) byKey[n.key] = n;
      node = {
        id: "n" + n.id,
        recordId: n.id,
        label: n.key || "(untitled)",
        detail: n.is_ending ? "Ending" : "Interaction",
        color: n.id === selectedId ? "#fbbf24" : (n.is_ending ? "var(--bs-success)" : "var(--bs-primary)")
      };
      saved = positions[node.id];
      if (saved) { node.x = saved.x; node.y = saved.y; }
      gnodes.push(node);
    }
    for (i = 0; i < choices.length; i++) {
      c = choices[i];
      if (!nodes.some(function (item) { return item.id === c.node_id; })) continue;
      target = byKey[c.target_node_key];
      if (target) {
        dst = "n" + target.id;
      } else {
        dst = "missing:" + (c.target_node_key || "");
        if (!missing[dst]) {
          missing[dst] = true;
          gnodes.push({
            id: dst,
            label: (c.target_node_key || "(none)") + " missing",
            detail: "No interaction uses this key",
            color: "var(--bs-secondary)"
          });
        }
      }
      edges.push({ source: "n" + c.node_id, target: dst, label: c.label || "(option)", choiceId: c.id });
    }
    return { nodes: gnodes, edges: edges };
  }

  function registerSchemas() {
    if (!BareMetal.Metadata || BareMetal.Metadata.get("story")) return;
    BareMetal.Metadata.register({
      name: "Story",
      slug: "story",
      fields: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "tags", label: "Tags", type: "text" },
        { name: "author_id", label: "Author id", type: "text" }
      ]
    });
    BareMetal.Metadata.register({
      name: "Interaction",
      slug: "interaction",
      fields: [
        { name: "key", label: "Key", type: "text", required: true },
        { name: "text", label: "Scene text", type: "textarea" },
        { name: "is_ending", label: "Ending", type: "boolean" },
        { name: "conditions", label: "Conditions", type: "textarea" },
        { name: "triggers", label: "Triggers", type: "textarea" }
      ]
    });
    BareMetal.Metadata.register({
      name: "Option",
      slug: "option",
      fields: [
        { name: "label", label: "Label", type: "text", required: true },
        { name: "target_node_key", label: "Opens interaction", type: "select", options: [] },
        { name: "conditions", label: "Conditions", type: "textarea" },
        { name: "effects", label: "Effects", type: "textarea" }
      ]
    });
    BareMetal.Metadata.register({
      name: "Persona",
      slug: "persona",
      fields: [
        { name: "key", label: "Key", type: "text", required: true },
        { name: "role", label: "Role", type: "select", options: [
          { value: "protagonist", label: "protagonist" },
          { value: "subject", label: "subject" },
          { value: "narrator", label: "narrator" }
        ] },
        { name: "system_prompt", label: "System prompt", type: "textarea" },
        { name: "base_facts", label: "Base facts", type: "textarea" }
      ]
    });
    BareMetal.Metadata.register({
      name: "Template",
      slug: "template",
      fields: [
        { name: "key", label: "Key", type: "text", required: true },
        { name: "channel", label: "Channel", type: "select", options: [
          { value: "email", label: "email" },
          { value: "sms", label: "sms" }
        ] },
        { name: "subject", label: "Subject", type: "text" },
        { name: "body", label: "Body", type: "textarea" }
      ]
    });
    tune("story", "description", { rows: 4, placeholder: "Short description for authors." });
    tune("story", "tags", { placeholder: "Comma-separated tags" });
    tune("interaction", "key", { placeholder: "Stable key inside this story" });
    tune("interaction", "text", { rows: 8, placeholder: "Base scene, Markdown. Leave empty until you write it." });
    tune("interaction", "conditions", { rows: 4, placeholder: '{"inventory":{"$contains":"item"}}' });
    tune("interaction", "triggers", { rows: 4, placeholder: '[{"template":"key","to":"address"}]' });
    tune("option", "conditions", { rows: 4, placeholder: '{"reputation":{"$gte":1}}' });
    tune("option", "effects", { rows: 5, placeholder: '[{"op":"set","var":"flag","value":true}]' });
    tune("persona", "system_prompt", { rows: 5, placeholder: "System instruction for the scene rewriter." });
    tune("persona", "base_facts", { rows: 4, placeholder: "{}" });
    tune("template", "body", { rows: 6, placeholder: "Body. It may read the current user state." });
  }

  function tune(slug, name, extra) {
    var field = BareMetal.Metadata.get(slug).fields[name];
    Object.keys(extra).forEach(function (key) { field[key] = extra[key]; });
  }

  function client() {
    function request(method, path, body) {
      var opts = { method: method, headers: {} };
      if (body !== undefined) {
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(body);
      }
      return fetch(path, opts).then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error(text || response.statusText);
          });
        }
        if (response.status === 204) return null;
        var type = response.headers.get("content-type") || "";
        if (type.indexOf("application/json") < 0) return null;
        return response.json();
      });
    }
    return {
      list: function (pack) {
        return request("GET", "/list/" + pack).then(function (body) {
          return ((body && body.records) || []).map(function (rec) {
            var data = rec.data;
            if (typeof data === "string") data = JSON.parse(data);
            if (!data || typeof data !== "object" || Array.isArray(data)) return null;
            data.id = rec.record;
            return data;
          }).filter(Boolean);
        });
      },
      create: function (pack, row) {
        return request("POST", "/" + pack, strip(row)).then(function (body) {
          return body.record;
        });
      },
      put: function (pack, id, row) {
        return request("PUT", "/" + pack + "/" + id, strip(row));
      },
      remove: function (pack, id) {
        return request("DELETE", "/" + pack + "/" + id);
      },
      ping: function () {
        return request("GET", "/");
      }
    };
  }

  function mount(target) {
    registerSchemas();
    if (!BareMetal.Metadata || !BareMetal.Bind || !BareMetal.Graph || !BareMetal.UndoRedo) {
      throw new Error("BareMetal Story needs Metadata, Bind, Graph, and UndoRedo.");
    }
    var root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) throw new Error("Story editor target not found.");
    if (location.protocol === "file:" || (location.hostname !== "127.0.0.1" && location.hostname !== "localhost" && location.hostname !== "::1")) {
      root.textContent = "Open this editor from the story server at http://127.0.0.1:8090/.";
      return;
    }
    if (BareMetal.Notify && BareMetal.Notify.configure) BareMetal.Notify.configure({ theme: "dark" });

    var api = client();
    var doc = emptyDoc();
    var busy = false;
    var ui = { view: "map", storyId: null, nodeId: null, choiceId: null, personaId: null, templateId: null, draft: null, pos: {}, graph: null, arm: null };
    var history = BareMetal.UndoRedo.create();
    var statusEl, listEl, stageEl, inspectorEl, sideTitle, addBtn, undoBtn, redoBtn;

    root.innerHTML = "";
    root.appendChild(shell());
    paintHistory();
    render();
    load();

    function shell() {
      var wrap = el("div", "se-shell");
      var top = el("header", "se-top");
      var brand = el("div");
      var mark = el("div", "se-mark");
      mark.textContent = "Storybook";
      var sub = el("div", "se-sub");
      sub.textContent = "Author stories, options, and interactions.";
      brand.appendChild(mark);
      brand.appendChild(sub);
      statusEl = el("div", "se-status");
      statusEl.textContent = "Connecting…";
      var tools = el("div", "se-tools");
      var read = el("a", "bt bt-s");
      read.href = "/";
      read.textContent = "Read";
      tools.appendChild(read);
      undoBtn = button("Undo", doUndo);
      redoBtn = button("Redo", doRedo);
      tools.appendChild(undoBtn);
      tools.appendChild(redoBtn);
      tools.appendChild(button("Reload", function () { history.clear(); load(); }));
      top.appendChild(brand);
      top.appendChild(statusEl);
      top.appendChild(tools);

      var stories = el("aside", "se-stories");
      var storyBar = el("div", "se-bar");
      var storyLabel = el("strong");
      storyLabel.textContent = "Stories";
      storyBar.appendChild(storyLabel);
      storyBar.appendChild(el("span", "se-grow"));
      storyBar.appendChild(button("New", function () { ui.draft = { kind: "story" }; ui.view = "map"; render(); }, "bt bt-p bt-s"));
      listEl = el("div", "se-list");
      stories.appendChild(storyBar);
      stories.appendChild(listEl);

      var main = el("main", "se-main");
      var bar = el("div", "se-bar");
      bar.appendChild(modeButton("map", "Map"));
      bar.appendChild(modeButton("personas", "Personas"));
      bar.appendChild(modeButton("templates", "Templates"));
      bar.appendChild(el("span", "se-grow"));
      addBtn = button("Add interaction", onAdd, "bt bt-p bt-s");
      bar.appendChild(addBtn);
      stageEl = el("div", "se-stage");
      main.appendChild(bar);
      main.appendChild(stageEl);

      var side = el("aside", "se-side");
      var sideBar = el("div", "se-bar");
      sideTitle = el("strong");
      sideTitle.textContent = "Inspector";
      sideBar.appendChild(sideTitle);
      inspectorEl = el("div", "se-inspector");
      side.appendChild(sideBar);
      side.appendChild(inspectorEl);

      wrap.appendChild(top);
      wrap.appendChild(stories);
      wrap.appendChild(main);
      wrap.appendChild(side);
      return wrap;
    }

    function el(tag, cls) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      return node;
    }

    function button(text, onClick, cls) {
      var node = el("button", cls || "bt bt-s");
      node.type = "button";
      node.textContent = text;
      node.addEventListener("click", onClick);
      return node;
    }

    function modeButton(name, label) {
      var node = button(label, function () {
        ui.view = name;
        ui.draft = null;
        ui.choiceId = null;
        render();
      }, "bt bt-s se-mode");
      node.setAttribute("data-mode", name);
      return node;
    }

    function status(text) { statusEl.textContent = text; }

    function notify(message, bad) {
      if (!BareMetal.Notify) return;
      if (bad === false) BareMetal.Notify.success(message);
      else BareMetal.Notify.error(String(message && message.message || message));
    }

    function paintHistory() {
      undoBtn.disabled = busy || !history.canUndo();
      redoBtn.disabled = busy || !history.canRedo();
    }

    function load() {
      status("Loading…");
      return api.ping().then(function () {
        return Promise.all(TABLES.map(function (table) {
          return api.list(table[1]).then(function (rows) { doc[table[0]] = rows; });
        }));
      }).then(function () {
        status("Connected");
        render();
      }, function (err) {
        status("Not connected");
        notify(err);
      });
    }

    function indexById(rows) {
      var out = {};
      rows.forEach(function (row) { if (row.id != null) out[row.id] = row; });
      return out;
    }

    function runSeq(steps) {
      var chain = Promise.resolve();
      steps.forEach(function (step) { chain = chain.then(step); });
      return chain;
    }

    function persistDiff(from, to) {
      var steps = [];
      var t;
      for (t = TABLES.length - 1; t >= 0; t--) {
        (function (name, pack, before) {
          var prior = indexById(before);
          Object.keys(prior).forEach(function (id) {
            if (!to[name].some(function (row) { return String(row.id) === String(id); })) {
              steps.push(function () { return api.remove(pack, Number(id)); });
            }
          });
        })(TABLES[t][0], TABLES[t][1], from[TABLES[t][0]]);
      }
      TABLES.forEach(function (table) {
        var name = table[0], pack = table[1], prior = indexById(from[name]);
        to[name].forEach(function (row) {
          if (row.id == null) {
            steps.push(function () {
              return api.create(pack, row).then(function (id) { row.id = id; });
            });
          } else if (!prior[row.id] || !same(prior[row.id], row)) {
            steps.push(function () { return api.put(pack, row.id, row); });
          }
        });
      });
      return runSeq(steps);
    }

    function mutate(name, fn) {
      if (busy) return Promise.reject(new Error("Still saving."));
      busy = true;
      paintHistory();
      var before = clone(doc);
      fn(doc);
      status("Saving…");
      return persistDiff(before, doc).then(function () {
        var after = clone(doc);
        history.push({
          name: name,
          execute: function () { swap(before, after); },
          undo: function () { swap(after, before); }
        });
        busy = false;
        paintHistory();
        status("Saved");
        render();
      }, function (err) {
        doc = before;
        ui.arm = null;
        busy = false;
        paintHistory();
        status("Save failed");
        notify(err);
        render();
      });
    }

    function swap(from, to) {
      if (busy) return;
      busy = true;
      paintHistory();
      doc = clone(to);
      render();
      persistDiff(from, doc).then(function () {
        busy = false;
        paintHistory();
        status("Saved");
      }, function (err) {
        notify(err);
        history.clear();
        busy = false;
        load();
      });
    }

    function doUndo() { if (!busy && history.canUndo()) history.undo(); }
    function doRedo() { if (!busy && history.canRedo()) history.redo(); }

    function story() {
      var i;
      for (i = 0; i < doc.stories.length; i++) if (doc.stories[i].id === ui.storyId) return doc.stories[i];
      return null;
    }

    function nodesOf(storyId) {
      return doc.nodes.filter(function (row) { return Number(row.story_id) === Number(storyId); });
    }

    function choicesOf(nodeId) {
      return doc.choices.filter(function (row) { return Number(row.node_id) === Number(nodeId); });
    }

    function onAdd() {
      if (ui.view === "templates") { ui.draft = { kind: "template" }; ui.templateId = null; render(); return; }
      if (!ui.storyId) return;
      if (ui.view === "personas") { ui.draft = { kind: "persona" }; ui.personaId = null; render(); return; }
      ui.draft = { kind: "node" };
      ui.nodeId = null;
      ui.choiceId = null;
      render();
    }

    function render() {
      if (ui.arm && ui.arm.row && ui.arm.row.id != null) {
        if (ui.arm.kind === "story") ui.storyId = ui.arm.row.id;
        if (ui.arm.kind === "node") { ui.storyId = Number(ui.arm.row.story_id); ui.nodeId = ui.arm.row.id; }
        if (ui.arm.kind === "choice") ui.choiceId = ui.arm.row.id;
        if (ui.arm.kind === "persona") ui.personaId = ui.arm.row.id;
        if (ui.arm.kind === "template") ui.templateId = ui.arm.row.id;
        ui.draft = null;
        ui.arm = null;
      }
      renderStories();
      renderStage();
      renderInspector();
      addBtn.textContent = ui.view === "personas" ? "Add persona" : ui.view === "templates" ? "Add template" : "Add interaction";
      addBtn.disabled = ui.view !== "templates" && !ui.storyId;
      var modes = root.querySelectorAll("[data-mode]");
      for (var i = 0; i < modes.length; i++) {
        modes[i].classList.toggle("act", modes[i].getAttribute("data-mode") === ui.view);
      }
    }

    function renderStories() {
      listEl.innerHTML = "";
      if (!doc.stories.length) {
        var empty = el("p", "se-help");
        empty.textContent = "No stories yet.";
        empty.style.padding = "0.8rem";
        listEl.appendChild(empty);
      }
      doc.stories.forEach(function (row) {
        var item = el("button", "se-item" + (row.id === ui.storyId ? " act" : ""));
        item.type = "button";
        var title = el("div");
        title.textContent = row.title || row.slug || ("Story " + row.id);
        var meta = el("small");
        meta.textContent = row.slug || "";
        item.appendChild(title);
        item.appendChild(meta);
        item.addEventListener("click", function () {
          ui.storyId = row.id;
          ui.nodeId = null;
          ui.choiceId = null;
          ui.personaId = null;
          ui.draft = null;
          if (ui.view === "templates") ui.view = "map";
          render();
        });
        listEl.appendChild(item);
      });
    }

    function renderStage() {
      harvest();
      stageEl.innerHTML = "";
      if (ui.view === "map") return renderMap();
      if (ui.view === "personas") return renderCards(personasFor(ui.storyId), "persona", "No personas for this story.");
      renderCards(doc.templates, "template", "No message templates yet.");
    }

    function harvest() {
      if (!ui.graph) return;
      var sid = ui.graphStory;
      ui.graph.nodes.forEach(function (node) {
        if (node.recordId != null) ui.pos[sid + ":" + node.id] = { x: node.x, y: node.y };
      });
      ui.graph.simulation.stop();
      ui.graph = null;
    }

    function renderMap() {
      var current = story();
      if (!current) {
        stageEl.appendChild(emptyNote("Select a story, or create one."));
        return;
      }
      var nodes = nodesOf(current.id);
      var choices = [];
      nodes.forEach(function (node) { choices = choices.concat(choicesOf(node.id)); });
      if (!nodes.length) {
        stageEl.appendChild(emptyNote("No interactions yet. Add one to start the map. An option is a choice on an interaction."));
        return;
      }
      var positions = {};
      nodes.forEach(function (node) {
        var saved = ui.pos[current.id + ":n" + node.id];
        if (saved) positions["n" + node.id] = saved;
      });
      var data = graphData(nodes, choices, ui.nodeId, positions);
      var host = el("div", "se-graph");
      stageEl.appendChild(host);
      ui.graphStory = current.id;
      ui.graph = BareMetal.Graph.create(host, data, {
        directed: true,
        showLabels: true,
        draggable: true,
        zoomable: true,
        width: Math.max(host.clientWidth || stageEl.clientWidth || 0, 720),
        height: Math.max(stageEl.clientHeight || 0, 640),
        repulsion: 2800,
        springLen: 170,
        centerForce: 0.003
      });
      var dots = ui.graph.svg.querySelectorAll(".bm-node");
      for (var i = 0; i < dots.length && i < ui.graph.nodes.length; i++) {
        (function (node, dot) {
          dot.addEventListener("click", function (event) {
            event.stopPropagation();
            if (node.recordId == null) return;
            ui.nodeId = node.recordId;
            ui.choiceId = null;
            ui.draft = null;
            render();
          });
        })(ui.graph.nodes[i], dots[i]);
      }
    }

    function renderCards(rows, kind, emptyText) {
      if (!rows.length) {
        stageEl.appendChild(emptyNote(emptyText));
        return;
      }
      rows.forEach(function (row) {
        var item = el("button", "se-item" + (selected(kind, row) ? " act" : ""));
        item.type = "button";
        var title = el("div");
        title.textContent = row.key || row.label || ("#" + row.id);
        var meta = el("small");
        meta.textContent = kind === "persona" ? (row.role || "") : (row.channel || "");
        item.appendChild(title);
        item.appendChild(meta);
        item.addEventListener("click", function () {
          ui.draft = null;
          if (kind === "persona") ui.personaId = row.id;
          else ui.templateId = row.id;
          render();
        });
        stageEl.appendChild(item);
      });
    }

    function selected(kind, row) {
      return kind === "persona" ? row.id === ui.personaId : row.id === ui.templateId;
    }

    function personasFor(storyId) {
      return doc.personas.filter(function (row) {
        return row.story_id == null || row.story_id === "" || Number(row.story_id) === Number(storyId);
      });
    }

    function emptyNote(text) {
      var note = el("div", "se-empty");
      note.textContent = text;
      return note;
    }

    function renderInspector() {
      inspectorEl.innerHTML = "";
      if (ui.draft) return renderDraft();
      if (ui.view === "personas") return renderPersona();
      if (ui.view === "templates") return renderTemplate();
      if (ui.choiceId) return renderChoice();
      if (ui.nodeId) return renderNode();
      if (ui.storyId) return renderStory(story(), false);
      sideTitle.textContent = "Inspector";
      var help = el("p", "se-help");
      help.textContent = "Create a story, then add interactions. Options are the choices on an interaction. Conditions, effects, and triggers stay in the story model. Tone and canon are unset.";
      inspectorEl.appendChild(help);
    }

    function renderDraft() {
      if (ui.draft.kind === "story") return renderStory({ title: "", slug: "", description: "", tags: [], author_id: "" }, true);
      if (ui.draft.kind === "node") {
        formFor("interaction", "New interaction", {
          key: "", text: "", is_ending: false, conditions: "", triggers: ""
        }, saveNode, null);
        attachPreview();
        return;
      }
      if (ui.draft.kind === "choice") {
        return formFor("option", "New option", {
          label: "", target_node_key: "", conditions: "", effects: ""
        }, saveChoice, null, choicesOf);
      }
      if (ui.draft.kind === "persona") {
        formFor("persona", "New persona", {
          key: "", role: "narrator", system_prompt: "", base_facts: ""
        }, savePersona, null);
        sharedBox(false);
        return;
      }
      return formFor("template", "New template", {
        key: "", channel: "email", subject: "", body: ""
      }, saveTemplate, null);
    }

    function renderStory(row, isNew) {
      if (!row) return;
      formFor("story", isNew ? "New story" : "Story", {
        title: row.title || "",
        slug: row.slug || "",
        description: row.description || "",
        tags: Array.isArray(row.tags) ? row.tags.join(", ") : (row.tags || ""),
        author_id: row.author_id || ""
      }, function (state) { saveStory(state, isNew ? null : row); }, isNew ? null : function () { removeStory(row); });
    }

    function renderNode() {
      var row = find(doc.nodes, ui.nodeId);
      if (!row) { ui.nodeId = null; return; }
      formFor("interaction", "Interaction", {
        key: row.key || "",
        text: row.text || "",
        is_ending: !!row.is_ending,
        conditions: jsonText(row.conditions),
        triggers: jsonText(row.triggers)
      }, function (state) { saveNode(state, row); }, function () { removeNode(row); });
      inspectorEl.appendChild(optionList(row));
      attachPreview();
    }

    function renderChoice() {
      var row = find(doc.choices, ui.choiceId);
      if (!row) { ui.choiceId = null; return; }
      var back = button("Back to interaction", function () { ui.choiceId = null; render(); }, "bt bt-s");
      inspectorEl.appendChild(back);
      formFor("option", "Option", {
        label: row.label || "",
        target_node_key: row.target_node_key || "",
        conditions: jsonText(row.conditions),
        effects: jsonText(row.effects)
      }, function (state) { saveChoice(state, row); }, function () { removeChoice(row); });
    }

    function renderPersona() {
      if (!ui.storyId && !ui.personaId) {
        sideTitle.textContent = "Personas";
        var help = el("p", "se-help");
        help.textContent = "Select a story to edit its personas. A shared persona is kept when the story is deleted.";
        inspectorEl.appendChild(help);
        return;
      }
      var row = find(doc.personas, ui.personaId);
      if (!row) {
        sideTitle.textContent = "Personas";
        var idle = el("p", "se-help");
        idle.textContent = "Select a persona, or add one. Role is protagonist, subject, or narrator.";
        inspectorEl.appendChild(idle);
        return;
      }
      formFor("persona", "Persona", {
        key: row.key || "",
        role: row.role || "narrator",
        system_prompt: row.system_prompt || "",
        base_facts: jsonText(row.base_facts)
      }, function (state) { savePersona(state, row); }, function () { removePersona(row); });
      sharedBox(row.story_id == null || row.story_id === "");
    }

    function renderTemplate() {
      var row = find(doc.templates, ui.templateId);
      if (!row) {
        sideTitle.textContent = "Templates";
        var help = el("p", "se-help");
        help.textContent = "Templates are shared by key. Channel is email or sms. A trigger names the key. The mail and SMS ports are not set, so nothing is sent from this editor.";
        inspectorEl.appendChild(help);
        return;
      }
      formFor("template", "Template", {
        key: row.key || "",
        channel: row.channel || "email",
        subject: row.subject || "",
        body: row.body || ""
      }, function (state) { saveTemplate(state, row); }, function () { removeTemplate(row); });
    }

    function formFor(slug, title, values, onSave, onDelete) {
      sideTitle.textContent = title;
      if (slug === "option") fillTargets();
      var meta = BareMetal.Metadata.get(slug);
      var pair = BareMetal.Bind.reactive(Object.assign({}, meta.initialData, values));
      pair.state.save = function () { onSave(pair.state); };
      var host = el("div");
      BareMetal.Metadata.renderForm(slug, host, pair.state, pair.watch);
      inspectorEl.appendChild(host);
      inspectorEl.appendChild(helpFor(slug));
      if (onDelete) {
        var row = el("div", "se-row");
        row.appendChild(button("Delete", onDelete, "bt bt-s bt-oer"));
        inspectorEl.appendChild(row);
      }
    }

    function helpFor(slug) {
      var p = el("p", "se-help");
      if (slug === "interaction" || slug === "option") {
        p.textContent = "Conditions use $contains or $gte. Effects use add, set, add_item, remove_item, or append. Triggers are {\"template\",\"to\"}. Leaving a JSON field empty stores no gate.";
      } else if (slug === "template") {
        p.textContent = "The reading site renders a trigger as a letter or a note. Body may use {{state.inventory}}, {{state.facts.notice}}, {{persona.base_facts.weather}}, {{history_summary}}, and {{to}}. Email uses the subject. SMS does not. Ports for those local APIs are unset, so nothing is sent.";
      } else if (slug === "persona") {
        p.textContent = "Narrator base_facts.sign is shown on the reading site. Protagonist base_facts merge into state.facts. Scene Markdown may use {{persona.base_facts...}} and {{state.facts...}}. The system prompt is for the rewriter and is not shown to the player.";
      } else {
        p.textContent = "Slug and title identify the story. Tags are a comma-separated list.";
      }
      return p;
    }

    function fillTargets() {
      var options = nodesOf(ui.storyId).filter(function (node) { return node.key; }).map(function (node) {
        return { value: node.key, label: node.key };
      });
      BareMetal.Metadata.get("option").fields.target_node_key.options = options;
    }

    function optionList(node) {
      var wrap = el("div");
      var kicker = el("div", "se-kicker");
      kicker.textContent = "Options";
      wrap.appendChild(kicker);
      choicesOf(node.id).forEach(function (choice) {
        var item = el("button", "se-option");
        item.type = "button";
        item.textContent = choice.label || "(untitled option)";
        item.addEventListener("click", function () {
          ui.choiceId = choice.id;
          ui.draft = null;
          render();
        });
        wrap.appendChild(item);
      });
      wrap.appendChild(button("Add option", function () {
        ui.draft = { kind: "choice", nodeId: node.id };
        ui.choiceId = null;
        render();
      }, "bt bt-s2 bt-s"));
      return wrap;
    }

    function attachPreview() {
      var field = inspectorEl.querySelector('[m-value="text"]');
      if (!field || !BareMetal.Markdown) return;
      var preview = el("div", "se-preview");
      var paint = function () { BareMetal.Markdown.renderSafe(preview, field.value || ""); };
      field.addEventListener("input", paint);
      paint();
      inspectorEl.appendChild(preview);
    }

    function sharedBox(checked) {
      var label = el("label", "se-help");
      var box = document.createElement("input");
      box.type = "checkbox";
      box.id = "se-shared";
      box.checked = !!checked;
      label.appendChild(box);
      label.appendChild(document.createTextNode(" Shared with every story"));
      inspectorEl.appendChild(label);
    }

    function showError(message) {
      var old = inspectorEl.querySelector(".se-error");
      if (old) old.remove();
      var p = el("p", "se-error");
      p.textContent = message;
      inspectorEl.appendChild(p);
      notify(message);
    }

    function tagsOf(text) {
      return String(text || "").split(",").map(function (part) { return part.trim(); }).filter(Boolean);
    }

    function saveStory(state, existing) {
      var row = {
        slug: String(state.slug || "").trim(),
        title: String(state.title || "").trim(),
        description: state.description || "",
        tags: tagsOf(state.tags),
        author_id: state.author_id || ""
      };
      if (!row.title) return showError("A story needs a title.");
      if (!row.slug) return showError("A story needs a slug.");
      if (doc.stories.some(function (item) { return item.slug === row.slug && item.id !== (existing && existing.id); })) {
        return showError("That slug is already used.");
      }
      if (!existing) {
        ui.arm = { kind: "story", row: row };
        return mutate("Add story", function () { doc.stories.push(row); });
      }
      row.id = existing.id;
      return mutate("Edit story", function () { replace(doc.stories, row); });
    }

    function saveNode(state, existing) {
      var conditions = validateConditions(state.conditions);
      var triggers = validateTriggers(state.triggers);
      if (!conditions.ok) return showError(conditions.error);
      if (!triggers.ok) return showError(triggers.error);
      var row = {
        story_id: Number(ui.storyId),
        key: String(state.key || "").trim(),
        text: state.text || "",
        is_ending: !!state.is_ending
      };
      if (conditions.value !== undefined) row.conditions = conditions.value;
      if (triggers.value !== undefined) row.triggers = triggers.value;
      if (!row.key) return showError("An interaction needs a key.");
      if (nodesOf(ui.storyId).some(function (item) { return item.key === row.key && item.id !== (existing && existing.id); })) {
        return showError("That key is already used in this story.");
      }
      if (!existing) {
        ui.arm = { kind: "node", row: row };
        ui.draft = null;
        return mutate("Add interaction", function () { doc.nodes.push(row); });
      }
      row.id = existing.id;
      return mutate("Edit interaction", function () { replace(doc.nodes, row); });
    }

    function saveChoice(state, existing) {
      var nodeId = existing ? existing.node_id : ui.draft && ui.draft.nodeId;
      var conditions = validateConditions(state.conditions);
      var effects = validateEffects(state.effects);
      if (!conditions.ok) return showError(conditions.error);
      if (!effects.ok) return showError(effects.error);
      var row = {
        node_id: Number(nodeId),
        label: String(state.label || "").trim(),
        target_node_key: String(state.target_node_key || "").trim()
      };
      if (conditions.value !== undefined) row.conditions = conditions.value;
      if (effects.value !== undefined) row.effects = effects.value;
      if (!row.label) return showError("An option needs a label.");
      if (!row.target_node_key) return showError("An option needs an interaction to open.");
      if (!nodesOf(ui.storyId).some(function (item) { return item.key === row.target_node_key; })) {
        return showError("No interaction in this story uses that key.");
      }
      if (!existing) {
        ui.arm = { kind: "choice", row: row };
        ui.nodeId = Number(nodeId);
        ui.draft = null;
        return mutate("Add option", function () { doc.choices.push(row); });
      }
      row.id = existing.id;
      return mutate("Edit option", function () { replace(doc.choices, row); });
    }

    function savePersona(state, existing) {
      var facts = validateBaseFacts(state.base_facts);
      if (!facts.ok) return showError(facts.error);
      var shared = inspectorEl.querySelector("#se-shared");
      var row = {
        key: String(state.key || "").trim(),
        role: state.role || "narrator",
        system_prompt: state.system_prompt || "",
        base_facts: facts.value
      };
      if (row.role !== "protagonist" && row.role !== "subject" && row.role !== "narrator") {
        return showError("Role must be protagonist, subject, or narrator.");
      }
      if (!row.key) return showError("A persona needs a key.");
      if (!(shared && shared.checked)) row.story_id = Number(ui.storyId);
      if (!existing) {
        ui.arm = { kind: "persona", row: row };
        ui.draft = null;
        return mutate("Add persona", function () { doc.personas.push(row); });
      }
      row.id = existing.id;
      return mutate("Edit persona", function () { replace(doc.personas, row); });
    }

    function saveTemplate(state, existing) {
      var row = {
        key: String(state.key || "").trim(),
        channel: state.channel || "email",
        subject: state.subject || "",
        body: state.body || ""
      };
      if (row.channel !== "email" && row.channel !== "sms") return showError("Channel must be email or sms.");
      if (!row.key) return showError("A template needs a key.");
      if (doc.templates.some(function (item) { return item.key === row.key && item.id !== (existing && existing.id); })) {
        return showError("That template key is already used.");
      }
      if (!existing) {
        ui.arm = { kind: "template", row: row };
        ui.draft = null;
        return mutate("Add template", function () { doc.templates.push(row); });
      }
      row.id = existing.id;
      return mutate("Edit template", function () { replace(doc.templates, row); });
    }

    function replace(list, row) {
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i].id === row.id) { list[i] = row; return; }
      }
    }

    function find(list, id) {
      var i;
      for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    }

    function removeStory(row) {
      if (!window.confirm("Delete this story, its interactions, its options, and the personas that belong to it? Player progress for this story is removed too. Shared personas and message templates stay.")) return;
      mutate("Delete story", function () {
        var ids = {};
        doc.nodes.forEach(function (node) { if (Number(node.story_id) === Number(row.id)) ids[node.id] = true; });
        doc.stories = doc.stories.filter(function (item) { return item.id !== row.id; });
        doc.nodes = doc.nodes.filter(function (item) { return Number(item.story_id) !== Number(row.id); });
        doc.choices = doc.choices.filter(function (item) { return !ids[item.node_id]; });
        doc.personas = doc.personas.filter(function (item) { return Number(item.story_id) !== Number(row.id); });
        doc.user_progress = doc.user_progress.filter(function (item) { return Number(item.story_id) !== Number(row.id); });
        if (ui.storyId === row.id) { ui.storyId = null; ui.nodeId = null; ui.choiceId = null; }
      });
    }

    function removeNode(row) {
      if (!window.confirm("Delete this interaction and its options?")) return;
      mutate("Delete interaction", function () {
        doc.nodes = doc.nodes.filter(function (item) { return item.id !== row.id; });
        doc.choices = doc.choices.filter(function (item) { return Number(item.node_id) !== Number(row.id); });
        ui.nodeId = null;
        ui.choiceId = null;
      });
    }

    function removeChoice(row) {
      if (!window.confirm("Delete this option?")) return;
      mutate("Delete option", function () {
        doc.choices = doc.choices.filter(function (item) { return item.id !== row.id; });
        ui.choiceId = null;
      });
    }

    function removePersona(row) {
      if (!window.confirm("Delete this persona?")) return;
      mutate("Delete persona", function () {
        doc.personas = doc.personas.filter(function (item) { return item.id !== row.id; });
        ui.personaId = null;
      });
    }

    function removeTemplate(row) {
      if (!window.confirm("Delete this template?")) return;
      mutate("Delete template", function () {
        doc.templates = doc.templates.filter(function (item) { return item.id !== row.id; });
        ui.templateId = null;
      });
    }
  }

  return {
    PACKS: PACKS,
    validateConditions: validateConditions,
    validateEffects: validateEffects,
    validateTriggers: validateTriggers,
    validateBaseFacts: validateBaseFacts,
    graphData: graphData,
    mount: mount
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.Story;

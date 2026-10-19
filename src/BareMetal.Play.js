/* BareMetal.Play — interactive story reader.
   Walks PicoWAL story packs: conditions gate options, effects change
   player state, and the place is stored in user_progress.

   Default packs: 1 stories, 2 nodes, 3 choices, 4 personas,
   5 templates, 6 user_progress.
   A cached generated_texts entry is shown when present. Otherwise the
   narrator persona fills {{placeholders}} in the authored Markdown.
   Protagonist base_facts merge into state.facts. Node triggers render
   as letters or notes on the page. This module does not call an LLM,
   mail, or SMS host.
*/
var BareMetal = (typeof BareMetal !== "undefined") ? BareMetal : {};
BareMetal.Play = (function () {
  "use strict";

  var PACKS = { stories: 1, nodes: 2, choices: 3, personas: 4, templates: 5, user_progress: 6 };
  var PLAYER_KEY = "storybook.player";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function freshState() {
    return { inventory: [], facts: {}, log: [] };
  }

  function lookup(state, path) {
    var parts = String(path).split(".");
    var cur = state;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function matchConditions(state, conditions) {
    if (conditions == null || conditions === "") return true;
    if (typeof conditions !== "object" || Array.isArray(conditions)) return false;
    var keys = Object.keys(conditions);
    var i, clause, value;
    for (i = 0; i < keys.length; i++) {
      clause = conditions[keys[i]];
      value = lookup(state || {}, keys[i]);
      if (!clause || typeof clause !== "object" || Array.isArray(clause)) return false;
      if (Object.prototype.hasOwnProperty.call(clause, "$contains")) {
        if (!Array.isArray(value) || value.indexOf(clause.$contains) < 0) return false;
      } else if (Object.prototype.hasOwnProperty.call(clause, "$gte")) {
        if (typeof value !== "number" || typeof clause.$gte !== "number" || value < clause.$gte) return false;
      } else {
        return false;
      }
    }
    return true;
  }

  function applyEffects(state, effects) {
    var next = clone(state || freshState());
    if (!Array.isArray(next.inventory)) next.inventory = [];
    if (!next.facts || typeof next.facts !== "object" || Array.isArray(next.facts)) next.facts = {};
    if (!Array.isArray(next.log)) next.log = [];
    if (!Array.isArray(effects)) return next;
    effects.forEach(function (effect) {
      var cur, at;
      if (!effect || typeof effect.op !== "string") return;
      if (effect.op === "add") {
        cur = next[effect.var];
        if (typeof effect.value !== "number") return;
        next[effect.var] = (typeof cur === "number" ? cur : 0) + effect.value;
      } else if (effect.op === "set") {
        if (!effect.var) return;
        next[effect.var] = effect.value;
      } else if (effect.op === "add_item") {
        next.inventory.push(effect.item);
      } else if (effect.op === "remove_item") {
        at = next.inventory.indexOf(effect.item);
        if (at >= 0) next.inventory.splice(at, 1);
      } else if (effect.op === "append") {
        if (!effect.var) return;
        if (!Object.prototype.hasOwnProperty.call(next, effect.var)) next[effect.var] = [];
        if (Array.isArray(next[effect.var])) next[effect.var].push(effect.value);
      }
    });
    return next;
  }

  function entryNode(nodes, choices, state) {
    var targeted = {};
    var starts, open;
    (choices || []).forEach(function (choice) {
      if (choice.target_node_key) targeted[choice.target_node_key] = true;
    });
    starts = (nodes || []).filter(function (node) { return node.key && !targeted[node.key]; });
    if (!starts.length) starts = (nodes || []).filter(function (node) { return node.key; });
    open = starts.filter(function (node) { return matchConditions(state, node.conditions); });
    open.sort(function (a, b) { return Number(a.id) - Number(b.id); });
    return open[0] || null;
  }

  function offeredChoices(node, nodes, choices, state) {
    var byKey = {};
    if (!node) return [];
    (nodes || []).forEach(function (item) { if (item.key) byKey[item.key] = item; });
    return (choices || []).filter(function (choice) {
      var target = byKey[choice.target_node_key];
      return Number(choice.node_id) === Number(node.id) &&
        matchConditions(state, choice.conditions) &&
        !!target &&
        matchConditions(state, target.conditions);
    }).sort(function (a, b) { return Number(a.id) - Number(b.id); });
  }

  function formatValue(value) {
    if (value == null || value === "") return "";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "nothing";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function fillText(text, ctx) {
    return String(text == null ? "" : text).replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, raw) {
      return formatValue(lookup(ctx, raw.trim()));
    });
  }

  function historySummary(history) {
    if (!history || !history.length) return "The story has only just opened.";
    return history.map(function (item) { return item.node_key; }).join(", then ");
  }

  function personasOf(personas, storyId) {
    return (personas || []).filter(function (row) {
      return row.story_id == null || row.story_id === "" || Number(row.story_id) === Number(storyId);
    });
  }

  function personaByRole(personas, storyId, role) {
    var rows = personasOf(personas, storyId).filter(function (row) { return row.role === role; });
    rows.sort(function (a, b) { return Number(a.id) - Number(b.id); });
    return rows[0] || null;
  }

  function narratorOf(personas, storyId) {
    return personaByRole(personas, storyId, "narrator") || personasOf(personas, storyId)[0] || null;
  }

  function withPersonaFacts(state, personas, storyId) {
    var next = clone(state || freshState());
    if (!next.facts || typeof next.facts !== "object" || Array.isArray(next.facts)) next.facts = {};
    var pro = personaByRole(personas, storyId, "protagonist");
    var facts = pro && pro.base_facts;
    if (facts && typeof facts === "object" && !Array.isArray(facts)) {
      Object.keys(facts).forEach(function (key) {
        if (next.facts[key] == null) next.facts[key] = facts[key];
      });
    }
    return next;
  }

  function makeCtx(persona, progress, node, trigger) {
    var facts = persona && persona.base_facts;
    return {
      state: (progress && progress.state) || freshState(),
      persona: {
        key: persona && persona.key,
        role: persona && persona.role,
        base_facts: (facts && typeof facts === "object" && !Array.isArray(facts)) ? facts : {}
      },
      node: { key: node && node.key },
      history_summary: historySummary(progress && progress.history),
      mail: { held: { messages: [] } },
      sms: { held: { messages: [] } },
      trigger: trigger || {},
      to: (trigger && trigger.to) || ""
    };
  }

  function sceneText(node, progress, persona) {
    var cache = progress && progress.generated_texts;
    if (node && cache && typeof cache[node.key] === "string" && cache[node.key]) return cache[node.key];
    return fillText((node && node.text) || "", makeCtx(persona, progress, node, null));
  }

  function templateByKey(templates, key) {
    var i;
    for (i = 0; i < (templates || []).length; i++) {
      if (templates[i].key === key) return templates[i];
    }
    return null;
  }

  function renderTrigger(trigger, templates, node, progress, persona) {
    var tpl = trigger && templateByKey(templates, trigger.template);
    if (!tpl) return null;
    var ctx = makeCtx(persona, progress, node, trigger);
    return {
      channel: tpl.channel || "email",
      to: trigger.to,
      subject: fillText(tpl.subject || "", ctx),
      body: fillText(tpl.body || "", ctx),
      template: tpl.key
    };
  }

  function slipsFor(node, templates, progress, persona) {
    var list = node && Array.isArray(node.triggers) ? node.triggers : [];
    return list.map(function (trigger) {
      return renderTrigger(trigger, templates, node, progress, persona);
    }).filter(Boolean);
  }

  function fireTriggers(node, templates, progress, persona) {
    var slips = slipsFor(node, templates, progress, persona);
    if (!progress.state) progress.state = freshState();
    if (!Array.isArray(progress.state.log)) progress.state.log = [];
    slips.forEach(function (slip) {
      var line = (slip.channel === "sms" ? "A note for " : "A letter for ") + (slip.to || "the story") + ".";
      if (progress.state.log.indexOf(line) < 0) progress.state.log.push(line);
    });
    return slips;
  }

  function mount(target) {
    var root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) throw new Error("Story site target not found.");
    if (location.protocol === "file:" || (location.hostname !== "127.0.0.1" && location.hostname !== "localhost" && location.hostname !== "::1")) {
      root.textContent = "Open this site from the story server at http://127.0.0.1:8090/.";
      return;
    }

    var api = client();
    var doc = { stories: [], nodes: [], choices: [], personas: [], templates: [], user_progress: [] };
    var ui = { storyId: null, busy: false, error: "" };
    var player = playerId();

    root.innerHTML = "";
    root.appendChild(shell());
    showStatus("Opening the shelf…");
    load();

    function shell() {
      var wrap = el("div", "play-wrap");
      var top = el("header", "play-top");
      var mark = el("a", "play-mark");
      mark.href = "#";
      mark.textContent = "Storybook";
      mark.addEventListener("click", function (event) {
        event.preventDefault();
        ui.storyId = null;
        ui.error = "";
        render();
      });
      var fiction = el("div", "play-fiction");
      fiction.textContent = "These stories are fiction.";
      var editor = el("a", "play-editor");
      editor.href = "/editor.html";
      editor.textContent = "Editor";
      top.appendChild(mark);
      top.appendChild(fiction);
      top.appendChild(el("span", "play-grow"));
      top.appendChild(editor);
      wrap.appendChild(top);
      wrap.appendChild(el("div", "play-main"));
      return wrap;
    }

    function main() { return root.querySelector(".play-main"); }

    function load() {
      return Promise.all([
        api.list(PACKS.stories),
        api.list(PACKS.nodes),
        api.list(PACKS.choices),
        api.list(PACKS.personas),
        api.list(PACKS.templates),
        api.list(PACKS.user_progress)
      ]).then(function (rows) {
        doc.stories = rows[0];
        doc.nodes = rows[1];
        doc.choices = rows[2];
        doc.personas = rows[3];
        doc.templates = rows[4];
        doc.user_progress = rows[5];
        ui.error = "";
        render();
      }, function (err) {
        ui.error = err && err.message ? err.message : "The shelf did not load.";
        render();
      });
    }

    function render() {
      var host = main();
      host.innerHTML = "";
      if (ui.error) {
        var bad = el("p", "play-error");
        bad.textContent = ui.error;
        host.appendChild(bad);
        return;
      }
      if (ui.storyId == null) return renderShelf(host);
      renderStory(host);
    }

    function renderShelf(host) {
      var title = el("h1", "play-h");
      title.textContent = "Stories";
      var lead = el("p", "play-lead");
      lead.textContent = doc.stories.length ? "Choose a story to read." : "No stories yet. Write one in the editor.";
      host.appendChild(title);
      host.appendChild(lead);
      if (!doc.stories.length) return;
      var grid = el("div", "play-grid");
      doc.stories.forEach(function (story) {
        var card = el("button", "play-card");
        card.type = "button";
        var name = el("strong");
        name.textContent = story.title || story.slug || ("Story " + story.id);
        card.appendChild(name);
        if (story.description) {
          var about = el("p");
          about.textContent = story.description;
          card.appendChild(about);
        }
        var tags = Array.isArray(story.tags) ? story.tags : [];
        if (tags.length) {
          var row = el("div", "play-tags");
          tags.forEach(function (tag) {
            var pill = el("span", "play-tag");
            pill.textContent = String(tag);
            row.appendChild(pill);
          });
          card.appendChild(row);
        }
        var sign = narratorSign(story.id);
        if (sign) {
          var voice = el("p", "play-voice");
          voice.textContent = sign;
          card.appendChild(voice);
        }
        card.addEventListener("click", function () { openStory(story); });
        grid.appendChild(card);
      });
      host.appendChild(grid);
    }

    function renderStory(host) {
      var story = find(doc.stories, ui.storyId);
      if (!story) { ui.storyId = null; renderShelf(host); return; }
      var progress = progressFor(story.id);
      var nodes = nodesOf(story.id);
      var choices = choicesFor(nodes);
      var narrator = narratorOf(doc.personas, story.id);
      if (progress) progress.state = withPersonaFacts(progress.state, doc.personas, story.id);
      var node = progress && findByKey(nodes, progress.current_node_key);
      if (progress && !node) {
        node = entryNode(nodes, choices, progress.state);
        if (node) {
          progress.current_node_key = node.key;
          fireTriggers(node, doc.templates, progress, narrator);
          saveProgress(progress);
        }
      }
      var back = el("button", "bt bt-s play-back");
      back.type = "button";
      back.textContent = "All stories";
      back.addEventListener("click", function () { ui.storyId = null; render(); });
      host.appendChild(back);

      var title = el("h1", "play-h");
      title.textContent = story.title || story.slug || "Story";
      host.appendChild(title);
      var sign = narrator && narrator.base_facts && narrator.base_facts.sign;
      if (sign) {
        var voice = el("p", "play-voice");
        voice.textContent = String(sign);
        host.appendChild(voice);
      }

      if (!progress || !node) {
        var closed = el("p", "play-note");
        closed.textContent = "This story has no open beginning from the current state.";
        host.appendChild(closed);
        return;
      }

      var paper = el("article", "play-paper");
      if (node.is_ending) {
        var kicker = el("div", "play-kicker");
        kicker.textContent = "Ending";
        paper.appendChild(kicker);
      }
      var scene = el("div", "play-scene");
      if (BareMetal.Markdown) BareMetal.Markdown.renderSafe(scene, sceneText(node, progress, narrator));
      else scene.textContent = sceneText(node, progress, narrator);
      paper.appendChild(scene);

      slipsFor(node, doc.templates, progress, narrator).forEach(function (slip) {
        paper.appendChild(slipCard(slip));
      });

      var options = offeredChoices(node, nodes, choices, progress.state);
      if (options.length) {
        var list = el("div", "play-choices");
        options.forEach(function (choice) {
          var button = el("button", "play-choice");
          button.type = "button";
          button.disabled = ui.busy;
          button.textContent = choice.label || "Continue";
          button.addEventListener("click", function () { take(story, node, choice, progress); });
          list.appendChild(button);
        });
        paper.appendChild(list);
      } else if (!node.is_ending) {
        var none = el("p", "play-note");
        none.textContent = "This path has no further options.";
        paper.appendChild(none);
      }
      host.appendChild(paper);

      var state = progress.state || freshState();
      if (state.inventory && state.inventory.length) {
        var held = el("p", "play-side");
        var heldLabel = el("strong");
        heldLabel.textContent = "You have ";
        held.appendChild(heldLabel);
        held.appendChild(document.createTextNode(state.inventory.join(", ") + "."));
        host.appendChild(held);
      }
      if (state.log && state.log.length) {
        var trail = el("p", "play-side");
        trail.textContent = state.log[state.log.length - 1];
        host.appendChild(trail);
      }

      var row = el("div", "play-row");
      var again = el("button", "bt bt-s");
      again.type = "button";
      again.disabled = ui.busy;
      again.textContent = "Begin again";
      again.addEventListener("click", function () { beginAgain(story, progress); });
      row.appendChild(again);
      host.appendChild(row);
    }

    function openStory(story) {
      ui.error = "";
      var progress = progressFor(story.id);
      if (progress) {
        ui.storyId = story.id;
        render();
        return;
      }
      var nodes = nodesOf(story.id);
      var start = entryNode(nodes, choicesFor(nodes), freshState());
      if (!start) {
        ui.storyId = story.id;
        render();
        return;
      }
      var narrator = narratorOf(doc.personas, story.id);
      progress = {
        user_id: player,
        story_id: Number(story.id),
        current_node_key: start.key,
        state: withPersonaFacts(freshState(), doc.personas, story.id),
        generated_texts: {},
        history: []
      };
      fireTriggers(start, doc.templates, progress, narrator);
      ui.busy = true;
      api.create(PACKS.user_progress, progress).then(function (id) {
        progress.id = id;
        doc.user_progress.push(progress);
        ui.storyId = story.id;
        ui.busy = false;
        render();
      }, function (err) {
        ui.busy = false;
        ui.error = err && err.message ? err.message : "The story did not open.";
        render();
      });
    }

    function take(story, node, choice, progress) {
      if (ui.busy) return;
      ui.busy = true;
      render();
      var next = clone(progress);
      next.state = applyEffects(withPersonaFacts(progress.state, doc.personas, story.id), choice.effects);
      next.history = (progress.history || []).concat([{
        node_key: node.key,
        choice_id: choice.id,
        timestamp: new Date().toISOString()
      }]);
      next.current_node_key = choice.target_node_key;
      var target = findByKey(nodesOf(story.id), choice.target_node_key);
      fireTriggers(target, doc.templates, next, narratorOf(doc.personas, story.id));
      saveProgress(next).then(function () {
        replace(doc.user_progress, next);
        ui.busy = false;
        render();
      }, function (err) {
        ui.busy = false;
        ui.error = err && err.message ? err.message : "That choice did not save.";
        render();
      });
    }

    function beginAgain(story, progress) {
      if (ui.busy) return;
      if (!window.confirm("Begin this story again? The saved place on this browser is cleared.")) return;
      var nodes = nodesOf(story.id);
      var start = entryNode(nodes, choicesFor(nodes), freshState());
      if (!start) return;
      var next = clone(progress);
      next.current_node_key = start.key;
      next.state = withPersonaFacts(freshState(), doc.personas, story.id);
      next.history = [];
      next.generated_texts = {};
      fireTriggers(start, doc.templates, next, narratorOf(doc.personas, story.id));
      ui.busy = true;
      saveProgress(next).then(function () {
        replace(doc.user_progress, next);
        ui.busy = false;
        render();
      }, function (err) {
        ui.busy = false;
        ui.error = err && err.message ? err.message : "The story did not restart.";
        render();
      });
    }

    function saveProgress(row) {
      if (row.id == null) return api.create(PACKS.user_progress, row).then(function (id) { row.id = id; return row; });
      return api.put(PACKS.user_progress, row.id, row).then(function () { return row; });
    }

    function progressFor(storyId) {
      var rows = doc.user_progress.filter(function (row) {
        return String(row.user_id) === player && Number(row.story_id) === Number(storyId);
      });
      rows.sort(function (a, b) { return Number(a.id) - Number(b.id); });
      return rows.length ? rows[rows.length - 1] : null;
    }

    function narratorSign(storyId) {
      var narrator = narratorOf(doc.personas, storyId);
      var sign = narrator && narrator.base_facts && narrator.base_facts.sign;
      return sign ? String(sign) : "";
    }

    function slipCard(slip) {
      var card = el("aside", "play-slip");
      var ch = el("div", "play-slip-ch");
      ch.textContent = slip.channel === "sms" ? "A note in the story" : "A letter in the story";
      card.appendChild(ch);
      if (slip.to) {
        var to = el("div", "play-slip-to");
        to.textContent = "For " + slip.to + ".";
        card.appendChild(to);
      }
      if (slip.subject) {
        var sub = el("div", "play-slip-sub");
        sub.textContent = slip.subject;
        card.appendChild(sub);
      }
      var body = el("p", "play-slip-body");
      body.textContent = slip.body || "";
      card.appendChild(body);
      return card;
    }

    function nodesOf(storyId) {
      return doc.nodes.filter(function (row) { return Number(row.story_id) === Number(storyId); });
    }

    function choicesFor(nodes) {
      var ids = {};
      nodes.forEach(function (node) { ids[node.id] = true; });
      return doc.choices.filter(function (choice) { return ids[choice.node_id] || ids[Number(choice.node_id)]; });
    }

    function find(list, id) {
      var i;
      for (i = 0; i < list.length; i++) if (Number(list[i].id) === Number(id)) return list[i];
      return null;
    }

    function findByKey(list, key) {
      var i;
      for (i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
      return null;
    }

    function replace(list, row) {
      var i;
      for (i = 0; i < list.length; i++) {
        if (Number(list[i].id) === Number(row.id)) { list[i] = row; return; }
      }
      list.push(row);
    }

    function showStatus(text) {
      var host = main();
      host.innerHTML = "";
      var note = el("p", "play-note");
      note.textContent = text;
      host.appendChild(note);
    }

    function el(tag, cls) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      return node;
    }

    function playerId() {
      var id = "";
      try { id = localStorage.getItem(PLAYER_KEY) || ""; } catch (err) { id = ""; }
      if (!id) {
        id = "player-" + Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem(PLAYER_KEY, id); } catch (err) { /* private mode still plays */ }
      }
      return id;
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
            return response.text().then(function (text) { throw new Error(text || response.statusText); });
          }
          if (response.status === 204) return null;
          var type = response.headers.get("content-type") || "";
          if (type.indexOf("application/json") < 0) return null;
          return response.json();
        });
      }
      function strip(row) {
        var out = {};
        Object.keys(row).sort().forEach(function (key) {
          if (key === "id" || typeof row[key] === "function") return;
          out[key] = row[key];
        });
        return out;
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
          return request("POST", "/" + pack, strip(row)).then(function (body) { return body.record; });
        },
        put: function (pack, id, row) {
          return request("PUT", "/" + pack + "/" + id, strip(row));
        }
      };
    }
  }

  return {
    PACKS: PACKS,
    freshState: freshState,
    matchConditions: matchConditions,
    applyEffects: applyEffects,
    entryNode: entryNode,
    offeredChoices: offeredChoices,
    fillText: fillText,
    withPersonaFacts: withPersonaFacts,
    narratorOf: narratorOf,
    sceneText: sceneText,
    slipsFor: slipsFor,
    fireTriggers: fireTriggers,
    mount: mount
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BareMetal.Play;

/*
 * Turns content/site.json into the HTML inside the
 * <!-- editable:NAME --> ... <!-- /editable:NAME --> regions of the pages.
 * Used by admin/editor.html (browser) and admin/build.js (Node).
 */
(function (root) {
  "use strict";

  const PAGES = {
    home: "index.html",
    about: "about/index.html",
  };

  /* Output only ever lands in element text, never in attributes */
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
    })[c]);
  }

  function clean(list) {
    return (list || []).map((s) => String(s == null ? "" : s).trim()).filter(Boolean);
  }

  function homeRegions(home) {
    const regions = {};

    regions.headline = [`<h1 class="headline">${esc(home.headline)}</h1>`];

    regions["about-text"] = clean(home.aboutParagraphs).map((p) => `<p class="justify">${esc(p)}</p>`);

    regions.interests = [`<p class="interests">${clean(home.interests).map(esc).join(" | ")}</p>`];

    const experience = [];
    const schools = (home.education || []).filter((e) => e && (e.school || "").trim());
    if (schools.length) {
      experience.push(`<h3 class="kicker">Education</h3>`);
      for (const edu of schools) {
        const year = (edu.year || "").trim();
        experience.push(
          `<p>`,
          `  <span class="school">${esc(edu.school.trim())}${year ? ` <small>${esc(year)}</small>` : ""}</span>`,
          ...clean(edu.degrees).map((d) => `  <span class="degree">${esc(d)}</span>`),
          `</p>`
        );
      }
    }
    for (const section of home.experience || []) {
      const items = clean(section && section.items);
      if (!section || !(section.title || "").trim() || !items.length) continue;
      experience.push(
        ``,
        `<h3 class="kicker">${esc(section.title.trim())}</h3>`,
        `<ul class="ledger">`,
        ...items.map((i) => `  <li>${esc(i)}</li>`),
        `</ul>`
      );
    }
    regions.experience = experience;

    const updates = [];
    for (const u of home.updates || []) {
      const text = (u && u.text || "").trim();
      if (!text) continue;
      const date = (u.date || "").trim();
      if (updates.length) updates.push(``);
      updates.push(
        `<article class="dispatch">`,
        `  <p class="justify">${date ? `<span class="dateline">${esc(date)}</span> ` : ""}${esc(text)}</p>`,
        `</article>`
      );
    }
    regions.updates = updates;

    return regions;
  }

  function aboutRegions(about) {
    const words = clean(about.words);
    return {
      ticker: [
        `<div class="ticker">`,
        `  <span class="visually-hidden">${words.map(esc).join(", ")}</span>`,
        `  <ul class="ticker__words" aria-hidden="true" style="--words: ${Math.max(words.length, 1)}">`,
        ...words.map((w) => `    <li><span>${esc(w)}</span></li>`),
        `  </ul>`,
        `</div>`,
      ],
      intro: clean(about.introParagraphs).map((p) => `<p class="feature__lead">${esc(p)}</p>`),
    };
  }

  /* Replace every editable region in `html`, keeping the marker's indentation. */
  function applyRegions(html, regions) {
    for (const [name, lines] of Object.entries(regions)) {
      const pattern = new RegExp(
        `^([ \\t]*)<!-- editable:${name} -->[\\s\\S]*?<!-- /editable:${name} -->`,
        "m"
      );
      if (!pattern.test(html)) {
        throw new Error(`Region "${name}" not found in page. Was the marker comment removed?`);
      }
      html = html.replace(pattern, (_, indent) => {
        const body = lines.map((l) => (l ? indent + l : "")).join("\n");
        return `${indent}<!-- editable:${name} -->\n${body}${body ? "\n" : ""}${indent}<!-- /editable:${name} -->`;
      });
    }
    return html;
  }

  function validate(content) {
    const errors = [];
    if (!(content.home.headline || "").trim()) errors.push("Home: the headline can't be empty.");
    if (!clean(content.about.words).length) errors.push("About: add at least one flashing word.");
    return errors;
  }

  function buildPages(content, templates) {
    return {
      [PAGES.home]: applyRegions(templates[PAGES.home], homeRegions(content.home)),
      [PAGES.about]: applyRegions(templates[PAGES.about], aboutRegions(content.about)),
    };
  }

  const api = { PAGES, buildPages, validate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SiteRender = api;
})(this);
